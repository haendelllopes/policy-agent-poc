-- ===================================================================
-- MIGRAÇÃO 020 V2: Segregação Simples e Corrigida
-- Data: 15 de janeiro de 2025
-- Descrição: Lógica simples que verifica o que está marcado
-- ===================================================================

CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(
  p_colaborador_id UUID,
  p_trilha_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_trilha RECORD;
  v_colaborador RECORD;
BEGIN
  -- Buscar dados da trilha
  SELECT segmentacao_tipo 
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
  
  -- Se colaborador não foi encontrado, não tem acesso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- LÓGICA SIMPLIFICADA E CORRETA:
  -- Procura na trilha_segmentacao se o colaborador tem acesso
  -- Verifica se existe um registro com:
  --   1. O departamento do colaborador (se trilha tem departamento marcado)
  --   2. O cargo do colaborador (se trilha tem cargo marcado)
  --   3. Ambos juntos (se trilha tem ambos marcados juntos)
  
  -- Se NÃO existe nenhuma configuração na trilha_segmentacao para esta trilha
  -- Então a trilha é para todos
  IF NOT EXISTS (SELECT 1 FROM trilha_segmentacao WHERE trilha_id = p_trilha_id) THEN
    RETURN true;
  END IF;
  
  -- Verifica se colaborador tem acesso baseado na trilha_segmentacao
  -- Aceita se:
  -- - Tem departamento E cargo juntos E colaborador tem AMBOS
  -- - Tem apenas departamento E colaborador tem o departamento
  -- - Tem apenas cargo E colaborador tem o cargo
  RETURN EXISTS (
    SELECT 1 FROM trilha_segmentacao ts
    WHERE ts.trilha_id = p_trilha_id
      AND (
        -- Caso 1: AMBOS (departamento E cargo juntos) - precisa ter AMBOS
        (ts.department_id IS NOT NULL AND ts.position_id IS NOT NULL 
         AND ts.department_id = v_colaborador.department_id 
         AND ts.position_id = v_colaborador.position_id)
        OR
        -- Caso 2: Apenas departamento - precisa ter o departamento
        (ts.department_id IS NOT NULL AND ts.position_id IS NULL 
         AND ts.department_id = v_colaborador.department_id)
        OR
        -- Caso 3: Apenas cargo - precisa ter o cargo
        (ts.department_id IS NULL AND ts.position_id IS NOT NULL 
         AND ts.position_id = v_colaborador.position_id)
      )
      AND ts.incluir = true
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION colaborador_tem_acesso_trilha IS 'Verifica se colaborador tem acesso: considera o que está marcado na trilha_segmentacao';

