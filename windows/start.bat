@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Rode windows\setup.bat primeiro.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Dependencias ausentes. Rodando setup...
  call "%~dp0setup.bat"
)

REM Prefer portable wget shipped/downloaded under vendor\wget
if exist "%CD%\vendor\wget\wget.exe" (
  set "WGET_PATH=%CD%\vendor\wget\wget.exe"
)

echo Iniciando Website Downloader em http://localhost:3000/
echo Pressione Ctrl+C para encerrar.
echo.
call npm start
pause
endlocal
