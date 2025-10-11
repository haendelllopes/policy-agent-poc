#!/bin/bash

echo "🧪 TESTANDO API EM PRODUÇÃO..."
echo ""

# Teste 1: Health Check
echo "📊 1. Health Check:"
curl -s https://navigator-gules.vercel.app/api/health | jq .
echo ""
echo ""

# Teste 2: Análise de Sentimento com PHONE
echo "📞 2. Análise de Sentimento (com phone):"
curl -X POST https://navigator-gules.vercel.app/api/analise-sentimento \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Adorei o sistema, muito fácil!",
    "phone": "556291708483",
    "context": "Teste de produção",
    "tenantId": "5978f911-738b-4aae-802a-f037fdac2e64"
  }' | jq .
echo ""
echo ""

echo "✅ Testes concluídos!"


