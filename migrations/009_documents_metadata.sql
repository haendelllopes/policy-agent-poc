-- =====================================================
-- Migração 009: Adicionar Metadata aos Documentos
-- =====================================================
-- Descrição: Adiciona suporte para metadata estruturada extraída
--            pelo Information Extractor do N8N
-- Data: 13/10/2025
-- Autor: Haendell Lopes
-- =====================================================

BEGIN;

-- 1. Adicionar coluna metadata (JSONB) para dados estruturados
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Adicionar coluna confidence_score (0-100)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0
CHECK (confidence_score >= 0 AND confidence_score <= 100);

-- 3. Adicionar coluna ai_categorized (flag)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_categorized BOOLEAN DEFAULT false;

-- 4. Adicionar coluna ai_categorized_at (timestamp)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_categorized_at TIMESTAMP WITH TIME ZONE;

-- 5. Criar índice GIN para busca em metadata
CREATE INDEX IF NOT EXISTS idx_documents_metadata 
ON documents USING GIN (metadata);

-- 6. Criar índice para confidence_score (ordenação DESC)
CREATE INDEX IF NOT EXISTS idx_documents_confidence 
ON documents (confidence_score DESC);

-- 7. Criar índice composto para documentos categorizados por IA
CREATE INDEX IF NOT EXISTS idx_documents_ai_categorized 
ON documents (ai_categorized, ai_categorized_at DESC)
WHERE ai_categorized = true;

-- 8. Criar índice para busca por tenant + ai_categorized
CREATE INDEX IF NOT EXISTS idx_documents_tenant_ai 
ON documents (tenant_id, ai_categorized, confidence_score DESC);

-- 9. Adicionar comentários para documentação
COMMENT ON COLUMN documents.metadata IS 'Metadata estruturada extraída pelo Information Extractor (tipo_documento, nivel_acesso, departamentos_relevantes, palavras_chave, vigencia, autoria, versao, referencias, validation)';
COMMENT ON COLUMN documents.confidence_score IS 'Score de confiança da categorização pela IA (0-100). Valores mais altos indicam maior confiança na categorização.';
COMMENT ON COLUMN documents.ai_categorized IS 'Indica se o documento foi categorizado automaticamente pela IA usando Information Extractor';
COMMENT ON COLUMN documents.ai_categorized_at IS 'Data/hora em que o documento foi categorizado pela IA';

-- 10. Atualizar documentos existentes (marcar como não categorizados pela IA)
UPDATE documents
SET 
  ai_categorized = false,
  confidence_score = 0,
  metadata = '{}'::jsonb
WHERE ai_categorized IS NULL;

-- 11. Criar função para extrair palavras-chave do metadata
CREATE OR REPLACE FUNCTION get_document_keywords(doc_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  keywords TEXT[];
BEGIN
  SELECT 
    COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text(metadata->'palavras_chave')
        FROM documents
        WHERE id = doc_id
      ),
      ARRAY[]::TEXT[]
    )
  INTO keywords;
  
  RETURN keywords;
END;
$$;

COMMENT ON FUNCTION get_document_keywords(UUID) IS 'Extrai array de palavras-chave do metadata JSONB de um documento';

-- 12. Criar função para buscar documentos por metadata
CREATE OR REPLACE FUNCTION search_documents_by_metadata(
  p_tenant_id UUID,
  p_tipo_documento TEXT DEFAULT NULL,
  p_nivel_acesso TEXT DEFAULT NULL,
  p_departamento TEXT DEFAULT NULL,
  p_min_confidence INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  tipo_documento TEXT,
  nivel_acesso TEXT,
  confidence_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.category,
    d.metadata->>'tipo_documento' AS tipo_documento,
    d.metadata->>'nivel_acesso' AS nivel_acesso,
    d.confidence_score,
    d.created_at
  FROM documents d
  WHERE 
    d.tenant_id = p_tenant_id
    AND d.ai_categorized = true
    AND d.confidence_score >= p_min_confidence
    AND (p_tipo_documento IS NULL OR d.metadata->>'tipo_documento' = p_tipo_documento)
    AND (p_nivel_acesso IS NULL OR d.metadata->>'nivel_acesso' = p_nivel_acesso)
    AND (p_departamento IS NULL OR d.metadata->'departamentos_relevantes' ? p_departamento)
  ORDER BY d.confidence_score DESC, d.created_at DESC;
END;
$$;

COMMENT ON FUNCTION search_documents_by_metadata IS 'Busca documentos filtrados por metadata estruturada (tipo, nível de acesso, departamento, confidence mínimo)';

-- 13. Criar view para documentos categorizados com alta confiança
CREATE OR REPLACE VIEW documents_high_confidence AS
SELECT 
  d.id,
  d.tenant_id,
  d.title,
  d.category,
  d.subcategories,
  d.tags,
  d.summary,
  d.metadata,
  d.confidence_score,
  d.ai_categorized_at,
  d.metadata->>'tipo_documento' AS tipo_documento,
  d.metadata->>'nivel_acesso' AS nivel_acesso,
  d.metadata->'departamentos_relevantes' AS departamentos_relevantes,
  d.metadata->'palavras_chave' AS palavras_chave,
  d.created_at,
  d.updated_at
FROM documents d
WHERE 
  d.ai_categorized = true
  AND d.confidence_score >= 70
ORDER BY d.confidence_score DESC, d.created_at DESC;

COMMENT ON VIEW documents_high_confidence IS 'View de documentos categorizados pela IA com score de confiança >= 70';

-- 14. Criar view para documentos que precisam revisão
CREATE OR REPLACE VIEW documents_need_review AS
SELECT 
  d.id,
  d.tenant_id,
  d.title,
  d.category,
  d.confidence_score,
  d.ai_categorized_at,
  d.metadata->'validation' AS validation,
  d.created_at
FROM documents d
WHERE 
  d.ai_categorized = true
  AND (
    d.confidence_score < 70
    OR d.metadata->'validation'->>'isValid' = 'false'
    OR (d.metadata->'validation'->'warnings')::jsonb != '[]'::jsonb
  )
ORDER BY d.confidence_score ASC, d.created_at DESC;

COMMENT ON VIEW documents_need_review IS 'View de documentos categorizados que precisam revisão humana (baixa confiança ou com warnings)';

-- 15. Criar trigger para atualizar ai_categorized_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_categorized_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ai_categorized = true AND (OLD.ai_categorized IS NULL OR OLD.ai_categorized = false) THEN
    NEW.ai_categorized_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_ai_categorized_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_categorized_timestamp();

COMMENT ON TRIGGER trigger_update_ai_categorized_timestamp ON documents IS 'Atualiza automaticamente ai_categorized_at quando documento é marcado como categorizado pela IA';

-- 16. Validar estrutura
DO $$
BEGIN
  -- Verificar se colunas foram criadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'metadata'
  ) THEN
    RAISE EXCEPTION 'Coluna metadata não foi criada';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'confidence_score'
  ) THEN
    RAISE EXCEPTION 'Coluna confidence_score não foi criada';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'ai_categorized'
  ) THEN
    RAISE EXCEPTION 'Coluna ai_categorized não foi criada';
  END IF;
  
  RAISE NOTICE '✅ Migração 009 executada com sucesso!';
END $$;

COMMIT;

-- =====================================================
-- Exemplo de Uso
-- =====================================================

-- 1. Buscar documentos de RH com alta confiança:
-- SELECT * FROM search_documents_by_metadata(
--   'tenant-id-here',
--   'Política',
--   'Interno',
--   'RH',
--   80
-- );

-- 2. Ver documentos que precisam revisão:
-- SELECT * FROM documents_need_review WHERE tenant_id = 'tenant-id-here';

-- 3. Ver documentos com alta confiança:
-- SELECT * FROM documents_high_confidence WHERE tenant_id = 'tenant-id-here';

-- 4. Extrair palavras-chave de um documento:
-- SELECT get_document_keywords('document-id-here');


