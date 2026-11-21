@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
 echo Instale Node.js 22 LTS para continuar.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci
 if errorlevel 1 exit /b 1
)
echo Abra http://127.0.0.1:5101
call npm run dev -- --host 127.0.0.1 --port 5101
pause
