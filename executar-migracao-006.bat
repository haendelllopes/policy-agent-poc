@echo off
echo.
echo ========================================
echo   EXECUTANDO MIGRACAO 006
echo   Trilhas por Cargo e Departamento
echo ========================================
echo.

cd /d "%~dp0"

echo [1/1] Executando migracoes...
node executar-migrations-supabase.js

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
pause

