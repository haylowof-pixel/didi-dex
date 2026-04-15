@echo off
title OVERSEER Dev
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%

:: Chemin absolu du worktree sans backslash final
set "APPDIR=%~dp0"
if "%APPDIR:~-1%"=="\" set "APPDIR=%APPDIR:~0,-1%"

echo.
echo  OVERSEER Dev - %APPDIR%
echo  ----------------------------------------

taskkill /f /im electron.exe >nul 2>&1

if not exist "node_modules" (
    echo  [INFO] Installation des dependances...
    call npm install
    if errorlevel 1 ( echo  [ERREUR] npm install echoue. & pause & exit /b 1 )
)

echo  [1/2] Vite build...
call node_modules\.bin\vite.cmd build
if errorlevel 1 ( echo  [ERREUR] vite build echoue. & pause & exit /b 1 )

echo  [2/2] Lancement Electron...

:: Recupere le chemin exact de l'exe electron depuis les node_modules locaux
for /f "usebackq delims=" %%E in (`node -p "require('electron')"`) do set "ELECTRONEXE=%%E"

if "%ELECTRONEXE%"=="" (
    echo  [ERREUR] Electron introuvable dans node_modules.
    pause & exit /b 1
)

echo  Electron : %ELECTRONEXE%
echo  App      : %APPDIR%
echo.

"%ELECTRONEXE%" "%APPDIR%"

echo.
echo  App fermee.
pause
