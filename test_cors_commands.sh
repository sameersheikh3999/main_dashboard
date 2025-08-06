#!/bin/bash

echo "🧪 Testing CORS Configuration"
echo "=============================="
echo ""

echo "1️⃣ Testing CORS Preflight Request (OPTIONS):"
echo "--------------------------------------------"
curl -X OPTIONS \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v \
  https://api-dashboard.niete.pk/api/auth/login/

echo ""
echo ""
echo "2️⃣ Testing Actual Login Request (POST):"
echo "---------------------------------------"
curl -X POST \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -v \
  https://api-dashboard.niete.pk/api/auth/login/

echo ""
echo ""
echo "3️⃣ Testing Health Check:"
echo "------------------------"
curl -H "Origin: https://dashboard.niete.pk" \
  -v \
  https://api-dashboard.niete.pk/api/health/

echo ""
echo ""
echo "📋 Expected Results:"
echo "==================="
echo "✅ If CORS is working, you should see:"
echo "   Access-Control-Allow-Origin: https://dashboard.niete.pk"
echo "   Access-Control-Allow-Methods: POST, OPTIONS"
echo "   Access-Control-Allow-Headers: content-type"
echo "   Access-Control-Allow-Credentials: true"
echo ""
echo "❌ If CORS is NOT working, you won't see any CORS headers"
echo ""
echo "🚨 If you don't see CORS headers, deploy the fix:"
echo "   ./deploy_fix_now.sh" 