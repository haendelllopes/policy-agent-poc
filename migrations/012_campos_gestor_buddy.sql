-- ===================================================================
-- MIGRAÇÃO: Campos Gestor e Buddy na tabela users
-- Data: 2025-10-11
-- ===================================================================

-- Adicionar campos gestor_id e buddy_id à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS buddy_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_gestor ON users(gestor_id);
CREATE INDEX IF NOT EXISTS idx_users_buddy ON users(buddy_id);

-- Comentários para documentação
COMMENT ON COLUMN users.gestor_id IS 'ID do gestor/líder direto do colaborador';
COMMENT ON COLUMN users.buddy_id IS 'ID do buddy/colega que ajudará no onboarding do colaborador';

-- Fim da migração
