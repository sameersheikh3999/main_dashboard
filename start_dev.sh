#!/bin/bash

echo "🚀 Starting Educational Dashboard Development Environment"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    pkill -f "manage.py runserver"
    pkill -f "react-scripts start"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Django backend
echo "Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Start React frontend
echo "Starting React frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 