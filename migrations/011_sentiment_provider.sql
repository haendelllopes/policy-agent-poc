-- =====================================================
-- Migração 011: Sentiment Analysis Provider
-- =====================================================
-- Descrição: Adiciona suporte para múltiplos providers de análise de sentimento
--            e armazena dados brutos da análise para auditoria
-- Data: 14 de outubro de 2025
-- Autor: Haendell Lopes
-- =====================================================

-- 1. Adicionar coluna raw_analysis para armazenar dados brutos do provider
ALTER TABLE colaborador_sentimentos
ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT NULL;

-- 2. Criar índice GIN para busca eficiente em raw_analysis
CREATE INDEX IF NOT EXISTS idx_sentimentos_raw_analysis 
ON colaborador_sentimentos USING GIN (raw_analysis);

-- 3. Comentário explicativo da coluna
COMMENT ON COLUMN colaborador_sentimentos.raw_analysis 
IS 'Dados brutos da análise de sentimento incluindo provider, scores detalhados e metadata. Estrutura: {"provider": "n8n_sentiment_analysis|openai|gemini", "sentiment_category": "...", "sentiment_strength": 0.0-1.0, "confidence_score": 0.0-1.0, "model": "...", "timestamp": "..."}';

-- 4. Adicionar coluna para rastrear o provider usado
ALTER TABLE colaborador_sentimentos
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'backend';

-- 5. Criar índice para provider (para análises e filtros)
CREATE INDEX IF NOT EXISTS idx_sentimentos_provider 
ON colaborador_sentimentos (provider);

-- 6. Comentário explicativo da coluna provider
COMMENT ON COLUMN colaborador_sentimentos.provider 
IS 'Provider usado para análise de sentimento: n8n_sentiment_analysis, openai_direct, gemini_direct, backend, fallback';

-- 7. View para análises por provider (útil para comparações)
CREATE OR REPLACE VIEW vw_sentimentos_por_provider AS
SELECT 
  provider,
  COUNT(*) as total_analises,
  AVG(intensidade) as intensidade_media,
  COUNT(CASE WHEN sentimento IN ('muito_positivo', 'positivo') THEN 1 END) as positivos,
  COUNT(CASE WHEN sentimento = 'neutro' THEN 1 END) as neutros,
  COUNT(CASE WHEN sentimento IN ('negativo', 'muito_negativo') THEN 1 END) as negativos,
  MIN(created_at) as primeira_analise,
  MAX(created_at) as ultima_analise
FROM colaborador_sentimentos
GROUP BY provider
ORDER BY total_analises DESC;

-- 8. View para análises com dados brutos (para debugging)
CREATE OR REPLACE VIEW vw_sentimentos_com_raw AS
SELECT 
  cs.id,
  cs.user_id,
  u.name as colaborador_nome,
  cs.sentimento,
  cs.intensidade,
  cs.provider,
  cs.raw_analysis->>'sentiment_strength' as raw_strength,
  cs.raw_analysis->>'confidence_score' as raw_confidence,
  cs.raw_analysis->>'model' as modelo_usado,
  cs.fatores_detectados,
  cs.created_at
FROM colaborador_sentimentos cs
LEFT JOIN users u ON cs.user_id = u.id
WHERE cs.raw_analysis IS NOT NULL
ORDER BY cs.created_at DESC;

-- 9. Função para validar raw_analysis structure
CREATE OR REPLACE FUNCTION validate_raw_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que raw_analysis tenha estrutura mínima se não for NULL
  IF NEW.raw_analysis IS NOT NULL THEN
    -- Verificar se tem os campos obrigatórios
    IF NOT (NEW.raw_analysis ? 'provider') THEN
      RAISE EXCEPTION 'raw_analysis deve conter campo "provider"';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para validar raw_analysis antes de inserir/atualizar
DROP TRIGGER IF EXISTS trg_validate_raw_analysis ON colaborador_sentimentos;
CREATE TRIGGER trg_validate_raw_analysis
  BEFORE INSERT OR UPDATE ON colaborador_sentimentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_raw_analysis();

-- =====================================================
-- Dados de exemplo e testes (comentado por padrão)
-- =====================================================

/*
-- Exemplo de inserção com raw_analysis
INSERT INTO colaborador_sentimentos (
  user_id,
  tenant_id,
  sentimento,
  intensidade,
  origem,
  dia_onboarding,
  provider,
  raw_analysis,
  fatores_detectados
) VALUES (
  'user-uuid-here',
  'tenant-uuid-here',
  'muito_positivo',
  0.92,
  'conversa_agente',
  1,
  'n8n_sentiment_analysis',
  '{"provider": "n8n_sentiment_analysis", "sentiment_category": "muito_positivo", "sentiment_strength": 0.92, "confidence_score": 0.88, "model": "gpt-4o-mini", "timestamp": "2025-10-14T12:00:00Z"}'::jsonb,
  '{"palavras_chave": ["adorei", "excelente"], "tom": "entusiasmado", "emojis": ["😊", "🎉"]}'::jsonb
);

-- Consultar análises por provider
SELECT * FROM vw_sentimentos_por_provider;

-- Consultar análises com dados brutos
SELECT * FROM vw_sentimentos_com_raw LIMIT 10;
*/

-- =====================================================
-- Rollback (se necessário)
-- =====================================================

/*
-- Para reverter esta migração:

DROP TRIGGER IF EXISTS trg_validate_raw_analysis ON colaborador_sentimentos;
DROP FUNCTION IF EXISTS validate_raw_analysis();
DROP VIEW IF EXISTS vw_sentimentos_com_raw;
DROP VIEW IF EXISTS vw_sentimentos_por_provider;
DROP INDEX IF EXISTS idx_sentimentos_provider;
DROP INDEX IF EXISTS idx_sentimentos_raw_analysis;
ALTER TABLE colaborador_sentimentos DROP COLUMN IF EXISTS provider;
ALTER TABLE colaborador_sentimentos DROP COLUMN IF EXISTS raw_analysis;
*/

