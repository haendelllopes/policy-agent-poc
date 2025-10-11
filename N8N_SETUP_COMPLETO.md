# 🤖 Guia Completo: Configurar n8n para Flowly

Este guia vai te ajudar a configurar TODO o fluxo de onboarding no n8n, desde a criação das trilhas até o envio do certificado.

---

## 📋 Visão Geral dos Workflows

Você vai criar **3 workflows principais**:

1. **🎬 Workflow 1: Processar Conteúdo das Trilhas** (quando trilha é criada)
2. **📱 Workflow 2: Orquestração WhatsApp** (recebe webhooks e envia mensagens)
3. **⏰ Workflow 3: Verificação Diária de Atrasos** (cron job)

---

## 🎬 WORKFLOW 1: Processar Conteúdo das Trilhas

### Objetivo
Quando o RH cria uma trilha com conteúdos (PDFs, vídeos, links), o n8n deve:
- Baixar e transcrever os conteúdos
- Gerar contexto com IA para uso posterior
- Armazenar no banco de dados

### Nodes do Workflow:

```
┌─────────────────┐
│  1. Webhook     │ (Trigger)
│  Trilha Criada  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Loop pelos  │
│  Conteúdos      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Switch por  │
│  Tipo           │
└────┬────┬───┬───┘
     │    │   │
  PDF│ VID│URL│
     ▼    ▼   ▼
┌────────────────────────────────┐
│  4. Processar cada tipo        │
│  • PDF → Extrair texto         │
│  • Vídeo → Transcrever áudio   │
│  • URL → Scrape conteúdo       │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────┐
│  5. OpenAI      │
│  Gerar Resumo   │
│  + Contexto     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. Supabase    │
│  Salvar Contexto│
└─────────────────┘
```

---

### Configuração Detalhada:

#### ✅ Node 1: Webhook (Trigger)
- **Tipo:** Webhook
- **URL:** `https://hndll.app.n8n.cloud/webhook/processar-conteudo`
- **Método:** POST
- **Ativa em:** Produção

**Payload esperado:**
```json
{
  "trilha_id": "uuid",
  "trilha_nome": "Segurança da Informação",
  "conteudos": [
    {
      "id": "uuid",
      "tipo": "documento",
      "titulo": "Política de Senhas",
      "url": "https://storage.com/documento.pdf"
    },
    {
      "id": "uuid",
      "tipo": "video",
      "titulo": "Treinamento LGPD",
      "url": "https://youtube.com/watch?v=xyz"
    }
  ]
}
```

---

#### ✅ Node 2: Loop pelos Conteúdos
- **Node:** Loop Over Items
- **Campo:** `{{ $json.conteudos }}`

---

#### ✅ Node 3: Switch por Tipo
- **Node:** Switch
- **Regras:**
  - **Rota 1:** `{{ $json.tipo }} === 'documento'` → Processar PDF
  - **Rota 2:** `{{ $json.tipo }} === 'video'` → Processar Vídeo
  - **Rota 3:** `{{ $json.tipo }} === 'link_externo'` → Processar URL

---

#### ✅ Node 4a: Processar PDF
- **Node:** HTTP Request
- **Método:** GET
- **URL:** `{{ $json.url }}`
- **Response Format:** File

**Depois:**
- **Node:** Extract from File (PDF)
- **Action:** Extract Text

---

#### ✅ Node 4b: Processar Vídeo YouTube
- **Node:** HTTP Request para YouTube Transcript API
- **URL:** `https://www.youtube.com/watch?v={{ $json.url.split('v=')[1] }}`

**Alternativa simples:**
- Use a API do YouTube ou serviço de transcrição
- Ou apenas salve a URL e processe manualmente

---

#### ✅ Node 4c: Processar URL
- **Node:** HTTP Request
- **Método:** GET
- **URL:** `{{ $json.url }}`

**Depois:**
- **Node:** HTML Extract
- **Seletor:** `body` (ou selectores específicos)

---

#### ✅ Node 5: OpenAI - Gerar Resumo
- **Node:** OpenAI
- **Action:** Message a Model
- **Model:** gpt-4o-mini
- **Prompt:**
```
Você é um assistente de RH especializado em onboarding.

Analise o seguinte conteúdo da trilha "{{ $('Webhook').item.json.trilha_nome }}" - tópico "{{ $json.titulo }}":

CONTEÚDO:
{{ $json.texto_extraido }}

Sua tarefa:
1. Faça um resumo executivo (máx 200 palavras)
2. Liste os 5 pontos-chave mais importantes
3. Identifique 3 conceitos que devem ser testados em um quiz

Retorne em formato JSON:
{
  "resumo": "...",
  "pontos_chave": ["...", "...", "...", "...", "..."],
  "conceitos_quiz": ["...", "...", "..."]
}
```

---

#### ✅ Node 6: Supabase - Salvar Contexto
- **Node:** Supabase
- **Operation:** Insert
- **Tabela:** `trilha_conteudos`
- **Campos:**
  - `id`: `{{ $json.id }}`
  - `trilha_id`: `{{ $('Webhook').item.json.trilha_id }}`
  - `contexto_ia`: `{{ JSON.stringify($json.resultado_openai) }}`

**Nota:** Você pode criar uma coluna `contexto_ia` (JSONB) na tabela `trilha_conteudos` para armazenar isso.

---

## 📱 WORKFLOW 2: Orquestração WhatsApp

### Objetivo
Receber webhooks do sistema e enviar mensagens WhatsApp apropriadas.

### Nodes do Workflow:

```
┌─────────────────┐
│  1. Webhook     │ (Trigger)
│  Onboarding     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Switch      │
│  Tipo Webhook   │
└─┬─┬─┬─┬─┬──────┘
  │ │ │ │ │
  1 2 3 4 5
  │ │ │ │ │
  ▼ ▼ ▼ ▼ ▼
┌──────────────────────────────┐
│  3. Enviar Mensagem WhatsApp │
│  (com mensagem específica)   │
└──────────────────────────────┘
```

---

### Configuração Detalhada:

#### ✅ Node 1: Webhook Onboarding
- **Tipo:** Webhook
- **URL:** `https://hndll.app.n8n.cloud/webhook/onboarding`
- **Método:** POST
- **Ativa em:** Produção

---

#### ✅ Node 2: Switch por Tipo
- **Node:** Switch
- **Campo:** `{{ $json.tipo }}`
- **Rotas:**
  1. `trilha_iniciada`
  2. `quiz_disponivel`
  3. `trilha_concluida`
  4. `onboarding_completo`
  5. `alerta_atraso`
  6. `alerta_nota_baixa`

---

#### ✅ Node 3a: WhatsApp - Trilha Iniciada
- **Node:** HTTP Request (ou WhatsApp Business API)
- **Método:** POST
- **URL:** `https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages`
- **Headers:**
  - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
  - `Content-Type`: `application/json`

**Body:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.colaborador.phone.replace('+', '') }}",
  "type": "text",
  "text": {
    "body": "{{ $json.mensagem_sugerida }}"
  }
}
```

**Alternativa sem WhatsApp Business:**
Use a API do Twilio, Evolution API, ou outro gateway WhatsApp.

---

#### ✅ Nodes 3b-3f: Repetir para outros tipos
Repita a estrutura acima para cada tipo de webhook, usando sempre `{{ $json.mensagem_sugerida }}`.

---

#### ✅ Node Extra: Enviar Email (para alertas de RH)
Para `alerta_atraso` e `alerta_nota_baixa`:

- **Node:** Send Email
- **To:** `{{ $json.destinatario.email }}`
- **Subject:** `⚠️ Alerta Onboarding - {{ $json.colaborador_nome }}`
- **Body:** `{{ $json.mensagem_sugerida }}`

---

## ⏰ WORKFLOW 3: Verificação Diária de Atrasos

### Objetivo
Todo dia às 9h da manhã, verificar trilhas atrasadas e enviar alertas.

### Nodes do Workflow:

```
┌─────────────────┐
│  1. Cron        │ (Trigger)
│  Todo dia 9h    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. HTTP Request│
│  Verificar      │
│  Atrasos        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Log Result  │
│  (opcional)     │
└─────────────────┘
```

---

### Configuração Detalhada:

#### ✅ Node 1: Schedule Trigger
- **Node:** Schedule Trigger
- **Intervalo:** Cron
- **Expressão Cron:** `0 9 * * *` (todo dia às 9h)
- **Timezone:** America/Sao_Paulo

---

#### ✅ Node 2: HTTP Request - Verificar Atrasos
- **Node:** HTTP Request
- **Método:** POST
- **URL:** `https://navigator-gules.vercel.app/api/admin/verificar-atrasos?tenant=SUBDOMAIN`

**Nota:** Se você tem múltiplos tenants, adicione um loop aqui.

---

#### ✅ Node 3: IF - Tem Alertas?
- **Node:** IF
- **Condição:** `{{ $json.alertas.length > 0 }}`

**Se SIM:**
- Enviar notificação resumo para o RH (opcional)

---

## 🎓 WORKFLOW EXTRA: Gerar Certificado PDF

### Objetivo
Quando uma trilha é concluída, gerar e enviar certificado por email.

### Nodes do Workflow:

```
┌─────────────────┐
│  1. Webhook     │
│  Trilha         │
│  Concluída      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Gerar PDF   │
│  (HTML to PDF)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Enviar      │
│  Email c/ PDF   │
└─────────────────┘
```

---

### Configuração Detalhada:

#### ✅ Node 1: Webhook (já existe no Workflow 2)
Adicione uma nova rota no Switch para `trilha_concluida`.

---

#### ✅ Node 2: HTML to PDF
- **Node:** HTML to PDF (ou HTTP Request para serviço externo)

**Template HTML do Certificado:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificado {
      background: white;
      padding: 60px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    h1 { color: #667eea; font-size: 48px; margin: 0; }
    h2 { color: #764ba2; font-size: 32px; }
    .nome { font-size: 36px; color: #333; font-weight: bold; margin: 30px 0; }
    .info { font-size: 18px; color: #666; margin: 10px 0; }
    .assinatura { margin-top: 60px; border-top: 2px solid #667eea; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="certificado">
    <h1>🎓 CERTIFICADO</h1>
    <h2>de Conclusão</h2>
    
    <p class="info">Certificamos que</p>
    <p class="nome">{{ $json.colaborador.nome }}</p>
    <p class="info">concluiu com êxito a trilha</p>
    <p class="nome">{{ $json.trilha.nome }}</p>
    
    <p class="info">com aproveitamento de <strong>{{ $json.resultado.nota }}%</strong></p>
    <p class="info">em {{ new Date().toLocaleDateString('pt-BR') }}</p>
    
    <div class="assinatura">
      <p class="info">Flowly - Sistema de Onboarding</p>
    </div>
  </div>
</body>
</html>
```

**Serviços para converter HTML → PDF:**
- **PDFShift:** https://pdfshift.io
- **HTML2PDF:** https://html2pdf.com
- **CloudConvert:** https://cloudconvert.com

---

#### ✅ Node 3: Send Email
- **Node:** Send Email
- **To:** `{{ $json.colaborador.email }}`
- **Subject:** `🎉 Parabéns! Certificado da trilha {{ $json.trilha.nome }}`
- **Attachments:** `{{ $binary.data }}`

**Body do Email:**
```
Olá {{ $json.colaborador.nome }}!

Parabéns pela conclusão da trilha "{{ $json.trilha.nome }}"! 🎉

Você obteve {{ $json.resultado.nota }}% de aproveitamento e ganhou {{ $json.resultado.pontos }} pontos!

Seu certificado está anexado neste email.

Continue assim! 💪

---
Equipe Flowly
```

---

## 🔧 Configurações Necessárias

### No n8n:

1. **Credentials:**
   - OpenAI API Key
   - Supabase URL + API Key
   - WhatsApp API Token (ou Twilio, Evolution API)
   - SMTP para envio de emails

2. **Variáveis de Ambiente:**
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=seu-service-role-key
   OPENAI_API_KEY=sk-...
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_ID=...
   ```

### No Vercel (Flowly):

Adicione a variável:
```
N8N_WEBHOOK_URL=https://hndll.app.n8n.cloud/webhook/onboarding
```

---

## 🧪 Testando os Workflows

### 1. Testar Webhook Manualmente
Use o Postman ou curl:

```bash
curl -X POST https://hndll.app.n8n.cloud/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "trilha_iniciada",
    "colaborador": {
      "nome": "Teste",
      "phone": "+5511999999999"
    },
    "mensagem_sugerida": "Olá! Teste de mensagem"
  }'
```

### 2. Testar Cron Job
No n8n, clique em "Execute Workflow" manualmente.

---

## 📊 Fluxo Completo End-to-End

```
1. RH cria trilha no admin-trilhas.html
   ↓
2. Frontend chama webhook do n8n (processar-conteudo)
   ↓
3. n8n processa PDFs/vídeos e gera contexto com OpenAI
   ↓
4. Colaborador é atribuído à trilha
   ↓
5. Colaborador inicia trilha → Webhook "trilha_iniciada"
   ↓
6. n8n envia WhatsApp: "Olá! Você tem uma nova trilha..."
   ↓
7. Colaborador lê conteúdos e aceita
   ↓
8. Todos aceitos → Webhook "quiz_disponivel"
   ↓
9. n8n envia WhatsApp: "Parabéns! Faça o quiz..."
   ↓
10. Colaborador faz quiz → Sistema usa contexto do n8n para gerar questões
   ↓
11. Se aprovado → Webhook "trilha_concluida"
   ↓
12. n8n gera PDF do certificado e envia por email
   ↓
13. Todas trilhas completas → Webhook "onboarding_completo"
   ↓
14. n8n envia WhatsApp de parabéns final
   ↓
15. Todo dia 9h → Cron verifica atrasos → Alertas para RH
```

---

## 🎯 Próximos Passos

1. **Criar conta no n8n** (se ainda não tiver)
2. **Importar/criar Workflow 2** (WhatsApp) primeiro - é o mais simples
3. **Testar** enviando webhooks manualmente
4. **Criar Workflow 3** (Cron de atrasos)
5. **Criar Workflow 1** (Processar conteúdo) - mais complexo
6. **Adicionar Workflow de Certificados**

---

## 📚 Recursos Úteis

- **n8n Docs:** https://docs.n8n.io
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp
- **Twilio WhatsApp:** https://www.twilio.com/whatsapp
- **Evolution API:** https://evolution-api.com (API WhatsApp brasileira)
- **HTML to PDF Services:** PDFShift, CloudConvert, API2PDF

---

**Criado em:** 09/10/2025  
**Por:** Flowly Assistant  
**Versão:** 1.0





