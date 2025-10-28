-- ===================================================================
-- DIAGNÓSTICO DE SEGREGAÇÃO DE TRILHAS
-- Colaborador: b2b1f3da-0ea0-445e-ba7f-0cd95e663900
-- Data: 15 de janeiro de 2025
-- ===================================================================

-- 1. DADOS DO COLABORADOR
SELECT '=== 1. DADOS DO COLABORADOR ===' as secao;

SELECT 
  id,
  name,
  email,
  department_id,
  position_id,
  (SELECT name FROM departments WHERE id = users.department_id) as dept_name,
  (SELECT name FROM positions WHERE id = users.position_id) as pos_name
FROM users
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 2. TRILHAS NO SISTEMA
SELECT '=== 2. TRILHAS NO SISTEMA ===' as secao;

SELECT 
  id,
  nome,
  ativo,
  segmentacao_tipo,
  (SELECT tenant_subdomain FROM tenants WHERE id = trilhas.tenant_id) as tenant
FROM trilhas
WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
ORDER BY nome;

-- 3. CONFIGURAÇÃO DE SEGREGAÇÃO
SELECT '=== 3. CONFIGURAÇÃO DE SEGREGAÇÃO ===' as secao;

SELECT 
  ts.trilha_id,
  t.nome as trilha_nome,
  ts.department_id,
  ts.position_id,
  ts.incluir,
  d.name as dept_name,
  p.name as pos_name,
  CASE
    WHEN ts.department_id IS NOT NULL AND ts.position_id IS NOT NULL THEN 'AMBOS'
    WHEN ts.department_id IS NOT NULL THEN 'DEPARTAMENTO'
    WHEN ts.position_id IS NOT NULL THEN 'CARGO'
    ELSE 'NENHUM'
  END as tipo_config
FROM trilha_segmentacao ts
JOIN trilhas t ON t.id = ts.trilha_id
LEFT JOIN departments d ON d.id = ts.department_id
LEFT JOIN positions p ON p.id = ts.position_id
WHERE ts.trilha_id IN (
  SELECT id FROM trilhas 
  WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
);

-- 4. TESTE DA FUNÇÃO DE ACESSO
SELECT '=== 4. TESTE DA FUNÇÃO DE ACESSO ===' as secao;

SELECT 
  t.id,
  t.nome,
  colaborador_tem_acesso_trilha('b2b1f3da-0ea0-445e-ba7f-0cd95e663900', t.id) as tem_acesso
FROM trilhas t
WHERE t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
  AND t.ativo = true
ORDER BY t.nome;

-- 5. CARGOS DISPONÍVEIS NO SISTEMA
SELECT '=== 5. CARGOS DISPONÍVEIS ===' as secao;

SELECT 
  id,
  name as cargo_nome,
  tenant_id
FROM positions
WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
ORDER BY name;

-- 6. VERIFICAR SE USUÁRIO TEM O CARGO CORRETO
SELECT '=== 6. VERIFICAÇÃO DE CARGO ===' as secao;

SELECT 
  u.id,
  u.name,
  u.position_id,
  p.name as cargo_nome,
  p.id as cargo_id
FROM users u
LEFT JOIN positions p ON p.id = u.position_id
WHERE u.id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 7. VERIFICAR TRILHAS PARA O CARGO DESENVOLVEDOR
SELECT '=== 7. TRILHAS CONFIGURADAS PARA CARGO ===' as secao;

SELECT 
  ts.trilha_id,
  t.nome as trilha_nome,
  t.segmentacao_tipo,
  ts.position_id,
  p.name as cargo_configurado,
  ts.incluir
FROM trilha_segmentacao ts
JOIN trilhas t ON t.id = ts.trilha_id
LEFT JOIN positions p ON p.id = ts.position_id
WHERE ts.position_id IS NOT NULL
  AND ts.trilha_id IN (
    SELECT id FROM trilhas 
    WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
  )
ORDER BY t.nome;

