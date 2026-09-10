@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================
echo  Website Downloader - Windows setup
echo ============================================
echo.
echo Este setup NAO baixa nenhum .exe.
echo So instala pacotes npm oficiais do Node.js.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js 16+ em https://nodejs.org/ ^(LTS^) e abra este script de novo.
  pause
  exit /b 1
)

echo Instalando dependencias npm...
call npm install
if errorlevel 1 (
  echo [ERRO] npm install falhou.
  pause
  exit /b 1
)

echo.
echo Pronto. Nao e necessario instalar wget.
echo O app usa um downloader embutido em Node quando o wget nao esta presente.
echo.
echo Proximo passo: rode windows\start.bat
echo Depois abra http://localhost:3000/
echo.
pause
endlocal
