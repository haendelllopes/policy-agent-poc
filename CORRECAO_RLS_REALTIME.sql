-- =====================================
-- CORREÇÃO RLS E REALTIME - SUPABASE
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- ==============================================
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_connections DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES (se houver)
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "System can insert assistant messages" ON chat_messages;

DROP POLICY IF EXISTS "Users can view their own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON chat_sessions;

DROP POLICY IF EXISTS "Users can view their own connections" ON chat_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON chat_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON chat_connections;

-- 3. VERIFICAR SE REALTIME ESTÁ HABILITADO
-- ========================================
-- Verificar se as tabelas têm REPLICA IDENTITY FULL
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

-- 4. GARANTIR QUE REALTIME ESTÁ HABILITADO
-- ========================================
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;

-- 5. TESTE DE REALTIME SEM RLS
-- ============================
-- Inserir uma mensagem de teste
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste Realtime sem RLS', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste Realtime sem RLS';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste Realtime sem RLS';

-- 6. HABILITAR RLS COM POLÍTICAS PERMISSIVAS
-- ==========================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_connections ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
CREATE POLICY "Allow all operations for development" ON chat_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON chat_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON chat_connections
    FOR ALL USING (true) WITH CHECK (true);

-- 7. TESTE FINAL COM RLS HABILITADO
-- ==================================
-- Inserir uma mensagem de teste
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste Realtime com RLS', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste Realtime com RLS';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste Realtime com RLS';

-- 8. VERIFICAR STATUS FINAL
-- =========================
-- Verificar se Realtime está habilitado
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

