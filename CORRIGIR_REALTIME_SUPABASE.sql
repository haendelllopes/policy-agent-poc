-- =====================================
-- VERIFICAR E CORRIGIR REALTIME SUPABASE
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. VERIFICAR STATUS ATUAL DAS TABELAS
-- =====================================
-- Consulta correta para verificar REPLICA IDENTITY
SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN relreplident = 'd' THEN 'DEFAULT'
        WHEN relreplident = 'n' THEN 'NOTHING'
        WHEN relreplident = 'f' THEN 'FULL'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND t.schemaname = 'public';

-- 2. GARANTIR QUE REALTIME ESTÁ HABILITADO
-- ========================================
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE chat_connections REPLICA IDENTITY FULL;

-- 3. VERIFICAR APÓS CORREÇÃO
-- ==========================
SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN relreplident = 'd' THEN 'DEFAULT'
        WHEN relreplident = 'n' THEN 'NOTHING'
        WHEN relreplident = 'f' THEN 'FULL'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN ('chat_messages', 'chat_sessions', 'chat_connections')
AND t.schemaname = 'public';

-- 4. TESTE DE INSERÇÃO
-- ====================
INSERT INTO chat_messages (user_id, message, message_type) 
VALUES ('3ba1e64a-88f1-4aa0-aa9a-4615a5b7e1f2', 'Teste Realtime Corrigido', 'user');

-- Verificar se funcionou
SELECT * FROM chat_messages WHERE message = 'Teste Realtime Corrigido';

-- Limpar teste
DELETE FROM chat_messages WHERE message = 'Teste Realtime Corrigido';
