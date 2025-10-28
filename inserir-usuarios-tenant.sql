-- ============================================
-- SCRIPT SQL: Inserir 3 Usuários para o Tenant
-- Arquivo: inserir-usuarios-tenant.sql
-- Descrição: Script para inserir 3 usuários com dados completos
-- ============================================

-- ============================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================
-- Verificar se as tabelas necessárias existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'positions', 'departments');

-- ============================================
-- 2. INSERIR DEPARTAMENTOS (se não existirem)
-- ============================================
INSERT INTO departments (id, tenant_id, name, description, created_at, updated_at)
VALUES 
('dept-dev-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Desenvolvimento', 'Departamento de Desenvolvimento de Software', NOW(), NOW()),
('dept-design-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Design', 'Departamento de Design e UX/UI', NOW(), NOW()),
('dept-pm-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Product Management', 'Departamento de Gestão de Produto', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. INSERIR CARGOS (se não existirem)
-- ============================================
INSERT INTO positions (id, tenant_id, name, description, department_id, created_at, updated_at)
VALUES 
('pos-dev-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Desenvolvedor Full Stack', 'Desenvolvedor com conhecimento em frontend e backend', 'dept-dev-001', NOW(), NOW()),
('pos-design-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'UX/UI Designer', 'Designer especializado em experiência e interface do usuário', 'dept-design-001', NOW(), NOW()),
('pos-pm-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Product Manager', 'Gerente de produto responsável por roadmap e estratégia', 'dept-pm-001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. INSERIR 3 USUÁRIOS
-- ============================================
INSERT INTO users (
    id, tenant_id, name, email, position_id, department_id, 
    phone, avatar_url, role, active, created_at, updated_at,
    risk_score, risk_score_atualizado_em, ultima_atividade_em
) VALUES 
-- Usuário 1: Desenvolvedor
('user-dev-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Ana Silva', 'ana.silva@empresa.com', 'pos-dev-001', 'dept-dev-001', 
 '+55 11 99999-1111', 'https://ui-avatars.com/api/?name=Ana+Silva&background=17A2B8&color=fff', 'colaborador', true, NOW(), NOW(),
 25, NOW(), NOW() - INTERVAL '1 hour'),

-- Usuário 2: Designer
('user-design-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Carlos Santos', 'carlos.santos@empresa.com', 'pos-design-001', 'dept-design-001',
 '+55 11 99999-2222', 'https://ui-avatars.com/api/?name=Carlos+Santos&background=28A745&color=fff', 'colaborador', true, NOW(), NOW(),
 15, NOW(), NOW() - INTERVAL '30 minutes'),

-- Usuário 3: Product Manager
('user-pm-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Maria Oliveira', 'maria.oliveira@empresa.com', 'pos-pm-001', 'dept-pm-001',
 '+55 11 99999-3333', 'https://ui-avatars.com/api/?name=Maria+Oliveira&background=6C757D&color=fff', 'colaborador', true, NOW(), NOW(),
 35, NOW(), NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. INSERIR TRILHAS PARA OS USUÁRIOS
-- ============================================
INSERT INTO trilhas (id, tenant_id, nome, descricao, status, created_at, updated_at)
VALUES 
('trilha-dev-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Onboarding Desenvolvedor', 'Trilha completa para novos desenvolvedores', 'ativo', NOW(), NOW()),
('trilha-design-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Onboarding Designer', 'Trilha completa para novos designers', 'ativo', NOW(), NOW()),
('trilha-pm-001', '5978f911-738b-4aae-802a-f037fdac2e64', 'Onboarding Product Manager', 'Trilha completa para novos PMs', 'ativo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. ASSOCIAR USUÁRIOS ÀS TRILHAS
-- ============================================
INSERT INTO user_trilhas (user_id, trilha_id, status, progresso, data_inicio, data_conclusao, created_at, updated_at)
VALUES 
-- Ana Silva - Trilha Desenvolvedor
('user-dev-001', 'trilha-dev-001', 'em_andamento', 65, NOW() - INTERVAL '5 days', NULL, NOW(), NOW()),

-- Carlos Santos - Trilha Designer  
('user-design-001', 'trilha-design-001', 'em_andamento', 80, NOW() - INTERVAL '3 days', NULL, NOW(), NOW()),

-- Maria Oliveira - Trilha PM
('user-pm-001', 'trilha-pm-001', 'em_andamento', 45, NOW() - INTERVAL '7 days', NULL, NOW(), NOW())
ON CONFLICT (user_id, trilha_id) DO NOTHING;

-- ============================================
-- 7. INSERIR ANOTAÇÕES PARA OS USUÁRIOS
-- ============================================
INSERT INTO agente_anotacoes (
    tenant_id, colaborador_id, titulo, anotacao, tipo, sentimento, 
    severidade, status, proactive_score, alerta_gerado, created_at
) VALUES 
-- Anotações para Ana Silva
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-dev-001', 'Excelente progresso na trilha', 'Ana está se adaptando muito bem ao processo de onboarding', 'feedback_positivo', 'positivo', 'baixa', 'ativo', 20, false, NOW() - INTERVAL '1 day'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-dev-001', 'Dúvida sobre documentação técnica', 'Ana teve algumas dúvidas sobre a documentação da API', 'duvida_tecnica', 'neutro', 'baixa', 'ativo', 30, false, NOW() - INTERVAL '2 days'),

-- Anotações para Carlos Santos
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-design-001', 'Feedback positivo sobre ferramentas', 'Carlos elogiou as ferramentas de design disponíveis', 'feedback_positivo', 'positivo', 'baixa', 'ativo', 15, false, NOW() - INTERVAL '1 day'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-design-001', 'Sugestão de melhoria no processo', 'Carlos sugeriu melhorias no processo de aprovação de designs', 'sugestao_melhoria', 'positivo', 'baixa', 'ativo', 25, false, NOW() - INTERVAL '3 days'),

-- Anotações para Maria Oliveira
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-pm-001', 'Dificuldade com ferramentas de PM', 'Maria está tendo dificuldade com as ferramentas de gestão de produto', 'dificuldade_ferramenta', 'negativo', 'media', 'ativo', 60, true, NOW() - INTERVAL '1 day'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-pm-001', 'Baixo engajamento nas reuniões', 'Maria demonstra baixo engajamento nas reuniões de equipe', 'alerta_baixo_engajamento', 'negativo', 'alta', 'ativo', 70, true, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. INSERIR NOTIFICAÇÕES PARA OS USUÁRIOS
-- ============================================
INSERT INTO notifications (
    tenant_id, user_id, tipo, titulo, mensagem, dados, link, created_at
) VALUES 
-- Notificações para Ana Silva
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-dev-001', 'trilha_progresso', '🎯 Progresso na Trilha', 'Você completou 65% da trilha de onboarding!', '{"trilha_id": "trilha-dev-001", "progresso": 65}', '/dashboard.html#trilhas', NOW() - INTERVAL '1 hour'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-dev-001', 'feedback_positivo', '👍 Feedback Positivo', 'Seu progresso no onboarding está excelente!', '{"tipo": "feedback_positivo", "score": 20}', '/dashboard.html#feedback', NOW() - INTERVAL '2 hours'),

-- Notificações para Carlos Santos
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-design-001', 'trilha_progresso', '🎯 Progresso na Trilha', 'Você completou 80% da trilha de onboarding!', '{"trilha_id": "trilha-design-001", "progresso": 80}', '/dashboard.html#trilhas', NOW() - INTERVAL '30 minutes'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-design-001', 'sugestao_aprovada', '💡 Sugestão Aprovada', 'Sua sugestão de melhoria foi aprovada pela equipe!', '{"tipo": "sugestao_melhoria", "status": "aprovada"}', '/dashboard.html#sugestoes', NOW() - INTERVAL '1 hour'),

-- Notificações para Maria Oliveira
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-pm-001', 'alerta_risco', '⚠️ Alerta de Risco', 'Identificamos algumas dificuldades no seu onboarding', '{"tipo": "alerta_risco", "score": 70}', '/dashboard.html#alertas', NOW() - INTERVAL '1 hour'),
('5978f911-738b-4aae-802a-f037fdac2e64', 'user-pm-001', 'suporte_disponivel', '🤝 Suporte Disponível', 'Nossa equipe está disponível para ajudar com suas dúvidas', '{"tipo": "suporte", "urgencia": "media"}', '/dashboard.html#suporte', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. VERIFICAR DADOS INSERIDOS
-- ============================================
DO $$
DECLARE
    tenant_uuid UUID := '5978f911-738b-4aae-802a-f037fdac2e64';
    usuarios_count INTEGER;
    trilhas_count INTEGER;
    anotacoes_count INTEGER;
    notificacoes_count INTEGER;
BEGIN
    -- Contar usuários inseridos
    SELECT COUNT(*) INTO usuarios_count 
    FROM users 
    WHERE tenant_id = tenant_uuid AND id LIKE 'user-%';
    
    -- Contar trilhas inseridas
    SELECT COUNT(*) INTO trilhas_count 
    FROM trilhas 
    WHERE tenant_id = tenant_uuid AND id LIKE 'trilha-%';
    
    -- Contar anotações inseridas
    SELECT COUNT(*) INTO anotacoes_count 
    FROM agente_anotacoes 
    WHERE tenant_id = tenant_uuid AND colaborador_id LIKE 'user-%';
    
    -- Contar notificações inseridas
    SELECT COUNT(*) INTO notificacoes_count 
    FROM notifications 
    WHERE tenant_id = tenant_uuid AND user_id LIKE 'user-%';
    
    -- Relatório de verificação
    RAISE NOTICE '=== VERIFICAÇÃO DOS USUÁRIOS INSERIDOS ===';
    RAISE NOTICE 'Usuários inseridos: %', usuarios_count;
    RAISE NOTICE 'Trilhas inseridas: %', trilhas_count;
    RAISE NOTICE 'Anotações inseridas: %', anotacoes_count;
    RAISE NOTICE 'Notificações inseridas: %', notificacoes_count;
    
    IF usuarios_count = 3 AND trilhas_count = 3 AND anotacoes_count > 0 AND notificacoes_count > 0 THEN
        RAISE NOTICE '✅ USUÁRIOS INSERIDOS COM SUCESSO!';
    ELSE
        RAISE NOTICE '❌ ERRO AO INSERIR USUÁRIOS';
    END IF;
END $$;

-- ============================================
-- 10. CONSULTA FINAL PARA VERIFICAR
-- ============================================
SELECT 
    u.name as nome,
    u.email,
    p.name as cargo,
    d.name as departamento,
    u.risk_score,
    ut.progresso,
    ut.status as status_trilha
FROM users u
LEFT JOIN positions p ON u.position_id = p.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN user_trilhas ut ON u.id = ut.user_id
WHERE u.tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'
AND u.id LIKE 'user-%'
ORDER BY u.name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================











