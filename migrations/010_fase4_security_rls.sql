-- =====================================
-- FASE 4: CORREÇÃO DE FOREIGN KEYS E RLS
-- =====================================

-- 1. CORRIGIR FOREIGN KEYS PARA TABELA USERS
-- ===========================================

-- Remover foreign keys antigas (se existirem)
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE chat_connections DROP CONSTRAINT IF EXISTS chat_connections_user_id_fkey;

-- Adicionar foreign keys corretas para tabela users
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_connections ADD CONSTRAINT chat_connections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ======================================

-- Habilitar RLS nas tabelas de chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_connections ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA CHAT_MESSAGES
-- ===================================

-- Política: Usuários podem ver suas próprias mensagens
CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política: Usuários podem inserir suas próprias mensagens
CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem atualizar suas próprias mensagens
CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Política: Sistema pode inserir mensagens de assistente
CREATE POLICY "System can insert assistant messages" ON chat_messages
    FOR INSERT WITH CHECK (message_type = 'assistant');

-- 4. POLÍTICAS RLS PARA CHAT_SESSIONS
-- ===================================

-- Política: Usuários podem ver suas próprias sessões
CREATE POLICY "Users can view their own sessions" ON chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política: Usuários podem inserir suas próprias sessões
CREATE POLICY "Users can insert their own sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem atualizar suas próprias sessões
CREATE POLICY "Users can update their own sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 5. POLÍTICAS RLS PARA CHAT_CONNECTIONS
-- ======================================

-- Política: Usuários podem ver suas próprias conexões
CREATE POLICY "Users can view their own connections" ON chat_connections
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política: Usuários podem inserir suas próprias conexões
CREATE POLICY "Users can insert their own connections" ON chat_connections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política: Usuários podem atualizar suas próprias conexões
CREATE POLICY "Users can update their own connections" ON chat_connections
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 6. FUNÇÕES AUXILIARES
-- =====================

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

-- Função para limpar conexões antigas
CREATE OR REPLACE FUNCTION cleanup_old_connections()
RETURNS void AS $$
BEGIN
    -- Remover conexões mais antigas que 1 hora
    DELETE FROM chat_connections 
    WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ÍNDICES DE PERFORMANCE
-- ==========================

-- Índices para melhorar performance das consultas RLS
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id_auth ON chat_messages(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id_auth ON chat_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_connections_user_id_auth ON chat_connections(user_id) WHERE user_id IS NOT NULL;

-- Índice para cleanup de conexões
CREATE INDEX IF NOT EXISTS idx_chat_connections_last_seen ON chat_connections(last_seen);

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================

COMMENT ON TABLE chat_messages IS 'Mensagens do chat em tempo real - FK para users(id) com RLS';
COMMENT ON TABLE chat_sessions IS 'Sessões de chat dos usuários - FK para users(id) com RLS';
COMMENT ON TABLE chat_connections IS 'Status de conexão dos usuários - FK para users(id) com RLS';

COMMENT ON POLICY "Users can view their own messages" ON chat_messages IS 'Permite usuários verem apenas suas próprias mensagens';
COMMENT ON POLICY "Users can insert their own messages" ON chat_messages IS 'Permite usuários inserirem mensagens apenas para si mesmos';
COMMENT ON POLICY "System can insert assistant messages" ON chat_messages IS 'Permite sistema inserir mensagens de assistente';

-- 9. VERIFICAÇÃO FINAL
-- ====================

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
ORDER BY tablename, policyname;

