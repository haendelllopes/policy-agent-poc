-- ===================================================================
-- MIGRAÇÃO: Processamento Automático de Conteúdos de Trilhas
-- Data: 2025-10-22
-- Descrição: Implementa sistema de processamento automático de conteúdos
--            com AI agent para extrair dados estruturados
-- ===================================================================

-- 1. Criar tabela para armazenar dados processados dos conteúdos
CREATE TABLE IF NOT EXISTS trilha_conteudos_processados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_conteudo_id UUID REFERENCES trilha_conteudos(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Dados extraídos pela AI
  conteudo_extraido TEXT,           -- Texto extraído do PDF/vídeo/URL
  resumo TEXT,                     -- Resumo gerado pela AI
  tags TEXT[],                     -- Tags extraídas
  categoria_sugerida VARCHAR(100), -- Categoria sugerida
  nivel_dificuldade VARCHAR(20),   -- Fácil, Médio, Difícil
  tempo_estimado_minutos INTEGER,  -- Tempo estimado de leitura/visualização
  
  -- Metadados técnicos
  idioma VARCHAR(10) DEFAULT 'pt-BR',
  word_count INTEGER,
  sentiment_score DECIMAL(3,2),    -- -1.0 a 1.0
  
  -- Embedding para busca semântica
  embedding JSONB,                 -- Vetor de embeddings
  
  -- Status do processamento
  status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
  erro TEXT,                       -- Erro se falhou
  
  -- Timestamps
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_processados_tenant 
ON trilha_conteudos_processados(tenant_id);

CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_processados_status 
ON trilha_conteudos_processados(status);

CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_processados_embedding 
ON trilha_conteudos_processados USING GIN(embedding);

CREATE INDEX IF NOT EXISTS idx_trilha_conteudos_processados_conteudo_id 
ON trilha_conteudos_processados(trilha_conteudo_id);

-- 3. Adicionar constraint de unicidade (um processamento por conteúdo)
CREATE UNIQUE INDEX IF NOT EXISTS unique_processamento_por_conteudo 
ON trilha_conteudos_processados(trilha_conteudo_id);

-- 4. Comentários na tabela
COMMENT ON TABLE trilha_conteudos_processados IS 
'Tabela para armazenar dados processados automaticamente pelos conteúdos das trilhas';

COMMENT ON COLUMN trilha_conteudos_processados.conteudo_extraido IS 
'Texto extraído do PDF, transcrição do vídeo ou conteúdo da URL';

COMMENT ON COLUMN trilha_conteudos_processados.resumo IS 
'Resumo gerado pela AI do conteúdo';

COMMENT ON COLUMN trilha_conteudos_processados.tags IS 
'Array de tags extraídas automaticamente';

COMMENT ON COLUMN trilha_conteudos_processados.categoria_sugerida IS 
'Categoria sugerida pela AI baseada no conteúdo';

COMMENT ON COLUMN trilha_conteudos_processados.nivel_dificuldade IS 
'Nível de dificuldade: Fácil, Médio, Difícil';

COMMENT ON COLUMN trilha_conteudos_processados.tempo_estimado_minutos IS 
'Tempo estimado em minutos para consumir o conteúdo';

COMMENT ON COLUMN trilha_conteudos_processados.embedding IS 
'Vetor de embeddings para busca semântica';

COMMENT ON COLUMN trilha_conteudos_processados.status IS 
'Status do processamento: processing, completed, failed';

-- 5. Função para obter estatísticas de processamento
CREATE OR REPLACE FUNCTION obter_estatisticas_processamento_conteudos(p_tenant_id UUID)
RETURNS TABLE (
  total_conteudos INTEGER,
  processados INTEGER,
  em_processamento INTEGER,
  falharam INTEGER,
  taxa_sucesso DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_conteudos,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as processados,
    COUNT(CASE WHEN status = 'processing' THEN 1 END)::INTEGER as em_processamento,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as falharam,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0 
    END as taxa_sucesso
  FROM trilha_conteudos_processados
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_estatisticas_processamento_conteudos IS 
'Retorna estatísticas de processamento de conteúdos para um tenant';

-- 6. Função para buscar conteúdos por similaridade semântica
CREATE OR REPLACE FUNCTION buscar_conteudos_similares(
  p_tenant_id UUID,
  p_query_embedding JSONB,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  trilha_conteudo_id UUID,
  conteudo_extraido TEXT,
  resumo TEXT,
  tags TEXT[],
  categoria_sugerida VARCHAR(100),
  nivel_dificuldade VARCHAR(20),
  tempo_estimado_minutos INTEGER,
  similarity_score DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tcp.id,
    tcp.trilha_conteudo_id,
    tcp.conteudo_extraido,
    tcp.resumo,
    tcp.tags,
    tcp.categoria_sugerida,
    tcp.nivel_dificuldade,
    tcp.tempo_estimado_minutos,
    (1 - (tcp.embedding <-> p_query_embedding))::DECIMAL(5,4) as similarity_score
  FROM trilha_conteudos_processados tcp
  WHERE tcp.tenant_id = p_tenant_id 
    AND tcp.status = 'completed'
    AND tcp.embedding IS NOT NULL
  ORDER BY tcp.embedding <-> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_conteudos_similares IS 
'Busca conteúdos similares usando embeddings para busca semântica';

-- Fim da migração
