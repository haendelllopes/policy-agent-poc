-- =====================================
-- SUPABASE REALTIME - ROW LEVEL SECURITY
-- =====================================

-- Habilitar RLS nas tabelas de chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_connections ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_messages
CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Políticas para chat_sessions
CREATE POLICY "Users can view their own sessions" ON chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Políticas para chat_connections
CREATE POLICY "Users can view their own connections" ON chat_connections
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own connections" ON chat_connections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own connections" ON chat_connections
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Política especial para sistema (assistant messages)
CREATE POLICY "System can insert assistant messages" ON chat_messages
    FOR INSERT WITH CHECK (message_type = 'assistant');

-- Função para obter user_id do contexto atual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode acessar chat
CREATE OR REPLACE FUNCTION can_access_chat(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Usuário pode acessar apenas seus próprios chats
    RETURN auth.uid() = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

