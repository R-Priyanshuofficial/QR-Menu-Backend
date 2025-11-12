@echo off
echo.
echo ========================================
echo   AUTOMATIC PRINTER SETUP
echo ========================================
echo.
echo Step 1: Installing dependencies...
echo.

call npm install

echo.
echo Step 2: Verifying installation...
echo.

call npm run verify-printer

echo.
echo Step 3: Starting server...
echo.

call npm run dev

pause
