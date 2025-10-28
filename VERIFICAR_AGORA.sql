-- ===================================================================
-- VERIFICAÇÃO RÁPIDA - Copie e cole no Supabase
-- ===================================================================

-- 1. Ver se colaborador tem cargo
SELECT '=== DADOS DO COLABORADOR ===' as info;
SELECT id, name, position_id, department_id,
  (SELECT name FROM positions WHERE id = users.position_id) as cargo,
  (SELECT name FROM departments WHERE id = users.department_id) as dept
FROM users 
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 2. Ver trilhas e como estão configuradas
SELECT '=== TRILHAS E SEGREGAÇÃO ===' as info;
SELECT 
  t.id,
  t.nome,
  t.segmentacao_tipo,
  COUNT(ts.id) as total_segmentacoes
FROM trilhas t
LEFT JOIN trilha_segmentacao ts ON ts.trilha_id = t.id
WHERE t.ativo = true
  AND t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
GROUP BY t.id, t.nome, t.segmentacao_tipo
ORDER BY t.nome;

-- 3. Ver detalhes da configuração da trilha "O que é onboarding"
SELECT '=== TRILHA "O que é onboarding" ===' as info;
SELECT 
  ts.trilha_id,
  t.nome as trilha_nome,
  ts.department_id,
  ts.position_id,
  ts.incluir,
  d.name as dept_name,
  p.name as pos_name
FROM trilha_segmentacao ts
JOIN trilhas t ON t.id = ts.trilha_id
LEFT JOIN departments d ON d.id = ts.department_id
LEFT JOIN positions p ON p.id = ts.position_id
WHERE t.nome ILIKE '%onboarding%'
  AND t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900');

-- 4. Ver quais trilhas têm cargo configurado
SELECT '=== TRILHAS COM CARGO ===' as info;
SELECT 
  t.id,
  t.nome,
  ts.position_id,
  p.name as cargo_configurado
FROM trilha_segmentacao ts
JOIN trilhas t ON t.id = ts.trilha_id
LEFT JOIN positions p ON p.id = ts.position_id
WHERE ts.position_id IS NOT NULL
  AND ts.department_id IS NULL
  AND t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900');

-- 5. Teste da função para VER todas as trilhas
SELECT '=== TESTE DA FUNÇÃO ===' as info;
SELECT 
  t.id,
  t.nome,
  t.segmentacao_tipo,
  colaborador_tem_acesso_trilha('b2b1f3da-0ea0-445e-ba7f-0cd95e663900', t.id) as tem_acesso
FROM trilhas t
WHERE t.ativo = true
  AND t.tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
ORDER BY t.nome;

