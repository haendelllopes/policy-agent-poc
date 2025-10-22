# 🚀 SUPABASE EDGE FUNCTION: Generate Embedding

## 📋 **DESCRIÇÃO**
Função serverless no Supabase para gerar embeddings usando OpenAI API.

## 🔧 **CONFIGURAÇÃO**

### **1. Instalar Supabase CLI**
```bash
npm install -g supabase
```

### **2. Login no Supabase**
```bash
supabase login
```

### **3. Configurar Variáveis de Ambiente**
```bash
# Configurar OpenAI API Key no Supabase
supabase secrets set OPENAI_API_KEY=sua_openai_api_key_aqui
```

### **4. Deploy da Função**
```bash
# Deploy da função
supabase functions deploy generate-embedding

# Verificar deploy
supabase functions list
```

## 🌐 **ENDPOINT**

### **URL:**
```
https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding
```

### **Método:** `POST`

### **Headers:**
```json
{
  "Authorization": "Bearer SUA_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}
```

### **Body:**
```json
{
  "text": "Texto para gerar embedding"
}
```

### **Response (Sucesso):**
```json
{
  "success": true,
  "embedding": [0.1, 0.2, 0.3, ...],
  "text": "Texto original",
  "model": "text-embedding-ada-002",
  "dimensions": 1536,
  "timestamp": "2025-10-22T20:30:00.000Z"
}
```

### **Response (Erro):**
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "timestamp": "2025-10-22T20:30:00.000Z"
}
```

## 🧪 **TESTE**

### **Teste Local:**
```bash
node teste-supabase-embedding-function.js
```

### **Teste Manual:**
```bash
curl -X POST \
  https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding \
  -H "Authorization: Bearer SUA_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste de embedding"}'
```

## 🔗 **INTEGRAÇÃO COM N8N**

### **Configuração do Nó HTTP Request:**
- **URL:** `https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding`
- **Método:** `POST`
- **Headers:** 
  - `Authorization: Bearer SUA_SUPABASE_ANON_KEY`
  - `Content-Type: application/json`
- **Body:** `{"text": "{{ $json.conteudo_extraido }}"}`

## 📊 **MONITORAMENTO**

### **Logs da Função:**
```bash
supabase functions logs generate-embedding
```

### **Métricas:**
- Acesse o Supabase Dashboard
- Vá em Functions → generate-embedding
- Visualize logs e métricas

## 🔒 **SEGURANÇA**

### **Variáveis de Ambiente:**
- ✅ `OPENAI_API_KEY` - Configurada no Supabase
- ✅ `SUPABASE_ANON_KEY` - Usada no N8N

### **CORS:**
- ✅ Configurado para aceitar requisições do N8N
- ✅ Headers apropriados configurados

## 🚀 **DEPLOY RÁPIDO**

### **Comando Único:**
```bash
# Deploy completo
supabase functions deploy generate-embedding && \
supabase secrets set OPENAI_API_KEY=sua_openai_api_key_aqui && \
node teste-supabase-embedding-function.js
```

## 📝 **NOTAS**

- **Modelo:** `text-embedding-ada-002` (1536 dimensões)
- **Limite:** Sem limite específico (depende do OpenAI)
- **Latência:** ~1-3 segundos por requisição
- **Custo:** Baseado no uso do OpenAI API

## 🔧 **TROUBLESHOOTING**

### **Erro 401:**
- Verificar se `SUPABASE_ANON_KEY` está correta

### **Erro 500:**
- Verificar se `OPENAI_API_KEY` está configurada
- Verificar logs da função

### **Erro 400:**
- Verificar se o campo `text` está sendo enviado
- Verificar se o texto não está vazio

## ✅ **STATUS**

- [x] Função criada
- [x] Código implementado
- [x] Testes criados
- [x] Documentação criada
- [ ] Deploy realizado
- [ ] Teste de integração
- [ ] Configuração no N8N
