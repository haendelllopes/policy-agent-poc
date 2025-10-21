-- =====================================
-- HABILITAR REALTIME SUPABASE
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. VERIFICAR STATUS ATUAL DO REALTIME
-- =====================================
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

-- 2. HABILITAR REALTIME NAS TABELAS
-- ==================================
-- Garantir que todas as tabelas tenham REPLICA IDENTITY FULL
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;

-- 3. VERIFICAR SE REALTIME ESTÁ HABILITADO NO PROJETO
-- ===================================================
-- Nota: Se o Realtime não estiver habilitado no projeto,
-- você precisa habilitar no Dashboard do Supabase:
-- Settings > Database > Realtime > Enable Realtime

-- 4. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- ==============================================
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_connections DISABLE ROW LEVEL SECURITY;

-- 5. TESTE DE INSERÇÃO SEM RLS
-- ============================
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

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all operations for development" ON chat_messages;
DROP POLICY IF EXISTS "Allow all operations for development" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all operations for development" ON chat_connections;

-- Criar políticas permissivas
CREATE POLICY "Allow all operations" ON chat_messages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations" ON chat_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations" ON chat_connections
    FOR ALL USING (true) WITH CHECK (true);

-- 7. TESTE FINAL COM RLS HABILITADO
-- ==================================
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste Final Realtime', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste Final Realtime';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste Final Realtime';

-- 8. VERIFICAR STATUS FINAL
-- =========================
-- Verificar Realtime
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';
