-- Criar tabela colaboradores (se não existir)
-- Baseado na estrutura esperada pelo código

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cargo VARCHAR(255),
  departamento VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ativo',
  data_admissao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, email)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_tenant ON colaboradores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);

-- RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver colaboradores do seu tenant
DROP POLICY IF EXISTS "Admins podem ver colaboradores do tenant" ON colaboradores;
CREATE POLICY "Admins podem ver colaboradores do tenant"
  ON colaboradores FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins podem inserir colaboradores
DROP POLICY IF EXISTS "Admins podem inserir colaboradores" ON colaboradores;
CREATE POLICY "Admins podem inserir colaboradores"
  ON colaboradores FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins podem atualizar colaboradores do tenant
DROP POLICY IF EXISTS "Admins podem atualizar colaboradores" ON colaboradores;
CREATE POLICY "Admins podem atualizar colaboradores"
  ON colaboradores FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Admins podem deletar colaboradores do tenant
DROP POLICY IF EXISTS "Admins podem deletar colaboradores" ON colaboradores;
CREATE POLICY "Admins podem deletar colaboradores"
  ON colaboradores FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Inserir colaborador de teste
INSERT INTO colaboradores (id, tenant_id, nome, email, cargo, departamento, status)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
  '5978f911-738b-4aae-802a-f037fdac2e64'::UUID,
  'Colaborador Teste',
  'teste@flowly.com',
  'Desenvolvedor',
  'TI',
  'ativo'
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Tabela colaboradores criada e colaborador de teste inserido!' as resultado;

