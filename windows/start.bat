@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

if exist "%CD%\runtime\node\node.exe" (
  set "PATH=%CD%\runtime\node;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Rode windows\setup.bat primeiro.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Dependencias ausentes. Rodando setup...
  call "%~dp0setup.bat"
)

echo Iniciando Website Downloader em http://localhost:3000/
echo Pressione Ctrl+C para encerrar.
echo.
call npm start
pause
endlocal
