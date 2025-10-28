-- ===================================================================
-- CORREÇÃO: Segregação de Trilhas - Lógica Corrigida
-- Data: 15 de janeiro de 2025
-- Descrição: 
-- - Se marca APENAS Cargo → verifica cargo
-- - Se marca APENAS Departamento → verifica departamento  
-- - Se marca AMBOS → verifica AMBOS (AND)
-- ===================================================================

CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(
  p_colaborador_id UUID,
  p_trilha_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_trilha RECORD;
  v_colaborador RECORD;
  v_tem_acesso BOOLEAN := false;
  v_so_cargo BOOLEAN := false;
  v_so_departamento BOOLEAN := false;
  v_ambos BOOLEAN := false;
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
  
  -- Verificar o que está configurado na trilha_segmentacao
  SELECT 
    -- Tem registros APENAS com departamento (sem cargo)
    EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.department_id IS NOT NULL
        AND ts.position_id IS NULL
        AND ts.incluir = true
    ),
    -- Tem registros APENAS com cargo (sem departamento)
    EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.department_id IS NULL
        AND ts.position_id IS NOT NULL
        AND ts.incluir = true
    ),
    -- Tem registros COM AMBOS (departamento E cargo juntos)
    EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND ts.department_id IS NOT NULL
        AND ts.position_id IS NOT NULL
        AND ts.incluir = true
    )
  INTO v_so_departamento, v_so_cargo, v_ambos;
  
  -- Verificar segmentação por departamento
  IF v_trilha.segmentacao_tipo = 'departamentos' THEN
    -- Verifica se colaborador tem o departamento configurado
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
    -- Verifica se colaborador tem o cargo configurado
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
    -- LÓGICA CORRIGIDA:
    -- Se na trilha_segmentacao tem registros COM AMBOS (cargo E departamento juntos)
    -- Então exige que o colaborador tenha AMBOS
    -- Se tem registros APENAS com cargo ou APENAS com departamento, verifica separadamente
    
    -- Se tem registros COM AMBOS definidos (cargo E departamento juntos)
    IF v_ambos THEN
      -- Exige que colaborador tenha AMBOS
      SELECT EXISTS (
        SELECT 1 FROM trilha_segmentacao ts
        WHERE ts.trilha_id = p_trilha_id
          AND ts.department_id = v_colaborador.department_id
          AND ts.position_id = v_colaborador.position_id
          AND ts.incluir = true
      ) INTO v_tem_acesso;
      
      RETURN v_tem_acesso;
    END IF;
    
    -- Se tem registros APENAS com departamento
    IF v_so_departamento THEN
      SELECT EXISTS (
        SELECT 1 FROM trilha_segmentacao ts
        WHERE ts.trilha_id = p_trilha_id
          AND ts.department_id = v_colaborador.department_id
          AND ts.incluir = true
      ) INTO v_tem_acesso;
      
      RETURN v_tem_acesso;
    END IF;
    
    -- Se tem registros APENAS com cargo
    IF v_so_cargo THEN
      SELECT EXISTS (
        SELECT 1 FROM trilha_segmentacao ts
        WHERE ts.trilha_id = p_trilha_id
          AND ts.position_id = v_colaborador.position_id
          AND ts.incluir = true
      ) INTO v_tem_acesso;
      
      RETURN v_tem_acesso;
    END IF;
    
    -- Se tem AMBOS tipos (departamento e cargo separados)
    -- Verifica se colaborador tem pelo menos um
    SELECT EXISTS (
      SELECT 1 FROM trilha_segmentacao ts
      WHERE ts.trilha_id = p_trilha_id
        AND (
          (ts.department_id = v_colaborador.department_id AND ts.department_id IS NOT NULL) OR
          (ts.position_id = v_colaborador.position_id AND ts.position_id IS NOT NULL)
        )
        AND ts.incluir = true
    ) INTO v_tem_acesso;
    
    RETURN v_tem_acesso;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION colaborador_tem_acesso_trilha IS 'Verifica se um colaborador tem acesso a uma trilha baseado na segmentação configurada';

