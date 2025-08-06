#!/bin/bash

# 🚨 URGENT: Deploy CORS and ALLOWED_HOSTS Fix
# This script will deploy the updated backend files to fix the CORS error

echo "🚨 DEPLOYING CORS AND ALLOWED_HOSTS FIX"
echo "=========================================="

# Check if files exist locally
echo "📁 Checking local files..."
if [ ! -f "backend/settings.py" ]; then
    echo "❌ ERROR: backend/settings.py not found!"
    exit 1
fi

if [ ! -f "backend/urls.py" ]; then
    echo "❌ ERROR: backend/urls.py not found!"
    exit 1
fi

if [ ! -f "backend/wsgi.py" ]; then
    echo "❌ ERROR: backend/wsgi.py not found!"
    exit 1
fi

if [ ! -f "backend/asgi.py" ]; then
    echo "❌ ERROR: backend/asgi.py not found!"
    exit 1
fi

echo "✅ All required files found locally"

# Verify the settings contain the correct domains
echo "🔍 Verifying settings..."
if grep -q "api-dashboard.niete.pk" backend/settings.py; then
    echo "✅ api-dashboard.niete.pk found in ALLOWED_HOSTS"
else
    echo "❌ ERROR: api-dashboard.niete.pk missing from settings!"
    exit 1
fi

if grep -q "dashboard.niete.pk" backend/settings.py; then
    echo "✅ dashboard.niete.pk found in ALLOWED_HOSTS"
else
    echo "❌ ERROR: dashboard.niete.pk missing from settings!"
    exit 1
fi

if grep -q "https://dashboard.niete.pk" backend/settings.py; then
    echo "✅ https://dashboard.niete.pk found in CORS_ALLOWED_ORIGINS"
else
    echo "❌ ERROR: https://dashboard.niete.pk missing from CORS settings!"
    exit 1
fi

echo "✅ Settings verification complete"

echo ""
echo "🚀 READY TO DEPLOY"
echo "=================="
echo ""
echo "You need to copy these files to your production server:"
echo "  📄 backend/settings.py"
echo "  📄 backend/urls.py" 
echo "  📄 backend/wsgi.py"
echo "  📄 backend/asgi.py"
echo "  📄 backend/__init__.py"
echo ""
echo "Then restart your Django application."
echo ""
echo "📋 DEPLOYMENT STEPS:"
echo "===================="
echo ""
echo "1. SSH into your production server:"
echo "   ssh user@your-production-server"
echo ""
echo "2. Navigate to your Django project:"
echo "   cd /path/to/your/django/project"
echo ""
echo "3. Copy the files (from your local machine):"
echo "   scp backend/settings.py user@your-production-server:/path/to/your/django/project/backend/settings.py"
echo "   scp backend/urls.py user@your-production-server:/path/to/your/django/project/backend/urls.py"
echo "   scp backend/wsgi.py user@your-production-server:/path/to/your/django/project/backend/wsgi.py"
echo "   scp backend/asgi.py user@your-production-server:/path/to/your/django/project/backend/asgi.py"
echo "   scp backend/__init__.py user@your-production-server:/path/to/your/django/project/backend/__init__.py"
echo ""
echo "4. Restart your Django application:"
echo "   sudo systemctl restart your-django-service"
echo "   # OR"
echo "   docker-compose restart backend"
echo "   # OR"
echo "   sudo supervisorctl restart your-django-app"
echo ""
echo "5. Test the fix:"
echo "   curl -X OPTIONS -H 'Origin: https://dashboard.niete.pk' \\"
echo "     -H 'Access-Control-Request-Method: POST' \\"
echo "     https://api-dashboard.niete.pk/api/auth/login/"
echo ""
echo "🎯 EXPECTED RESULT:"
echo "=================="
echo "After deployment, you should see:"
echo "  HTTP/1.1 200 OK"
echo "  Access-Control-Allow-Origin: https://dashboard.niete.pk"
echo "  Access-Control-Allow-Methods: POST, OPTIONS"
echo "  Access-Control-Allow-Headers: content-type"
echo "  Access-Control-Allow-Credentials: true"
echo ""
echo "📞 NEED HELP?"
echo "============="
echo "If you need help with the deployment:"
echo "1. Check: IMMEDIATE_DEPLOYMENT_GUIDE.md"
echo "2. Use: ./deploy_production_fix.sh"
echo "3. Test: python3 test_production_cors.py"
echo ""
echo "🚨 URGENT: This deployment is required immediately!"
echo "Your frontend cannot communicate with the backend until this is fixed." 