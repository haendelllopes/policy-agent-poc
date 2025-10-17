@echo off
echo 🚀 Testando Evolution API no Render...
echo.

set /p API_KEY="Cole aqui sua API KEY do Render: "
set /p API_URL="Cole aqui a URL da sua Evolution API (ex: https://navigator-evolution-api.onrender.com): "

echo.
echo 🔍 Testando health endpoint...
curl "%API_URL%/manager/health"

echo.
echo.
echo 🔍 Testando criação de instância WhatsApp...
curl -X POST "%API_URL%/instance/create" ^
  -H "Content-Type: application/json" ^
  -H "apikey: %API_KEY%" ^
  -d "{\"instanceName\": \"navigator-whatsapp\", \"qrcode\": true, \"integration\": \"WHATSAPP-BAILEYS\", \"webhook\": \"https://hndll.app.n8n.cloud/webhook/evolution-webhook\"}"

echo.
echo.
echo ✅ Teste concluído! Verifique as respostas acima.
echo.
pause

