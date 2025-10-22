-- =====================================
-- CORREÇÃO: FOREIGN KEYS PARA TABELA USERS
-- =====================================

-- Remover foreign keys antigas
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE chat_connections DROP CONSTRAINT IF EXISTS chat_connections_user_id_fkey;

-- Adicionar foreign keys corretas para tabela users
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE chat_connections ADD CONSTRAINT chat_connections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- Comentários atualizados
COMMENT ON TABLE chat_messages IS 'Mensagens do chat em tempo real - FK para users(id)';
COMMENT ON TABLE chat_sessions IS 'Sessões de chat dos usuários - FK para users(id)';
COMMENT ON TABLE chat_connections IS 'Status de conexão dos usuários - FK para users(id)';

