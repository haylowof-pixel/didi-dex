@echo off
setlocal enabledelayedexpansion

:: ── OVERSEER Release Script ──────────────────────────────────────────
:: Usage: release.bat 3.2.5
:: Bumps version in package.json, commits, pushes, tags → triggers CI build

if "%~1"=="" (
    echo.
    echo  Usage: release.bat ^<version^>
    echo  Exemple: release.bat 3.2.5
    echo.
    pause
    exit /b 1
)

set VERSION=%~1
set TAG=v%VERSION%

:: Must be run from project root (where package.json is)
if not exist "package.json" (
    echo  [ERREUR] package.json introuvable.
    echo  Lance ce script depuis la racine du projet.
    pause
    exit /b 1
)

:: Read current version via PowerShell (safe, no quote issues)
for /f "delims=" %%v in ('powershell -NoProfile -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set CURRENT=%%v

if "!CURRENT!"=="" (
    echo  [ERREUR] Impossible de lire la version dans package.json.
    pause
    exit /b 1
)

echo.
echo  OVERSEER Release Tool
echo  ─────────────────────
echo  Version actuelle : !CURRENT!
echo  Nouvelle version : %VERSION%
echo  Tag              : %TAG%
echo.

set /p CONFIRM= Continuer ? (O/N) :
if /i not "!CONFIRM!"=="O" (
    echo  Annule.
    exit /b 0
)

echo.
echo  [1/4] Mise a jour de package.json...
powershell -NoProfile -Command "$f='package.json'; $c=Get-Content $f -Raw; $c=$c -replace '\"version\": \"!CURRENT!\"','\"version\": \"%VERSION%\"'; Set-Content $f $c -NoNewline"
if errorlevel 1 ( echo  [ERREUR] Echec mise a jour package.json & pause & exit /b 1 )
echo  OK.

echo  [2/4] Commit...
git add package.json
git commit -m "chore: bump version to %VERSION%"
if errorlevel 1 ( echo  [ERREUR] git commit & pause & exit /b 1 )
echo  OK.

echo  [3/4] Push branche...
git push
if errorlevel 1 (
    :: Try with explicit upstream
    git push --set-upstream origin HEAD
    if errorlevel 1 ( echo  [ERREUR] git push & pause & exit /b 1 )
)
echo  OK.

echo  [4/4] Tag %TAG%...
git tag %TAG%
git push origin %TAG%
if errorlevel 1 ( echo  [ERREUR] push tag & pause & exit /b 1 )
echo  OK.

echo.
echo  Release %TAG% publiee !
echo  CI GitHub en cours : https://github.com/haylowof-pixel/overseer-companion/releases
echo.
pause
