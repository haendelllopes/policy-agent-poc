-- ============================================
-- SCRIPT: ADICIONAR 15 NOVOS USUÁRIOS
-- Descrição: Adicionar 15 usuários para o sistema Navigator
-- Data: 2025-01-14
-- ============================================

-- ============================================
-- 1. BUSCAR IDs DOS USUÁRIOS REFERÊNCIA
-- ============================================

-- Buscar ID do Haendell (Gestor)
DO $$
DECLARE
    haendell_id UUID;
    vanessa_id UUID;
    tenant_uuid UUID := '5978f911-738b-4aae-802a-f037fdac2e64';
BEGIN
    -- Buscar IDs do Haendell e Vanessa
    SELECT id INTO haendell_id FROM users WHERE LOWER(name) LIKE '%haendell%' AND tenant_id = tenant_uuid LIMIT 1;
    SELECT id INTO vanessa_id FROM users WHERE LOWER(name) LIKE '%vanessa%' AND tenant_id = tenant_uuid LIMIT 1;
    
    RAISE NOTICE 'Haendell ID: %', haendell_id;
    RAISE NOTICE 'Vanessa ID: %', vanessa_id;
    
    -- ============================================
    -- 2. BUSCAR OU CRIAR DEPARTAMENTOS
    -- ============================================
    
    -- Inserir departamentos se não existirem
    INSERT INTO departments (id, tenant_id, name, description, created_at, updated_at)
    VALUES 
    ('dept-dev-001', tenant_uuid, 'Desenvolvimento', 'Departamento de Desenvolvimento de Software', NOW(), NOW()),
    ('dept-design-001', tenant_uuid, 'Design', 'Departamento de Design e UX/UI', NOW(), NOW()),
    ('dept-rh-001', tenant_uuid, 'Recursos Humanos', 'Departamento de Recursos Humanos', NOW(), NOW()),
    ('dept-comercial-001', tenant_uuid, 'Comercial', 'Departamento Comercial e Vendas', NOW(), NOW()),
    ('dept-marketing-001', tenant_uuid, 'Marketing', 'Departamento de Marketing Digital', NOW(), NOW()),
    ('dept-financeiro-001', tenant_uuid, 'Financeiro', 'Departamento Financeiro e Contabilidade', NOW(), NOW()),
    ('dept-op-001', tenant_uuid, 'Operações', 'Departamento de Operações', NOW(), NOW()),
    ('dept-qa-001', tenant_uuid, 'Quality Assurance', 'Departamento de Garantia de Qualidade', NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- ============================================
    -- 3. BUSCAR OU CRIAR CARGOS
    -- ============================================
    
    -- Inserir cargos se não existirem
    INSERT INTO positions (id, tenant_id, name, description, department_id, created_at, updated_at)
    VALUES 
    -- Desenvolvimento
    ('pos-dev-jr-001', tenant_uuid, 'Desenvolvedor Júnior', 'Desenvolvedor nível júnior', 'dept-dev-001', NOW(), NOW()),
    ('pos-dev-pl-001', tenant_uuid, 'Desenvolvedor Pleno', 'Desenvolvedor nível pleno', 'dept-dev-001', NOW(), NOW()),
    ('pos-dev-sr-001', tenant_uuid, 'Desenvolvedor Sênior', 'Desenvolvedor nível sênior', 'dept-dev-001', NOW(), NOW()),
    ('pos-tech-lead-001', tenant_uuid, 'Tech Lead', 'Tech Lead de desenvolvimento', 'dept-dev-001', NOW(), NOW()),
    
    -- Design
    ('pos-design-jr-001', tenant_uuid, 'Designer Júnior', 'Designer nível júnior', 'dept-design-001', NOW(), NOW()),
    ('pos-design-pl-001', tenant_uuid, 'Designer Pleno', 'Designer nível pleno', 'dept-design-001', NOW(), NOW()),
    ('pos-design-sr-001', tenant_uuid, 'Designer Sênior', 'Designer nível sênior', 'dept-design-001', NOW(), NOW()),
    
    -- RH
    ('pos-rh-analista-001', tenant_uuid, 'Analista de RH', 'Analista de Recursos Humanos', 'dept-rh-001', NOW(), NOW()),
    ('pos-rh-coord-001', tenant_uuid, 'Coordenador de RH', 'Coordenador de Recursos Humanos', 'dept-rh-001', NOW(), NOW()),
    
    -- Comercial
    ('pos-vend-001', tenant_uuid, 'Vendedor', 'Representante Comercial', 'dept-comercial-001', NOW(), NOW()),
    ('pos-vend-sr-001', tenant_uuid, 'Vendedor Sênior', 'Representante Comercial Sênior', 'dept-comercial-001', NOW(), NOW()),
    
    -- Marketing
    ('pos-mkt-jr-001', tenant_uuid, 'Analista de Marketing', 'Analista de Marketing Digital', 'dept-marketing-001', NOW(), NOW()),
    ('pos-mkt-pl-001', tenant_uuid, 'Especialista de Marketing', 'Especialista em Marketing', 'dept-marketing-001', NOW(), NOW()),
    
    -- QA
    ('pos-qa-jr-001', tenant_uuid, 'QA Júnior', 'Analista de QA Júnior', 'dept-qa-001', NOW(), NOW()),
    ('pos-qa-pl-001', tenant_uuid, 'QA Pleno', 'Analista de QA Pleno', 'dept-qa-001', NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- ============================================
    -- 4. INSERIR 15 NOVOS USUÁRIOS
    -- ============================================
    
    INSERT INTO users (
        id, 
        tenant_id, 
        name, 
        email, 
        phone, 
        position, 
        department, 
        position_id, 
        department_id,
        gestor_id,
        buddy_id,
        role,
        status,
        onboarding_status,
        onboarding_inicio,
        start_date,
        created_at,
        updated_at
    ) VALUES 
    -- Usuários com gestor Haendell e buddy Vanessa
    (gen_random_uuid(), tenant_uuid, 'Ana Paula Santos', 'ana.paula@navigator.com', '+5521999887766', 'Desenvolvedor Júnior', 'Desenvolvimento', 'pos-dev-jr-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 3, CURRENT_DATE - 3, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Bruno Oliveira', 'bruno.oliveira@navigator.com', '+5521988776655', 'Desenvolvedor Pleno', 'Desenvolvimento', 'pos-dev-pl-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 5, CURRENT_DATE - 5, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Camila Ferreira', 'camila.ferreira@navigator.com', '+5521977665544', 'Designer Júnior', 'Design', 'pos-design-jr-001', 'dept-design-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 2, CURRENT_DATE - 2, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Diego Almeida', 'diego.almeida@navigator.com', '+5521966554433', 'Desenvolvedor Sênior', 'Desenvolvimento', 'pos-dev-sr-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 7, CURRENT_DATE - 7, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Fernanda Costa', 'fernanda.costa@navigator.com', '+5521955443322', 'Analista de Marketing', 'Marketing', 'pos-mkt-jr-001', 'dept-marketing-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 1, CURRENT_DATE - 1, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Gabriel Lima', 'gabriel.lima@navigator.com', '+5521944332211', 'QA Pleno', 'Quality Assurance', 'pos-qa-pl-001', 'dept-qa-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 6, CURRENT_DATE - 6, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Isabella Martins', 'isabella.martins@navigator.com', '+5521933221100', 'Desenvolvedor Pleno', 'Desenvolvimento', 'pos-dev-pl-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 4, CURRENT_DATE - 4, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'João Henrique', 'joao.henrique@navigator.com', '+5521922110099', 'Designer Pleno', 'Design', 'pos-design-pl-001', 'dept-design-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 8, CURRENT_DATE - 8, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Karina Silva', 'karina.silva@navigator.com', '+5521911009988', 'Analista de RH', 'Recursos Humanos', 'pos-rh-analista-001', 'dept-rh-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 10, CURRENT_DATE - 10, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Lucas Pereira', 'lucas.pereira@navigator.com', '+5521900998877', 'Vendedor', 'Comercial', 'pos-vend-001', 'dept-comercial-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 12, CURRENT_DATE - 12, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Mariana Rocha', 'mariana.rocha@navigator.com', '+5521888777666', 'Desenvolvedor Júnior', 'Desenvolvimento', 'pos-dev-jr-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 9, CURRENT_DATE - 9, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Natália Souza', 'natalia.souza@navigator.com', '+5521877666555', 'Tech Lead', 'Desenvolvimento', 'pos-tech-lead-001', 'dept-dev-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 11, CURRENT_DATE - 11, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Otávio Rodrigues', 'otavio.rodrigues@navigator.com', '+5521866555444', 'QA Júnior', 'Quality Assurance', 'pos-qa-jr-001', 'dept-qa-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 13, CURRENT_DATE - 13, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Patrícia Alves', 'patricia.alves@navigator.com', '+5521855444333', 'Especialista de Marketing', 'Marketing', 'pos-mkt-pl-001', 'dept-marketing-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 14, CURRENT_DATE - 14, NOW(), NOW()),
    
    (gen_random_uuid(), tenant_uuid, 'Ricardo Barbosa', 'ricardo.barbosa@navigator.com', '+5521844333222', 'Vendedor Sênior', 'Comercial', 'pos-vend-sr-001', 'dept-comercial-001', haendell_id, vanessa_id, 'colaborador', 'active', 'nao_iniciado', CURRENT_DATE - 15, CURRENT_DATE - 15, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Inserção de 15 usuários concluída!';
    RAISE NOTICE 'Gestor configurado: Haendell (%s)', haendell_id;
    RAISE NOTICE 'Buddy configurado: Vanessa (%s)', vanessa_id;
END $$;

-- Verificar inserção
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    d.name as department_name,
    p.name as position_name,
    u.gestor_id,
    u.buddy_id,
    u.onboarding_status,
    u.start_date
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN positions p ON u.position_id = p.id
WHERE u.tenant_id = '5978f911-738b-4aae-802a-f037fdac2e64'
AND u.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY u.created_at DESC
LIMIT 20;

-- Fim do script

