-- ============================================
-- MIGRAÇÃO 015: FASE 5 - SISTEMA PROATIVO
-- Data: 21 de outubro de 2025
-- Descrição: Sistema proativo reutilizando estrutura existente
-- ============================================

-- ============================================
-- FASE 5: SISTEMA PROATIVO - MIGRAÇÃO MÍNIMA
-- Reaproveita estrutura existente
-- ============================================

-- 1. EXPANDIR agente_anotacoes (já tem quase tudo que precisamos)
-- Adicionar campos para sistema proativo
ALTER TABLE agente_anotacoes 
ADD COLUMN IF NOT EXISTS severidade VARCHAR(20) CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'ignorado', 'em_analise')),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP,
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS proactive_score INTEGER DEFAULT 0, -- Score de risco 0-100
ADD COLUMN IF NOT EXISTS alerta_gerado BOOLEAN DEFAULT false;

-- Adicionar novos tipos de anotação para alertas proativos
ALTER TABLE agente_anotacoes DROP CONSTRAINT IF EXISTS agente_anotacoes_tipo_check;
ALTER TABLE agente_anotacoes ADD CONSTRAINT agente_anotacoes_tipo_check CHECK (tipo IN (
  'sentimento_trilha',
  'sentimento_empresa',
  'dificuldade_conteudo',
  'sugestao_colaborador',
  'padrao_identificado',
  'observacao_geral',
  -- Novos tipos para sistema proativo:
  'alerta_risco_evasao',
  'alerta_inatividade',
  'alerta_sentimento_negativo',
  'alerta_trilha_atrasada',
  'alerta_baixo_engajamento'
));

-- Índices adicionais para performance do sistema proativo
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_severidade ON agente_anotacoes(severidade);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_status ON agente_anotacoes(status);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_score ON agente_anotacoes(proactive_score DESC);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_proativo ON agente_anotacoes(tenant_id, status, severidade) WHERE alerta_gerado = true;

-- 2. EXPANDIR onboarding_improvements (para ações sugeridas pela IA)
-- Adicionar campos para sistema de aprovação
ALTER TABLE onboarding_improvements 
ADD COLUMN IF NOT EXISTS tipo_acao VARCHAR(50), -- 'contatar_colaborador', 'escalar_rh', 'ajustar_trilha', 'criar_ticket'
ADD COLUMN IF NOT EXISTS alvo_colaborador_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS justificativa_ia TEXT,
ADD COLUMN IF NOT EXISTS dados_acao JSONB,
ADD COLUMN IF NOT EXISTS executado_em TIMESTAMP;

-- Adicionar novos status para workflow de aprovação
ALTER TABLE onboarding_improvements DROP CONSTRAINT IF EXISTS onboarding_improvements_status_check;
ALTER TABLE onboarding_improvements ADD CONSTRAINT onboarding_improvements_status_check CHECK (status IN (
  'sugerida',
  'em_analise',
  'aprovada',
  'em_desenvolvimento',
  'implementada',
  'rejeitada',
  -- Novos status para sistema proativo:
  'pendente_aprovacao', -- Aguardando aprovação do admin
  'aprovada_pendente_execucao', -- Aprovada mas ainda não executada
  'executada' -- Ação foi executada
));

-- Índice para buscar ações pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_improvements_pendente_aprovacao ON onboarding_improvements(tenant_id, status) WHERE status = 'pendente_aprovacao';
CREATE INDEX IF NOT EXISTS idx_improvements_colaborador ON onboarding_improvements(alvo_colaborador_id) WHERE alvo_colaborador_id IS NOT NULL;

-- 3. TABELA DE NOTIFICAÇÕES (única tabela nova necessária)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'alerta_critico', 'acao_pendente', 'colaborador_risco', 'melhoria_sugerida'
  titulo TEXT NOT NULL,
  mensagem TEXT,
  dados JSONB,
  link VARCHAR(255), -- Link para ação relacionada
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_nao_lidas ON notifications(user_id, lida) WHERE lida = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprias notificações" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 4. ADICIONAR campos úteis em users para cache de risco
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0, -- Score de risco calculado
ADD COLUMN IF NOT EXISTS risk_score_atualizado_em TIMESTAMP,
ADD COLUMN IF NOT EXISTS ultima_atividade_em TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score DESC) WHERE risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_users_ultima_atividade ON users(ultima_atividade_em);

-- Comentários
COMMENT ON COLUMN agente_anotacoes.severidade IS 'Severidade do alerta: baixa, media, alta, critica';
COMMENT ON COLUMN agente_anotacoes.status IS 'Status do alerta: ativo, resolvido, ignorado, em_analise';
COMMENT ON COLUMN agente_anotacoes.proactive_score IS 'Score de risco 0-100 calculado automaticamente';
COMMENT ON COLUMN onboarding_improvements.tipo_acao IS 'Tipo de ação sugerida pela IA';
COMMENT ON COLUMN onboarding_improvements.justificativa_ia IS 'Justificativa gerada pela IA para a ação sugerida';
COMMENT ON TABLE notifications IS 'Notificações in-app para administradores';
COMMENT ON COLUMN users.risk_score IS 'Score de risco do colaborador (0-100), calculado pelo sistema proativo';

-- ============================================
-- FUNÇÕES AUXILIARES PARA SISTEMA PROATIVO
-- ============================================

-- Função para atualizar score de risco do usuário
CREATE OR REPLACE FUNCTION atualizar_risk_score_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar score de risco quando uma nova anotação proativa é criada
  IF NEW.alerta_gerado = true AND NEW.proactive_score > 0 THEN
    UPDATE users 
    SET risk_score = NEW.proactive_score,
        risk_score_atualizado_em = NEW.created_at
    WHERE id = NEW.colaborador_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar risk_score automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_risk_score ON agente_anotacoes;
CREATE TRIGGER trigger_atualizar_risk_score
  AFTER INSERT ON agente_anotacoes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_risk_score_usuario();

-- Função para criar notificação quando alerta crítico é criado
CREATE OR REPLACE FUNCTION notificar_alerta_critico()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação para admins quando alerta crítico é criado
  IF NEW.severidade = 'critica' AND NEW.alerta_gerado = true THEN
    INSERT INTO notifications (tenant_id, user_id, tipo, titulo, mensagem, dados, link)
    SELECT 
      NEW.tenant_id,
      u.id,
      'alerta_critico',
      '🚨 Alerta Crítico: ' || NEW.titulo,
      NEW.anotacao,
      jsonb_build_object(
        'alerta_id', NEW.id,
        'colaborador_id', NEW.colaborador_id,
        'severidade', NEW.severidade,
        'score', NEW.proactive_score
      ),
      '/dashboard.html#proatividade-section'
    FROM users u 
    WHERE u.tenant_id = NEW.tenant_id 
      AND u.role = 'admin' 
      AND u.active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar admins sobre alertas críticos
DROP TRIGGER IF EXISTS trigger_notificar_alerta_critico ON agente_anotacoes;
CREATE TRIGGER trigger_notificar_alerta_critico
  AFTER INSERT ON agente_anotacoes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_alerta_critico();

-- ============================================
-- DADOS DE EXEMPLO PARA TESTE
-- ============================================

-- Inserir alguns dados de exemplo para teste (apenas em desenvolvimento)
DO $$
BEGIN
  -- Verificar se estamos em ambiente de desenvolvimento
  IF current_setting('app.environment', true) = 'development' THEN
    
    -- Inserir notificação de exemplo
    INSERT INTO notifications (tenant_id, user_id, tipo, titulo, mensagem, dados)
    SELECT 
      '5978f911-738b-4aae-802a-f037fdac2e64', -- Tenant demonstração
      u.id,
      'sistema_proativo',
      '🎯 Sistema Proativo Ativado',
      'O sistema de monitoramento proativo foi configurado com sucesso!',
      jsonb_build_object(
        'versao', '5.0.0',
        'cron_jobs', jsonb_build_array(
          jsonb_build_object('nome', 'monitoramento-continuo', 'frequencia', '15min'),
          jsonb_build_object('nome', 'analise-horaria', 'frequencia', '1h'),
          jsonb_build_object('nome', 'relatorio-diario', 'frequencia', '9h')
        )
      )
    FROM users u 
    WHERE u.tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' 
      AND u.role = 'admin' 
      AND u.active = true
    LIMIT 1;
    
    RAISE NOTICE 'Dados de exemplo inseridos para desenvolvimento';
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- Verificar se todas as colunas foram adicionadas
DO $$
DECLARE
  colunas_agente INTEGER;
  colunas_improvements INTEGER;
  colunas_users INTEGER;
  tabela_notifications BOOLEAN;
BEGIN
  -- Verificar colunas em agente_anotacoes
  SELECT COUNT(*) INTO colunas_agente
  FROM information_schema.columns 
  WHERE table_name = 'agente_anotacoes' 
    AND column_name IN ('severidade', 'status', 'proactive_score', 'alerta_gerado');
  
  -- Verificar colunas em onboarding_improvements
  SELECT COUNT(*) INTO colunas_improvements
  FROM information_schema.columns 
  WHERE table_name = 'onboarding_improvements' 
    AND column_name IN ('tipo_acao', 'alvo_colaborador_id', 'justificativa_ia');
  
  -- Verificar colunas em users
  SELECT COUNT(*) INTO colunas_users
  FROM information_schema.columns 
  WHERE table_name = 'users' 
    AND column_name IN ('risk_score', 'risk_score_atualizado_em', 'ultima_atividade_em');
  
  -- Verificar se tabela notifications existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) INTO tabela_notifications;
  
  -- Relatório de verificação
  RAISE NOTICE '=== VERIFICAÇÃO DA MIGRAÇÃO 015 ===';
  RAISE NOTICE 'Colunas adicionadas em agente_anotacoes: %/4', colunas_agente;
  RAISE NOTICE 'Colunas adicionadas em onboarding_improvements: %/3', colunas_improvements;
  RAISE NOTICE 'Colunas adicionadas em users: %/3', colunas_users;
  RAISE NOTICE 'Tabela notifications criada: %', tabela_notifications;
  
  IF colunas_agente = 4 AND colunas_improvements = 3 AND colunas_users = 3 AND tabela_notifications THEN
    RAISE NOTICE '✅ MIGRAÇÃO 015 CONCLUÍDA COM SUCESSO!';
  ELSE
    RAISE NOTICE '❌ ERRO NA MIGRAÇÃO 015 - Verificar logs acima';
  END IF;
END $$;

-- Fim da migração

