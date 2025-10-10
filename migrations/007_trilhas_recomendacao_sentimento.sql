-- ===================================================================
-- MIGRAÇÃO: Sistema de Recomendação de Trilhas por Sentimento
-- Data: 2025-10-10
-- Descrição: Adiciona métricas de sentimento às trilhas para recomendação inteligente
-- ===================================================================

-- Adicionar métricas de sentimento à tabela trilhas
ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS sentimento_medio DECIMAL(3,2);
-- Valor de 0.00 a 1.00 (calculado a partir dos feedbacks)

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;
-- Quantas pessoas já deram feedback sobre esta trilha

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS dificuldade_percebida VARCHAR(20) 
  CHECK (dificuldade_percebida IN ('muito_facil', 'facil', 'media', 'dificil', 'muito_dificil'));
-- Calculada automaticamente baseada em feedbacks

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS tempo_medio_conclusao INTEGER;
-- Em dias - quanto tempo o pessoal leva em média

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS taxa_conclusao DECIMAL(5,2);
-- Porcentagem de pessoas que concluem (0.00 a 100.00)

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS recomendada_para_iniciantes BOOLEAN DEFAULT false;
-- Se é boa trilha para quem está começando

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS sentimento_atualizado_em TIMESTAMP WITH TIME ZONE;
-- Quando foi calculado pela última vez

-- Criar índices para queries de recomendação
CREATE INDEX IF NOT EXISTS idx_trilhas_sentimento ON trilhas(sentimento_medio DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_trilhas_dificuldade ON trilhas(dificuldade_percebida);
CREATE INDEX IF NOT EXISTS idx_trilhas_taxa_conclusao ON trilhas(taxa_conclusao DESC);

-- Comentários
COMMENT ON COLUMN trilhas.sentimento_medio IS 'Sentimento médio dos colaboradores sobre esta trilha (0.00 a 1.00)';
COMMENT ON COLUMN trilhas.dificuldade_percebida IS 'Dificuldade percebida calculada a partir de feedbacks';
COMMENT ON COLUMN trilhas.taxa_conclusao IS 'Porcentagem de colaboradores que concluem a trilha';
COMMENT ON COLUMN trilhas.tempo_medio_conclusao IS 'Tempo médio em dias para conclusão da trilha';
COMMENT ON COLUMN trilhas.recomendada_para_iniciantes IS 'Se a trilha é recomendada para colaboradores iniciantes';

-- ===================================================================
-- FUNÇÃO: Calcular Sentimento da Trilha
-- ===================================================================

CREATE OR REPLACE FUNCTION calcular_sentimento_trilha(p_trilha_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sentimento_medio DECIMAL(3,2);
  v_total_avaliacoes INTEGER;
  v_total_conclusoes INTEGER;
  v_total_tentativas INTEGER;
  v_tempo_medio INTEGER;
  v_dificuldade VARCHAR(20);
  v_taxa_conclusao DECIMAL(5,2);
BEGIN
  -- Calcular sentimento médio (convertendo escala para 0.00-1.00)
  SELECT 
    AVG(CASE 
      WHEN cs.sentimento = 'muito_positivo' THEN 1.00
      WHEN cs.sentimento = 'positivo' THEN 0.75
      WHEN cs.sentimento = 'neutro' THEN 0.50
      WHEN cs.sentimento = 'negativo' THEN 0.25
      WHEN cs.sentimento = 'muito_negativo' THEN 0.00
    END),
    COUNT(*)
  INTO v_sentimento_medio, v_total_avaliacoes
  FROM colaborador_sentimentos cs
  WHERE cs.trilha_id = p_trilha_id
    AND cs.origem IN ('pos_trilha', 'durante_conversa', 'feedback_explicito');
  
  -- Se não houver avaliações, usar valor neutro
  IF v_total_avaliacoes = 0 OR v_sentimento_medio IS NULL THEN
    v_sentimento_medio := 0.50;
    v_total_avaliacoes := 0;
  END IF;
  
  -- Calcular taxa de conclusão
  SELECT 
    COUNT(CASE WHEN ct.status = 'concluida' THEN 1 END),
    COUNT(*)
  INTO v_total_conclusoes, v_total_tentativas
  FROM colaborador_trilhas ct
  WHERE ct.trilha_id = p_trilha_id;
  
  -- Calcular porcentagem
  IF v_total_tentativas > 0 THEN
    v_taxa_conclusao := (v_total_conclusoes::DECIMAL / v_total_tentativas) * 100;
  ELSE
    v_taxa_conclusao := 0;
  END IF;
  
  -- Calcular tempo médio de conclusão
  SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (ct.data_conclusao - ct.data_inicio)) / 86400))
  INTO v_tempo_medio
  FROM colaborador_trilhas ct
  WHERE ct.trilha_id = p_trilha_id
    AND ct.status = 'concluida'
    AND ct.data_conclusao IS NOT NULL
    AND ct.data_inicio IS NOT NULL;
  
  -- Calcular dificuldade percebida
  -- Baseado em: sentimento médio + taxa de conclusão + tempo médio vs prazo
  IF v_sentimento_medio >= 0.80 AND v_taxa_conclusao >= 80 THEN
    v_dificuldade := 'muito_facil';
  ELSIF v_sentimento_medio >= 0.65 AND v_taxa_conclusao >= 70 THEN
    v_dificuldade := 'facil';
  ELSIF v_sentimento_medio >= 0.45 AND v_taxa_conclusao >= 50 THEN
    v_dificuldade := 'media';
  ELSIF v_sentimento_medio >= 0.30 AND v_taxa_conclusao >= 30 THEN
    v_dificuldade := 'dificil';
  ELSE
    v_dificuldade := 'muito_dificil';
  END IF;
  
  -- Atualizar trilha
  UPDATE trilhas
  SET 
    sentimento_medio = v_sentimento_medio,
    total_avaliacoes = v_total_avaliacoes,
    dificuldade_percebida = v_dificuldade,
    tempo_medio_conclusao = v_tempo_medio,
    taxa_conclusao = v_taxa_conclusao,
    recomendada_para_iniciantes = (v_sentimento_medio >= 0.70 AND v_dificuldade IN ('muito_facil', 'facil')),
    sentimento_atualizado_em = NOW()
  WHERE id = p_trilha_id;
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_sentimento_trilha IS 'Calcula e atualiza métricas de sentimento de uma trilha baseado em feedbacks';

-- ===================================================================
-- TRIGGERS: Atualização Automática de Sentimento
-- ===================================================================

-- Trigger para recalcular sentimento da trilha quando novo feedback chega
CREATE OR REPLACE FUNCTION trigger_atualizar_sentimento_trilha()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trilha_id IS NOT NULL THEN
    PERFORM calcular_sentimento_trilha(NEW.trilha_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_sentimento_trilha ON colaborador_sentimentos;
CREATE TRIGGER trigger_recalcular_sentimento_trilha
  AFTER INSERT OR UPDATE ON colaborador_sentimentos
  FOR EACH ROW
  WHEN (NEW.trilha_id IS NOT NULL)
  EXECUTE FUNCTION trigger_atualizar_sentimento_trilha();

-- Trigger para quando trilha é concluída
CREATE OR REPLACE FUNCTION trigger_trilha_concluida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    PERFORM calcular_sentimento_trilha(NEW.trilha_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trilha_conclusao ON colaborador_trilhas;
CREATE TRIGGER trigger_trilha_conclusao
  AFTER INSERT OR UPDATE ON colaborador_trilhas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trilha_concluida();

-- ===================================================================
-- VIEW: Trilhas Recomendadas
-- ===================================================================

CREATE OR REPLACE VIEW trilhas_recomendadas AS
SELECT 
  t.id,
  t.tenant_id,
  t.nome,
  t.descricao,
  t.prazo_dias,
  t.sentimento_medio,
  t.dificuldade_percebida,
  t.taxa_conclusao,
  t.tempo_medio_conclusao,
  t.total_avaliacoes,
  t.recomendada_para_iniciantes,
  t.ativo,
  
  -- Calcular score de recomendação (0-100)
  CASE
    WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 100
    WHEN t.sentimento_medio >= 0.70 AND t.taxa_conclusao >= 70 THEN 90
    WHEN t.sentimento_medio >= 0.60 AND t.taxa_conclusao >= 60 THEN 80
    WHEN t.sentimento_medio >= 0.50 AND t.taxa_conclusao >= 50 THEN 70
    WHEN t.sentimento_medio >= 0.40 AND t.taxa_conclusao >= 40 THEN 60
    ELSE 50
  END as score_recomendacao,
  
  -- Classificar nível de recomendação
  CASE
    WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 'altamente_recomendada'
    WHEN t.sentimento_medio >= 0.60 AND t.taxa_conclusao >= 60 THEN 'recomendada'
    WHEN t.sentimento_medio >= 0.40 THEN 'moderada'
    ELSE 'precisa_atencao'
  END as nivel_recomendacao,
  
  -- Contar feedbacks
  (SELECT COUNT(*) FROM colaborador_sentimentos cs WHERE cs.trilha_id = t.id) as total_feedbacks,
  
  -- Contar conclusões
  (SELECT COUNT(*) FROM colaborador_trilhas ct WHERE ct.trilha_id = t.id AND ct.status = 'concluida') as total_conclusoes,
  
  -- Contar em andamento
  (SELECT COUNT(*) FROM colaborador_trilhas ct WHERE ct.trilha_id = t.id AND ct.status = 'em_andamento') as total_em_andamento
  
FROM trilhas t
WHERE t.ativo = true;

COMMENT ON VIEW trilhas_recomendadas IS 'View com score de recomendação de trilhas baseado em sentimentos e conclusões';

-- ===================================================================
-- FUNÇÃO: Buscar Trilhas Compatíveis com Sentimento do Colaborador
-- ===================================================================

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

-- ===================================================================
-- POPULAR DADOS INICIAIS (calcular sentimento de trilhas existentes)
-- ===================================================================

-- Calcular sentimento de todas as trilhas existentes que têm dados
DO $$
DECLARE
  trilha_record RECORD;
BEGIN
  FOR trilha_record IN SELECT id FROM trilhas WHERE ativo = true
  LOOP
    PERFORM calcular_sentimento_trilha(trilha_record.id);
  END LOOP;
END $$;

-- Fim da migração

