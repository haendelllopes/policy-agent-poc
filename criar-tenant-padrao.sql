-- Criar tenant padrão para testes
-- Execute isso no Supabase SQL Editor

-- 1. Verificar tenants existentes
SELECT id, name FROM tenants ORDER BY created_at DESC LIMIT 5;

-- 2. Criar tenant padrão se não existir
INSERT INTO tenants (
  id,
  name,
  slug,
  created_at
) VALUES (
  'f37a823e-c4af-4b1b-9e88-1d5ec65326ad',
  'Tenant Padrão N8N',
  'tenant-padrao-n8n',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se foi criado
SELECT id, name, slug FROM tenants WHERE id = 'f37a823e-c4af-4b1b-9e88-1d5ec65326ad';

-- 4. Criar tenant de demonstração (o que já usávamos)
INSERT INTO tenants (
  id,
  name,
  slug,
  created_at
) VALUES (
  '5978f911-738b-4aae-802a-f037fdac2e64',
  'Demonstração',
  'demonstracao',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. Listar todos os tenants
SELECT 
  id, 
  name, 
  slug,
  created_at 
FROM tenants 
ORDER BY created_at DESC;


