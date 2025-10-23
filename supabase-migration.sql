-- ============================================
-- SCRIPT SQL: Migração Dashboard Mock Data
-- Arquivo: supabase-migration.sql
-- Descrição: Script para executar diretamente no Supabase
-- ============================================

-- ============================================
-- 1. CRIAR TABELA NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    dados JSONB,
    link VARCHAR(255),
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. ADICIONAR COLUNAS EM AGENTE_ANOTACOES
-- ============================================
-- Remover constraint existente se houver
ALTER TABLE agente_anotacoes DROP CONSTRAINT IF EXISTS agente_anotacoes_tipo_check;

-- Adicionar colunas necessárias
ALTER TABLE agente_anotacoes 
ADD COLUMN IF NOT EXISTS severidade VARCHAR(20) CHECK (severidade IN ('baixa', 'media', 'alta', 'critica')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'ignorado', 'em_analise')),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP,
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS proactive_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerta_gerado BOOLEAN DEFAULT false;

-- ============================================
-- 3. ADICIONAR COLUNAS EM ONBOARDING_IMPROVEMENTS
-- ============================================
ALTER TABLE onboarding_improvements 
ADD COLUMN IF NOT EXISTS tipo_acao VARCHAR(50),
ADD COLUMN IF NOT EXISTS alvo_colaborador_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS justificativa_ia TEXT,
ADD COLUMN IF NOT EXISTS dados_acao JSONB,
ADD COLUMN IF NOT EXISTS executado_em TIMESTAMP;

-- ============================================
-- 4. ADICIONAR COLUNAS EM USERS
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_score_atualizado_em TIMESTAMP,
ADD COLUMN IF NOT EXISTS ultima_atividade_em TIMESTAMP;

-- ============================================
-- 5. INSERIR DADOS MOCK
-- ============================================

-- Variáveis para facilitar
DO $$
DECLARE
    tenant_id UUID := '5978f911-738b-4aae-802a-f037fdac2e64';
    user_id UUID := '4ab6c765-bcfc-4280-84cd-3190fcf881c2';
BEGIN
    -- Inserir alertas proativos
    INSERT INTO agente_anotacoes (
        tenant_id, colaborador_id, titulo, anotacao, tipo, 
        sentimento, severidade, status, proactive_score, alerta_gerado, created_at
    ) VALUES 
    (tenant_id, user_id, 'Baixo engajamento em trilha', 'Colaborador demonstra baixo interesse nas trilhas de onboarding', 'alerta_baixo_engajamento', 'negativo', 'critica', 'ativo', 85, true, NOW()),
    (tenant_id, user_id, 'Múltiplas dúvidas não resolvidas', 'Colaborador tem várias dúvidas pendentes há mais de 3 dias', 'alerta_inatividade', 'neutro', 'alta', 'ativo', 70, true, NOW()),
    (tenant_id, user_id, 'Sentimento negativo crescente', 'Feedback negativo sobre processo de onboarding', 'alerta_sentimento_negativo', 'negativo', 'media', 'ativo', 60, true, NOW())
    ON CONFLICT DO NOTHING;
    
    -- Inserir melhorias/ações
    INSERT INTO onboarding_improvements (
        tenant_id, titulo, descricao, status, tipo_acao,
        alvo_colaborador_id, justificativa_ia, dados_acao, created_at
    ) VALUES 
    (tenant_id, 'Revisar trilha de onboarding', 'Ajustar conteúdo da trilha de desenvolvimento', 'pendente_aprovacao', 'ajustar_trilha', user_id, 'IA detectou padrão de dificuldade com documentação técnica', '{"trilha_id": "dev-onboarding", "ajustes": ["adicionar_exemplos_praticos", "simplificar_linguagem"]}', NOW()),
    (tenant_id, 'Agendar reunião de feedback', 'Reunião individual com colaborador em risco', 'aprovada_pendente_execucao', 'contatar_colaborador', user_id, 'Score de risco alto requer intervenção imediata', '{"tipo_reuniao": "feedback", "urgencia": "alta", "agendamento": "proximo_dia_util"}', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Atualizar score de risco do usuário
    UPDATE users 
    SET risk_score = 75, 
        risk_score_atualizado_em = NOW(),
        ultima_atividade_em = NOW() - INTERVAL '2 hours'
    WHERE id = user_id;
    
    -- Inserir notificações
    INSERT INTO notifications (
        tenant_id, user_id, tipo, titulo, mensagem, dados, link, created_at
    ) VALUES 
    (tenant_id, user_id, 'alerta_critico', '🚨 Alerta Crítico: Baixo Engajamento', 'Colaborador João Silva apresenta baixo engajamento nas trilhas', '{"alerta_id": "1", "severidade": "critica", "score": 85}', '/dashboard.html#alertas', NOW()),
    (tenant_id, user_id, 'acao_pendente', '⏳ Ação Pendente: Revisar Trilha', 'Aprovação necessária para ajustar trilha de desenvolvimento', '{"acao_id": "1", "tipo": "ajustar_trilha"}', '/dashboard.html#acoes', NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Dados mock inseridos com sucesso!';
END $$;

-- ============================================
-- 6. VERIFICAR DADOS INSERIDOS
-- ============================================
DO $$
DECLARE
    tenant_id UUID := '5978f911-738b-4aae-802a-f037fdac2e64';
    alertas_count INTEGER;
    melhorias_count INTEGER;
    notificacoes_count INTEGER;
    usuarios_risco INTEGER;
BEGIN
    -- Contar alertas proativos
    SELECT COUNT(*) INTO alertas_count 
    FROM agente_anotacoes 
    WHERE tenant_id = tenant_id AND alerta_gerado = true;
    
    -- Contar melhorias/ações
    SELECT COUNT(*) INTO melhorias_count 
    FROM onboarding_improvements 
    WHERE tenant_id = tenant_id;
    
    -- Contar notificações
    SELECT COUNT(*) INTO notificacoes_count 
    FROM notifications 
    WHERE tenant_id = tenant_id;
    
    -- Contar usuários com risco
    SELECT COUNT(*) INTO usuarios_risco 
    FROM users 
    WHERE tenant_id = tenant_id AND risk_score > 0;
    
    -- Relatório de verificação
    RAISE NOTICE '=== VERIFICAÇÃO DOS DADOS MOCK ===';
    RAISE NOTICE 'Alertas proativos inseridos: %', alertas_count;
    RAISE NOTICE 'Melhorias/ações inseridas: %', melhorias_count;
    RAISE NOTICE 'Notificações inseridas: %', notificacoes_count;
    RAISE NOTICE 'Usuários com score de risco: %', usuarios_risco;
    
    IF alertas_count > 0 AND melhorias_count > 0 AND notificacoes_count > 0 THEN
        RAISE NOTICE '✅ DADOS MOCK INSERIDOS COM SUCESSO!';
    ELSE
        RAISE NOTICE '❌ ERRO AO INSERIR DADOS MOCK';
    END IF;
END $$;

-- ============================================
-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_nao_lidas ON notifications(user_id, lida) WHERE lida = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_severidade ON agente_anotacoes(severidade);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_status ON agente_anotacoes(status);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_score ON agente_anotacoes(proactive_score DESC);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_proativo ON agente_anotacoes(tenant_id, status, severidade) WHERE alerta_gerado = true;

CREATE INDEX IF NOT EXISTS idx_improvements_pendente_aprovacao ON onboarding_improvements(tenant_id, status) WHERE status = 'pendente_aprovacao';
CREATE INDEX IF NOT EXISTS idx_improvements_colaborador ON onboarding_improvements(alvo_colaborador_id) WHERE alvo_colaborador_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score DESC) WHERE risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_users_ultima_atividade ON users(ultima_atividade_em);

-- ============================================
-- 8. CRIAR VIEW OTIMIZADA PARA DASHBOARD
-- ============================================
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    
    -- Métricas de trilhas
    (SELECT COUNT(*) FROM trilhas tr WHERE tr.tenant_id = t.id AND tr.status = 'ativo') as trilhas_ativas,
    (SELECT COUNT(*) FROM trilhas tr WHERE tr.tenant_id = t.id AND tr.status = 'concluido') as trilhas_concluidas,
    
    -- Métricas de usuários
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as total_usuarios,
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.created_at > NOW() - INTERVAL '30 days') as usuarios_onboarding,
    
    -- Métricas de melhorias
    (SELECT COUNT(*) FROM onboarding_improvements oi WHERE oi.tenant_id = t.id AND oi.status = 'sugerida') as melhorias_sugeridas,
    (SELECT COUNT(*) FROM onboarding_improvements oi WHERE oi.tenant_id = t.id AND oi.status = 'pendente_aprovacao') as acoes_pendentes,
    
    -- Métricas de sentimento (últimos 7 dias)
    (SELECT AVG(CASE 
        WHEN sentimento = 'muito_positivo' THEN 5
        WHEN sentimento = 'positivo' THEN 4
        WHEN sentimento = 'neutro' THEN 3
        WHEN sentimento = 'negativo' THEN 2
        WHEN sentimento = 'muito_negativo' THEN 1
        ELSE 3
    END) FROM agente_anotacoes aa WHERE aa.tenant_id = t.id AND aa.created_at > NOW() - INTERVAL '7 days') as sentimento_medio,
    
    -- Métricas de alertas
    (SELECT COUNT(*) FROM agente_anotacoes aa WHERE aa.tenant_id = t.id AND aa.alerta_gerado = true AND aa.status = 'ativo') as alertas_ativos,
    (SELECT COUNT(*) FROM agente_anotacoes aa WHERE aa.tenant_id = t.id AND aa.severidade = 'critica' AND aa.status = 'ativo') as alertas_criticos,
    
    -- Métricas de risco
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.risk_score > 70) as colaboradores_alto_risco,
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.risk_score > 50) as colaboradores_risco
    
FROM tenants t;

-- ============================================
-- 9. CRIAR FUNÇÃO PARA BUSCAR DADOS DO DASHBOARD
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_data(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'tenant_id', p_tenant_id,
        'timestamp', NOW(),
        
        -- Métricas principais
        'trilhasAtivas', COALESCE(trilhas_ativas, 0),
        'usuariosOnboarding', COALESCE(usuarios_onboarding, 0),
        'melhoriasSugeridas', COALESCE(melhorias_sugeridas, 0),
        'sentimentoMedio', COALESCE(ROUND(sentimento_medio::numeric, 1), 0),
        'alertasAtivos', COALESCE(alertas_ativos, 0),
        'colaboradoresRisco', COALESCE(colaboradores_alto_risco, 0),
        
        -- Tendências
        'trilhasTrend', CASE 
            WHEN trilhas_concluidas > 0 THEN '+12%'
            ELSE '+0%'
        END,
        'usuariosTrend', CASE 
            WHEN usuarios_onboarding > 0 THEN '+8%'
            ELSE '+0%'
        END,
        'melhoriasTrend', CASE 
            WHEN melhorias_sugeridas > 0 THEN '+15%'
            ELSE '+0%'
        END,
        'sentimentoTrend', CASE 
            WHEN sentimento_medio > 4 THEN '+0.3'
            WHEN sentimento_medio < 3 THEN '-0.2'
            ELSE '+0.1'
        END,
        'alertasTrend', CASE 
            WHEN alertas_criticos > 0 THEN '-25%'
            ELSE '+0%'
        END,
        'riscoTrend', CASE 
            WHEN colaboradores_alto_risco > 0 THEN '-50%'
            ELSE '+0%'
        END,
        
        -- Dados para gráficos
        'graficos', json_build_object(
            'trilhasPorCargo', json_build_array(
                json_build_object('cargo', 'Desenvolvedor', 'ativas', 8, 'concluidas', 12, 'atrasadas', 2),
                json_build_object('cargo', 'Designer', 'ativas', 6, 'concluidas', 8, 'atrasadas', 1),
                json_build_object('cargo', 'Product Manager', 'ativas', 4, 'concluidas', 6, 'atrasadas', 1),
                json_build_object('cargo', 'QA', 'ativas', 5, 'concluidas', 7, 'atrasadas', 2),
                json_build_object('cargo', 'DevOps', 'ativas', 3, 'concluidas', 4, 'atrasadas', 1)
            ),
            'sentimentoPorCargo', json_build_array(
                json_build_object('cargo', 'Desenvolvedor', 'sentimento', 4.2),
                json_build_object('cargo', 'Designer', 'sentimento', 4.5),
                json_build_object('cargo', 'Product Manager', 'sentimento', 4.1),
                json_build_object('cargo', 'QA', 'sentimento', 3.8),
                json_build_object('cargo', 'DevOps', 'sentimento', 4.3)
            ),
            'alertasPorSeveridade', json_build_array(
                json_build_object('severidade', 'Crítico', 'quantidade', COALESCE(alertas_criticos, 0)),
                json_build_object('severidade', 'Alto', 'quantidade', 5),
                json_build_object('severidade', 'Médio', 'quantidade', 8),
                json_build_object('severidade', 'Baixo', 'quantidade', 12)
            ),
            'tendenciaEngajamento', json_build_array(
                json_build_object('dia', 'Seg', 'engajamento', 85),
                json_build_object('dia', 'Ter', 'engajamento', 78),
                json_build_object('dia', 'Qua', 'engajamento', 92),
                json_build_object('dia', 'Qui', 'engajamento', 88),
                json_build_object('dia', 'Sex', 'engajamento', 95),
                json_build_object('dia', 'Sáb', 'engajamento', 82),
                json_build_object('dia', 'Dom', 'engajamento', 89)
            )
        )
    ) INTO result
    FROM dashboard_metrics
    WHERE tenant_id = p_tenant_id;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TESTAR A FUNÇÃO
-- ============================================
SELECT get_dashboard_data('5978f911-738b-4aae-802a-f037fdac2e64');

-- ============================================
-- FIM DO SCRIPT
-- ============================================









