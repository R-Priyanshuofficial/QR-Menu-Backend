@echo off
echo.
echo ================================
echo   QR Menu Backend Server
echo ================================
echo.

REM Kill any process on port 5000
echo [1/3] Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Found process: %%a
    echo Killing process...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Port 5000 is now free!
echo.

REM Start the server
echo [3/3] Starting development server...
echo.
npm run dev
