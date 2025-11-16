#!/bin/bash

# Start both backend and frontend servers

echo "🚀 Starting DivergentUnity servers..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server on port 8000..."
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend server on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo "📍 Backend: http://localhost:8000"
echo "📍 Frontend: http://localhost:3000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
