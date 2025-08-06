#!/bin/bash

# Production ALLOWED_HOSTS Update Script
# This script helps update the production server's ALLOWED_HOSTS configuration

echo "🔧 Production ALLOWED_HOSTS Update Script"
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to test the health check endpoint
test_health_check() {
    echo "🧪 Testing health check endpoint..."
    
    # Test with api-dashboard.niete.pk
    echo "Testing: https://api-dashboard.niete.pk/api/health/"
    response=$(curl -s -o /dev/null -w "%{http_code}" -H 'Host: api-dashboard.niete.pk' https://api-dashboard.niete.pk/api/health/)
    
    if [ "$response" = "200" ] || [ "$response" = "400" ]; then
        echo "✅ Success: Status $response"
    else
        echo "❌ Failed: Status $response"
        echo "   This indicates the ALLOWED_HOSTS is not properly configured"
    fi
}

# Function to show current configuration
show_current_config() {
    echo "📋 Current Configuration:"
    echo "------------------------"
    
    # Check if we can access Django settings
    if command_exists python; then
        echo "Attempting to check Django settings..."
        python -c "
import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
try:
    django.setup()
    from django.conf import settings
    print(f'DJANGO_SETTINGS_MODULE: {os.environ.get(\"DJANGO_SETTINGS_MODULE\", \"Not set\")}')
    print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
    print(f'DEBUG: {settings.DEBUG}')
except Exception as e:
    print(f'Error accessing Django settings: {e}')
    print('This is normal if Django is not properly configured in this environment')
" 2>/dev/null || echo "Could not access Django settings (this is normal)"
    fi
    
    echo ""
    echo "Environment Variables:"
    echo "ALLOWED_HOSTS: ${ALLOWED_HOSTS:-Not set}"
    echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-Not set}"
}

# Function to provide update instructions
provide_instructions() {
    echo ""
    echo "🚀 Update Instructions:"
    echo "======================"
    echo ""
    echo "1. SSH into your production server:"
    echo "   ssh user@your-production-server"
    echo ""
    echo "2. Navigate to your Django project directory:"
    echo "   cd /path/to/your/django/project"
    echo ""
    echo "3. Update the ALLOWED_HOSTS environment variable:"
    echo "   export ALLOWED_HOSTS=\"localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk\""
    echo ""
    echo "4. Add to your .env file (if using one):"
    echo "   echo \"ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk\" >> .env"
    echo ""
    echo "5. Restart your Django application:"
    echo "   # If using systemd:"
    echo "   sudo systemctl restart your-django-service"
    echo ""
    echo "   # If using supervisor:"
    echo "   sudo supervisorctl restart your-django-app"
    echo ""
    echo "   # If using Docker:"
    echo "   docker-compose restart backend"
    echo ""
    echo "6. Test the changes:"
    echo "   curl -H 'Host: api-dashboard.niete.pk' https://api-dashboard.niete.pk/api/health/"
    echo ""
}

# Function to show troubleshooting steps
show_troubleshooting() {
    echo ""
    echo "🔍 Troubleshooting Steps:"
    echo "========================="
    echo ""
    echo "If you're still getting DisallowedHost errors:"
    echo ""
    echo "1. Check current ALLOWED_HOSTS:"
    echo "   python manage.py shell"
    echo "   >>> from django.conf import settings"
    echo "   >>> print(settings.ALLOWED_HOSTS)"
    echo ""
    echo "2. Check environment variables:"
    echo "   echo \$ALLOWED_HOSTS"
    echo "   env | grep ALLOWED_HOSTS"
    echo ""
    echo "3. Check settings module:"
    echo "   echo \$DJANGO_SETTINGS_MODULE"
    echo ""
    echo "4. Restart all services:"
    echo "   sudo systemctl restart nginx"
    echo "   sudo systemctl restart your-django-service"
    echo ""
    echo "5. Check if backend/settings.py exists:"
    echo "   ls -la backend/settings.py"
    echo ""
    echo "6. If backend/settings.py doesn't exist, create it with the content from PRODUCTION_ALLOWED_HOSTS_FIX.md"
    echo ""
}

# Main script
echo "This script will help you update the production server's ALLOWED_HOSTS configuration."
echo ""

# Test current status
test_health_check

echo ""
show_current_config

# Provide instructions
provide_instructions

# Show troubleshooting
show_troubleshooting

echo ""
echo "📝 Summary:"
echo "==========="
echo "The production server needs to have 'api-dashboard.niete.pk' and 'dashboard.niete.pk'"
echo "added to its ALLOWED_HOSTS configuration. This can be done through environment"
echo "variables or by updating the settings file."
echo ""
echo "After making the changes and restarting the Django application, both domains"
echo "should work without DisallowedHost errors."
echo ""
echo "For detailed instructions, see: PRODUCTION_ALLOWED_HOSTS_FIX.md" 