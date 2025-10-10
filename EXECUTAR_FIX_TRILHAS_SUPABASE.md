# 🔧 FIX URGENTE: Corrigir Função SQL no Supabase

## ⚠️ PROBLEMA:
A função `buscar_trilhas_por_sentimento` está retornando colunas com nomes errados, causando erro:
```
"structure of query does not match function result type"
```

## ✅ SOLUÇÃO:
Executar o SQL de correção no Supabase para atualizar a função.

---

## 📋 PASSO A PASSO:

### 1. **Abrir Supabase:**
   - Ir em: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

### 2. **Copiar e colar o SQL abaixo:**

```sql
-- ===================================================================
-- FIX: Corrigir função buscar_trilhas_por_sentimento
-- ===================================================================

CREATE OR REPLACE FUNCTION buscar_trilhas_por_sentimento(
  p_colaborador_id UUID,
  p_sentimento_atual VARCHAR(20),
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  trilha_id UUID,
  nome VARCHAR(255),
  descricao TEXT,
  sentimento_medio DECIMAL(3,2),
  dificuldade_percebida VARCHAR(20),
  taxa_conclusao DECIMAL(5,2),
  tempo_medio_conclusao INTEGER,
  score_recomendacao INTEGER,
  compatibilidade_sentimento INTEGER,
  motivo_recomendacao TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id as trilha_id,
    tr.nome,
    tr.descricao,
    tr.sentimento_medio,
    tr.dificuldade_percebida,
    tr.taxa_conclusao,
    tr.tempo_medio_conclusao,
    tr.score_recomendacao,
    
    CASE
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('muito_facil', 'facil') AND tr.sentimento_medio >= 0.70 THEN 100
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.75 THEN 80
          ELSE 50
        END
      WHEN p_sentimento_atual = 'neutro' THEN
        CASE
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.60 THEN 100
          WHEN tr.dificuldade_percebida IN ('facil', 'dificil') THEN 80
          ELSE 60
        END
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('media', 'dificil') AND tr.sentimento_medio >= 0.50 THEN 100
          WHEN tr.dificuldade_percebida = 'muito_dificil' AND tr.sentimento_medio >= 0.60 THEN 90
          ELSE 70
        END
      ELSE 50
    END::INTEGER as compatibilidade_sentimento,
    
    CASE
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        'Trilha mais leve para recuperar confiança'
      WHEN p_sentimento_atual = 'neutro' THEN
        'Trilha equilibrada para seu momento'
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        'Trilha desafiadora que vai te agregar muito'
      ELSE 'Trilha recomendada'
    END::TEXT as motivo_recomendacao
    
  FROM trilhas_recomendadas tr
  WHERE colaborador_tem_acesso_trilha(p_colaborador_id, tr.id) = true
    AND tr.id NOT IN (
      SELECT ct.trilha_id 
      FROM colaborador_trilhas ct
      WHERE ct.colaborador_id = p_colaborador_id 
        AND ct.status IN ('concluida', 'em_andamento')
    )
  ORDER BY 
    CASE
      WHEN p_sentimento_atual IN ('muito_negativo', 'negativo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('muito_facil', 'facil') AND tr.sentimento_medio >= 0.70 THEN 100
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.75 THEN 80
          ELSE 50
        END
      WHEN p_sentimento_atual = 'neutro' THEN
        CASE
          WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.60 THEN 100
          WHEN tr.dificuldade_percebida IN ('facil', 'dificil') THEN 80
          ELSE 60
        END
      WHEN p_sentimento_atual IN ('positivo', 'muito_positivo') THEN
        CASE
          WHEN tr.dificuldade_percebida IN ('media', 'dificil') AND tr.sentimento_medio >= 0.50 THEN 100
          WHEN tr.dificuldade_percebida = 'muito_dificil' AND tr.sentimento_medio >= 0.60 THEN 90
          ELSE 70
        END
    END DESC,
    tr.score_recomendacao DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### 3. **Executar (RUN):**
   - Clicar em "RUN" ou "Executar"
   - Aguardar confirmação: "Success. No rows returned"

### 4. **Testar o N8N novamente:**
   - Executar o workflow
   - Verificar se o nó "4️⃣ Buscar Trilhas" funciona

---

## 🧪 TESTE RÁPIDO NO SUPABASE (OPCIONAL):

Após executar o fix, você pode testar diretamente no SQL Editor:

```sql
-- Testar a função (usar um user_id válido do seu banco)
SELECT * FROM buscar_trilhas_por_sentimento(
  'SEU_USER_ID_AQUI'::UUID,
  'negativo',
  3
);
```

---

## ✅ RESULTADO ESPERADO:

Se funcionar, você verá:
```
trilha_id | nome | descricao | sentimento_medio | dificuldade_percebida | ...
----------|------|-----------|------------------|----------------------|-----
uuid-1    | ...  | ...       | 0.75             | facil                | ...
uuid-2    | ...  | ...       | 0.80             | muito_facil          | ...
```

---

## 🎯 CHECKLIST:

- [ ] Abrir SQL Editor no Supabase
- [ ] Copiar e colar o SQL de correção
- [ ] Executar (RUN)
- [ ] Verificar "Success"
- [ ] Testar workflow no N8N
- [ ] Confirmar que o nó "4️⃣ Buscar Trilhas" funciona

---

**Execute agora e me avise o resultado!** 🚀

