#!/bin/bash

# DivergentUnity Setup Script

echo "🚀 Setting up DivergentUnity..."

# Check Python version
echo "📋 Checking Python version..."
if ! command -v python3.10 &> /dev/null; then
    echo "❌ Python 3.10+ is required but not found"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

# Backend setup
echo ""
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3.10 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
    echo ""
fi

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp .env.local.example .env.local
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your GEMINI_API_KEY to backend/.env"
echo "2. Start the backend: cd backend && source venv/bin/activate && python -m uvicorn main:app --reload --port 8000"
echo "3. In a new terminal, start the frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Then open http://localhost:3000 in your browser"
