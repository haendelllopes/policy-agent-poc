# 🎯 Recomendação Inteligente de Trilhas por Sentimento

**Data:** 10 de outubro de 2025  
**Melhoria Adicional:** Sistema de Recomendação Contextual

---

## 💡 Conceito

O agente deve recomendar trilhas considerando **dois fatores**:

1. **Sentimento atual do colaborador** (como ele está se sentindo agora)
2. **Sentimento médio da trilha** (como outros colaboradores se sentiram ao fazer essa trilha)

### Objetivo

**Ajudar o colaborador a ter sucesso**, sugerindo trilhas mais leves quando ele está desmotivado, e trilhas desafiadoras quando está confiante.

---

## 🎭 Cenários de Uso

### Cenário 1: Colaborador Desmotivado
```
Colaborador: "Tô achando muito difícil isso tudo..."
Sentimento detectado: 😞 muito_negativo (intensidade: 0.85)

Agente analisa:
- Trilha A: sentimento_medio = 0.72 (positivo) ✅ Geralmente bem avaliada
- Trilha B: sentimento_medio = 0.45 (negativo) ❌ Pessoal reclama muito
- Trilha C: sentimento_medio = 0.88 (muito_positivo) ✅ Pessoal AMA

Agente responde:
"Entendo que está difícil 💙
Que tal começar pela trilha 'Cultura da Empresa'? 
Ela é mais leve e o pessoal geralmente curte bastante! 
Depois você pega as outras com mais confiança 💪"
```

---

### Cenário 2: Colaborador Confiante
```
Colaborador: "Show! Terminei a primeira trilha, bora pra próxima!"
Sentimento detectado: 😄 muito_positivo (intensidade: 0.90)

Agente analisa:
- Trilha D: sentimento_medio = 0.55 (neutro), dificuldade_percebida = 'alta'
- Trilha E: sentimento_medio = 0.80 (positivo), dificuldade_percebida = 'média'

Agente responde:
"Muito bem! Você está arrasando! 🎉
Vejo que está confiante. Que tal encarar a trilha 
'Procedimentos Técnicos'? É um pouco mais desafiadora, 
mas acho que você tá pronto! 💪"
```

---

### Cenário 3: Trilha com Reputação Ruim
```
Agente detecta:
- Trilha "Compliance e Regulamentação"
- Sentimento médio: 0.35 (negativo)
- 15 colaboradores relataram: "muito longa", "difícil", "chata"

Agente PROATIVAMENTE sugere ao admin:
"🚨 Alerta: A trilha 'Compliance e Regulamentação' está 
com sentimento muito negativo (0.35/1.0).

Principais reclamações:
- "muito longa" (8 colaboradores)
- "conteúdo denso" (5 colaboradores)
- "exemplos confusos" (3 colaboradores)

💡 Sugestão: Dividir em módulos menores ou adicionar 
vídeos explicativos."
```

---

## 🗄️ Modificações no Banco de Dados

### 1. Adicionar colunas em `trilhas`

```sql
-- Adicionar métricas de sentimento à tabela trilhas
ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS sentimento_medio DECIMAL(3,2);
-- Valor de 0.00 a 1.00 (calculado a partir dos feedbacks)

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 0;
-- Quantas pessoas já deram feedback sobre esta trilha

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS dificuldade_percebida VARCHAR(20) 
  CHECK (dificuldade_percebida IN ('muito_facil', 'facil', 'media', 'dificil', 'muito_dificil'));
-- Calculada automaticamente baseada em feedbacks

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS tempo_medio_conclusao INTEGER;
-- Em dias - quanto tempo o pessoal leva em média

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS taxa_conclusao DECIMAL(5,2);
-- Porcentagem de pessoas que concluem (0.00 a 100.00)

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS recomendada_para_iniciantes BOOLEAN DEFAULT false;
-- Se é boa trilha para quem está começando

ALTER TABLE trilhas ADD COLUMN IF NOT EXISTS sentimento_atualizado_em TIMESTAMP WITH TIME ZONE;
-- Quando foi calculado pela última vez

-- Criar índice para queries de recomendação
CREATE INDEX IF NOT EXISTS idx_trilhas_sentimento ON trilhas(sentimento_medio DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_trilhas_dificuldade ON trilhas(dificuldade_percebida);

-- Comentários
COMMENT ON COLUMN trilhas.sentimento_medio IS 'Sentimento médio dos colaboradores sobre esta trilha (0.00 a 1.00)';
COMMENT ON COLUMN trilhas.dificuldade_percebida IS 'Dificuldade percebida calculada a partir de feedbacks';
COMMENT ON COLUMN trilhas.taxa_conclusao IS 'Porcentagem de colaboradores que concluem a trilha';
```

---

### 2. Criar view para trilhas recomendadas

```sql
CREATE OR REPLACE VIEW trilhas_recomendadas AS
SELECT 
  t.id,
  t.nome,
  t.descricao,
  t.sentimento_medio,
  t.dificuldade_percebida,
  t.taxa_conclusao,
  t.tempo_medio_conclusao,
  t.recomendada_para_iniciantes,
  
  -- Calcular score de recomendação (0-100)
  CASE
    WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 100
    WHEN t.sentimento_medio >= 0.70 AND t.taxa_conclusao >= 70 THEN 90
    WHEN t.sentimento_medio >= 0.60 AND t.taxa_conclusao >= 60 THEN 80
    WHEN t.sentimento_medio >= 0.50 AND t.taxa_conclusao >= 50 THEN 70
    ELSE 60
  END as score_recomendacao,
  
  -- Classificar nível de recomendação
  CASE
    WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 'altamente_recomendada'
    WHEN t.sentimento_medio >= 0.60 AND t.taxa_conclusao >= 60 THEN 'recomendada'
    WHEN t.sentimento_medio >= 0.40 THEN 'moderada'
    ELSE 'precisa_atencao'
  END as nivel_recomendacao,
  
  -- Contar feedbacks
  (SELECT COUNT(*) FROM colaborador_sentimentos cs WHERE cs.trilha_id = t.id) as total_feedbacks
  
FROM trilhas t
WHERE t.ativo = true;

COMMENT ON VIEW trilhas_recomendadas IS 'View com score de recomendação de trilhas baseado em sentimentos e conclusões';
```

---

## 📊 Função para Calcular Sentimento Médio da Trilha

```sql
CREATE OR REPLACE FUNCTION calcular_sentimento_trilha(p_trilha_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sentimento_medio DECIMAL(3,2);
  v_total_avaliacoes INTEGER;
  v_total_conclusoes INTEGER;
  v_total_tentativas INTEGER;
  v_tempo_medio INTEGER;
  v_dificuldade VARCHAR(20);
BEGIN
  -- Calcular sentimento médio (convertendo escala para 0.00-1.00)
  SELECT 
    AVG(CASE 
      WHEN cs.sentimento = 'muito_positivo' THEN 1.00
      WHEN cs.sentimento = 'positivo' THEN 0.75
      WHEN cs.sentimento = 'neutro' THEN 0.50
      WHEN cs.sentimento = 'negativo' THEN 0.25
      WHEN cs.sentimento = 'muito_negativo' THEN 0.00
    END),
    COUNT(*)
  INTO v_sentimento_medio, v_total_avaliacoes
  FROM colaborador_sentimentos cs
  WHERE cs.trilha_id = p_trilha_id
    AND cs.origem IN ('pos_trilha', 'durante_conversa', 'feedback_explicito');
  
  -- Calcular taxa de conclusão
  SELECT 
    COUNT(CASE WHEN ct.status = 'concluida' THEN 1 END),
    COUNT(*)
  INTO v_total_conclusoes, v_total_tentativas
  FROM colaborador_trilhas ct
  WHERE ct.trilha_id = p_trilha_id;
  
  -- Calcular tempo médio de conclusão
  SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (ct.data_conclusao - ct.data_inicio)) / 86400))
  INTO v_tempo_medio
  FROM colaborador_trilhas ct
  WHERE ct.trilha_id = p_trilha_id
    AND ct.status = 'concluida'
    AND ct.data_conclusao IS NOT NULL
    AND ct.data_inicio IS NOT NULL;
  
  -- Calcular dificuldade percebida
  -- Baseado em: sentimento médio + taxa de conclusão + tempo médio
  IF v_sentimento_medio >= 0.80 AND (v_total_conclusoes::DECIMAL / NULLIF(v_total_tentativas, 0)) >= 0.80 THEN
    v_dificuldade := 'muito_facil';
  ELSIF v_sentimento_medio >= 0.65 AND (v_total_conclusoes::DECIMAL / NULLIF(v_total_tentativas, 0)) >= 0.70 THEN
    v_dificuldade := 'facil';
  ELSIF v_sentimento_medio >= 0.45 THEN
    v_dificuldade := 'media';
  ELSIF v_sentimento_medio >= 0.30 THEN
    v_dificuldade := 'dificil';
  ELSE
    v_dificuldade := 'muito_dificil';
  END IF;
  
  -- Atualizar trilha
  UPDATE trilhas
  SET 
    sentimento_medio = v_sentimento_medio,
    total_avaliacoes = v_total_avaliacoes,
    dificuldade_percebida = v_dificuldade,
    tempo_medio_conclusao = v_tempo_medio,
    taxa_conclusao = (v_total_conclusoes::DECIMAL / NULLIF(v_total_tentativas, 0)) * 100,
    recomendada_para_iniciantes = (v_sentimento_medio >= 0.70 AND v_dificuldade IN ('muito_facil', 'facil')),
    sentimento_atualizado_em = NOW()
  WHERE id = p_trilha_id;
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_sentimento_trilha IS 'Calcula e atualiza métricas de sentimento de uma trilha';
```

---

## 🔄 Trigger para Atualizar Sentimento Automaticamente

```sql
-- Trigger para recalcular sentimento da trilha quando novo feedback chega
CREATE OR REPLACE FUNCTION trigger_atualizar_sentimento_trilha()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trilha_id IS NOT NULL THEN
    PERFORM calcular_sentimento_trilha(NEW.trilha_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_sentimento_trilha ON colaborador_sentimentos;
CREATE TRIGGER trigger_recalcular_sentimento_trilha
  AFTER INSERT OR UPDATE ON colaborador_sentimentos
  FOR EACH ROW
  WHEN (NEW.trilha_id IS NOT NULL)
  EXECUTE FUNCTION trigger_atualizar_sentimento_trilha();

-- Trigger para quando trilha é concluída
CREATE OR REPLACE FUNCTION trigger_trilha_concluida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    PERFORM calcular_sentimento_trilha(NEW.trilha_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trilha_conclusao ON colaborador_trilhas;
CREATE TRIGGER trigger_trilha_conclusao
  AFTER INSERT OR UPDATE ON colaborador_trilhas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trilha_concluida();
```

---

## 🤖 Lógica de Recomendação no N8N

### Query SQL para Buscar Trilhas Recomendadas

```sql
-- Buscar trilhas recomendadas baseado no sentimento do colaborador
SELECT 
  tr.id,
  tr.nome,
  tr.descricao,
  tr.sentimento_medio,
  tr.dificuldade_percebida,
  tr.taxa_conclusao,
  tr.tempo_medio_conclusao,
  tr.score_recomendacao,
  tr.nivel_recomendacao,
  
  -- Calcular compatibilidade com sentimento do colaborador
  CASE
    -- Colaborador muito negativo: trilhas fáceis e bem avaliadas
    WHEN $1 IN ('muito_negativo', 'negativo') THEN
      CASE
        WHEN tr.dificuldade_percebida IN ('muito_facil', 'facil') AND tr.sentimento_medio >= 0.70 THEN 100
        WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.75 THEN 80
        ELSE 50
      END
    
    -- Colaborador neutro: trilhas médias
    WHEN $1 = 'neutro' THEN
      CASE
        WHEN tr.dificuldade_percebida = 'media' AND tr.sentimento_medio >= 0.60 THEN 100
        WHEN tr.dificuldade_percebida IN ('facil', 'dificil') THEN 80
        ELSE 60
      END
    
    -- Colaborador positivo: pode encarar desafios
    WHEN $1 IN ('positivo', 'muito_positivo') THEN
      CASE
        WHEN tr.dificuldade_percebida IN ('media', 'dificil') AND tr.sentimento_medio >= 0.50 THEN 100
        WHEN tr.dificuldade_percebida = 'muito_dificil' AND tr.sentimento_medio >= 0.60 THEN 90
        ELSE 70
      END
  END as compatibilidade_sentimento
  
FROM trilhas_recomendadas tr
WHERE colaborador_tem_acesso_trilha($2, tr.id) = true -- Verifica segmentação cargo/dept
  AND tr.id NOT IN (
    SELECT trilha_id 
    FROM colaborador_trilhas 
    WHERE colaborador_id = $2 
      AND status IN ('concluida', 'em_andamento')
  ) -- Não sugerir trilhas já feitas ou em andamento
ORDER BY compatibilidade_sentimento DESC, tr.score_recomendacao DESC
LIMIT 3;

-- Parâmetros:
-- $1 = sentimento_atual do colaborador ('muito_negativo', 'negativo', 'neutro', 'positivo', 'muito_positivo')
-- $2 = id do colaborador
```

---

## 💬 Templates de Mensagens do Agente

### Para Colaborador Desmotivado (muito_negativo / negativo)

```javascript
// N8N - Node de Mensagem Adaptada
const trilhaRecomendada = $input.item.json.trilhas[0];
const sentimentoColab = $input.item.json.sentimento_atual;

const mensagens = {
  muito_negativo: `Entendo que está difícil 💙

Sei que você pode estar se sentindo sobrecarregado. 
Que tal começar pela trilha "${trilhaRecomendada.nome}"?

✨ Por que recomendo ela:
• Geralmente o pessoal acha mais leve (dificuldade: ${trilhaRecomendada.dificuldade_percebida})
• ${trilhaRecomendada.taxa_conclusao}% dos colaboradores conseguem completar
• Leva em média ${trilhaRecomendada.tempo_medio_conclusao} dias

Vamos com calma! Você consegue! 💪`,

  negativo: `Percebo que está um pouco desanimado 😊

Que tal uma trilha mais tranquila para recuperar a confiança?

Recomendo: "${trilhaRecomendada.nome}"
• Dificuldade: ${trilhaRecomendada.dificuldade_percebida}
• O pessoal geralmente curte bastante! (nota ${(trilhaRecomendada.sentimento_medio * 10).toFixed(1)}/10)

Quer tentar? 😊`
};

return mensagens[sentimentoColab] || mensagens.negativo;
```

---

### Para Colaborador Neutro

```javascript
const mensagens = {
  neutro: `Vejo que você está seguindo firme! 👍

Aqui vão algumas opções de trilhas que combinam com você:

1️⃣ ${trilhas[0].nome} (${trilhas[0].dificuldade_percebida})
   • ${trilhas[0].tempo_medio_conclusao} dias em média
   • Avaliação: ${(trilhas[0].sentimento_medio * 10).toFixed(1)}/10

2️⃣ ${trilhas[1].nome} (${trilhas[1].dificuldade_percebida})
   • ${trilhas[1].tempo_medio_conclusao} dias em média
   • Avaliação: ${(trilhas[1].sentimento_medio * 10).toFixed(1)}/10

Qual te interessa mais? 😊`
};
```

---

### Para Colaborador Confiante (positivo / muito_positivo)

```javascript
const mensagens = {
  muito_positivo: `Você está arrasando! 🎉🔥

Vejo que está confiante! Que tal um desafio?

💪 Recomendo: "${trilhaRecomendada.nome}"
• Nível: ${trilhaRecomendada.dificuldade_percebida}
• Vai te agregar muito conhecimento!
• ${trilhaRecomendada.taxa_conclusao}% dos colegas conseguiram completar

Topa o desafio? 😎`,

  positivo: `Muito bem! Você está indo super bem! 🌟

Próximas trilhas recomendadas:

${trilhas.map((t, i) => 
  `${i+1}️⃣ ${t.nome}
   • Dificuldade: ${t.dificuldade_percebida}
   • Avaliação do pessoal: ${(t.sentimento_medio * 10).toFixed(1)}/10`
).join('\n\n')}

Qual você quer fazer primeiro? 😊`
};
```

---

## 📊 Dashboard Admin - Insights de Trilhas

### Novas Métricas no Dashboard

```
┌───────────────────────────────────────────────────────────┐
│ 📊 Performance das Trilhas                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Trilha: "Compliance e Regulamentação"               │   │
│ │                                                       │   │
│ │ Sentimento Médio: 😟 3.5/10 (negativo)              │   │
│ │ Taxa de Conclusão: 45% ⚠️                           │   │
│ │ Dificuldade Percebida: Muito Difícil               │   │
│ │ Tempo Médio: 12 dias (prazo: 7 dias) ⚠️            │   │
│ │                                                       │   │
│ │ 🚨 ATENÇÃO: Trilha precisa de revisão                │   │
│ │                                                       │   │
│ │ Top Reclamações:                                     │   │
│ │ • "muito longa" (8x)                                │   │
│ │ • "conteúdo denso" (5x)                             │   │
│ │ • "exemplos confusos" (3x)                          │   │
│ │                                                       │   │
│ │ [Ver Detalhes] [Editar Trilha] [Ver Sugestões IA]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Trilha: "Cultura da Empresa"                        │   │
│ │                                                       │   │
│ │ Sentimento Médio: 😄 8.8/10 (muito positivo)       │   │
│ │ Taxa de Conclusão: 92% ✅                           │   │
│ │ Dificuldade Percebida: Fácil                        │   │
│ │ Tempo Médio: 3 dias (prazo: 5 dias) ✅             │   │
│ │                                                       │   │
│ │ ⭐ DESTAQUE: Trilha muito bem avaliada!              │   │
│ │                                                       │   │
│ │ Top Elogios:                                         │   │
│ │ • "adorei os vídeos" (12x)                          │   │
│ │ • "muito didático" (8x)                             │   │
│ │ • "rápido e objetivo" (6x)                          │   │
│ │                                                       │   │
│ │ 💡 Recomendada para iniciantes                       │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## ✅ Benefícios Adicionais

### 1. **Personalização Extrema**
- Cada colaborador recebe sugestões únicas
- Adaptação ao estado emocional em tempo real

### 2. **Aumento de Conclusão**
- Colaboradores desmotivados recebem trilhas mais fáceis
- Aumenta confiança e momentum

### 3. **Insights Automáticos**
- Trilhas problemáticas são identificadas automaticamente
- Gestores sabem exatamente o que melhorar

### 4. **Gamificação Natural**
- "Desbloqueie trilhas mais difíceis conforme progride"
- Senso de progressão e conquista

---

## 🎯 Implementação no Checklist

Adicionar à **Fase 2** (Análise de Sentimento):

### Tarefas Adicionais - Banco de Dados
- [ ] Adicionar colunas de sentimento em `trilhas`
- [ ] Criar view `trilhas_recomendadas`
- [ ] Criar função `calcular_sentimento_trilha()`
- [ ] Criar triggers automáticos

### Tarefas Adicionais - N8N
- [ ] Criar nó de recomendação de trilhas
- [ ] Implementar query de compatibilidade
- [ ] Criar templates de mensagens adaptadas
- [ ] Testar recomendações com diferentes sentimentos

### Tarefas Adicionais - Frontend
- [ ] Dashboard de performance de trilhas
- [ ] Visualização de sentimento médio por trilha
- [ ] Alertas de trilhas problemáticas
- [ ] Gráfico de dificuldade percebida

---

## 📝 Exemplo Completo de Conversa

```
[09:00] Colaborador: Bom dia!

[09:01] Flowly Bot: Bom dia, João! 😊
Como você está se sentindo hoje?

[09:02] Colaborador: Meio pra baixo... 
Tentei fazer aquela trilha de compliance mas tá muito difícil 😕

[09:03] Flowly Bot: 
Sentimento detectado: 😞 negativo (0.65)
Trilha anterior: Compliance (sentimento médio: 0.35 - difícil)

Entendo, João 💙

Vejo que você tentou a trilha de Compliance. 
Ela realmente é mais densa (muita gente acha difícil).

Que tal uma trilha mais leve para recuperar a energia?

✨ Recomendo: "Cultura da Empresa"
• Geralmente o pessoal ADORA (nota 8.8/10!)
• Tem vídeos curtos e dinâmicos
• Leva só 3 dias em média
• 92% dos colegas conseguem completar

Depois você volta pro Compliance com mais confiança! 💪

Quer começar?

[09:04] Colaborador: Boa! Vou fazer essa primeiro então

[09:05] Flowly Bot: Ótimo! Vou te mandar o link da trilha "Cultura da Empresa"

Tenho certeza que você vai gostar! 😊
Qualquer dúvida, é só chamar! 🚀

[2 dias depois...]

[11:00] Colaborador: Terminei a trilha de Cultura! Foi muito boa mesmo! 😄

[11:01] Flowly Bot:
Sentimento detectado: 😄 muito_positivo (0.92)
Trilha concluída: Cultura da Empresa
Tempo: 2 dias (abaixo da média!)

Que SHOW, João! 🎉🎉

Você terminou em 2 dias, mais rápido que a média!
Está arrasando! 🌟

Agora que você pegou confiança, quer voltar para o 
Compliance? Ou prefere outra trilha antes?

[11:02] Colaborador: Agora sim! Bora pro Compliance!

[11:03] Flowly Bot: Isso aí! Com essa energia você vai longe! 💪🔥

Aqui está a trilha de Compliance.
Lembrando: se tiver qualquer dúvida, é só chamar!

Sucesso! 🚀
```

---

## 💡 Valor Agregado

Esta funcionalidade transforma o Flowly em um **coach inteligente** que:

✅ **Entende** o estado emocional do colaborador  
✅ **Adapta** as recomendações ao momento  
✅ **Aumenta** taxa de conclusão  
✅ **Reduz** frustração e desistência  
✅ **Identifica** trilhas problemáticas automaticamente  
✅ **Melhora** experiência do usuário drasticamente  

---

**Criado por:** Haendell Lopes + AI Assistant  
**Data:** 10 de outubro de 2025  
**Status:** 💡 Proposta de Melhoria Adicional




