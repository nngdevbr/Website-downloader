@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================
echo  Website Downloader - Windows setup
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js 16+ em https://nodejs.org/ e abra este script de novo.
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias npm...
call npm install
if errorlevel 1 (
  echo [ERRO] npm install falhou.
  pause
  exit /b 1
)

echo.
echo [2/3] Garantindo wget...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ensure-wget.ps1"
if errorlevel 1 (
  echo [AVISO] Nao foi possivel instalar wget automaticamente.
  echo Tente: winget install JernejSimoncic.Wget
  echo Ou baixe wget.exe e coloque em vendor\wget\wget.exe
)

echo.
echo [3/3] Pronto.
echo.
echo Para iniciar o app, rode: windows\start.bat
echo Depois abra http://localhost:3000/
echo.
pause
endlocal
