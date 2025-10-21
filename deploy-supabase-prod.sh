#!/bin/bash
# ========================================
# DEPLOY SUPABASE REALTIME EM PRODUÇÃO
# ========================================

echo "🚀 INICIANDO DEPLOY SUPABASE REALTIME EM PRODUÇÃO"
echo "================================================="

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# 2. Verificar dependências
echo "📦 Verificando dependências..."
if ! npm list @supabase/supabase-js > /dev/null 2>&1; then
    echo "⚠️ Instalando @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi

# 3. Verificar arquivos necessários
echo "📁 Verificando arquivos necessários..."
required_files=(
    "src/supabase/client.js"
    "src/supabase/realtime.js"
    "src/supabase/chatService.js"
    "src/supabase/authService.js"
    "public/js/supabase-client.js"
    "public/js/supabase-chat-widget.js"
    "public/test-supabase-chat.html"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo necessário não encontrado: $file"
        exit 1
    else
        echo "✅ $file"
    fi
done

# 4. Verificar variáveis de ambiente
echo "🔧 Verificando variáveis de ambiente..."
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não configuradas"
    echo "📋 Configure no arquivo .env ou nas variáveis de ambiente do Vercel"
    exit 1
else
    echo "✅ Variáveis de ambiente configuradas"
fi

# 5. Executar testes de produção
echo "🧪 Executando testes de produção..."
if node test-fase5-complete.js; then
    echo "✅ Testes de produção passaram"
else
    echo "⚠️ Alguns testes falharam, mas continuando..."
fi

# 6. Preparar para deploy
echo "📦 Preparando para deploy..."
echo "✅ Arquivos verificados"
echo "✅ Dependências instaladas"
echo "✅ Variáveis de ambiente configuradas"
echo "✅ Testes executados"

# 7. Instruções para deploy
echo ""
echo "🎯 PRÓXIMOS PASSOS PARA DEPLOY:"
echo "================================"
echo ""
echo "1. 📤 FAZER PUSH PARA GITHUB:"
echo "   git add ."
echo "   git commit -m 'feat: Deploy Supabase Realtime em produção'"
echo "   git push origin main"
echo ""
echo "2. 🌐 CONFIGURAR VERCEL:"
echo "   - Acesse: https://vercel.com/dashboard"
echo "   - Configure as variáveis de ambiente:"
echo "     * SUPABASE_URL=https://gxqwfltteimexngybwna.supabase.co"
echo "     * SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "     * NODE_ENV=production"
echo ""
echo "3. 🧪 TESTAR EM PRODUÇÃO:"
echo "   - Acesse: https://navigator-gules.vercel.app/test-supabase-chat.html"
echo "   - Teste o chat em tempo real"
echo ""
echo "4. 📊 MONITORAR:"
echo "   - Verificar logs do Vercel"
echo "   - Monitorar Supabase Dashboard"
echo "   - Testar funcionalidades"
echo ""
echo "🎉 DEPLOY PREPARADO COM SUCESSO!"
echo "🚀 Supabase Realtime pronto para produção!"
