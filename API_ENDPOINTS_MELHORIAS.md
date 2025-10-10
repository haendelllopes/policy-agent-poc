# 📡 API Endpoints - Melhorias Flowly

**Criado em:** 10 de outubro de 2025  
**Versão:** 1.0

---

## 🎯 Índice de Endpoints

1. [Sentimentos](#-sentimentos)
2. [Trilhas Recomendadas](#-trilhas-recomendadas)
3. [Anotações do Agente](#-anotações-do-agente)

---

## 💚 Sentimentos

### POST `/api/sentimentos`
Registrar um novo sentimento do colaborador.

**Body:**
```json
{
  "colaborador_id": "uuid",
  "sentimento": "positivo",
  "intensidade": 0.75,
  "origem": "durante_conversa",
  "mensagem_analisada": "Estou gostando muito dessa trilha!",
  "fatores_detectados": {
    "palavras_chave": ["gostando", "muito"],
    "tom": "animado",
    "emojis": []
  },
  "trilha_id": "uuid",
  "momento_onboarding": "meio",
  "dia_onboarding": 5,
  "acao_agente": "mudou_tom",
  "resposta_adaptada": "Que ótimo! Continue assim!"
}
```

**Sentimentos válidos:** `muito_positivo`, `positivo`, `neutro`, `negativo`, `muito_negativo`

**Origens válidas:** `primeiro_contato`, `durante_conversa`, `pos_trilha`, `pos_quiz`, `feedback_explicito`, `analise_automatica`

---

### GET `/api/sentimentos/colaborador/:userId`
Buscar histórico de sentimentos de um colaborador.

**Query params:**
- `limit` (opcional): número de resultados (padrão: 50)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "colaborador_id": "uuid",
    "sentimento": "positivo",
    "intensidade": 0.75,
    "origem": "durante_conversa",
    "mensagem_analisada": "...",
    "trilha_id": "uuid",
    "trilha_nome": "Cultura da Empresa",
    "created_at": "2025-10-10T..."
  }
]
```

---

### GET `/api/sentimentos/colaborador/:userId/atual`
Buscar sentimento atual do colaborador.

**Resposta:**
```json
{
  "sentimento_atual": "positivo",
  "sentimento_atualizado_em": "2025-10-10T..."
}
```

---

### GET `/api/sentimentos/estatisticas/:tenantId`
Estatísticas agregadas de sentimentos.

**Query params:**
- `dias` (opcional): período em dias (padrão: 30)

**Resposta:**
```json
{
  "distribuicao": [
    {
      "sentimento": "muito_positivo",
      "total": 150,
      "intensidade_media": 0.85,
      "colaboradores_unicos": 45
    }
  ],
  "sentimento_medio": "4.2",
  "periodo_dias": 30
}
```

---

### GET `/api/sentimentos/trilha/:trilhaId`
Sentimentos sobre uma trilha específica.

**Resposta:**
```json
[
  {
    "sentimento": "positivo",
    "total": 25,
    "intensidade_media": 0.72
  }
]
```

---

### GET `/api/sentimentos/alertas/:tenantId`
Colaboradores com sentimento negativo (últimos 7 dias).

**Resposta:**
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "sentimento_atual": "muito_negativo",
    "sentimento_atualizado_em": "2025-10-10T...",
    "mensagem_analisada": "Tá muito difícil...",
    "ultimo_registro": "2025-10-10T..."
  }
]
```

---

## 🎯 Trilhas Recomendadas

### GET `/api/trilhas-recomendadas/:userId`
Buscar trilhas recomendadas para um colaborador baseado em seu sentimento.

**Query params:**
- `limit` (opcional): número de trilhas (padrão: 3)

**Resposta:**
```json
{
  "sentimento_atual": "negativo",
  "total": 3,
  "trilhas": [
    {
      "trilha_id": "uuid",
      "nome": "Cultura da Empresa",
      "descricao": "...",
      "sentimento_medio": 0.88,
      "dificuldade_percebida": "facil",
      "taxa_conclusao": 92.00,
      "tempo_medio_conclusao": 3,
      "score_recomendacao": 100,
      "compatibilidade_sentimento": 100,
      "motivo_recomendacao": "Trilha mais leve para recuperar confiança"
    }
  ]
}
```

---

### GET `/api/trilhas-recomendadas/metricas/:trilhaId`
Métricas completas de uma trilha.

**Resposta:**
```json
{
  "id": "uuid",
  "nome": "Cultura da Empresa",
  "descricao": "...",
  "sentimento_medio": 0.88,
  "dificuldade_percebida": "facil",
  "taxa_conclusao": 92.50,
  "tempo_medio_conclusao": 3,
  "total_avaliacoes": 48,
  "recomendada_para_iniciantes": true,
  "sentimento_atualizado_em": "2025-10-10T...",
  "total_feedbacks": 52,
  "total_conclusoes": 46,
  "total_em_andamento": 4,
  "distribuicao_sentimentos": [
    {
      "sentimento": "muito_positivo",
      "quantidade": 30
    },
    {
      "sentimento": "positivo",
      "quantidade": 18
    }
  ]
}
```

---

### GET `/api/trilhas-recomendadas/ranking/:tenantId`
Ranking de trilhas do tenant.

**Query params:**
- `orderBy` (opcional): `sentimento`, `conclusao` ou `score` (padrão: sentimento)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "nome": "Cultura da Empresa",
    "sentimento_medio": 0.88,
    "taxa_conclusao": 92.50,
    "score_recomendacao": 100,
    "nivel_recomendacao": "altamente_recomendada"
  }
]
```

---

### POST `/api/trilhas-recomendadas/recalcular/:trilhaId`
Forçar recálculo das métricas de uma trilha.

**Resposta:**
```json
{
  "success": true,
  "message": "Métricas recalculadas com sucesso",
  "metricas": {
    "sentimento_medio": 0.88,
    "dificuldade_percebida": "facil",
    "taxa_conclusao": 92.50,
    "tempo_medio_conclusao": 3,
    "total_avaliacoes": 48,
    "sentimento_atualizado_em": "2025-10-10T..."
  }
}
```

---

### GET `/api/trilhas-recomendadas/problematicas/:tenantId`
Trilhas que precisam de atenção (sentimento < 0.50 ou conclusão < 50%).

**Resposta:**
```json
[
  {
    "id": "uuid",
    "nome": "Compliance e Regulamentação",
    "sentimento_medio": 0.35,
    "taxa_conclusao": 45.00,
    "nivel_recomendacao": "precisa_atencao",
    "feedbacks_negativos_recentes": [
      {
        "mensagem_analisada": "Muito longa essa trilha",
        "sentimento": "negativo",
        "created_at": "2025-10-09T..."
      }
    ]
  }
]
```

---

## 📝 Anotações do Agente

### POST `/api/anotacoes`
Criar nova anotação do agente.

**Body:**
```json
{
  "colaborador_id": "uuid",
  "trilha_id": "uuid",
  "tipo": "sentimento_trilha",
  "titulo": "Colaborador achou trilha longa",
  "anotacao": "João mencionou que a trilha tem muito conteúdo...",
  "sentimento": "negativo",
  "intensidade_sentimento": 0.65,
  "contexto": {
    "conversa_id": "conv-123",
    "momento_onboarding": "dia_3"
  },
  "tags": ["prazo", "volume_conteudo", "rh"]
}
```

**Tipos válidos:** `sentimento_trilha`, `sentimento_empresa`, `dificuldade_conteudo`, `sugestao_colaborador`, `padrao_identificado`, `observacao_geral`

---

### GET `/api/anotacoes/:tenantId`
Listar anotações do tenant.

**Query params:**
- `tipo` (opcional): filtrar por tipo
- `relevante` (opcional): `true` ou `false` (padrão: true)
- `limit` (opcional): número de resultados (padrão: 50)
- `offset` (opcional): offset para paginação (padrão: 0)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "tipo": "sentimento_trilha",
    "titulo": "Colaborador achou trilha longa",
    "anotacao": "...",
    "sentimento": "negativo",
    "tags": ["prazo", "volume_conteudo"],
    "colaborador_nome": "João Silva",
    "trilha_nome": "RH - Políticas",
    "relevante": true,
    "gerou_melhoria": false,
    "created_at": "2025-10-10T..."
  }
]
```

---

### GET `/api/anotacoes/padroes/:tenantId`
Identificar padrões nas anotações.

**Query params:**
- `dias` (opcional): período em dias (padrão: 30)
- `minOcorrencias` (opcional): mínimo de ocorrências (padrão: 3)

**Resposta:**
```json
{
  "periodo_dias": 30,
  "min_ocorrencias": 3,
  "padroes": [
    {
      "tipo": "sentimento_trilha",
      "tag": "volume_conteudo",
      "frequencia": 8,
      "sentimento_medio": 2.5,
      "trilhas_afetadas": ["uuid1", "uuid2"],
      "ultimos_titulos": [
        "Trilha muito longa",
        "Muito conteúdo para absorver"
      ]
    }
  ]
}
```

---

### GET `/api/anotacoes/colaborador/:userId`
Anotações de um colaborador específico.

---

### GET `/api/anotacoes/trilha/:trilhaId`
Anotações sobre uma trilha específica.

---

### PUT `/api/anotacoes/:id/marcar-melhoria`
Marcar anotação como tendo gerado uma melhoria.

**Body:**
```json
{
  "improvement_id": "uuid"
}
```

---

### PUT `/api/anotacoes/:id/relevancia`
Alterar relevância de uma anotação.

**Body:**
```json
{
  "relevante": false
}
```

---

### GET `/api/anotacoes/estatisticas/:tenantId`
Estatísticas de anotações (últimos 30 dias).

**Resposta:**
```json
[
  {
    "tipo": "sentimento_trilha",
    "total": 45,
    "relevantes": 38,
    "geraram_melhoria": 5,
    "sentimento_medio": 3.2
  }
]
```

---

## 🧪 Exemplos de Uso

### Fluxo Completo: Capturar Sentimento e Recomendar Trilha

```javascript
// 1. Colaborador envia mensagem
const mensagem = "Tá muito difícil essa trilha...";

// 2. Análise de sentimento (via Gemini - próximo passo)
const sentimentoAnalisado = {
  sentimento: "negativo",
  intensidade: 0.75,
  fatores_detectados: {
    palavras_chave: ["difícil"],
    tom: "frustrado",
    emojis: []
  }
};

// 3. Registrar sentimento
const responseSentimento = await fetch('http://localhost:3000/api/sentimentos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    colaborador_id: 'user-uuid',
    sentimento: sentimentoAnalisado.sentimento,
    intensidade: sentimentoAnalisado.intensidade,
    origem: 'durante_conversa',
    mensagem_analisada: mensagem,
    fatores_detectados: sentimentoAnalisado.fatores_detectados,
    acao_agente: 'ofereceu_ajuda'
  })
});

// 4. Buscar trilhas recomendadas
const responseTrilhas = await fetch('http://localhost:3000/api/trilhas-recomendadas/user-uuid');
const { trilhas } = await responseTrilhas.json();

// 5. Agente sugere trilha mais leve
console.log(trilhas[0]); // Trilha com alta compatibilidade para sentimento negativo

// 6. Criar anotação
await fetch('http://localhost:3000/api/anotacoes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    colaborador_id: 'user-uuid',
    tipo: 'dificuldade_conteudo',
    titulo: 'Colaborador relatou dificuldade',
    anotacao: `Colaborador disse: "${mensagem}"`,
    sentimento: 'negativo',
    intensidade_sentimento: 0.75,
    tags: ['dificuldade', 'suporte']
  })
});
```

---

## 🔒 Segurança

- Todas as rotas respeitam o `tenant_id` do usuário
- RLS (Row Level Security) ativo no Supabase
- Validações de entrada em todos os endpoints
- Parâmetros obrigatórios validados

---

## 📊 Status Codes

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Requisição inválida (parâmetros incorretos)
- **404** - Recurso não encontrado
- **500** - Erro interno do servidor

---

**Criado por:** Haendell Lopes + AI Assistant  
**Base URL:** `http://localhost:3000/api`  
**Produção:** `https://seu-dominio.com/api`



