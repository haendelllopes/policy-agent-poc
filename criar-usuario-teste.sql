-- Criar usuário de teste na tabela users (que é a tabela correta)

-- Primeiro, verificar se já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID
  ) THEN
    INSERT INTO users (
      id, 
      tenant_id, 
      name, 
      email,
      phone,
      position,
      role,
      department,
      created_at
    ) VALUES (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
      '5978f911-738b-4aae-802a-f037fdac2e64'::UUID,
      'Colaborador Teste',
      'teste@flowly.com',
      '+5511999999999',
      'Desenvolvedor',
      'colaborador',
      'TI',
      NOW()
    );
    
    RAISE NOTICE 'Usuário de teste criado com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário de teste já existe!';
  END IF;
END $$;

-- Verificar
SELECT id, name, email, role, tenant_id 
FROM users 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID;

