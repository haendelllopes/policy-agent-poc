@echo off
echo.
echo ========================================
echo    ABRINDO DASHBOARD DE INSIGHTS
echo ========================================
echo.

REM Abrir navegador no dashboard
start http://localhost:3000/dashboard.html

echo Dashboard aberto no navegador!
echo.
echo INSTRUCOES:
echo 1. Pressione Ctrl+Shift+R para forcar reload
echo 2. Clique no menu lateral: 💡 Insights
echo 3. Veja as anotacoes e padroes identificados
echo.
echo Se nao aparecer o menu Insights:
echo - Verifique se o servidor esta rodando
echo - Execute restart-server.bat primeiro
echo.
pause

