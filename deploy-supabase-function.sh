#!/bin/bash

# 🚀 Script de Deploy da Supabase Edge Function
# Deploy automático da função generate-embedding

echo "🚀 INICIANDO DEPLOY DA SUPABASE EDGE FUNCTION"
echo "=============================================="

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "📦 Instalando Supabase CLI..."
    npm install -g supabase
fi

# Verificar se está logado
echo "🔐 Verificando login no Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "🔑 Fazendo login no Supabase..."
    supabase login
fi

# Verificar se OPENAI_API_KEY está configurada
echo "🔑 Verificando OPENAI_API_KEY..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️ OPENAI_API_KEY não encontrada nas variáveis de ambiente"
    echo "💡 Configure com: export OPENAI_API_KEY=sua_chave_aqui"
    read -p "🔑 Digite sua OpenAI API Key: " OPENAI_KEY
    export OPENAI_API_KEY=$OPENAI_KEY
fi

# Deploy da função
echo "📦 Fazendo deploy da função generate-embedding..."
supabase functions deploy generate-embedding

if [ $? -eq 0 ]; then
    echo "✅ Deploy realizado com sucesso!"
else
    echo "❌ Erro no deploy!"
    exit 1
fi

# Configurar secret
echo "🔐 Configurando OPENAI_API_KEY..."
supabase secrets set OPENAI_API_KEY=$OPENAI_API_KEY

if [ $? -eq 0 ]; then
    echo "✅ Secret configurado com sucesso!"
else
    echo "❌ Erro ao configurar secret!"
    exit 1
fi

# Testar função
echo "🧪 Testando função..."
node teste-supabase-embedding-function.js

if [ $? -eq 0 ]; then
    echo "✅ Teste passou!"
else
    echo "❌ Teste falhou!"
    exit 1
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================="
echo "🌐 URL da função: https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding"
echo "🔧 Configure no N8N:"
echo "   - URL: https://gxqwfltteimexngybwna.supabase.co/functions/v1/generate-embedding"
echo "   - Method: POST"
echo "   - Headers: Authorization: Bearer SUA_SUPABASE_ANON_KEY"
echo "   - Body: {\"text\": \"{{ \$json.conteudo_extraido }}\"}"
echo ""
echo "🚀 Função pronta para uso!"
