# Evolution API - Configuração

## URLs
- API: https://navigator-evolution-api.onrender.com
- Render Dashboard: https://dashboard.render.com

## Credenciais
- API Key: [Ver Render Dashboard → Environment → AUTHENTICATION_API_KEY]
- Instance Name: navigator-whatsapp

## Endpoints
- Health: GET /manager/health
- Connection State: GET /instance/connectionState/navigator-whatsapp
- Send Message: POST /message/sendText/navigator-whatsapp

## N8N
- Webhook: https://hndll.app.n8n.cloud/webhook/evolution-webhook
- Credential: Evolution API Navigator

## Comandos úteis

### Verificar status
```bash
curl https://navigator-evolution-api.onrender.com/instance/connectionState/navigator-whatsapp \
  -H "apikey: SUA-KEY"
```

### Reconectar WhatsApp (se desconectar)
```bash
curl https://navigator-evolution-api.onrender.com/instance/connect/navigator-whatsapp \
  -H "apikey: SUA-KEY"
```

### Enviar mensagem de teste
```bash
curl -X POST https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-KEY" \
  -d '{"number": "5562999404760", "text": "Teste"}'
```

### Criar instância WhatsApp
```bash
curl -X POST https://navigator-evolution-api.onrender.com/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-KEY" \
  -d '{
    "instanceName": "navigator-whatsapp",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": "https://hndll.app.n8n.cloud/webhook/evolution-webhook",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'
```

## Backend Endpoints

### Enviar mensagem via backend
```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/evolution/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+55 62 99940-4760",
    "message": "Teste via backend"
  }'
```

### Verificar status via backend
```bash
curl https://navigator-gules.vercel.app/api/webhooks/evolution/status
```

## Configuração N8N

### Credencial Evolution API
- Nome: Evolution API Navigator
- Tipo: HTTP Header Auth
- Header Name: apikey
- Header Value: [API Key do Render]

### Node HTTP Request para envio
- Method: POST
- URL: https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp
- Authentication: Evolution API Navigator
- Headers: Content-Type = application/json
- Body JSON:
```json
{
  "number": "={{ $json.phone.replace(/\D/g, '') }}",
  "text": "={{ $json.message || $json.mensagem_sugerida || $json.text }}"
}
```

### Webhook para receber mensagens
- Path: evolution-webhook
- Method: POST
- Authentication: None

### Code Node para processar mensagens recebidas
```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const data = item.json;
  
  // Evolution API envia evento MESSAGES_UPSERT
  if (data.key && data.message) {
    const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
    const messageText = data.message.conversation || 
                       data.message.extendedTextMessage?.text || 
                       '';
    
    if (messageText) {
      results.push({
        json: {
          from: phoneNumber,
          phone: phoneNumber,
          message: messageText,
          messageText: messageText,
          timestamp: data.messageTimestamp,
          messageId: data.key.id,
          type: 'whatsapp',
          source: 'evolution-api',
          raw: data
        }
      });
    }
  }
}

return results;
```

## Monitoramento

### Logs Render
- Dashboard → Logs para verificar erros
- Logs em tempo real durante desenvolvimento

### N8N Executions
- https://hndll.app.n8n.cloud/executions
- Filtrar por workflow "Evolution API - Receiver"

### Status WhatsApp
- Verificar conexão periodicamente
- Reconectar se necessário (comando acima)

## Troubleshooting

### Problema: Evolution API não responde
- Verificar logs no Render Dashboard
- Testar health endpoint: GET /manager/health

### Problema: WhatsApp desconectou
- Usar comando de reconexão
- Gerar novo QR Code se necessário

### Problema: Mensagens não chegam
- Verificar webhook configurado corretamente
- Verificar logs N8N executions
- Testar envio direto via API

### Problema: N8N não processa webhook
- Verificar se webhook está ativo
- Verificar formato da mensagem
- Verificar logs N8N executions

## Arquivos importantes
- `render.evolution.yaml` - Configuração Render
- `Dockerfile.evolution` - Dockerfile Evolution API
- `EVOLUTION_API_CREDENTIALS.txt` - Credenciais (não commitar)
- `qr-code-evolution.html` - QR Code temporário (não commitar)

## Variáveis de ambiente
```env
EVOLUTION_API_URL=https://navigator-evolution-api.onrender.com
EVOLUTION_API_KEY=SUA-API-KEY-DO-RENDER
EVOLUTION_INSTANCE_NAME=navigator-whatsapp
```


