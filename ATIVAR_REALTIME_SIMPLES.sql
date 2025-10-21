-- =====================================
-- ATIVAR REALTIME VIA SQL
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. HABILITAR REALTIME NAS TABELAS
-- ==================================
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;

-- 2. VERIFICAR SE REALTIME ESTÁ HABILITADO
-- ========================================
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
WHERE tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND schemaname = 'public';

-- 3. TESTE DE INSERÇÃO PARA VERIFICAR
-- ====================================
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste Realtime', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste Realtime';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste Realtime';
