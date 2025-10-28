-- ===================================================================
-- MIGRAÇÃO 020: Correção da Segregação de Trilhas
-- Data: 15 de janeiro de 2025
-- Descrição: Lógica OR vs AND corrigida
-- ===================================================================

-- Atualizar função para verificar configuração real na tabela
CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(
  p_colaborador_id UUID,
  p_trilha_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_trilha RECORD;
  v_colaborador RECORD;
  v_tem_departamento BOOLEAN := false;
  v_tem_cargo BOOLEAN := false;
  v_tem_ambos BOOLEAN := false;
  v_acesso BOOLEAN := false;
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
  IF NOT FOUND OR v_colaborador.department_id IS NULL OR v_colaborador.position_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar o que está configurado na trilha_segmentacao para ESTA trilha
  -- Existe pelo menos um registro só com departamento?
  SELECT EXISTS (
    SELECT 1 FROM trilha_segmentacao ts
    WHERE ts.trilha_id = p_trilha_id
      AND ts.department_id = v_colaborador.department_id
      AND ts.position_id IS NULL
      AND ts.incluir = true
  ) INTO v_tem_departamento;
  
  -- Existe pelo menos um registro só com cargo?
  SELECT EXISTS (
    SELECT 1 FROM trilha_segmentacao ts
    WHERE ts.trilha_id = p_trilha_id
      AND ts.department_id IS NULL
      AND ts.position_id = v_colaborador.position_id
      AND ts.incluir = true
  ) INTO v_tem_cargo;
  
  -- Existe pelo menos um registro com AMBOS (departamento E cargo juntos)?
  SELECT EXISTS (
    SELECT 1 FROM trilha_segmentacao ts
    WHERE ts.trilha_id = p_trilha_id
      AND ts.department_id = v_colaborador.department_id
      AND ts.position_id = v_colaborador.position_id
      AND ts.incluir = true
  ) INTO v_tem_ambos;
  
  -- LÓGICA CORRIGIDA:
  -- Se tem registro com AMBOS (departamento E cargo juntos), exige ambos (AND)
  -- Se tem apenas departamento OU apenas cargo, verifica separadamente
  -- Se tem departamento E cargo separados, precisa de ao menos um (OR)
  
  -- Se tem configuração com AMBOS juntos, exige ambos
  IF v_tem_ambos THEN
    RETURN true; -- Tem acesso porque tem ambos
  END IF;
  
  -- Se tem APENAS departamento configurado
  IF v_tem_departamento AND NOT v_tem_cargo AND NOT v_tem_ambos THEN
    RETURN true; -- Tem acesso porque tem o departamento
  END IF;
  
  -- Se tem APENAS cargo configurado
  IF v_tem_cargo AND NOT v_tem_departamento AND NOT v_tem_ambos THEN
    RETURN true; -- Tem acesso porque tem o cargo
  END IF;
  
  -- Se tem departamento E cargo configurados SEPARADAMENTE (não juntos)
  -- Então precisa ter PELO MENOS UM (OR)
  IF v_tem_departamento OR v_tem_cargo THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION colaborador_tem_acesso_trilha IS 'Verifica se colaborador tem acesso: se AMBOS marcados exige ambos (AND), senão verifica OR';

