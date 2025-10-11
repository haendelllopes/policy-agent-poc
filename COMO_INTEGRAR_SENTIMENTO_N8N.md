# 🔧 COMO INTEGRAR ANÁLISE DE SENTIMENTO NO SEU N8N

**Data:** 10/10/2025  
**Workflow Atual:** Flowly - Análise de Sentimento e Recomendação Inteligente

---

## 📊 ANÁLISE DO SEU WORKFLOW ATUAL

### ✅ O QUE VOCÊ JÁ TEM:
- ✅ Estrutura básica de análise de sentimento (final do workflow)
- ✅ Chamada para `/api/analise-sentimento`
- ✅ Busca de trilhas recomendadas
- ✅ Geração de resposta personalizada
- ✅ Envio via WhatsApp

### ⚠️ O QUE FALTA:
- ❌ Integração com o fluxo principal (WhatsApp Trigger, Telegram, Slack)
- ❌ Salvar sentimento no banco (`/api/sentimentos`)
- ❌ Alertas para sentimentos negativos
- ❌ Adaptação de tom mais robusta

---

## 🎯 OPÇÃO 1: INTEGRAÇÃO SIMPLES (RECOMENDADO)

### Passos para integrar no workflow existente:

#### 1. **Adicionar Análise de Sentimento ANTES do AI Agent**

No seu workflow atual, o fluxo é:
```
Merge → AI Agent → Code in JavaScript1 → Decide Canal1 → Send message
```

**Novo fluxo:**
```
Merge → 
  ├─ Analisar Sentimento → 
  ├─ Salvar Sentimento → 
  ├─ Verificar se Negativo → 
  │   ├─ (Se SIM) → Enviar Alerta RH
  │   └─ (Se NÃO) → Continuar
  ├─ Preparar Contexto com Sentimento →
  └─ AI Agent (com prompt adaptado) → ...
```

#### 2. **Criar os Nós Necessários**

**Nó 1: Analisar Sentimento**
```json
{
  "name": "Analisar Sentimento",
  "type": "n8n-nodes-base.httpRequest",
  "method": "POST",
  "url": "https://seu-projeto.vercel.app/api/analise-sentimento",
  "body": {
    "message": "={{ $('Merge').item.json.messageText }}",
    "userId": "={{ $('Merge').item.json.from }}",
    "context": "Mensagem via {{ $('Merge').item.json.channel }}",
    "tenantId": "={{ $('Merge').item.json.tenantId }}",
    "momentoOnboarding": "conversa_agente",
    "diaOnboarding": 1
  }
}
```

**Nó 2: Salvar Sentimento**
```json
{
  "name": "Salvar Sentimento",
  "type": "n8n-nodes-base.httpRequest",
  "method": "POST",
  "url": "https://seu-projeto.vercel.app/api/sentimentos",
  "body": {
    "colaborador_id": "={{ $('Merge').item.json.from }}",
    "sentimento": "={{ $('Analisar Sentimento').item.json.sentiment.sentimento }}",
    "intensidade": "={{ $('Analisar Sentimento').item.json.sentiment.intensidade }}",
    "origem": "={{ $('Merge').item.json.channel }}",
    "mensagem_analisada": "={{ $('Merge').item.json.messageText }}",
    "fatores_detectados": "={{ JSON.stringify($('Analisar Sentimento').item.json.sentiment.fatores_detectados) }}",
    "momento_onboarding": "conversa_agente",
    "dia_onboarding": 1
  }
}
```

**Nó 3: Verificar se Negativo**
```json
{
  "name": "É Sentimento Negativo?",
  "type": "n8n-nodes-base.if",
  "conditions": [
    {
      "leftValue": "={{ $('Analisar Sentimento').item.json.sentiment.sentimento }}",
      "operation": "regex",
      "rightValue": "negativo|muito_negativo"
    }
  ]
}
```

**Nó 4: Enviar Alerta RH (se negativo)**
```json
{
  "name": "Alerta RH - Sentimento Negativo",
  "type": "n8n-nodes-base.httpRequest",
  "method": "POST",
  "url": "https://seu-projeto.vercel.app/api/webhooks/alerta-sentimento-negativo",
  "body": {
    "colaborador_id": "={{ $('Merge').item.json.from }}",
    "sentimento": "={{ $('Analisar Sentimento').item.json.sentiment.sentimento }}",
    "intensidade": "={{ $('Analisar Sentimento').item.json.sentiment.intensidade }}",
    "mensagem": "={{ $('Merge').item.json.messageText }}",
    "canal": "={{ $('Merge').item.json.channel }}",
    "tenant_id": "={{ $('Merge').item.json.tenantId }}"
  }
}
```

#### 3. **Adaptar o AI Agent**

Modifique o `System Message` do `AI Agent` para incluir o sentimento:

```javascript
// No nó "AI Agent", altere o System Message para:

Você é o Flowly, assistente de onboarding.

**Análise de Sentimento do Colaborador:**
- Sentimento: {{ $('Analisar Sentimento').item.json.sentiment.sentimento }}
- Intensidade: {{ $('Analisar Sentimento').item.json.sentiment.intensidade }}
- Tom: {{ $('Analisar Sentimento').item.json.sentiment.fatores_detectados.tom }}

**IMPORTANTE: Adapte seu tom baseado no sentimento:**

Se MUITO_NEGATIVO:
- Seja EXTREMAMENTE empático
- Ofereça ajuda IMEDIATA
- Mostre que você se importa
- Diga: "Vejo que você está com dificuldades. Vamos resolver isso juntos! 💙"

Se NEGATIVO:
- Seja compreensivo
- Ofereça suporte
- Dê dicas práticas
- Diga: "Entendo sua frustração. Posso te ajudar com isso?"

Se NEUTRO:
- Mantenha tom profissional
- Seja claro e objetivo

Se POSITIVO:
- Seja motivador
- Reconheça o progresso
- Diga: "Muito bem! Você está indo ótimo! 👏"

Se MUITO_POSITIVO:
- Celebre com o colaborador
- Use emojis positivos
- Diga: "Incrível! Estou muito feliz com seu progresso! 🎉"

Responda sempre em português brasileiro, de forma natural e humana.
```

---

## 🚀 OPÇÃO 2: USAR O WORKFLOW MELHORADO (AVANÇADO)

Se quiser uma implementação mais completa, use o arquivo `N8N_WORKFLOW_SENTIMENTO_MELHORADO.json`:

### Vantagens:
- ✅ Adaptação de tom automática e robusta
- ✅ Sistema de alertas configurado
- ✅ Busca de trilhas baseada em sentimento
- ✅ Prompt dinâmico que muda baseado no sentimento

### Como usar:
1. Importe o `N8N_WORKFLOW_SENTIMENTO_MELHORADO.json` no N8N
2. Configure a URL do backend no nó `BACKEND_URL`
3. Conecte ao seu fluxo existente após o nó `Merge`
4. Conecte a saída do `5️⃣ Preparar Prompt Adaptado` ao `AI Agent`

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Backend (JÁ FEITO ✅)
- ✅ `/api/analise-sentimento` - Funcionando
- ✅ `/api/sentimentos` - Funcionando
- ✅ `/api/trilhas-recomendadas/:userId` - Funcionando

### Fase 2: N8N (FAZER AGORA)
- [ ] Adicionar nó "Analisar Sentimento" após Merge
- [ ] Adicionar nó "Salvar Sentimento"
- [ ] Adicionar nó "Verificar se Negativo"
- [ ] Adicionar nó "Alerta RH" (condicional)
- [ ] Modificar System Message do AI Agent
- [ ] Testar com mensagem positiva
- [ ] Testar com mensagem negativa
- [ ] Testar com mensagem neutra

### Fase 3: Endpoint de Alertas (NOVO)
- [ ] Criar `/api/webhooks/alerta-sentimento-negativo`
- [ ] Enviar email/notificação para RH
- [ ] Criar task de acompanhamento

---

## 🧪 COMO TESTAR

### 1. Teste com Sentimento POSITIVO:
```
Enviar via WhatsApp: "Adorei o sistema! Muito fácil de usar!"
```

**Resultado esperado:**
- ✅ Sentimento detectado: muito_positivo
- ✅ Salvo no banco
- ✅ AI responde com tom celebrativo
- ✅ Sem alertas

### 2. Teste com Sentimento NEGATIVO:
```
Enviar via WhatsApp: "Não estou entendendo nada, muito confuso :("
```

**Resultado esperado:**
- ✅ Sentimento detectado: negativo
- ✅ Salvo no banco
- ✅ Alerta enviado para RH
- ✅ AI responde com tom empático
- ✅ Sugere trilhas mais simples

### 3. Teste com Sentimento NEUTRO:
```
Enviar via WhatsApp: "Qual o prazo para completar a trilha?"
```

**Resultado esperado:**
- ✅ Sentimento detectado: neutro
- ✅ Salvo no banco
- ✅ AI responde com tom profissional
- ✅ Sem alertas

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### 1. Variáveis de Ambiente (Vercel)
```bash
DATABASE_URL=sua_connection_string
OPENAI_API_KEY=sua_chave_openai
GOOGLE_GEMINI_API_KEY=sua_chave_gemini (opcional)
```

### 2. URL do Backend no N8N
Substitua em todos os nós HTTP Request:
```
http://localhost:3000 → https://seu-projeto.vercel.app
```

### 3. Credenciais N8N
- ✅ Google Gemini API: Já configurada
- ✅ WhatsApp API: Já configurada
- ✅ Telegram API: Já configurada

---

## 📊 MÉTRICAS PARA ACOMPANHAR

Após implementar, monitore:

### Dashboard de Sentimentos (a criar):
- 📈 Evolução de sentimentos ao longo do tempo
- 🥧 Distribuição de sentimentos (% positivo, neutro, negativo)
- 🚨 Número de alertas gerados
- 👥 Colaboradores com sentimento negativo recorrente

### Logs do N8N:
- ✅ Taxa de sucesso das análises
- ⏱️ Tempo de resposta da API
- ❌ Erros de integração

---

## 🆘 TROUBLESHOOTING

### Problema 1: "Erro 500 ao analisar sentimento"
**Causa:** OpenAI API key expirada ou sem créditos  
**Solução:** 
1. Verificar saldo da OpenAI
2. O sistema fará fallback automático para Gemini
3. Se ambos falharem, usa análise simples

### Problema 2: "Sentimento não está sendo salvo"
**Causa:** Foreign key constraint (usuário não existe)  
**Solução:**
1. Verificar se o `colaborador_id` existe na tabela `users`
2. Criar usuário teste com `criar-usuario-teste.sql`

### Problema 3: "AI não adapta o tom"
**Causa:** System Message não foi atualizado  
**Solução:**
1. Copiar o novo System Message (acima)
2. Colar no nó "AI Agent"
3. Salvar workflow

---

## 🎯 PRÓXIMOS PASSOS APÓS IMPLEMENTAÇÃO

1. **Criar Dashboard de Sentimentos** (6-8h)
   - `public/admin-sentimentos.html`
   - Gráficos e estatísticas

2. **Implementar Notificações de Alertas** (2-3h)
   - Email para RH
   - WhatsApp para gestor

3. **Análise Periódica de Padrões** (4-6h)
   - Workflow agendado (1x/semana)
   - Identificar padrões de sentimentos negativos
   - Gerar sugestões de melhoria

4. **Documentação de API** (2h)
   - Swagger/OpenAPI
   - Exemplos de uso

---

## ✅ CONCLUSÃO

Seu workflow já está **65% pronto**! Falta apenas:

1. ✅ Integrar análise de sentimento no fluxo principal
2. ✅ Salvar no banco
3. ✅ Adicionar alertas

**Tempo estimado:** 2-3 horas de configuração no N8N

---

**Precisa de ajuda para implementar? Me avise!** 🚀

**Arquivos criados:**
- `N8N_WORKFLOW_SENTIMENTO_MELHORADO.json` - Workflow pronto para importar
- Este guia - Instruções passo a passo


