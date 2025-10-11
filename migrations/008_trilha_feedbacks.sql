-- Migration 008: Tabela para feedbacks de trilhas
-- Data: 2025-01-11

-- Criar tabela para armazenar feedbacks dos colaboradores sobre trilhas
CREATE TABLE IF NOT EXISTS trilha_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trilha_id UUID NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    tipo_feedback VARCHAR(50) DEFAULT 'geral', -- 'geral', 'dificuldade', 'sugestao', 'elogio'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trilha_feedbacks_colaborador ON trilha_feedbacks(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_trilha_feedbacks_trilha ON trilha_feedbacks(trilha_id);
CREATE INDEX IF NOT EXISTS idx_trilha_feedbacks_created_at ON trilha_feedbacks(created_at);

-- Comentários
COMMENT ON TABLE trilha_feedbacks IS 'Feedbacks dos colaboradores sobre trilhas de onboarding';
COMMENT ON COLUMN trilha_feedbacks.feedback IS 'Texto do feedback do colaborador';
COMMENT ON COLUMN trilha_feedbacks.tipo_feedback IS 'Tipo do feedback: geral, dificuldade, sugestao, elogio';
