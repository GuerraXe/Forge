@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm was not found on PATH. Install Node.js 20+ from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this only happens once...
  call npm install
  if errorlevel 1 (
    echo npm install failed. See the error above.
    pause
    exit /b 1
  )
)

echo Starting Forge... your browser will open automatically.
echo Keep this window open while using the app. Close it to stop the server.
call npm run launch
pause
