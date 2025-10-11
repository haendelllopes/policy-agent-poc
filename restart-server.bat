@echo off
echo.
echo ========================================
echo    REINICIANDO SERVIDOR FLOWLY
echo ========================================
echo.

REM Matar processos node existentes
echo [1/4] Parando servidor anterior...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Navegar para o diretório
cd /d "%~dp0"

REM Iniciar servidor em background
echo [2/4] Iniciando novo servidor...
start /B cmd /c "npm start > server.log 2>&1"

REM Aguardar servidor iniciar
echo [3/4] Aguardando servidor iniciar (10 segundos)...
timeout /t 10 /nobreak >nul

REM Abrir navegador no dashboard
echo [4/4] Abrindo dashboard no navegador...
start http://localhost:3000/dashboard.html

echo.
echo ========================================
echo    SERVIDOR INICIADO COM SUCESSO!
echo ========================================
echo.
echo Dashboard: http://localhost:3000/dashboard.html
echo.
echo Pressione Ctrl+Shift+R no navegador para forcar reload
echo.
pause

