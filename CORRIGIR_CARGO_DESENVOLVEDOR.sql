-- Execute esta query para configurar cargo "Desenvolvedor" no colaborador

-- 1. Ver cargo "Desenvolvedor"
SELECT id, name FROM positions WHERE name ILIKE '%esenvolvedor%' LIMIT 1;

-- 2. Substitua o UUID abaixo pelo ID retornado acima, depois execute:
UPDATE users 
SET position_id = 'SUBSTITUIR_AQUI',
    updated_at = NOW()
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

-- 3. Verificar se atualizou
SELECT 
  id, name, 
  position_id,
  (SELECT name FROM positions WHERE id = users.position_id) as cargo
FROM users 
WHERE id = 'b2b1f3da-0ea0-445e-ba7f-0cd95e663900';

