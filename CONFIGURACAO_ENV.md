# Configuração de Variáveis de Ambiente

Para que o Flowly funcione corretamente, você precisa criar um arquivo `.env` na raiz do projeto.

## Como Configurar

1. Crie um arquivo chamado `.env` na raiz do projeto
2. Adicione as seguintes variáveis:

```env
# Configuração do Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/flowly

# API Keys
GOOGLE_GEMINI_API_KEY=sua_chave_api_gemini_aqui

# Configuração do Servidor
PORT=3000
NODE_ENV=development

# N8N Webhooks (opcional)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/sentiment-analysis

# Supabase (se usar)
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Como Obter a Chave do Google Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma nova API key
3. Copie a chave e cole no arquivo `.env`

## Testando a Configuração

Depois de configurar o arquivo `.env`, reinicie o servidor:

```bash
npm run dev
```

Você deve ver no console se o Gemini foi configurado corretamente.

## Análise de Sentimento sem Gemini

Se você não configurar a API key do Gemini, o sistema ainda funcionará usando um algoritmo de análise de sentimento simples (fallback), mas com resultados menos precisos.

