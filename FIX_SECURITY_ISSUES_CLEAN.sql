DROP VIEW IF EXISTS trilhas_recomendadas CASCADE;
DROP VIEW IF EXISTS trilhas_colaborador CASCADE;

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

CREATE VIEW trilhas_colaborador AS
SELECT 
  t.id as trilha_id,
  t.nome as trilha_nome,
  t.descricao as trilha_descricao,
  u.id as colaborador_id,
  u.name as colaborador_nome,
  u.email as colaborador_email,
  u.department_id,
  u.position_id,
  d.name as department_nome,
  p.name as position_nome,
  
  colaborador_tem_acesso_trilha(u.id, t.id) as tem_acesso,
  
  ct.status as status_trilha,
  
  t.sentimento_medio,
  t.dificuldade_percebida,
  t.taxa_conclusao,
  t.tempo_medio_conclusao,
  
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

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_access_policy" ON tenant_settings
  FOR ALL 
  TO authenticated
  USING (true);

DO $$
DECLARE
    current_table TEXT;
    tables_without_rls TEXT[] := ARRAY[
        'onboarding_improvements',
        'agente_anotacoes', 
        'colaborador_sentimentos',
        'trilha_segmentacao'
    ];
BEGIN
    FOREACH current_table IN ARRAY tables_without_rls
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = current_table
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', current_table);
            
            EXECUTE format('
                DROP POLICY IF EXISTS "%s_access_policy" ON %I
            ', current_table || '_access', current_table);
            
            EXECUTE format('
                CREATE POLICY "%s_access_policy" ON %I
                FOR ALL TO authenticated
                USING (true)
            ', current_table || '_access', current_table);
            
            RAISE NOTICE 'RLS habilitado para tabela: %', current_table;
        END IF;
    END LOOP;
END $$;

DROP POLICY IF EXISTS "agente_anotacoes_access_policy" ON agente_anotacoes;
CREATE POLICY "agente_anotacoes_access_policy" ON agente_anotacoes
  FOR ALL 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
  );

DROP POLICY IF EXISTS "colaborador_sentimentos_access_policy" ON colaborador_sentimentos;
CREATE POLICY "colaborador_sentimentos_access_policy" ON colaborador_sentimentos
  FOR ALL 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
    AND (
      colaborador_id = auth.uid()::text::uuid
      OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'admin'
        AND tenant_id = colaborador_sentimentos.tenant_id
      )
    )
  );

DROP POLICY IF EXISTS "onboarding_improvements_access_policy" ON onboarding_improvements;
CREATE POLICY "onboarding_improvements_access_policy" ON onboarding_improvements
  FOR ALL 
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid()::text::uuid
    )
    AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'admin'
        AND tenant_id = onboarding_improvements.tenant_id
      )
      OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text::uuid 
        AND role = 'manager'
        AND tenant_id = onboarding_improvements.tenant_id
      )
    )
  );
