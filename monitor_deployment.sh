#!/bin/bash

echo "🔍 Monitoring Deployment Progress"
echo "================================"
echo ""

echo "⏳ Waiting for deployment to complete..."
echo "This usually takes 2-3 minutes..."
echo ""

# Wait for 2 minutes
sleep 120

echo "🧪 Testing deployment..."
echo ""

# Test CORS
echo "1️⃣ Testing CORS preflight request..."
CORS_RESPONSE=$(curl -s -X OPTIONS \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -I https://api-dashboard.niete.pk/api/auth/login/ 2>/dev/null)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS is working!"
    echo "$CORS_RESPONSE" | grep "Access-Control-Allow"
else
    echo "❌ CORS still not working"
fi

echo ""
echo "2️⃣ Testing ALLOWED_HOSTS..."
HOST_RESPONSE=$(curl -s -H "Host: api-dashboard.niete.pk" \
  https://api-dashboard.niete.pk/api/health/ 2>/dev/null)

if echo "$HOST_RESPONSE" | grep -q "DisallowedHost"; then
    echo "❌ ALLOWED_HOSTS still not working"
else
    echo "✅ ALLOWED_HOSTS is working!"
fi

echo ""
echo "📋 Summary:"
echo "==========="

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
    echo "❌ Deployment may still be in progress or failed"
    echo ""
    echo "🔄 Wait another minute and run: ./check_deployment_status.sh"
fi 