@echo off
setlocal enabledelayedexpansion
title OVERSEER — Dev

:: ── OVERSEER Dev Launcher ─────────────────────────────────────────────────
cd /d "%~dp0"

echo.
echo  OVERSEER Dev Launcher
echo  ─────────────────────

:: Tue l'instance electron eventuelle deja ouverte
taskkill /f /im electron.exe >nul 2>&1

:: node_modules present ?
if not exist "node_modules" (
    echo  [INFO] node_modules absent — npm install en cours...
    call npm install
    if errorlevel 1 ( echo  [ERREUR] npm install echoue. & pause & exit /b 1 )
)

echo  [1/2] Vite build...
call npx vite build
if errorlevel 1 ( echo  [ERREUR] vite build echoue. & pause & exit /b 1 )

echo  [2/2] Lancement Electron...
echo.
npx electron .

echo.
echo  App fermee.
pause
