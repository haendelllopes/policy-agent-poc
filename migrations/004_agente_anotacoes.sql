-- ===================================================================
-- MIGRAÇÃO: Bloco de Notas do Agente AI
-- Data: 2025-10-10
-- Descrição: Sistema de memória e aprendizado do agente
-- ===================================================================

-- Criar tabela de anotações do agente
CREATE TABLE IF NOT EXISTS agente_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Relacionamentos
  colaborador_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trilha_id UUID REFERENCES trilhas(id) ON DELETE SET NULL,
  
  -- Tipo de anotação
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'sentimento_trilha',     -- Sentimento sobre uma trilha específica
    'sentimento_empresa',    -- Sentimento sobre a empresa
    'dificuldade_conteudo',  -- Dificuldade relatada em conteúdo
    'sugestao_colaborador',  -- Sugestão do colaborador
    'padrao_identificado',   -- Padrão identificado pelo agente
    'observacao_geral'       -- Observação geral
  )),
  
  -- Conteúdo da anotação
  titulo VARCHAR(255) NOT NULL,
  anotacao TEXT NOT NULL,
  
  -- Análise de sentimento da anotação
  sentimento VARCHAR(20) CHECK (sentimento IN ('muito_positivo', 'positivo', 'neutro', 'negativo', 'muito_negativo')),
  intensidade_sentimento DECIMAL(3,2), -- 0.00 a 1.00
  
  -- Metadados
  contexto JSONB, -- {conversa_id, momento_onboarding, topico, etc}
  tags TEXT[], -- Array de tags para facilitar busca
  
  -- Controle
  relevante BOOLEAN DEFAULT true, -- Se a anotação ainda é relevante
  gerou_melhoria BOOLEAN DEFAULT false, -- Se já gerou uma sugestão de melhoria
  improvement_id UUID REFERENCES onboarding_improvements(id), -- Link com melhoria gerada
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tenant ON agente_anotacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_colaborador ON agente_anotacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_trilha ON agente_anotacoes(trilha_id);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tipo ON agente_anotacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_sentimento ON agente_anotacoes(sentimento);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_relevante ON agente_anotacoes(tenant_id, relevante);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_tags ON agente_anotacoes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_agente_anotacoes_created_at ON agente_anotacoes(created_at);

-- RLS (Row Level Security)
ALTER TABLE agente_anotacoes ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todas as anotações do tenant
CREATE POLICY "Admins podem ver anotações do tenant" ON agente_anotacoes
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t 
      JOIN users u ON u.tenant_id = t.id 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Comentários
COMMENT ON TABLE agente_anotacoes IS 'Bloco de notas do agente AI para aprendizado e geração de insights';
COMMENT ON COLUMN agente_anotacoes.tipo IS 'Tipo de anotação: sentimento_trilha, sentimento_empresa, dificuldade_conteudo, sugestao_colaborador, padrao_identificado, observacao_geral';
COMMENT ON COLUMN agente_anotacoes.sentimento IS 'Sentimento detectado: muito_positivo, positivo, neutro, negativo, muito_negativo';
COMMENT ON COLUMN agente_anotacoes.intensidade_sentimento IS 'Intensidade do sentimento de 0.00 (fraco) a 1.00 (muito forte)';
COMMENT ON COLUMN agente_anotacoes.tags IS 'Tags para facilitar busca e agrupamento de anotações';
COMMENT ON COLUMN agente_anotacoes.relevante IS 'Se a anotação ainda é relevante para análises futuras';
COMMENT ON COLUMN agente_anotacoes.gerou_melhoria IS 'Se esta anotação já gerou uma sugestão de melhoria';

-- Fim da migração




