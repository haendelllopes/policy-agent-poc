-- Corrigir políticas RLS para admin_notifications
-- Permitir leitura para todos temporariamente (até implementar autenticação Supabase)

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins can read their own notifications" ON admin_notifications;

-- Criar nova política que permite leitura pública
CREATE POLICY "Allow public read access"
  ON admin_notifications
  FOR SELECT
  USING (true);

-- Garantir que Realtime está habilitado
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS admin_notifications;

COMMENT ON POLICY "Allow public read access" ON admin_notifications IS 'Temporariamente permite leitura pública das notificações de admin até implementar autenticação Supabase no frontend';

