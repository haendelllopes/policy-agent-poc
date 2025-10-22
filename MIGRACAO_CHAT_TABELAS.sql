-- =====================================
-- MIGRAÇÃO MANUAL - TABELAS DE CHAT SUPABASE
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. REMOVER TABELAS EXISTENTES (se necessário)
DROP TABLE IF EXISTS chat_connections CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- 2. CRIAR TABELAS COM ESTRUTURA CORRETA
-- =====================================

-- Tabela para mensagens do chat
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'user' CHECK (message_type IN ('user', 'assistant', 'system')),
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sessões de chat
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para status de conexão
CREATE TABLE chat_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_id VARCHAR(255) UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ==================================
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_connections_user_id ON chat_connections(user_id);
CREATE INDEX idx_chat_connections_connection_id ON chat_connections(connection_id);

-- 4. CRIAR TRIGGERS PARA UPDATED_AT
-- ==================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR REALTIME
-- =====================
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==================================
COMMENT ON TABLE chat_messages IS 'Mensagens do chat em tempo real';
COMMENT ON TABLE chat_sessions IS 'Sessões de chat dos usuários';
COMMENT ON TABLE chat_connections IS 'Status de conexão dos usuários';

-- 7. TESTE DE INSERÇÃO
-- ====================
-- Inserir uma mensagem de teste
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste de migração', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste de migração';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste de migração';

