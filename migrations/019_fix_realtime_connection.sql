-- Script para corrigir conexão WebSocket do Supabase Realtime
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'admin_notifications'
);

-- 2. Verificar se a tabela está na publicação Realtime
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'admin_notifications';

-- 3. Adicionar tabela à publicação Realtime (se não estiver)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'admin_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
        RAISE NOTICE 'Tabela admin_notifications adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela admin_notifications já está no Realtime';
    END IF;
END $$;

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admin_notifications';

-- 5. Habilitar replica identity para Realtime funcionar corretamente
ALTER TABLE admin_notifications REPLICA IDENTITY FULL;

-- 6. Verificar se Realtime está habilitado na tabela
SELECT 
    attname, 
    atttypid::regtype
FROM pg_attribute
WHERE attrelid = 'public.admin_notifications'::regclass
AND attname = 'id'
AND attnum > 0;
