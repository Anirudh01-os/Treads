#!/bin/bash

echo "🚀 Setting up Treads Virtual Try-On App..."

# Check if Python and Node.js are installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "📦 Setting up Python backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend setup complete"

# Setup Frontend
echo "📦 Setting up React frontend..."
cd ../frontend

# Install Node.js dependencies
npm install

echo "✅ Frontend setup complete"

# Create necessary directories
echo "📁 Creating directories..."
cd ..
mkdir -p uploads/{clothing,body_models,tryons,users}
mkdir -p models
mkdir -p logs

# Copy environment file
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Created .env file from template"
fi

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "Then visit: http://localhost:3000"