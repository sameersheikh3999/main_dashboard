#!/bin/bash

echo "🧪 Testing Educational Dashboard Services"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" "$url" -o /tmp/response)
    status_code=${response: -3}
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL (Status: $status_code)${NC}"
        if [ -f /tmp/response ]; then
            echo "Response: $(cat /tmp/response)"
        fi
    fi
}

# Test Backend Health
echo ""
echo "🔍 Testing Backend Services..."
test_endpoint "http://localhost:8000/api/health" "Backend Health Check" "200"

# Test Frontend
echo ""
echo "🌐 Testing Frontend Services..."
test_endpoint "http://localhost:3000" "Frontend Application" "200"

# Test BigQuery endpoints (should return 401 - authentication required)
echo ""
echo "📊 Testing BigQuery Integration..."
test_endpoint "http://localhost:8000/api/bigquery/filter-options" "BigQuery Filter Options" "401"

# Test Authentication endpoint
echo ""
echo "🔐 Testing Authentication..."
test_endpoint "http://localhost:8000/api/auth/login" "Login Endpoint" "405"  # Method not allowed for GET

# Check if services are running
echo ""
echo "🔄 Checking Service Processes..."
backend_running=$(ps aux | grep "manage.py runserver" | grep -v grep | wc -l)
frontend_running=$(ps aux | grep "react-scripts start" | grep -v grep | wc -l)

if [ $backend_running -gt 0 ]; then
    echo -e "${GREEN}✅ Backend (Django) is running${NC}"
else
    echo -e "${RED}❌ Backend (Django) is not running${NC}"
fi

if [ $frontend_running -gt 0 ]; then
    echo -e "${GREEN}✅ Frontend (React) is running${NC}"
else
    echo -e "${RED}❌ Frontend (React) is not running${NC}"
fi

# Summary
echo ""
echo "📋 Summary:"
echo "==========="
echo "• Backend API: http://localhost:8000/api/"
echo "• Frontend App: http://localhost:3000"
echo "• Health Check: http://localhost:8000/api/health"
echo ""
echo "🎯 To access the application:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with default credentials:"
echo "   - FDE: username=fde, password=fde123"
echo "   - AEO: username=aeo_bk, password=aeo123"
echo "   - Principal: username=principal_al_noor_elementary, password=principal123"

# Cleanup
rm -f /tmp/response 