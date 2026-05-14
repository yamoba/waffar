#!/bin/bash

# Waffar.eg Setup Script
# This script helps you quickly set up the backend and dependencies

echo "🚀 Waffar.eg Backend Setup"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo "✓ npm detected: $(npm --version)"
echo ""

# Navigate to backend directory
cd backend || exit 1

echo "📦 Installing backend dependencies..."
npm install

echo ""
echo "✓ Dependencies installed!"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file with your configuration:"
    echo "   - MONGODB_URI: Your MongoDB connection string"
    echo "   - JWT_SECRET: Generate a strong secret key"
    echo ""
    echo "To generate a strong secret:"
    echo "   node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit backend/.env with your MongoDB connection"
echo "2. Start MongoDB (mongod)"
echo "3. Run: npm run dev (in backend folder)"
echo "4. Open price_compare.html in your browser"
echo ""
echo "Happy price comparing! 🎯"
