@echo off
chcp 65001 >nul
cd /d "%~dp0"

title TravelHub - Stop All Services
echo ====================================================================
echo   TRAVELHUB SYSTEM - STOPPING ALL SERVICES
echo ====================================================================
echo.

echo [1/2] Shutting down Database Containers (Docker)...
docker-compose down
echo [OK] Database containers stopped.
echo.

echo [2/2] Cleaning up Node.js processes on ports 3000 and 4200...
taskkill /F /IM node.exe >nul 2>&1
echo [OK] Processes terminated.
echo.

echo ====================================================================
echo   ALL SERVICES STOPPED SUCCESSFULLY!
echo   You can close this window now.
echo ====================================================================
echo.
pause
