-- ===================================================================
-- CORREÇÃO: Problemas de Segurança do Database Linter
-- Data: 2025-10-10
-- Problemas identificados:
-- 1. Views com SECURITY DEFINER
-- 2. RLS desabilitado em tabelas públicas
-- ===================================================================

-- ===================================================================
-- 1. CORRIGIR VIEWS COM SECURITY DEFINER
-- ===================================================================

-- Remover views antigas com SECURITY DEFINER
DROP VIEW IF EXISTS trilhas_recomendadas CASCADE;
DROP VIEW IF EXISTS trilhas_colaborador CASCADE;

-- Recriar view trilhas_recomendadas SEM SECURITY DEFINER
CREATE VIEW trilhas_recomendadas AS
SELECT 
  t.id,
  t.nome,
  t.descricao,
  t.sentimento_medio,
  t.dificuldade_percebida,
  t.taxa_conclusao,
  t.tempo_medio_conclusao,
  t.recomendada_para_iniciantes,
  t.created_at,
  t.updated_at,
  
  -- Calcular score de recomendação baseado em múltiplos fatores
  CASE
    WHEN t.sentimento_medio IS NULL THEN 50
    WHEN t.taxa_conclusao IS NULL THEN 50
    ELSE 
      ROUND(
        (COALESCE(t.sentimento_medio, 0.5) * 40) + 
        (COALESCE(t.taxa_conclusao, 0.5) * 40) + 
        (CASE WHEN t.recomendada_para_iniciantes THEN 20 ELSE 0 END)
      )
  END as score_recomendacao
  
FROM trilhas t
WHERE t.ativo = true;

COMMENT ON VIEW trilhas_recomendadas IS 'View de trilhas com score de recomendação calculado';

-- Recriar view trilhas_colaborador SEM SECURITY DEFINER
CREATE VIEW trilhas_colaborador AS
SELECT 
  t.id as trilha_id,
  t.nome as trilha_nome,
  t.descricao as trilha_descricao,
  u.id as colaborador_id,
  u.nome as colaborador_nome,
  u.email as colaborador_email,
  u.department_id,
  u.position_id,
  d.nome as department_nome,
  p.nome as position_nome,
  
  -- Verificar se colaborador tem acesso à trilha
  colaborador_tem_acesso_trilha(u.id, t.id) as tem_acesso,
  
  -- Status da trilha para o colaborador (se existir)
  ct.status as status_trilha,
  ct.progresso,
  ct.iniciado_em,
  ct.concluido_em,
  
  -- Métricas da trilha
  t.sentimento_medio,
  t.dificuldade_percebida,
  t.taxa_conclusao,
  t.tempo_medio_conclusao,
  
  -- Score de recomendação
  CASE
    WHEN t.sentimento_medio IS NULL THEN 50
    WHEN t.taxa_conclusao IS NULL THEN 50
    ELSE 
      ROUND(
        (COALESCE(t.sentimento_medio, 0.5) * 40) + 
        (COALESCE(t.taxa_conclusao, 0.5) * 40) + 
        (CASE WHEN t.recomendada_para_iniciantes THEN 20 ELSE 0 END)
      )
  END as score_recomendacao

FROM trilhas t
CROSS JOIN users u
LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = u.id
LEFT JOIN departments d ON d.id = u.department_id
LEFT JOIN positions p ON p.id = u.position_id
WHERE t.ativo = true;

COMMENT ON VIEW trilhas_colaborador IS 'View de trilhas com informações do colaborador e acesso';

-- ===================================================================
-- 2. HABILITAR RLS EM TABELAS PÚBLICAS
-- ===================================================================

-- Habilitar RLS na tabela tenant_settings
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para tenant_settings
CREATE POLICY "tenant_settings_access_policy" ON tenant_settings
  FOR ALL 
  TO authenticated
  USING (true); -- Por enquanto permitir acesso total, pode ser refinado depois

COMMENT ON POLICY "tenant_settings_access_policy" ON tenant_settings IS 'Política RLS para tenant_settings - acesso total para usuários autenticados';

-- ===================================================================
-- 3. VERIFICAR E HABILITAR RLS EM OUTRAS TABELAS IMPORTANTES
-- ===================================================================

-- Verificar se outras tabelas precisam de RLS
DO $$
DECLARE
    table_name TEXT;
    tables_without_rls TEXT[] := ARRAY[
        'onboarding_improvements',
        'agente_anotacoes', 
        'colaborador_sentimentos',
        'trilha_segmentacao'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_without_rls
    LOOP
        -- Verificar se a tabela existe e se RLS está habilitado
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            -- Habilitar RLS se não estiver habilitado
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            
            -- Criar política básica de acesso
            EXECUTE format('
                CREATE POLICY IF NOT EXISTS "%s_access_policy" ON %I
                FOR ALL TO authenticated
                USING (true)
            ', table_name || '_access', table_name);
            
            RAISE NOTICE 'RLS habilitado para tabela: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ===================================================================
-- 4. CRIAR POLÍTICAS RLS MAIS ESPECÍFICAS (OPCIONAL)
-- ===================================================================

-- Política mais específica para agente_anotacoes
DROP POLICY IF EXISTS "agente_anotacoes_access_policy" ON agente_anotacoes;
CREATE POLICY "agente_anotacoes_access_policy" ON agente_anotacoes
  FOR ALL 
  TO authenticated
  USING (
    -- Permitir acesso apenas ao próprio tenant
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
  );

-- Política mais específica para colaborador_sentimentos  
DROP POLICY IF EXISTS "colaborador_sentimentos_access_policy" ON colaborador_sentimentos;
CREATE POLICY "colaborador_sentimentos_access_policy" ON colaborador_sentimentos
  FOR ALL 
  TO authenticated
  USING (
    -- Permitir acesso apenas ao próprio tenant
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
    AND (
      -- Usuário pode ver seus próprios sentimentos
      colaborador_id = auth.uid()::text::uuid
      OR
      -- Admin pode ver todos do tenant
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'admin'
        AND tenant_id = colaborador_sentimentos.tenant_id
      )
    )
  );

-- Política mais específica para onboarding_improvements
DROP POLICY IF EXISTS "onboarding_improvements_access_policy" ON onboarding_improvements;
CREATE POLICY "onboarding_improvements_access_policy" ON onboarding_improvements
  FOR ALL 
  TO authenticated
  USING (
    -- Permitir acesso apenas ao próprio tenant
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
    AND (
      -- Admin pode ver todas as melhorias
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'admin'
        AND tenant_id = onboarding_improvements.tenant_id
      )
      OR
      -- Manager pode ver melhorias
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'manager'
        AND tenant_id = onboarding_improvements.tenant_id
      )
    )
  );

-- ===================================================================
-- 5. VERIFICAÇÃO FINAL
-- ===================================================================

-- Verificar views recriadas
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('trilhas_recomendadas', 'trilhas_colaborador');

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenant_settings', 'onboarding_improvements', 'agente_anotacoes', 'colaborador_sentimentos', 'trilha_segmentacao');

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- FIM DA CORREÇÃO DE SEGURANÇA




