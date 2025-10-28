CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(p_colaborador_id UUID, p_trilha_id UUID) RETURNS BOOLEAN AS $func$
DECLARE
  v_colaborador RECORD;
  v_tem_configuracao BOOLEAN;
BEGIN
  SELECT department_id, position_id INTO v_colaborador FROM users WHERE id = p_colaborador_id;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT EXISTS(SELECT 1 FROM trilha_segmentacao WHERE trilha_id = p_trilha_id) INTO v_tem_configuracao;
  IF NOT v_tem_configuracao THEN RETURN true; END IF;
  RETURN EXISTS (
    SELECT 1 FROM trilha_segmentacao ts WHERE ts.trilha_id = p_trilha_id AND ts.incluir = true AND (
      (ts.department_id IS NOT NULL AND ts.position_id IS NULL AND ts.department_id = v_colaborador.department_id) OR
      (ts.department_id IS NULL AND ts.position_id IS NOT NULL AND ts.position_id = v_colaborador.position_id) OR
      (ts.department_id IS NOT NULL AND ts.position_id IS NOT NULL AND ts.department_id = v_colaborador.department_id AND ts.position_id = v_colaborador.position_id)
    )
  );
END;
$func$ LANGUAGE plpgsql;

