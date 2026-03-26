@echo off
title OVERSEER - Publication de mise a jour
color 0A
echo.
echo  ========================================
echo    OVERSEER - Publication de mise a jour
echo  ========================================
echo.

cd /d "%~dp0"

:: 1. Demander le numero de version
set /p VERSION="Nouvelle version (ex: 2.1.0) : "
if "%VERSION%"=="" (
    echo Annule - pas de version entree.
    pause
    exit /b
)

:: 2. Mettre a jour package.json avec la nouvelle version
powershell -Command "(Get-Content package.json) -replace '\"version\": \".*?\"', '\"version\": \"%VERSION%\"' | Set-Content package.json"
echo [OK] Version mise a jour : %VERSION%

:: 3. Commit + Push
echo.
echo [...] Commit et push sur GitHub...
git add -A
git commit -m "v%VERSION%"
git push origin master
echo [OK] Code pousse sur GitHub !

:: 4. Build + Publish
echo.
echo [...] Build de l'app et publication sur GitHub Releases...
echo     (ca peut prendre 1-2 minutes)
echo.

:: Get GitHub token
for /f "tokens=*" %%i in ('gh auth token') do set GH_TOKEN=%%i

call npx vite build
call npx electron-builder --win --publish always

echo.
echo  ========================================
echo    PUBLIE ! Tes potes recevront la v%VERSION%
echo    automatiquement au lancement de l'app
echo  ========================================
echo.
pause
