#!/bin/bash

# Production Deployment Script
# This script helps deploy the CORS and ALLOWED_HOSTS fix to production

echo "🚀 Production Deployment Script"
echo "==============================="
echo "This script will help you deploy the CORS and ALLOWED_HOSTS fix to production."
echo ""

# Function to check if files exist
check_files() {
    echo "📋 Checking required files..."
    
    files=(
        "backend/settings.py"
        "backend/urls.py"
        "backend/wsgi.py"
        "backend/__init__.py"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✅ $file exists"
        else
            echo "  ❌ $file missing"
            return 1
        fi
    done
    
    echo "  ✅ All required files exist"
    return 0
}

# Function to show deployment steps
show_deployment_steps() {
    echo ""
    echo "🚀 Deployment Steps:"
    echo "==================="
    echo ""
    echo "1. SSH into your production server:"
    echo "   ssh user@your-production-server"
    echo ""
    echo "2. Navigate to your Django project directory:"
    echo "   cd /path/to/your/django/project"
    echo ""
    echo "3. Copy the updated files to production:"
    echo "   # Copy backend/settings.py"
    echo "   scp backend/settings.py user@your-production-server:/path/to/your/django/project/backend/settings.py"
    echo ""
    echo "   # Copy backend/urls.py"
    echo "   scp backend/urls.py user@your-production-server:/path/to/your/django/project/backend/urls.py"
    echo ""
    echo "   # Copy backend/wsgi.py"
    echo "   scp backend/wsgi.py user@your-production-server:/path/to/your/django/project/backend/wsgi.py"
    echo ""
    echo "   # Copy backend/__init__.py"
    echo "   scp backend/__init__.py user@your-production-server:/path/to/your/django/project/backend/__init__.py"
    echo ""
    echo "4. Restart your Django application:"
    echo "   # If using systemd"
    echo "   sudo systemctl restart your-django-service"
    echo ""
    echo "   # If using supervisor"
    echo "   sudo supervisorctl restart your-django-app"
    echo ""
    echo "   # If using Docker"
    echo "   docker-compose restart backend"
    echo ""
    echo "   # If using PM2"
    echo "   pm2 restart your-app-name"
    echo ""
    echo "5. Test the deployment:"
    echo "   curl -X OPTIONS -H 'Origin: https://dashboard.niete.pk' \\"
    echo "     -H 'Access-Control-Request-Method: POST' \\"
    echo "     https://api-dashboard.niete.pk/api/auth/login/"
    echo ""
}

# Function to show verification commands
show_verification_commands() {
    echo ""
    echo "🧪 Verification Commands:"
    echo "========================"
    echo ""
    echo "# Test CORS preflight request"
    echo "curl -X OPTIONS -H 'Origin: https://dashboard.niete.pk' \\"
    echo "  -H 'Access-Control-Request-Method: POST' \\"
    echo "  -H 'Access-Control-Request-Headers: content-type' \\"
    echo "  https://api-dashboard.niete.pk/api/auth/login/"
    echo ""
    echo "# Test actual login request"
    echo "curl -X POST -H 'Origin: https://dashboard.niete.pk' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"username\":\"test\",\"password\":\"test\"}' \\"
    echo "  https://api-dashboard.niete.pk/api/auth/login/"
    echo ""
    echo "# Test health check"
    echo "curl -H 'Origin: https://dashboard.niete.pk' \\"
    echo "  https://api-dashboard.niete.pk/api/health/"
    echo ""
    echo "# Check headers"
    echo "curl -I -H 'Origin: https://dashboard.niete.pk' \\"
    echo "  https://api-dashboard.niete.pk/api/auth/login/"
    echo ""
}

# Function to show expected results
show_expected_results() {
    echo ""
    echo "✅ Expected Results After Deployment:"
    echo "===================================="
    echo ""
    echo "After successful deployment, you should see:"
    echo ""
    echo "1. CORS Preflight Request (OPTIONS):"
    echo "   - Status Code: 200"
    echo "   - Access-Control-Allow-Origin: https://dashboard.niete.pk"
    echo "   - Access-Control-Allow-Methods: POST, OPTIONS"
    echo "   - Access-Control-Allow-Headers: content-type"
    echo "   - Access-Control-Allow-Credentials: true"
    echo ""
    echo "2. Actual Login Request (POST):"
    echo "   - Status Code: 400 (expected for invalid credentials)"
    echo "   - Access-Control-Allow-Origin: https://dashboard.niete.pk"
    echo "   - Access-Control-Allow-Credentials: true"
    echo ""
    echo "3. Frontend Login:"
    echo "   - No CORS errors in browser console"
    echo "   - Login form works without blocking"
    echo ""
}

# Function to show troubleshooting
show_troubleshooting() {
    echo ""
    echo "🔍 Troubleshooting:"
    echo "=================="
    echo ""
    echo "If you still get CORS errors after deployment:"
    echo ""
    echo "1. Check if files were copied correctly:"
    echo "   ls -la backend/"
    echo ""
    echo "2. Check Django settings on production:"
    echo "   python manage.py shell"
    echo "   >>> from django.conf import settings"
    echo "   >>> print(settings.ALLOWED_HOSTS)"
    echo "   >>> print(settings.CORS_ALLOWED_ORIGINS)"
    echo ""
    echo "3. Check if Django application restarted:"
    echo "   # Check systemd status"
    echo "   sudo systemctl status your-django-service"
    echo ""
    echo "   # Check supervisor status"
    echo "   sudo supervisorctl status your-django-app"
    echo ""
    echo "4. Check logs for errors:"
    echo "   # Systemd logs"
    echo "   sudo journalctl -u your-django-service -f"
    echo ""
    echo "   # Supervisor logs"
    echo "   sudo tail -f /var/log/supervisor/your-django-app.log"
    echo ""
    echo "5. Test with curl:"
    echo "   curl -v -X OPTIONS -H 'Origin: https://dashboard.niete.pk' \\"
    echo "     -H 'Access-Control-Request-Method: POST' \\"
    echo "     https://api-dashboard.niete.pk/api/auth/login/"
    echo ""
}

# Main script
echo "This script will help you deploy the CORS and ALLOWED_HOSTS fix to production."
echo ""

# Check if required files exist
if check_files; then
    echo ""
    echo "✅ All required files are ready for deployment!"
    echo ""
    
    # Show deployment steps
    show_deployment_steps
    
    # Show verification commands
    show_verification_commands
    
    # Show expected results
    show_expected_results
    
    # Show troubleshooting
    show_troubleshooting
    
    echo ""
    echo "📝 Summary:"
    echo "==========="
    echo "The deployment involves copying the updated backend files to your production server"
    echo "and restarting the Django application. This will fix both the ALLOWED_HOSTS and"
    echo "CORS issues that are currently preventing your frontend from communicating with"
    echo "the backend."
    echo ""
    echo "After deployment, test the fix using the verification commands above."
    echo ""
    echo "For detailed instructions, see: PRODUCTION_CORS_ALLOWED_HOSTS_FIX.md"
    
else
    echo ""
    echo "❌ Some required files are missing. Please ensure all files are created before deployment."
    echo ""
    echo "Required files:"
    echo "- backend/settings.py"
    echo "- backend/urls.py"
    echo "- backend/wsgi.py"
    echo "- backend/__init__.py"
    echo ""
    echo "These files have been created in your local codebase and are ready for deployment."
fi 