#!/bin/bash

echo "Installing WebSocket dependencies..."

# Install Django Channels and related packages
pip install channels==4.0.0
pip install channels-redis==4.1.0
pip install daphne==4.0.0

# Install Redis if not already installed (for channel layers)
# On Ubuntu/Debian: sudo apt-get install redis-server
# On macOS: brew install redis

echo "WebSocket dependencies installed successfully!"
echo ""
echo "To start the server with WebSocket support, use:"
echo "daphne main_api.asgi:application -b 0.0.0.0 -p 8000"
echo ""
echo "Or for development with auto-reload:"
echo "python manage.py runserver"
echo ""
echo "Make sure Redis is running:"
echo "redis-server" 