-- ============================================
-- MIGRAÇÃO 016: DADOS MOCK PARA DASHBOARD
-- Data: 21 de dezembro de 2024
-- Descrição: Dados mock otimizados para dashboard proativo
-- ============================================

-- ============================================
-- 1. INSERIR ANOTAÇÕES COM ALERTAS PROATIVOS
-- ============================================

-- Limpar dados existentes de teste (opcional)
DELETE FROM agente_anotacoes WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' AND tipo LIKE 'alerta_%';
DELETE FROM onboarding_improvements WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
DELETE FROM notifications WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';

-- Inserir alertas proativos
INSERT INTO agente_anotacoes (
    tenant_id, 
    colaborador_id, 
    titulo, 
    anotacao, 
    tipo, 
    sentimento, 
    severidade, 
    status, 
    proactive_score, 
    alerta_gerado,
    created_at
) VALUES 
-- Alertas críticos
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Baixo engajamento em trilha', 'Colaborador demonstra baixo interesse nas trilhas de onboarding', 'alerta_baixo_engajamento', 'negativo', 'critica', 'ativo', 85, true, NOW() - INTERVAL '2 hours'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Múltiplas dúvidas não resolvidas', 'Colaborador tem várias dúvidas pendentes há mais de 3 dias', 'alerta_inatividade', 'neutro', 'alta', 'ativo', 70, true, NOW() - INTERVAL '4 hours'),

-- Alertas médios
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Sentimento negativo crescente', 'Feedback negativo sobre processo de onboarding', 'alerta_sentimento_negativo', 'negativo', 'media', 'ativo', 60, true, NOW() - INTERVAL '1 day'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Trilha atrasada', 'Colaborador está atrasado na trilha de desenvolvimento', 'alerta_trilha_atrasada', 'neutro', 'media', 'ativo', 55, true, NOW() - INTERVAL '2 days'),

-- Alertas baixos
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Padrão de dificuldade identificado', 'Dificuldade recorrente com documentação técnica', 'padrao_identificado', 'neutro', 'baixa', 'ativo', 40, true, NOW() - INTERVAL '3 days'),

-- Dados históricos para gráficos
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Feedback positivo sobre onboarding', 'Colaborador elogiou a qualidade do conteúdo', 'feedback_positivo', 'positivo', 'baixa', 'resolvido', 20, false, NOW() - INTERVAL '5 days'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Sugestão de melhoria', 'Sugestão para adicionar mais exemplos práticos', 'sugestao_colaborador', 'positivo', 'baixa', 'resolvido', 15, false, NOW() - INTERVAL '7 days');

-- ============================================
-- 2. INSERIR MELHORIAS/AÇÕES SUGERIDAS
-- ============================================

INSERT INTO onboarding_improvements (
    tenant_id,
    titulo,
    descricao,
    status,
    tipo_acao,
    alvo_colaborador_id,
    justificativa_ia,
    dados_acao,
    created_at
) VALUES 
('5978f911-738b-4aae-802a-f037fdac2e64', 'Revisar trilha de onboarding', 'Ajustar conteúdo da trilha de desenvolvimento', 'pendente_aprovacao', 'ajustar_trilha', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'IA detectou padrão de dificuldade com documentação técnica', '{"trilha_id": "dev-onboarding", "ajustes": ["adicionar_exemplos_praticos", "simplificar_linguagem"]}', NOW() - INTERVAL '1 hour'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'Agendar reunião de feedback', 'Reunião individual com colaborador em risco', 'aprovada_pendente_execucao', 'contatar_colaborador', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Score de risco alto requer intervenção imediata', '{"tipo_reuniao": "feedback", "urgencia": "alta", "agendamento": "proximo_dia_util"}', NOW() - INTERVAL '30 minutes'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'Escalar para RH', 'Encaminhar caso para recursos humanos', 'pendente_aprovacao', 'escalar_rh', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Múltiplos alertas indicam possível problema de adaptação', '{"motivo": "risco_evasao", "documentacao": ["alertas_criticos", "baixo_engajamento"]}', NOW() - INTERVAL '2 hours'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'Criar ticket de suporte', 'Ticket para equipe de desenvolvimento', 'executada', 'criar_ticket', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'Problema técnico identificado na plataforma', '{"ticket_id": "TICK-2024-001", "prioridade": "media", "categoria": "bug"}', NOW() - INTERVAL '1 day');

-- ============================================
-- 3. ATUALIZAR SCORES DE RISCO DOS USUÁRIOS
-- ============================================

UPDATE users 
SET risk_score = 75, 
    risk_score_atualizado_em = NOW(),
    ultima_atividade_em = NOW() - INTERVAL '2 hours'
WHERE id = '4ab6c765-bcfc-4280-84cd-3190fcf881c2';

-- Adicionar mais usuários com diferentes scores
INSERT INTO users (
    id, 
    tenant_id, 
    name, 
    email, 
    role, 
    active, 
    risk_score, 
    risk_score_atualizado_em,
    ultima_atividade_em,
    created_at
) VALUES 
(gen_random_uuid(), '5978f911-738b-4aae-802a-f037fdac2e64', 'Maria Santos', 'maria@demo.com', 'user', true, 60, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days'),
(gen_random_uuid(), '5978f911-738b-4aae-802a-f037fdac2e64', 'João Silva', 'joao@demo.com', 'user', true, 45, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '15 days'),
(gen_random_uuid(), '5978f911-738b-4aae-802a-f037fdac2e64', 'Ana Costa', 'ana@demo.com', 'user', true, 25, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '7 days')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 4. INSERIR NOTIFICAÇÕES
-- ============================================

INSERT INTO notifications (
    tenant_id,
    user_id,
    tipo,
    titulo,
    mensagem,
    dados,
    link,
    created_at
) VALUES 
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'alerta_critico', '🚨 Alerta Crítico: Baixo Engajamento', 'Colaborador João Silva apresenta baixo engajamento nas trilhas', '{"alerta_id": "1", "severidade": "critica", "score": 85}', '/dashboard.html#alertas', NOW() - INTERVAL '2 hours'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'acao_pendente', '⏳ Ação Pendente: Revisar Trilha', 'Aprovação necessária para ajustar trilha de desenvolvimento', '{"acao_id": "1", "tipo": "ajustar_trilha"}', '/dashboard.html#acoes', NOW() - INTERVAL '1 hour'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'colaborador_risco', '⚠️ Colaborador em Risco', 'João Silva tem score de risco alto (75/100)', '{"colaborador_id": "4ab6c765-bcfc-4280-84cd-3190fcf881c2", "score": 75}', '/dashboard.html#risco', NOW() - INTERVAL '3 hours'),
('5978f911-738b-4aae-802a-f037fdac2e64', '4ab6c765-bcfc-4280-84cd-3190fcf881c2', 'melhoria_sugerida', '💡 Nova Melhoria Sugerida', 'Sistema sugeriu melhorias na trilha de onboarding', '{"melhoria_id": "1", "impacto": "alto"}', '/dashboard.html#melhorias', NOW() - INTERVAL '4 hours');

-- ============================================
-- 5. CRIAR VIEW OTIMIZADA PARA DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    
    -- Métricas de trilhas
    (SELECT COUNT(*) FROM trilhas tr WHERE tr.tenant_id = t.id AND tr.status = 'ativo') as trilhas_ativas,
    (SELECT COUNT(*) FROM trilhas tr WHERE tr.tenant_id = t.id AND tr.status = 'concluido') as trilhas_concluidas,
    
    -- Métricas de usuários
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.active = true) as total_usuarios,
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.active = true AND u.created_at > NOW() - INTERVAL '30 days') as usuarios_onboarding,
    
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
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.risk_score > 50) as colaboradores_risco,
    
    -- Tendências (comparação com período anterior)
    (SELECT COUNT(*) FROM agente_anotacoes aa WHERE aa.tenant_id = t.id AND aa.created_at > NOW() - INTERVAL '7 days') as anotacoes_7_dias,
    (SELECT COUNT(*) FROM agente_anotacoes aa WHERE aa.tenant_id = t.id AND aa.created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days') as anotacoes_7_dias_anterior
    
FROM tenants t;

-- ============================================
-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para consultas do dashboard
CREATE INDEX IF NOT EXISTS idx_dashboard_anotacoes_tenant_data ON agente_anotacoes(tenant_id, created_at DESC, alerta_gerado);
CREATE INDEX IF NOT EXISTS idx_dashboard_anotacoes_severidade ON agente_anotacoes(tenant_id, severidade, status) WHERE alerta_gerado = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_improvements_tenant_status ON onboarding_improvements(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_risk ON users(tenant_id, risk_score DESC, active);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_tenant ON notifications(tenant_id, created_at DESC, lida);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_onboarding ON users(tenant_id, created_at DESC) WHERE active = true;

-- ============================================
-- 7. FUNÇÃO PARA BUSCAR DADOS DO DASHBOARD
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
-- 8. VERIFICAÇÕES FINAIS
-- ============================================

-- Verificar se os dados foram inseridos
DO $$
DECLARE
    alertas_count INTEGER;
    melhorias_count INTEGER;
    notificacoes_count INTEGER;
    usuarios_risco INTEGER;
BEGIN
    SELECT COUNT(*) INTO alertas_count FROM agente_anotacoes WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' AND alerta_gerado = true;
    SELECT COUNT(*) INTO melhorias_count FROM onboarding_improvements WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    SELECT COUNT(*) INTO notificacoes_count FROM notifications WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64';
    SELECT COUNT(*) INTO usuarios_risco FROM users WHERE tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64' AND risk_score > 0;
    
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

-- Testar a função de dashboard
SELECT get_dashboard_data('5978f911-738b-4aae-802a-f037fdac2e64');

-- Fim da migração











