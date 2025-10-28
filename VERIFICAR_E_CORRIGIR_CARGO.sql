-- ===================================================================
-- CORREÇÃO DO CARGO DO COLABORADOR
-- Execute no Supabase
-- ===================================================================

-- 1. VER DADOS ATUAIS
SELECT 'DADOS ATUAIS' as acao;
SELECT 
  id,
  name,
  position_id,
  department_id,
  (SELECT name FROM positions WHERE id = users.position_id) as cargo_nome,
  (SELECT name FROM departments WHERE id = users.department_id) as dept_nome
FROM users 
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 2. LISTAR CARGOS DISPONÍVEIS NO SISTEMA
SELECT 'CARGOS DISPONÍVEIS' as acao;
SELECT id, name FROM positions 
WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900')
ORDER BY name;

-- 3. VER QUAL É O CARGO "Desenvolvedor"
SELECT 'CARGO DESENVOLVEDOR' as acao;
SELECT id, name FROM positions 
WHERE name ILIKE '%esenvolvedor%'
  AND tenant_id = (SELECT tenant_id FROM users WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900');

-- 4. ATUALIZAR COLABORADOR COM O CARGO CORRETO
-- (Execute após identificar o ID do cargo)
-- UPDATE users 
-- SET position_id = 'ID_DO_CARGO_AQUI'
-- WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 5. VERIFICAR SE ATUALIZOU
SELECT 'DADOS APÓS ATUALIZAÇÃO' as acao;
SELECT 
  id,
  name,
  position_id,
  department_id,
  (SELECT name FROM positions WHERE id = users.position_id) as cargo_nome,
  (SELECT name FROM departments WHERE id = users.department_id) as dept_nome
FROM users 
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

