# 📡 Webhooks n8n - Sistema de Trilhas de Onboarding

Este documento descreve todos os webhooks disponíveis no sistema Flowly para integração com n8n e WhatsApp.

## 🔧 Configuração

Defina a variável de ambiente no Vercel:
```
N8N_WEBHOOK_URL=https://hndll.app.n8n.cloud/webhook/onboarding
```

## 📤 Webhooks Disponíveis

### 1. 🚀 Trilha Iniciada
**Endpoint:** `POST /api/webhooks/trilha-iniciada`

**Quando dispara:** Quando um colaborador inicia uma trilha de onboarding.

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "trilha_iniciada",
  "colaborador": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+5511999999999"
  },
  "trilha": {
    "id": "uuid",
    "nome": "Segurança da Informação",
    "prazo_dias": 7,
    "data_limite": "2025-10-16T12:30:00.000Z"
  },
  "mensagem_sugerida": "Olá João Silva! 👋\n\nVocê tem uma nova trilha..."
}
```

---

### 2. ✍️ Quiz Disponível
**Endpoint:** `POST /api/webhooks/quiz-disponivel`

**Quando dispara:** Quando o colaborador conclui todos os conteúdos e o quiz fica disponível.

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "quiz_disponivel",
  "colaborador": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+5511999999999"
  },
  "trilha": {
    "id": "uuid",
    "nome": "Segurança da Informação"
  },
  "mensagem_sugerida": "Parabéns João Silva! 🎉\n\nVocê concluiu todos os conteúdos..."
}
```

---

### 3. 🎉 Trilha Concluída
**Endpoint:** `POST /api/webhooks/trilha-concluida`

**Quando dispara:** Quando o colaborador é aprovado no quiz (≥60% de acerto).

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "trilha_concluida",
  "colaborador": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+5511999999999"
  },
  "trilha": {
    "id": "uuid",
    "nome": "Segurança da Informação"
  },
  "resultado": {
    "nota": 80,
    "pontos": 80
  },
  "mensagem_sugerida": "🎉🎉🎉 PARABÉNS João Silva!\n\nVocê concluiu a trilha..."
}
```

---

### 4. 🏆 Onboarding Completo
**Endpoint:** `POST /api/webhooks/onboarding-completo`

**Quando dispara:** Quando o colaborador conclui TODAS as trilhas do onboarding.

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "onboarding_completo",
  "colaborador": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+5511999999999"
  },
  "resultado": {
    "total_trilhas": 5,
    "pontuacao_total": 425,
    "ranking_geral": 3
  },
  "mensagem_sugerida": "🏆🏆🏆 INCRÍVEL João Silva!\n\nVocê concluiu TODAS as trilhas..."
}
```

---

### 5. ⚠️ Alerta de Atraso
**Endpoint:** `POST /api/webhooks/alerta-atraso`

**Quando dispara:** 
- Quando o endpoint `/api/admin/verificar-atrasos` é chamado (via cron job ou manualmente)
- Para trilhas com `data_limite` vencida e status `em_andamento` ou `aguardando_quiz`

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "alerta_atraso",
  "tipo_alerta": "atraso",
  "colaborador_nome": "João Silva",
  "trilha_nome": "Segurança da Informação",
  "dias_atraso": 3,
  "destinatario": {
    "email": "rh@empresa.com",
    "phone": "+5511988888888"
  },
  "mensagem_sugerida": "⚠️ ALERTA DE ATRASO\n\nColaborador: João Silva..."
}
```

---

### 6. 📉 Alerta de Nota Baixa
**Endpoint:** `POST /api/webhooks/alerta-nota-baixa`

**Quando dispara:** Quando o colaborador tira nota < 40% em um quiz.

**Payload:**
```json
{
  "timestamp": "2025-10-09T12:30:00.000Z",
  "tipo": "alerta_nota_baixa",
  "tipo_alerta": "nota_baixa",
  "colaborador_nome": "João Silva",
  "trilha_nome": "Segurança da Informação",
  "nota": 20,
  "tentativa": 2,
  "destinatario": {
    "email": "rh@empresa.com",
    "phone": "+5511988888888"
  },
  "mensagem_sugerida": "📉 ALERTA DE DESEMPENHO\n\nColaborador: João Silva..."
}
```

---

## 🔄 Fluxo Completo

```
1. 🚀 Colaborador inicia trilha
   → Webhook: trilha_iniciada
   → n8n envia mensagem WhatsApp com boas-vindas

2. 📖 Colaborador consome conteúdos
   (sem webhook)

3. ✅ Colaborador aceita todos os conteúdos
   → Webhook: quiz_disponivel
   → n8n envia link do quiz via WhatsApp

4a. ✅ Aprovado no quiz (≥60%)
    → Webhook: trilha_concluida
    → n8n envia parabéns + notifica que certificado será enviado

4b. ❌ Reprovado no quiz (<60%)
    → Se nota < 40%: Webhook: alerta_nota_baixa
    → n8n notifica RH
    → Colaborador pode tentar novamente

5. 🏆 Todas as trilhas concluídas
   → Webhook: onboarding_completo
   → n8n envia mensagem de conclusão total

6. ⚠️ Atraso detectado (cron job diário)
   → Webhook: alerta_atraso
   → n8n notifica RH via WhatsApp/Email
```

---

## 🤖 Cron Job para Alertas de Atraso

Recomendação: Criar um workflow n8n que chama o endpoint `/api/admin/verificar-atrasos` diariamente.

**Endpoint para chamada automática:**
```
POST https://navigator-gules.vercel.app/api/admin/verificar-atrasos?tenant=SUBDOMAIN
```

**Resposta:**
```json
{
  "message": "2 alertas de atraso enviados",
  "alertas": [
    {
      "colaborador": "João Silva",
      "trilha": "Segurança da Informação",
      "dias_atraso": 3
    }
  ]
}
```

---

## 📝 Notas Importantes

1. **Multi-tenancy:** Todos os webhooks incluem `?tenant=SUBDOMAIN` na query string
2. **Mensagens sugeridas:** Cada webhook inclui uma `mensagem_sugerida` que pode ser usada no n8n
3. **Telefones:** Os números de telefone já vêm formatados para WhatsApp (+55...)
4. **Erros de webhook não bloqueiam:** Se o webhook falhar, o sistema continua funcionando normalmente
5. **Logs:** Todos os webhooks geram logs no console do Vercel para debugging

---

## 🧪 Testando Webhooks

Para testar localmente:

1. Configure `N8N_WEBHOOK_URL` no `.env`
2. Inicie o servidor: `npm start`
3. Use Postman/Insomnia para chamar os endpoints diretamente
4. Verifique os logs no terminal

---

**Documentação criada em:** 09/10/2025  
**Versão:** 1.0  
**Produto:** Flowly (policy-agent-poc)

