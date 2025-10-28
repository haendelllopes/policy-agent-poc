-- Script para corrigir políticas RLS de admin_notifications
-- Execute este script no Supabase SQL Editor

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admins can read their own notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Allow public read access" ON admin_notifications;

-- Criar nova política que permite leitura pública
CREATE POLICY "Allow public read access"
  ON admin_notifications
  FOR SELECT
  USING (true);

-- Comentário explicativo
COMMENT ON POLICY "Allow public read access" ON admin_notifications 
IS 'Temporariamente permite leitura pública das notificações de admin até implementar autenticação Supabase no frontend';

