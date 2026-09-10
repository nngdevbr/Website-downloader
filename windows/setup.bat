@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================
echo  Website Downloader - setup Windows
echo ============================================
echo.
echo Este setup NAO usa o instalador MSI do Node.
echo Se o Node nao estiver instalado, baixa o ZIP
echo oficial do nodejs.org para a pasta runtime\
echo.

REM Prefer a local portable Node if present
if exist "%CD%\runtime\node\node.exe" (
  set "PATH=%CD%\runtime\node;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Baixando versao portatil oficial...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ensure-node.ps1"
  if errorlevel 1 (
    echo.
    echo [ERRO] Nao foi possivel obter o Node automaticamente.
    echo Baixe manualmente o ZIP "Windows Binary (.zip)" em:
    echo   https://nodejs.org/en/download
    echo Extraia e copie a pasta para:
    echo   %CD%\runtime\node
    echo ^(precisa existir runtime\node\node.exe^)
    pause
    exit /b 1
  )
  set "PATH=%CD%\runtime\node;%PATH%"
)

echo Usando Node:
where node
node -v
echo.

echo Instalando dependencias npm...
call npm install
if errorlevel 1 (
  echo [ERRO] npm install falhou.
  pause
  exit /b 1
)

echo.
echo Pronto.
echo Proximo passo: rode windows\start.bat
echo Depois abra http://localhost:3000/
echo.
pause
endlocal
