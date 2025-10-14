-- =====================================================
-- Migração 010: Histórico de Conversas
-- =====================================================
-- Descrição: Adiciona suporte para histórico estruturado de conversas
--            usado pelo OpenAI Message a Model
-- Data: 14 de outubro de 2025
-- Autor: Haendell Lopes
-- =====================================================

BEGIN;

-- 1. Criar tabela de histórico de conversas
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sentiment TEXT,
  sentiment_intensity DECIMAL(3,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_history_user 
ON conversation_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_history_session 
ON conversation_history (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_history_tenant 
ON conversation_history (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_history_created 
ON conversation_history (created_at DESC);

-- 3. Criar índice GIN para metadata
CREATE INDEX IF NOT EXISTS idx_conversation_history_metadata 
ON conversation_history USING GIN (metadata);

-- 4. Comentários para documentação
COMMENT ON TABLE conversation_history IS 'Histórico completo de conversas entre colaboradores e o AI Agent Flowly';
COMMENT ON COLUMN conversation_history.session_id IS 'ID da sessão de conversa (formato: {phone}, {tenantId}, {channel})';
COMMENT ON COLUMN conversation_history.role IS 'Papel da mensagem: user (colaborador), assistant (Flowly), system (instruções)';
COMMENT ON COLUMN conversation_history.content IS 'Conteúdo completo da mensagem';
COMMENT ON COLUMN conversation_history.sentiment IS 'Sentimento detectado na mensagem (muito_positivo, positivo, neutro, negativo, muito_negativo)';
COMMENT ON COLUMN conversation_history.sentiment_intensity IS 'Intensidade do sentimento (0.0 a 1.0)';
COMMENT ON COLUMN conversation_history.metadata IS 'Metadados adicionais (canal, tokens usados, ferramenta chamada, etc.)';

-- 5. Criar função para buscar histórico de um colaborador
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_user_id UUID,
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.role,
    ch.content,
    ch.sentiment,
    ch.created_at
  FROM conversation_history ch
  WHERE 
    ch.user_id = p_user_id
    AND ch.tenant_id = p_tenant_id
  ORDER BY ch.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_conversation_history IS 'Busca histórico de conversas de um colaborador específico (mais recentes primeiro)';

-- 6. Criar função para buscar histórico por session_id
CREATE OR REPLACE FUNCTION get_conversation_by_session(
  p_session_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.role,
    ch.content,
    ch.sentiment,
    ch.created_at
  FROM conversation_history ch
  WHERE ch.session_id = p_session_id
  ORDER BY ch.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_conversation_by_session IS 'Busca histórico de conversas por session_id (formato: {phone}, {tenantId}, {channel})';

-- 7. Criar view para conversas recentes
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
  ch.id,
  ch.tenant_id,
  ch.user_id,
  u.name as user_name,
  u.phone as user_phone,
  ch.session_id,
  ch.role,
  ch.content,
  ch.sentiment,
  ch.sentiment_intensity,
  ch.metadata->>'channel' as channel,
  ch.created_at
FROM conversation_history ch
LEFT JOIN users u ON ch.user_id = u.id
WHERE ch.created_at >= NOW() - INTERVAL '7 days'
ORDER BY ch.created_at DESC;

COMMENT ON VIEW recent_conversations IS 'View de conversas dos últimos 7 dias com informações do colaborador';

-- 8. Criar função para limpar histórico antigo (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(
  p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM conversation_history
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_conversations IS 'Remove conversas mais antigas que X dias (padrão: 90 dias). Retorna quantidade de registros deletados.';

-- 9. Criar políticas RLS (Row Level Security)
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias conversas
CREATE POLICY conversation_history_select_own
  ON conversation_history
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Política: Sistema pode inserir conversas
CREATE POLICY conversation_history_insert_system
  ON conversation_history
  FOR INSERT
  WITH CHECK (true);

-- Política: Admins podem ver todas as conversas do tenant
CREATE POLICY conversation_history_admin_all
  ON conversation_history
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Trigger para limpar metadata (sanitização)
CREATE OR REPLACE FUNCTION sanitize_conversation_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remover campos sensíveis do metadata se existirem
  IF NEW.metadata ? 'api_key' THEN
    NEW.metadata = NEW.metadata - 'api_key';
  END IF;
  
  IF NEW.metadata ? 'password' THEN
    NEW.metadata = NEW.metadata - 'password';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sanitize_conversation_metadata
  BEFORE INSERT OR UPDATE ON conversation_history
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_conversation_metadata();

COMMENT ON TRIGGER trigger_sanitize_conversation_metadata ON conversation_history IS 'Remove dados sensíveis do metadata antes de salvar';

-- 11. Validar estrutura
DO $$
BEGIN
  -- Verificar se tabela foi criada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversation_history'
  ) THEN
    RAISE EXCEPTION 'Tabela conversation_history não foi criada';
  END IF;
  
  RAISE NOTICE '✅ Migração 010 executada com sucesso!';
END $$;

COMMIT;

-- =====================================================
-- Exemplos de Uso
-- =====================================================

/*
-- 1. Buscar histórico de um colaborador:
SELECT * FROM get_conversation_history(
  'user-uuid-here',
  'tenant-uuid-here',
  10
);

-- 2. Buscar conversas por session_id:
SELECT * FROM get_conversation_by_session(
  '556291708483, 5978f911-738b-4aae-802a-f037fdac2e64, whatsapp',
  10
);

-- 3. Ver conversas recentes:
SELECT * FROM recent_conversations WHERE tenant_id = 'tenant-uuid-here' LIMIT 20;

-- 4. Limpar conversas antigas (mais de 90 dias):
SELECT cleanup_old_conversations(90);

-- 5. Inserir mensagem de teste:
INSERT INTO conversation_history (
  tenant_id,
  user_id,
  session_id,
  role,
  content,
  sentiment,
  sentiment_intensity,
  metadata
) VALUES (
  'tenant-uuid-here',
  'user-uuid-here',
  '556291708483, tenant-uuid, whatsapp',
  'user',
  'Olá, tudo bem?',
  'positivo',
  0.8,
  '{"channel": "whatsapp", "tokens_used": 15}'::jsonb
);
*/

-- =====================================================
-- Rollback (se necessário)
-- =====================================================

/*
-- Para reverter esta migração:

DROP TRIGGER IF EXISTS trigger_sanitize_conversation_metadata ON conversation_history;
DROP FUNCTION IF EXISTS sanitize_conversation_metadata();
DROP POLICY IF EXISTS conversation_history_admin_all ON conversation_history;
DROP POLICY IF EXISTS conversation_history_insert_system ON conversation_history;
DROP POLICY IF EXISTS conversation_history_select_own ON conversation_history;
DROP FUNCTION IF EXISTS cleanup_old_conversations(INTEGER);
DROP VIEW IF EXISTS recent_conversations;
DROP FUNCTION IF EXISTS get_conversation_by_session(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_conversation_history(UUID, UUID, INTEGER);
DROP INDEX IF EXISTS idx_conversation_history_metadata;
DROP INDEX IF EXISTS idx_conversation_history_created;
DROP INDEX IF EXISTS idx_conversation_history_tenant;
DROP INDEX IF EXISTS idx_conversation_history_session;
DROP INDEX IF EXISTS idx_conversation_history_user;
DROP TABLE IF EXISTS conversation_history CASCADE;
*/

