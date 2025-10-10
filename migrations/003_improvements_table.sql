-- ===================================================================
-- MIGRAÇÃO: Tabela de Oportunidades de Melhoria do Onboarding
-- Data: 2025-10-09
-- Descrição: Tabela para agente de IA registrar melhorias no processo
-- ===================================================================

-- Criar tabela de oportunidades de melhoria
CREATE TABLE IF NOT EXISTS onboarding_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Categoria da melhoria
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'conteudo', 'interface', 'fluxo', 'performance', 'engajamento', 'acessibilidade', 'outros'
  )),
  
  -- Prioridade da melhoria
  prioridade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  
  -- Título da melhoria
  titulo VARCHAR(255) NOT NULL,
  
  -- Descrição detalhada da oportunidade
  descricao TEXT NOT NULL,
  
  -- Contexto específico (ex: trilha, colaborador, momento)
  contexto JSONB,
  
  -- Dados que geraram a sugestão
  dados_analise JSONB,
  
  -- Status da melhoria
  status VARCHAR(30) NOT NULL DEFAULT 'sugerida' CHECK (status IN (
    'sugerida', 'em_analise', 'aprovada', 'em_desenvolvimento', 'implementada', 'rejeitada'
  )),
  
  -- Impacto estimado
  impacto_estimado VARCHAR(20) CHECK (impacto_estimado IN ('baixo', 'medio', 'alto', 'muito_alto')),
  
  -- Esforço estimado para implementar
  esforco_estimado VARCHAR(20) CHECK (esforco_estimado IN ('baixo', 'medio', 'alto', 'muito_alto')),
  
  -- Observações adicionais
  observacoes TEXT,
  
  -- Metadados
  criado_por VARCHAR(50) DEFAULT 'ai_agent',
  analisado_por UUID REFERENCES users(id),
  data_analise TIMESTAMP WITH TIME ZONE,
  data_implementacao TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_improvements_tenant ON onboarding_improvements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_improvements_categoria ON onboarding_improvements(categoria);
CREATE INDEX IF NOT EXISTS idx_improvements_prioridade ON onboarding_improvements(prioridade);
CREATE INDEX IF NOT EXISTS idx_improvements_status ON onboarding_improvements(status);
CREATE INDEX IF NOT EXISTS idx_improvements_created_at ON onboarding_improvements(created_at);

-- RLS (Row Level Security)
ALTER TABLE onboarding_improvements ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todas as melhorias do tenant
CREATE POLICY "Admins podem ver melhorias do tenant" ON onboarding_improvements
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t 
      JOIN users u ON u.tenant_id = t.id 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Política: Usuários podem ver melhorias implementadas do seu tenant
CREATE POLICY "Usuários podem ver melhorias implementadas" ON onboarding_improvements
  FOR SELECT USING (
    status = 'implementada' AND
    tenant_id IN (
      SELECT t.id FROM tenants t 
      JOIN users u ON u.tenant_id = t.id 
      WHERE u.id = auth.uid()
    )
  );

-- Comentários da tabela
COMMENT ON TABLE onboarding_improvements IS 'Tabela para agente de IA registrar oportunidades de melhoria no processo de onboarding';
COMMENT ON COLUMN onboarding_improvements.categoria IS 'Categoria da melhoria: conteudo, interface, fluxo, performance, engajamento, acessibilidade, outros';
COMMENT ON COLUMN onboarding_improvements.prioridade IS 'Prioridade: baixa, media, alta, critica';
COMMENT ON COLUMN onboarding_improvements.contexto IS 'Contexto específico em formato JSON (ex: trilha_id, colaborador_id, momento)';
COMMENT ON COLUMN onboarding_improvements.dados_analise IS 'Dados que geraram a sugestão (ex: métricas, feedback, comportamento)';
COMMENT ON COLUMN onboarding_improvements.status IS 'Status: sugerida, em_analise, aprovada, em_desenvolvimento, implementada, rejeitada';
COMMENT ON COLUMN onboarding_improvements.criado_por IS 'Quem criou: ai_agent, admin_id, sistema, etc.';


