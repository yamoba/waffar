@echo off
REM Waffar.eg Setup Script for Windows
REM This script helps you quickly set up the backend and dependencies

echo.
echo 🚀 Waffar.eg Backend Setup
echo ============================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js detected: 
node --version

echo ✓ npm detected: 
npm --version

echo.

REM Navigate to backend directory
cd backend
if %errorlevel% neq 0 (
    echo ❌ Could not navigate to backend directory
    pause
    exit /b 1
)

echo 📦 Installing backend dependencies...
call npm install

echo.
echo ✓ Dependencies installed!
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✓ .env file created!
    echo.
    echo ⚠️  IMPORTANT: Edit the .env file with your configuration:
    echo    - MONGODB_URI: Your MongoDB connection string
    echo    - JWT_SECRET: Generate a strong secret key
    echo.
    echo To generate a strong secret, run in PowerShell:
    echo    [System.Convert]::ToBase64String((1..32 ^| ForEach-Object {Get-Random -Maximum 256}))
    echo.
) else (
    echo ✓ .env file already exists
    echo.
)

echo ✅ Setup complete!
echo.
echo 📚 Next steps:
echo 1. Edit backend\.env with your MongoDB connection
echo 2. Start MongoDB (mongod)
echo 3. Run: npm run dev (in backend folder)
echo 4. Open price_compare.html in your browser
echo.
echo Happy price comparing! 🎯
echo.
pause
