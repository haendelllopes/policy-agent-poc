# 🚀 DEPLOY MANUAL DA SUPABASE EDGE FUNCTION

## ⚠️ **PROBLEMA IDENTIFICADO:**
O Supabase CLI está com problemas no Windows. Vamos fazer o deploy manualmente via Dashboard.

## 🔧 **SOLUÇÃO ALTERNATIVA:**

### **1. Acessar Supabase Dashboard:**
```
https://supabase.com/dashboard/project/gxqwfltteimexngybwna
```

### **2. Ir para Edge Functions:**
- No menu lateral: **Edge Functions**
- Clicar em **Create a new function**

### **3. Configurar a Função:**
- **Name:** `generate-embedding`
- **Template:** `Blank`

### **4. Copiar o Código:**
Copie o conteúdo do arquivo `supabase/functions/generate-embedding/index.ts` para o editor.

### **5. Configurar Variáveis de Ambiente:**
- **Settings** → **Edge Functions** → **Environment Variables**
- Adicionar: `OPENAI_API_KEY` = sua chave OpenAI

### **6. Deploy:**
- Clicar em **Deploy**

## 🧪 **TESTE APÓS DEPLOY:**

### **URL da Função:**
```
https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding
```

### **Teste Manual:**
```bash
curl -X POST \
  https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding \
  -H "Authorization: Bearer SUA_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste de embedding"}'
```

## 🔧 **CONFIGURAÇÃO NO N8N:**

### **Nó "Gerar Embeddings":**
- **URL:** `https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding`
- **Método:** `POST`
- **Headers:**
  ```json
  {
    "Authorization": "Bearer SUA_SUPABASE_ANON_KEY",
    "Content-Type": "application/json"
  }
  ```
- **Body:**
  ```json
  {
    "text": "{{ $json.conteudo_extraido }}"
  }
  ```

## 📋 **CÓDIGO DA FUNÇÃO:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Obter dados do body
    const { text } = await req.json()
    
    if (!text) {
      return new Response('Text is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Verificar se OpenAI API Key está configurada
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    console.log(`🔍 Gerando embedding para texto: ${text.substring(0, 100)}...`)

    // Chamar OpenAI para gerar embedding
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const embedding = openaiData.data[0].embedding

    console.log(`✅ Embedding gerado com sucesso: ${embedding.length} dimensões`)

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        embedding: embedding,
        text: text,
        model: 'text-embedding-ada-002',
        dimensions: embedding.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})
```

## 🎯 **PRÓXIMOS PASSOS:**

1. **Acessar Supabase Dashboard**
2. **Criar Edge Function** `generate-embedding`
3. **Copiar código** acima
4. **Configurar OPENAI_API_KEY**
5. **Fazer Deploy**
6. **Testar no N8N**

## ✅ **STATUS:**

- ✅ **Código criado** e commitado
- ✅ **Documentação** completa
- ⏳ **Deploy manual** via Dashboard
- ⏳ **Teste** após deploy

**Faça o deploy manual via Dashboard e teste!** 🚀
