@echo off
echo.
echo ========================================
echo   Thermal Printer Setup - Windows
echo ========================================
echo.
echo Installing thermal printer dependencies...
echo.

npm install node-thermal-printer@^4.4.4 escpos@^3.0.0-alpha.6 escpos-usb@^3.0.0-alpha.4 escpos-network@^3.0.0-alpha.1 serialport@^12.0.0

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart the backend server
echo 2. Connect your thermal printer (USB/Network)
echo 3. Go to Settings page in app
echo 4. Configure printer settings
echo 5. Click "Test Print"
echo.
echo For detailed instructions, see:
echo   THERMAL_PRINTER_INSTALLATION.md
echo.
pause
