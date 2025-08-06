#!/bin/bash

echo "🔍 Checking Deployment Status"
echo "============================"
echo ""

echo "📊 Current Production Server Status:"
echo "-----------------------------------"

# Test if the server is responding
echo "1️⃣ Testing server response..."
if curl -s -o /dev/null -w "%{http_code}" https://api-dashboard.niete.pk/api/health/ | grep -q "200\|400"; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    exit 1
fi

echo ""
echo "2️⃣ Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -X OPTIONS \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -I https://api-dashboard.niete.pk/api/auth/login/ 2>/dev/null)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers are present"
    echo "$CORS_RESPONSE" | grep "Access-Control-Allow"
else
    echo "❌ CORS headers are missing"
fi

echo ""
echo "3️⃣ Testing ALLOWED_HOSTS..."
HOST_RESPONSE=$(curl -s -H "Host: api-dashboard.niete.pk" \
  https://api-dashboard.niete.pk/api/health/ 2>/dev/null)

if echo "$HOST_RESPONSE" | grep -q "DisallowedHost"; then
    echo "❌ ALLOWED_HOSTS not updated - still getting DisallowedHost error"
else
    echo "✅ ALLOWED_HOSTS appears to be working"
fi

echo ""
echo "📋 Deployment Status Summary:"
echo "============================"

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin" && ! echo "$HOST_RESPONSE" | grep -q "DisallowedHost"; then
    echo "🎉 SUCCESS: Deployment completed successfully!"
    echo "✅ CORS is working"
    echo "✅ ALLOWED_HOSTS is working"
    echo ""
    echo "🧪 Test your frontend:"
    echo "   Go to https://dashboard.niete.pk"
    echo "   Try to log in"
    echo "   Should work without CORS errors"
else
    echo "❌ ISSUE: Deployment may not be complete"
    echo ""
    echo "🔧 Possible issues:"
    echo "   1. CI/CD pipeline is still running"
    echo "   2. CI/CD pipeline failed"
    echo "   3. Django service wasn't restarted"
    echo "   4. Files weren't deployed correctly"
    echo ""
    echo "📞 Next steps:"
    echo "   1. Check your CI/CD pipeline status"
    echo "   2. Wait a few more minutes for deployment"
    echo "   3. If still failing, check pipeline logs"
    echo "   4. Manually restart Django service if needed"
fi

echo ""
echo "🔄 To retest, run: ./test_cors_commands.sh" 