#!/bin/bash

# Educational Dashboard Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Educational Dashboard Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    
    # Check Docker (optional)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Docker setup will be skipped."
        DOCKER_AVAILABLE=false
    else
        DOCKER_AVAILABLE=true
    fi
    
    print_success "System requirements check completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating frontend .env file..."
        cat > .env << EOF
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development
EOF
    fi
    
    cd ..
    print_success "Frontend setup completed"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating backend .env file..."
        cat > .env << EOF
# Django Settings
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Google Cloud/BigQuery (optional)
# GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=1
JWT_REFRESH_TOKEN_LIFETIME=7

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis (optional)
# REDIS_URL=redis://localhost:6379/0
EOF
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    python manage.py migrate
    
    # Create superuser if it doesn't exist
    print_status "Creating default users..."
    python create_test_user.py
    
    # Collect static files
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
    
    cd ..
    print_success "Backend setup completed"
}

# Setup Docker (if available)
setup_docker() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_status "Setting up Docker environment..."
        
        # Create docker directory if it doesn't exist
        mkdir -p docker
        
        # Create nginx configuration
        if [ ! -f "docker/nginx.conf" ]; then
            print_status "Creating nginx configuration..."
            cat > docker/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/api/health/;
        }
    }
}
EOF
        fi
        
        # Create supervisord configuration
        if [ ! -f "docker/supervisord.conf" ]; then
            print_status "Creating supervisord configuration..."
            cat > docker/supervisord.conf << 'EOF'
[supervisord]
nodaemon=true
user=appuser

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx/error.log
stdout_logfile=/var/log/nginx/access.log

[program:django]
command=python manage.py runserver 0.0.0.0:8000
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/app/backend/logs/django_error.log
stdout_logfile=/app/backend/logs/django_access.log
EOF
        fi
        
        # Create entrypoint script
        if [ ! -f "docker/entrypoint.sh" ]; then
            print_status "Creating entrypoint script..."
            cat > docker/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Wait for database
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 1
done

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start supervisor
echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF
            chmod +x docker/entrypoint.sh
        fi
        
        print_success "Docker setup completed"
    else
        print_warning "Docker setup skipped (Docker not available)"
    fi
}

# Create development scripts
create_scripts() {
    print_status "Creating development scripts..."
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Educational Dashboard..."

# Start backend
echo "Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting React frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    chmod +x start.sh
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Educational Dashboard..."

# Kill backend process
pkill -f "python manage.py runserver"

# Kill frontend process
pkill -f "react-scripts start"

echo "Services stopped"
EOF
    chmod +x stop.sh
    
    # Create test script
    cat > test.sh << 'EOF'
#!/bin/bash
echo "🧪 Running tests..."

# Backend tests
echo "Running backend tests..."
cd backend
source venv/bin/activate
python manage.py test

# Frontend tests
echo "Running frontend tests..."
cd ../frontend
npm test -- --watchAll=false
EOF
    chmod +x test.sh
    
    print_success "Development scripts created"
}

# Main setup function
main() {
    print_status "Starting setup process..."
    
    check_requirements
    setup_frontend
    setup_backend
    setup_docker
    create_scripts
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the development server: ./start.sh"
    echo "2. Open http://localhost:3000 in your browser"
    echo "3. Login with default credentials:"
    echo "   - FDE: username=fde, password=fde123"
    echo "   - AEO: username=aeo_bk, password=aeo123"
    echo "   - Principal: username=principal_al_noor_elementary, password=principal123"
    echo ""
    echo "For Docker setup:"
    echo "1. docker-compose up -d"
    echo "2. docker-compose logs -f"
}

# Run main function
main "$@" 