#!/bin/bash

# 🚀 Evolution API Setup Simples - Navigator
# Data: 17 de outubro de 2025
# Versão: Simplificada para evitar erros de build

set -e

echo "🚀 Configurando Evolution API (Versão Simplificada)..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
EVOLUTION_URL="http://localhost:8080"
API_KEY="navigator-evolution-key-2025-secure"
INSTANCE_NAME="navigator-whatsapp"

echo -e "${BLUE}📋 Verificando pré-requisitos...${NC}"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado. Instale o Docker primeiro.${NC}"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado. Instale o Docker Compose primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker e Docker Compose encontrados${NC}"

echo -e "${BLUE}🐳 Parando containers existentes...${NC}"

# Parar containers existentes se houver
docker-compose -f docker-compose.evolution-simple.yml down 2>/dev/null || true

echo -e "${BLUE}🐳 Baixando imagem oficial Evolution API...${NC}"

# Baixar imagem oficial primeiro
docker pull evolutionapi/evolution-api:1.0.0

echo -e "${BLUE}🐳 Iniciando Evolution API...${NC}"

# Iniciar Evolution API (versão simples)
docker-compose -f docker-compose.evolution-simple.yml up -d

echo -e "${YELLOW}⏳ Aguardando Evolution API inicializar...${NC}"

# Aguardar API estar disponível
for i in {1..60}; do
    if curl -s "$EVOLUTION_URL/manager/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Evolution API está rodando${NC}"
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Evolution API não iniciou em 60 segundos${NC}"
        echo -e "${YELLOW}Verifique os logs: docker-compose -f docker-compose.evolution.yml logs${NC}"
        exit 1
    fi
    
    sleep 1
done

echo -e "${BLUE}🔧 Criando instância WhatsApp...${NC}"

# Criar instância WhatsApp
CREATE_RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -d '{
    "instanceName": "'$INSTANCE_NAME'",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": "https://hndll.app.n8n.cloud/webhook/evolution-webhook",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
    "rejectCall": true,
    "msgRetryCounterCache": true,
    "userAgent": "Navigator Evolution API"
  }')

if echo "$CREATE_RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Erro ao criar instância:${NC}"
    echo "$CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Instância '$INSTANCE_NAME' criada com sucesso${NC}"

echo -e "${BLUE}📱 Obtendo QR Code para conectar WhatsApp...${NC}"

# Obter QR Code
QR_RESPONSE=$(curl -s -X GET "$EVOLUTION_URL/instance/connect/$INSTANCE_NAME" \
  -H "apikey: $API_KEY")

if echo "$QR_RESPONSE" | grep -q "base64"; then
    # Extrair base64 do QR Code
    QR_BASE64=$(echo "$QR_RESPONSE" | grep -o '"base64":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${GREEN}✅ QR Code obtido com sucesso${NC}"
    echo -e "${YELLOW}📱 QR Code salvo em: qr-code-navigator.png${NC}"
    
    # Salvar QR Code como imagem
    echo "$QR_BASE64" | sed 's/data:image\/png;base64,//' | base64 -d > qr-code-navigator.png
    
    echo -e "${BLUE}🔗 Para conectar seu WhatsApp:${NC}"
    echo -e "${YELLOW}1. Abra o WhatsApp no seu celular${NC}"
    echo -e "${YELLOW}2. Vá em Configurações > Dispositivos conectados > Conectar um dispositivo${NC}"
    echo -e "${YELLOW}3. Escaneie o QR Code do arquivo: qr-code-navigator.png${NC}"
    
else
    echo -e "${RED}❌ Erro ao obter QR Code:${NC}"
    echo "$QR_RESPONSE"
    exit 1
fi

echo -e "${BLUE}⏳ Aguardando conexão do WhatsApp...${NC}"
echo -e "${YELLOW}(Pressione Ctrl+C para cancelar)${NC}"

# Aguardar conexão
for i in {1..300}; do
    STATUS_RESPONSE=$(curl -s -X GET "$EVOLUTION_URL/instance/connectionState/$INSTANCE_NAME" \
      -H "apikey: $API_KEY")
    
    if echo "$STATUS_RESPONSE" | grep -q '"state":"open"'; then
        echo -e "${GREEN}🎉 WhatsApp conectado com sucesso!${NC}"
        break
    fi
    
    if [ $i -eq 300 ]; then
        echo -e "${YELLOW}⏰ Timeout aguardando conexão. Você pode conectar depois.${NC}"
        break
    fi
    
    sleep 2
done

echo -e "${BLUE}🧪 Testando envio de mensagem...${NC}"

# Teste básico (substitua pelo seu número)
echo -e "${YELLOW}Digite seu número de telefone para teste (ex: 556299940476):${NC}"
read -r TEST_PHONE

if [ -n "$TEST_PHONE" ]; then
    TEST_RESPONSE=$(curl -s -X POST "$EVOLUTION_URL/message/sendText/$INSTANCE_NAME" \
      -H "Content-Type: application/json" \
      -H "apikey: $API_KEY" \
      -d '{
        "number": "'$TEST_PHONE'",
        "text": "🚀 Evolution API configurada com sucesso para o Navigator!\n\nEsta é uma mensagem de teste. Se você recebeu, está tudo funcionando! 🎉"
      }')
    
    if echo "$TEST_RESPONSE" | grep -q "key\|id"; then
        echo -e "${GREEN}✅ Mensagem de teste enviada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao enviar mensagem de teste:${NC}"
        echo "$TEST_RESPONSE"
    fi
fi

echo -e "${BLUE}📊 Informações da instalação:${NC}"
echo -e "${GREEN}• Evolution API URL: $EVOLUTION_URL${NC}"
echo -e "${GREEN}• Instância: $INSTANCE_NAME${NC}"
echo -e "${GREEN}• API Key: $API_KEY${NC}"
echo -e "${GREEN}• QR Code: qr-code-navigator.png${NC}"

echo -e "${BLUE}🔧 Próximos passos:${NC}"
echo -e "${YELLOW}1. Configurar N8N para usar Evolution API${NC}"
echo -e "${YELLOW}2. Testar integração completa${NC}"
echo -e "${YELLOW}3. Adicionar usuários de teste${NC}"

echo -e "${GREEN}🎉 Evolution API configurada com sucesso!${NC}"
