-- ===================================================================
-- CORREÇÃO: Função buscar_trilhas_por_sentimento
-- Data: 2025-10-10
-- Problema: Ambiguidade de coluna trilha_id
-- Solução: Qualificar com alias da tabela (ct.trilha_id)
-- ===================================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS buscar_trilhas_por_sentimento(UUID, VARCHAR, INTEGER);

-- Recriar função corrigida
CREATE OR REPLACE FUNCTION buscar_trilhas_por_sentimento(
  p_colaborador_id UUID,
  p_sentimento_atual VARCHAR(20),
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  trilha_id UUID,
  nome VARCHAR(255),
  descricao TEXT,
  sentimento_medio DECIMAL(3,2),
  dificuldade_percebida VARCHAR(20),
  taxa_conclusao DECIMAL(5,2),
  tempo_medio_conclusao INTEGER,
  score_recomendacao INTEGER,
  compatibilidade_sentimento INTEGER,
  motivo_recomendacao TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.nome,
    tr.descricao,
    tr.sentimento_medio,
    tr.dificuldade_percebida,
    tr.taxa_conclusao,
    tr.tempo_medio_conclusao,
    tr.score_recomendacao,
    
    -- Calcular compatibilidade com sentimento do colaborador
    CASE
      -- Colaborador muito negativo: trilhas fáceis e bem avaliadas
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('muito_facil', 'facil') AND tr.sentimento_medio >= 0.70 THEN 100
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.75 THEN 80
          ELSE 50
        END
      
      -- Colaborador neutro: trilhas médias
      WHEN p_sentimento_atual = 'neutro' THEN
        CASE
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.60 THEN 100
          WHEN tr.dificuldade_percebida IN ('facil', 'dificil') THEN 80
          ELSE 60
        END
      
      -- Colaborador positivo: pode encarar desafios
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('media', 'dificil') AND tr.sentimento_medio >= 0.50 THEN 100
          WHEN tr.dificuldade_percebida = 'muito_dificil' AND tr.sentimento_medio >= 0.60 THEN 90
          ELSE 70
        END
    END as compatibilidade,
    
    -- Motivo da recomendação
    CASE
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        'Trilha mais leve para recuperar confiança'
      WHEN p_sentimento_atual = 'neutro' THEN
        'Trilha equilibrada para seu momento'
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        'Trilha desafiadora que vai te agregar muito'
    END as motivo
    
  FROM trilhas_recomendadas tr
  WHERE colaborador_tem_acesso_trilha(p_colaborador_id, tr.id) = true
    AND tr.id NOT IN (
      SELECT ct.trilha_id 
      FROM colaborador_trilhas ct
      WHERE ct.colaborador_id = p_colaborador_id 
        AND ct.status IN ('concluida', 'em_andamento')
    )
  ORDER BY 
    -- Ordenar por compatibilidade primeiro, depois por score
    CASE
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('muito_facil', 'facil') AND tr.sentimento_medio >= 0.70 THEN 100
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.75 THEN 80
          ELSE 50
        END
      WHEN p_sentimento_atual = 'neutro' THEN
        CASE
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.60 THEN 100
          WHEN tr.dificuldade_percebida IN ('facil', 'dificil') THEN 80
          ELSE 60
        END
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('media', 'dificil') AND tr.sentimento_medio >= 0.50 THEN 100
          WHEN tr.dificuldade_percebida = 'muito_dificil' AND tr.sentimento_medio >= 0.60 THEN 90
          ELSE 70
        END
    END DESC,
    tr.score_recomendacao DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_trilhas_por_sentimento IS 'Busca trilhas mais compatíveis com o sentimento atual do colaborador';

-- FIM DA CORREÇÃO

