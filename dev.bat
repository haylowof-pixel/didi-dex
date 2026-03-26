@echo off
taskkill /f /im electron.exe >nul 2>&1
cd /d "%~dp0"
call npx vite build
start "" npx electron .
