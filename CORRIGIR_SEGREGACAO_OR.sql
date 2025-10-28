-- ===================================================================
-- CORREÇÃO: Segregação de Trilhas - Cargo OU Departamento
-- Data: 15 de janeiro de 2025
-- ===================================================================

-- A lógica atual 'departamentos_cargos' exige AMBOS (AND)
-- Vamos criar uma nova opção que faz OR (qualquer um dá acesso)

-- Adicionar novo tipo de segmentação
ALTER TABLE trilhas DROP CONSTRAINT IF EXISTS trilhas_segmentacao_tipo_check;
ALTER TABLE trilhas ADD CONSTRAINT trilhas_segmentacao_tipo_check 
  CHECK (segmentacao_tipo IN ('todos', 'departamentos', 'cargos', 'departamentos_cargos', 'departamentos_ou_cargos'));

COMMENT ON COLUMN trilhas.segmentacao_tipo IS 'Tipo de segmentação: todos, departamentos, cargos, departamentos_cargos (AND), departamentos_ou_cargos (OR)';

-- Atualizar função para suportar OR
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
  
  -- Verificar segmentação por departamento E cargo (AMBOS)
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
  
  -- NOVO: Verificar segmentação por departamento OU cargo (QUALQUER UM)
  IF v_trilha.segmentacao_tipo = 'departamentos_ou_cargos' THEN
    SELECT EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND (
          ts.department_id = v_colaborador.department_id OR
          ts.position_id = v_colaborador.position_id
        )
        AND ts.incluir = true
    ) INTO v_tem_acesso;
    
    RETURN v_tem_acesso;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION colaborador_tem_acesso_trilha IS 'Verifica se um colaborador tem acesso a uma trilha específica baseado na segmentação (todos, departamentos, cargos, AND, OU)';

