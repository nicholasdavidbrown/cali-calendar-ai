@echo off
REM Cali Calendar AI - Development Helper Script for Windows

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="start" goto start
if "%1"=="build" goto build
if "%1"=="stop" goto stop
if "%1"=="logs" goto logs
if "%1"=="seed" goto seed
if "%1"=="clean" goto clean
goto help

:help
echo.
echo 🚀 Cali Calendar AI - Development Commands
echo.
echo Usage: dev.bat [command]
echo.
echo Commands:
echo   start   - Start development environment
echo   build   - Build and start development environment
echo   stop    - Stop development environment
echo   logs    - View logs
echo   seed    - Seed database
echo   clean   - Clean up containers and volumes
echo   help    - Show this help message
echo.
goto end

:start
echo 🚀 Starting development environment...
docker compose -f docker-compose.dev.yml up
goto end

:build
echo 🔨 Building and starting development environment...
docker compose -f docker-compose.dev.yml up --build
goto end

:stop
echo ⏹️  Stopping development environment...
docker compose -f docker-compose.dev.yml down
goto end

:logs
echo 📋 Viewing logs...
docker compose -f docker-compose.dev.yml logs -f
goto end

:seed
echo 🌱 Seeding database...
docker compose -f docker-compose.dev.yml exec backend yarn db:seed
goto end

:clean
echo 🧹 Cleaning up...
docker compose -f docker-compose.dev.yml down -v
echo ✅ Cleanup complete
goto end

:end
