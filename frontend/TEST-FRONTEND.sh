#!/bin/bash

echo "🚀 CodeFlow AI Frontend - Quick Test Script"
echo "==========================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in frontend directory"
    echo "Please run: cd frontend && ./TEST-FRONTEND.sh"
    exit 1
fi

echo "✅ In frontend directory"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Start the development server
echo "🎨 Starting development server..."
echo ""
echo "Visit: http://localhost:3000"
echo ""
echo "Pages to test:"
echo "  1. Landing:    http://localhost:3000"
echo "  2. Dashboard:  http://localhost:3000/dashboard"
echo "  3. Roadmap:    http://localhost:3000/dashboard/roadmap"
echo "  4. AI Mentor:  http://localhost:3000/dashboard/mentor"
echo "  5. Interview:  http://localhost:3000/dashboard/interview"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
