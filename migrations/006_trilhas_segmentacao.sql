-- ===================================================================
-- MIGRAÇÃO: Trilhas por Departamento e Cargo
-- Data: 2025-10-10
-- Descrição: Segmentação de trilhas para personalização por cargo/departamento
-- ===================================================================

-- Adicionar colunas de segmentação à tabela trilhas
ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS segmentacao_tipo VARCHAR(30) NOT NULL DEFAULT 'todos'
  CHECK (segmentacao_tipo IN ('todos', 'departamentos', 'cargos', 'departamentos_cargos'));

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS segmentacao_config JSONB;

-- Criar tabela auxiliar para segmentação (melhor performance em queries)
CREATE TABLE IF NOT EXISTS trilha_segmentacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  
  -- Segmentação (pelo menos um deve estar preenchido)
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  
  -- Se true, todos do departamento/cargo têm acesso
  -- Se false, é uma exceção (não tem acesso)
  incluir BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que não haverá duplicatas
  UNIQUE(trilha_id, department_id, position_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trilhas_segmentacao_tipo ON trilhas(segmentacao_tipo);
CREATE INDEX IF NOT EXISTS idx_trilhas_tenant_segmentacao ON trilhas(tenant_id, segmentacao_tipo);
CREATE INDEX IF NOT EXISTS idx_trilha_segmentacao_trilha ON trilha_segmentacao(trilha_id);
CREATE INDEX IF NOT EXISTS idx_trilha_segmentacao_dept ON trilha_segmentacao(department_id);
CREATE INDEX IF NOT EXISTS idx_trilha_segmentacao_position ON trilha_segmentacao(position_id);
CREATE INDEX IF NOT EXISTS idx_trilha_segmentacao_trilha_dept ON trilha_segmentacao(trilha_id, department_id);
CREATE INDEX IF NOT EXISTS idx_trilha_segmentacao_trilha_position ON trilha_segmentacao(trilha_id, position_id);

-- RLS (Row Level Security)
ALTER TABLE trilha_segmentacao ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem gerenciar segmentação do tenant
CREATE POLICY "Admins podem gerenciar segmentação" ON trilha_segmentacao
  FOR ALL USING (
    trilha_id IN (
      SELECT t.id FROM trilhas t
      JOIN tenants tn ON t.tenant_id = tn.id
      JOIN users u ON u.tenant_id = tn.id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE trilha_segmentacao IS 'Segmentação de trilhas por departamento e cargo';
COMMENT ON COLUMN trilhas.segmentacao_tipo IS 'Tipo de segmentação: todos, departamentos, cargos, departamentos_cargos';
COMMENT ON COLUMN trilhas.segmentacao_config IS 'Configuração JSON com IDs de departamentos/cargos permitidos';
COMMENT ON COLUMN trilha_segmentacao.incluir IS 'Se true, inclui este departamento/cargo; se false, exclui';

-- Função auxiliar para verificar se colaborador tem acesso à trilha
CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(
  p_colaborador_id UUID,
  p_trilha_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_trilha RECORD;
  v_colaborador RECORD;
  v_tem_acesso BOOLEAN := false;
BEGIN
  -- Buscar dados da trilha
  SELECT segmentacao_tipo, segmentacao_config 
  INTO v_trilha
  FROM trilhas 
  WHERE id = p_trilha_id AND ativo = true;
  
  -- Se trilha não existe ou inativa, não tem acesso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Se trilha é para todos, tem acesso
  IF v_trilha.segmentacao_tipo = 'todos' THEN
    RETURN true;
  END IF;
  
  -- Buscar dados do colaborador
  SELECT department_id, position_id
  INTO v_colaborador
  FROM users
  WHERE id = p_colaborador_id;
  
  -- Se colaborador não tem departamento/cargo definido, não tem acesso a trilhas segmentadas
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar segmentação por departamento
  IF v_trilha.segmentacao_tipo = 'departamentos' THEN
    SELECT EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.department_id = v_colaborador.department_id
        AND ts.incluir = true
    ) INTO v_tem_acesso;
    
    RETURN v_tem_acesso;
  END IF;
  
  -- Verificar segmentação por cargo
  IF v_trilha.segmentacao_tipo = 'cargos' THEN
    SELECT EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.position_id = v_colaborador.position_id
        AND ts.incluir = true
    ) INTO v_tem_acesso;
    
    RETURN v_tem_acesso;
  END IF;
  
  -- Verificar segmentação por departamento E cargo
  IF v_trilha.segmentacao_tipo = 'departamentos_cargos' THEN
    SELECT EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.department_id = v_colaborador.department_id
        AND ts.position_id = v_colaborador.position_id
        AND ts.incluir = true
    ) INTO v_tem_acesso;
    
    RETURN v_tem_acesso;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION colaborador_tem_acesso_trilha IS 'Verifica se um colaborador tem acesso a uma trilha específica baseado na segmentação';

-- View para facilitar consulta de trilhas por colaborador
CREATE OR REPLACE VIEW trilhas_colaborador AS
SELECT 
  u.id as colaborador_id,
  t.*,
  colaborador_tem_acesso_trilha(u.id, t.id) as tem_acesso
FROM users u
CROSS JOIN trilhas t
WHERE t.ativo = true
  AND u.tenant_id = t.tenant_id;

COMMENT ON VIEW trilhas_colaborador IS 'View que mostra todas as trilhas e se cada colaborador tem acesso a elas';

-- Fim da migração

