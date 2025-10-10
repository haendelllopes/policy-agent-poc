-- ===================================================================
-- TESTES DE VALIDAÇÃO - Migrações Executadas
-- Data: 10/10/2025
-- Execute este SQL no Supabase SQL Editor para validar tudo
-- ===================================================================

-- TESTE 1: Verificar tabelas criadas
SELECT '=== TESTE 1: Tabelas Criadas ===' as teste;

SELECT 
  table_name,
  'Criada ✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'trilha_segmentacao',
    'colaborador_sentimentos', 
    'agente_anotacoes',
    'onboarding_improvements'
  )
ORDER BY table_name;

-- TESTE 2: Verificar colunas em trilhas
SELECT '=== TESTE 2: Colunas em Trilhas ===' as teste;

SELECT 
  column_name,
  data_type,
  'Criada ✅' as status
FROM information_schema.columns 
WHERE table_name = 'trilhas'
  AND column_name IN (
    'segmentacao_tipo',
    'segmentacao_config',
    'sentimento_medio',
    'dificuldade_percebida',
    'taxa_conclusao',
    'tempo_medio_conclusao',
    'recomendada_para_iniciantes',
    'sentimento_atualizado_em'
  )
ORDER BY column_name;

-- TESTE 3: Verificar colunas em users
SELECT '=== TESTE 3: Colunas em Users ===' as teste;

SELECT 
  column_name,
  data_type,
  'Criada ✅' as status
FROM information_schema.columns 
WHERE table_name = 'users'
  AND column_name IN (
    'sentimento_atual',
    'sentimento_atualizado_em'
  )
ORDER BY column_name;

-- TESTE 4: Verificar funções criadas
SELECT '=== TESTE 4: Funções Criadas ===' as teste;

SELECT 
  routine_name,
  'Criada ✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'colaborador_tem_acesso_trilha',
    'buscar_trilhas_por_sentimento',
    'calcular_sentimento_trilha',
    'atualizar_sentimento_usuario',
    'trigger_atualizar_sentimento_trilha',
    'trigger_trilha_concluida'
  )
ORDER BY routine_name;

-- TESTE 5: Verificar views criadas
SELECT '=== TESTE 5: Views Criadas ===' as teste;

SELECT 
  table_name as view_name,
  'Criada ✅' as status
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'trilhas_colaborador',
    'trilhas_recomendadas'
  )
ORDER BY table_name;

-- TESTE 6: Inserir sentimento de teste
SELECT '=== TESTE 6: Inserir Sentimento de Teste ===' as teste;

-- Buscar primeiro usuário
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT id, tenant_id INTO v_user_id, v_tenant_id
  FROM users 
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Inserir sentimento de teste
    INSERT INTO colaborador_sentimentos (
      tenant_id,
      colaborador_id,
      sentimento,
      intensidade,
      origem,
      mensagem_analisada,
      fatores_detectados
    ) VALUES (
      v_tenant_id,
      v_user_id,
      'positivo',
      0.85,
      'teste_validacao',
      'Mensagem de teste para validar o sistema',
      '{"palavras_chave": ["teste", "validacao"], "tom": "neutro"}'::jsonb
    );
    
    RAISE NOTICE 'Sentimento de teste inserido para user_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'Nenhum usuário encontrado para teste';
  END IF;
END $$;

-- Verificar se foi inserido
SELECT 
  'Sentimento inserido' as resultado,
  COUNT(*) as total
FROM colaborador_sentimentos
WHERE origem = 'teste_validacao';

-- TESTE 7: Verificar se sentimento_atual foi atualizado (via trigger)
SELECT '=== TESTE 7: Trigger de Sentimento ===' as teste;

SELECT 
  u.name,
  u.sentimento_atual,
  u.sentimento_atualizado_em,
  'Trigger funcionou ✅' as status
FROM users u
WHERE u.sentimento_atual IS NOT NULL
LIMIT 5;

-- TESTE 8: Criar anotação de teste
SELECT '=== TESTE 8: Criar Anotação de Teste ===' as teste;

DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT id, tenant_id INTO v_user_id, v_tenant_id
  FROM users 
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO agente_anotacoes (
      tenant_id,
      colaborador_id,
      tipo,
      titulo,
      anotacao,
      sentimento,
      intensidade_sentimento,
      tags
    ) VALUES (
      v_tenant_id,
      v_user_id,
      'observacao_geral',
      'Teste de anotação',
      'Esta é uma anotação de teste para validar o sistema',
      'neutro',
      0.50,
      ARRAY['teste', 'validacao', 'api']
    );
    
    RAISE NOTICE 'Anotação de teste inserida';
  END IF;
END $$;

SELECT 
  'Anotação inserida' as resultado,
  COUNT(*) as total
FROM agente_anotacoes
WHERE 'teste' = ANY(tags);

-- TESTE 9: Testar função de recomendação
SELECT '=== TESTE 9: Função de Recomendação ===' as teste;

DO $$
DECLARE
  v_user_id UUID;
  v_result RECORD;
BEGIN
  SELECT id INTO v_user_id FROM users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testando função buscar_trilhas_por_sentimento para user_id: %', v_user_id;
    
    -- Testar com sentimento positivo
    FOR v_result IN 
      SELECT * FROM buscar_trilhas_por_sentimento(v_user_id, 'positivo', 3)
    LOOP
      RAISE NOTICE 'Trilha recomendada: % (compatibilidade: %)', v_result.nome, v_result.compatibilidade_sentimento;
    END LOOP;
  END IF;
END $$;

-- TESTE 10: Testar view trilhas_recomendadas
SELECT '=== TESTE 10: View Trilhas Recomendadas ===' as teste;

SELECT 
  nome,
  sentimento_medio,
  dificuldade_percebida,
  taxa_conclusao,
  score_recomendacao,
  nivel_recomendacao
FROM trilhas_recomendadas
LIMIT 5;

-- TESTE 11: Estatísticas de sentimentos
SELECT '=== TESTE 11: Estatísticas de Sentimentos ===' as teste;

SELECT 
  sentimento,
  COUNT(*) as total,
  AVG(intensidade) as intensidade_media
FROM colaborador_sentimentos
GROUP BY sentimento
ORDER BY 
  CASE sentimento
    WHEN 'muito_positivo' THEN 1
    WHEN 'positivo' THEN 2
    WHEN 'neutro' THEN 3
    WHEN 'negativo' THEN 4
    WHEN 'muito_negativo' THEN 5
  END;

-- TESTE 12: Resumo Final
SELECT '=== ✅ RESUMO FINAL ===' as teste;

SELECT 
  'Tabelas' as tipo,
  COUNT(*) as quantidade
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('trilha_segmentacao', 'colaborador_sentimentos', 'agente_anotacoes', 'onboarding_improvements')

UNION ALL

SELECT 
  'Funções' as tipo,
  COUNT(*) as quantidade
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('colaborador_tem_acesso_trilha', 'buscar_trilhas_por_sentimento', 'calcular_sentimento_trilha')

UNION ALL

SELECT 
  'Views' as tipo,
  COUNT(*) as quantidade
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN ('trilhas_colaborador', 'trilhas_recomendadas')

UNION ALL

SELECT 
  'Sentimentos registrados' as tipo,
  COUNT(*) as quantidade
FROM colaborador_sentimentos

UNION ALL

SELECT 
  'Anotações criadas' as tipo,
  COUNT(*) as quantidade
FROM agente_anotacoes;

-- FIM DOS TESTES
SELECT '=== 🎉 TESTES CONCLUÍDOS ===' as teste;

