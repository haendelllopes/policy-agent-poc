-- ===================================================================
-- MIGRAÇÃO: Sistema de Análise de Sentimento do Colaborador
-- Data: 2025-10-10
-- Descrição: Captura e histórico de sentimentos para personalização
-- ===================================================================

-- Criar tabela de sentimentos do colaborador
CREATE TABLE IF NOT EXISTS colaborador_sentimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sentimento capturado
  sentimento VARCHAR(20) NOT NULL CHECK (sentimento IN (
    'muito_positivo',  -- 😄 Entusiasmado, animado
    'positivo',        -- 🙂 Satisfeito, tranquilo
    'neutro',          -- 😐 Indiferente
    'negativo',        -- 😟 Preocupado, frustrado
    'muito_negativo'   -- 😞 Desmotivado, ansioso
  )),
  
  -- Intensidade do sentimento (0.00 = fraco, 1.00 = muito forte)
  intensidade DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  
  -- Contexto da captura
  origem VARCHAR(50) NOT NULL CHECK (origem IN (
    'primeiro_contato',      -- Primeira interação com agente
    'durante_conversa',      -- Durante conversa normal
    'pos_trilha',            -- Após completar trilha
    'pos_quiz',              -- Após realizar quiz
    'feedback_explicito',    -- Colaborador deu feedback direto
    'analise_automatica'     -- Análise automática de mensagens
  )),
  
  -- Dados da análise
  mensagem_analisada TEXT, -- Mensagem que gerou a análise
  fatores_detectados JSONB, -- {palavras_chave: [], tom: '', emojis: []}
  
  -- Contexto adicional
  trilha_id UUID REFERENCES trilhas(id),
  momento_onboarding VARCHAR(50), -- 'inicio', 'meio', 'fim'
  dia_onboarding INTEGER, -- Dia de onboarding (1, 2, 3...)
  
  -- Ação tomada pelo agente
  acao_agente VARCHAR(100), -- 'mudou_tom', 'ofereceu_ajuda', 'enviou_motivacao'
  resposta_adaptada TEXT, -- Como o agente adaptou a resposta
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas de sentimento à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS sentimento_atual VARCHAR(20) 
  CHECK (sentimento_atual IN ('muito_positivo', 'positivo', 'neutro', 'negativo', 'muito_negativo'));
  
ALTER TABLE users ADD COLUMN IF NOT EXISTS sentimento_atualizado_em TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_tenant ON colaborador_sentimentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_colaborador ON colaborador_sentimentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_sentimento ON colaborador_sentimentos(sentimento);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_origem ON colaborador_sentimentos(origem);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_data ON colaborador_sentimentos(created_at);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_colaborador_data ON colaborador_sentimentos(colaborador_id, created_at);
CREATE INDEX IF NOT EXISTS idx_colaborador_sentimentos_trilha ON colaborador_sentimentos(trilha_id);

-- Índice para users
CREATE INDEX IF NOT EXISTS idx_users_sentimento_atual ON users(sentimento_atual);

-- RLS (Row Level Security)
ALTER TABLE colaborador_sentimentos ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todos os sentimentos do tenant
CREATE POLICY "Admins podem ver sentimentos do tenant" ON colaborador_sentimentos
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t 
      JOIN users u ON u.tenant_id = t.id 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Política: Colaboradores podem ver apenas seus próprios sentimentos
CREATE POLICY "Colaboradores veem próprios sentimentos" ON colaborador_sentimentos
  FOR SELECT USING (
    colaborador_id = auth.uid()
  );

-- Comentários
COMMENT ON TABLE colaborador_sentimentos IS 'Histórico de sentimentos do colaborador para personalização da experiência';
COMMENT ON COLUMN colaborador_sentimentos.sentimento IS 'Sentimento detectado: muito_positivo, positivo, neutro, negativo, muito_negativo';
COMMENT ON COLUMN colaborador_sentimentos.intensidade IS 'Intensidade do sentimento de 0.00 (fraco) a 1.00 (muito forte)';
COMMENT ON COLUMN colaborador_sentimentos.origem IS 'Como o sentimento foi capturado';
COMMENT ON COLUMN colaborador_sentimentos.fatores_detectados IS 'JSON com palavras-chave, tom, emojis e outros fatores que geraram a análise';
COMMENT ON COLUMN colaborador_sentimentos.acao_agente IS 'Ação que o agente tomou baseado no sentimento detectado';
COMMENT ON COLUMN users.sentimento_atual IS 'Último sentimento capturado do colaborador';
COMMENT ON COLUMN users.sentimento_atualizado_em IS 'Quando o sentimento foi atualizado pela última vez';

-- Função para atualizar sentimento_atual do user automaticamente
CREATE OR REPLACE FUNCTION atualizar_sentimento_usuario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET sentimento_atual = NEW.sentimento,
      sentimento_atualizado_em = NEW.created_at
  WHERE id = NEW.colaborador_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar sentimento_atual automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_sentimento_usuario ON colaborador_sentimentos;
CREATE TRIGGER trigger_atualizar_sentimento_usuario
  AFTER INSERT ON colaborador_sentimentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_sentimento_usuario();

-- Fim da migração

