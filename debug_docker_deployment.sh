#!/bin/bash

echo "🐳 Debugging Docker Deployment"
echo "=============================="
echo ""

echo "📋 Checking if we can access the production server..."
echo ""

# Test basic connectivity
echo "1️⃣ Testing server connectivity..."
if curl -s -o /dev/null -w "%{http_code}" https://api-dashboard.niete.pk/api/health/ | grep -q "200\|400"; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    exit 1
fi

echo ""
echo "2️⃣ Testing current settings..."
echo "Getting current ALLOWED_HOSTS and CORS settings..."

# Get the current settings from the server
SETTINGS_RESPONSE=$(curl -s https://api-dashboard.niete.pk/api/health/ 2>/dev/null)

if echo "$SETTINGS_RESPONSE" | grep -q "DisallowedHost"; then
    echo "❌ Still getting DisallowedHost error"
    echo "This means the new settings are not being used"
else
    echo "✅ No DisallowedHost error - settings might be updated"
fi

echo ""
echo "3️⃣ Testing CORS headers..."
CORS_RESPONSE=$(curl -s -X OPTIONS \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -I https://api-dashboard.niete.pk/api/auth/login/ 2>/dev/null)

echo "CORS Response Headers:"
echo "$CORS_RESPONSE" | head -10

echo ""
echo "🔧 Possible Issues:"
echo "=================="
echo "1. CI/CD pipeline might have failed"
echo "2. Docker container might not be restarting"
echo "3. Environment variables might be overriding settings"
echo "4. Old Docker image might be cached"
echo ""
echo "📞 Next Steps:"
echo "=============="
echo "1. Check GitHub Actions status:"
echo "   - Go to https://github.com/sameersheikh3999/main_dashboard/actions"
echo "   - Look for the latest deployment run"
echo "   - Check if it succeeded or failed"
echo ""
echo "2. If CI/CD failed, try manual deployment:"
echo "   - SSH into your production server"
echo "   - Check Docker container logs"
echo "   - Restart the container manually"
echo ""
echo "3. If CI/CD succeeded but still not working:"
echo "   - The container might need manual restart"
echo "   - Environment variables might be overriding settings"
echo ""
echo "🔄 To check deployment status again:"
echo "   ./check_deployment_status.sh" 