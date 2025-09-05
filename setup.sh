#!/bin/bash

# Stock Market Chatbot Setup Script
echo "🤖 Setting up Stock Market Chatbot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please add your Alpha Vantage API key"
else
    echo "⚠️  .env file already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get a free API key from: https://www.alphavantage.co/support/#api-key"
echo "2. Add your API key to backend/.env file"
echo "3. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh"
echo "4. Pull a model: ollama pull deepseek-r1:14b"
echo "5. Start the backend: cd backend && npm run dev"
echo "6. Start the frontend: cd frontend && npm run dev"
echo ""
echo "📖 For more details, see README.md"
