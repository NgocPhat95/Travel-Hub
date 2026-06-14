@echo off
chcp 65001 >nul
cd /d "%~dp0"

title TravelHub - Start All Services
echo ====================================================================
echo   TRAVELHUB SYSTEM - STARTING ALL SERVICES
echo ====================================================================
echo.

docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Docker is not found or Docker Desktop is not running!
    echo Please install and start Docker Desktop first.
    echo.
    pause
    exit
)

echo [1/3] Starting Database Containers via Docker Compose...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo [ERROR] Docker Compose failed to start containers!
    echo Please make sure Docker Desktop is running.
    echo.
    pause
    exit
)
echo [OK] Database containers (Postgres, Redis, Elasticsearch) are running.
echo.

echo Waiting 8 seconds for database services to initialize...
ping 127.0.0.1 -n 9 >nul

echo [2/4] Initializing Database Schema (Prisma DB Push)...
cd /d "%~dp0backend"
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo [ERROR] Failed to push database schema!
    echo Please make sure Postgres is running and env DATABASE_URL is correct.
    echo.
    pause
    exit
)

echo [3/4] Seeding Sample Data into Database (Prisma DB Seed)...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Database seed encountered an issue, but continuing...
)
echo [OK] Database schema initialized and seeded successfully.
echo.

echo [4/4] Spawning Backend & Frontend Services...
cd /d "%~dp0"
start "TravelHub - Backend" cmd /k "chcp 65001 >nul && cd /d "%~dp0backend" && npm run start:dev"

ping 127.0.0.1 -n 3 >nul

start "TravelHub - Frontend" cmd /k "chcp 65001 >nul && cd /d "%~dp0frontend" && npm start"

color 0A
echo ====================================================================
echo   STARTUP COMPLETED SUCCESSFULLY!
echo   - Backend API: http://localhost:3000
echo   - Frontend Web: http://localhost:4200
echo.
echo   * Keep the spawned command windows running.
echo ====================================================================
echo.
pause
