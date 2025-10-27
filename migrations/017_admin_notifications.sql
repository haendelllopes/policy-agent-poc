-- Tabela para notificações de admin em tempo real
-- Esta tabela é usada pelo Supabase Realtime para notificações push
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'urgencia_critica',
  colaborador_nome VARCHAR(255),
  colaborador_email VARCHAR(255),
  colaborador_phone VARCHAR(50),
  problema TEXT,
  urgencia VARCHAR(20),
  categoria VARCHAR(50),
  acao_sugerida TEXT,
  anotacao_id UUID,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_tenant_id ON admin_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_lida ON admin_notifications(lida);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Habilitar Realtime na tabela
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- RLS (Row Level Security)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem suas próprias notificações
CREATE POLICY "Admins can read their own notifications"
  ON admin_notifications
  FOR SELECT
  USING (auth.uid()::text = admin_id::text);

-- Política para sistema inserir notificações
CREATE POLICY "System can insert notifications"
  ON admin_notifications
  FOR INSERT
  WITH CHECK (true);

-- Política para admins atualizarem suas notificações
CREATE POLICY "Admins can update their own notifications"
  ON admin_notifications
  FOR UPDATE
  USING (auth.uid()::text = admin_id::text);

COMMENT ON TABLE admin_notifications IS 'Notificações em tempo real para administradores via Supabase Realtime';

