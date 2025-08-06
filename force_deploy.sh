#!/bin/bash

echo "🚀 Force Deploying CORS Fix"
echo "============================"
echo ""

echo "📝 Making a small change to force deployment..."
echo "# Force deployment - $(date)" >> backend/settings.py

echo "📦 Committing the change..."
git add backend/settings.py
git commit -m "Force deploy CORS and ALLOWED_HOSTS fix - $(date)"

echo "🚀 Pushing to trigger CI/CD pipeline..."
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "📋 What's happening:"
echo "   1. CI/CD pipeline will build new Docker image"
echo "   2. New container will use updated settings.py"
echo "   3. Old container will be stopped and removed"
echo "   4. New container will start with CORS fixes"
echo ""
echo "⏳ Wait 2-3 minutes for deployment to complete"
echo "🔄 Then test with: ./check_deployment_status.sh" 