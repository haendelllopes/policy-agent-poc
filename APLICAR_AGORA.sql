-- ===================================================================
-- APLICAR AGORA: Correção Final da Segregação
-- Copie e cole no Supabase SQL Editor
-- ===================================================================

CREATE OR REPLACE FUNCTION colaborador_tem_acesso_trilha(
  p_colaborador_id UUID,
  p_trilha_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_colaborador RECORD;
  v_tem_configuracao BOOLEAN := false;
BEGIN
  -- Buscar dados do colaborador
  SELECT department_id, position_id
  INTO v_colaborador
  FROM users
  WHERE id = p_colaborador_id;
  
  -- Se colaborador não foi encontrado, não tem acesso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se a trilha tem alguma configuração de segregação
  SELECT EXISTS (SELECT 1 FROM trilha_segmentacao WHERE trilha_id = p_trilha_id)
  INTO v_tem_configuracao;
  
  -- Se NÃO tem configuração de segregação, todos têm acesso
  IF NOT v_tem_configuracao THEN
    RETURN true;
  END IF;
  
  -- TEM configuração, então verifica se o colaborador bate
  RETURN EXISTS (
    SELECT 1 FROM trilha_segmentacao ts
    WHERE ts.trilha_id = p_trilha_id
      AND ts.incluir = true
      AND (
        -- Caso 1: Trilha marcada com departamento APENAS
        (ts.department_id IS NOT NULL AND ts.position_id IS NULL 
         AND ts.department_id = v_colaborador.department_id)
        OR
        -- Caso 2: Trilha marcada com cargo APENAS
        (ts.department_id IS NULL AND ts.position_id IS NOT NULL 
         AND ts.position_id = v_colaborador.position_id)
        OR
        -- Caso 3: Trilha marcada com AMBOS (departamento E cargo juntos)
        (ts.department_id IS NOT NULL AND ts.position_id IS NOT NULL 
         AND ts.department_id = v_colaborador.department_id 
         AND ts.position_id = v_colaborador.position_id)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- ✅ Função atualizada! Teste agora.

