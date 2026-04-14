@echo off
setlocal EnableExtensions EnableDelayedExpansion
title OVERSEER - Publication de mise a jour
color 0A

cd /d "%~dp0"

echo.
echo ========================================
echo OVERSEER - Publication de mise a jour
echo ========================================
echo.

if not exist package.json (
  echo [ERREUR] package.json introuvable dans : %CD%
  pause
  exit /b 1
)

where git >nul 2>&1 || (
  echo [ERREUR] Git n'est pas installe ou non present dans le PATH.
  pause
  exit /b 1
)

where gh >nul 2>&1 || (
  echo [ERREUR] GitHub CLI ^(gh^) n'est pas installe ou non present dans le PATH.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" (
  echo [ERREUR] Impossible de detecter la branche Git courante.
  pause
  exit /b 1
)

echo Branche detectee : %CURRENT_BRANCH%
echo.
set /p VERSION=Nouvelle version (ex: 3.2.3) : 
if "%VERSION%"=="" (
  echo Annule - pas de version entree.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('gh auth token 2^>nul') do set GH_TOKEN=%%i
if "%GH_TOKEN%"=="" (
  echo [ERREUR] Aucun token GitHub detecte. Lance d'abord : gh auth login
  pause
  exit /b 1
)

echo.
echo [...] Mise a jour de package.json vers %VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='package.json'; $j=Get-Content $p -Raw | ConvertFrom-Json; $j.version='%VERSION%'; $j | ConvertTo-Json -Depth 100 | Set-Content $p -Encoding UTF8"
if errorlevel 1 (
  echo [ERREUR] Impossible de mettre a jour package.json
  pause
  exit /b 1
)

echo [OK] Version mise a jour : %VERSION%

echo.
echo [...] Verification de l'etat Git...
git diff --quiet --exit-code >nul 2>&1
if errorlevel 1 (
  echo Modifications detectees, elles seront commit.
) else (
  echo Aucune modification locale avant la mise a jour.
)

echo.
echo [...] Commit + push sur %CURRENT_BRANCH%...
git add -A
if errorlevel 1 goto :gitfail

git commit -m "v%VERSION%"
if errorlevel 1 (
  echo [INFO] Aucun nouveau changement a commit ou commit refuse. On continue.
)

git push origin %CURRENT_BRANCH%
if errorlevel 1 goto :gitfail

echo.
echo [...] Creation / mise a jour du tag v%VERSION%...
git tag -d v%VERSION% >nul 2>&1
git push origin :refs/tags/v%VERSION% >nul 2>&1
git tag v%VERSION%
if errorlevel 1 goto :gitfail

git push origin v%VERSION%
if errorlevel 1 goto :gitfail

echo.
echo [...] Build de l'app et publication sur GitHub Releases...
echo (ca peut prendre plusieurs minutes)
echo.

set CSC_IDENTITY_AUTO_DISCOVERY=false
set "WINCODESIGN_PATH=%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0"

call npx vite build
if errorlevel 1 goto :buildfail

call npx electron-builder --win --publish always
if errorlevel 1 goto :buildfail

