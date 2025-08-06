# Production CORS Deployment Guide

## 🚨 **Current Issue**

The production server at `https://api-dashboard.niete.pk` is not returning CORS headers, causing the frontend at `https://dashboard.niete.pk` to fail with CORS policy errors.

## ✅ **Solution Status**

- ✅ CORS configuration has been updated in the codebase
- ✅ Local development server is working correctly
- ✅ Production server needs to be restarted with new configuration

## 🔧 **Deployment Steps**

### **Step 1: Update Production Server Configuration**

1. **SSH into your production server**
   ```bash
   ssh user@your-production-server
   ```

2. **Navigate to the Django project directory**
   ```bash
   cd /path/to/your/django/project
   ```

3. **Update the CORS configuration**
   - Copy the updated `backend/main_api/settings.py` file to your production server
   - Or manually update the CORS settings in your production `settings.py`:

   ```python
   # CORS settings
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
       "https://dashboard.niete.pk",        # ✅ Add this
       "https://api-dashboard.niete.pk",    # ✅ Add this
   ]

   CORS_ALLOW_CREDENTIALS = True

   # Additional CORS headers for better compatibility
   CORS_ALLOW_HEADERS = [
       'accept',
       'accept-encoding',
       'authorization',
       'content-type',
       'dnt',
       'origin',
       'user-agent',
       'x-csrftoken',
       'x-requested-with',
   ]

   CORS_EXPOSE_HEADERS = [
       'content-type',
       'content-disposition',
   ]
   ```

### **Step 2: Update Environment Variables**

1. **Update your production `.env` file**
   ```bash
   # Add or update these lines in your .env file
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://dashboard.niete.pk,https://api-dashboard.niete.pk
   CORS_ALLOW_ALL_ORIGINS=False
   ```

### **Step 3: Restart the Production Server**

**Option A: If using systemd service**
```bash
sudo systemctl restart your-django-service
sudo systemctl status your-django-service
```

**Option B: If using supervisor**
```bash
sudo supervisorctl restart your-django-app
sudo supervisorctl status your-django-app
```

**Option C: If using Docker**
```bash
docker-compose down
docker-compose up -d
```

**Option D: If running directly with gunicorn**
```bash
# Find the process
ps aux | grep gunicorn

# Kill the process
sudo kill -HUP <process_id>

# Or restart the service
sudo systemctl restart gunicorn
```

### **Step 4: Verify the Deployment**

1. **Test CORS headers using curl**
   ```bash
   curl -X OPTIONS \
     -H "Origin: https://dashboard.niete.pk" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     https://api-dashboard.niete.pk/api/auth/login/ \
     -v
   ```

2. **Expected response headers**
   ```
   Access-Control-Allow-Origin: https://dashboard.niete.pk
   Access-Control-Allow-Methods: DELETE, GET, OPTIONS, PATCH, POST, PUT
   Access-Control-Allow-Headers: accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with
   Access-Control-Allow-Credentials: true
   ```

3. **Test from the frontend**
   - Open `https://dashboard.niete.pk` in your browser
   - Open Developer Tools (F12)
   - Go to Network tab
   - Try to login
   - Check that there are no CORS errors

## 🔍 **Troubleshooting**

### **If CORS headers are still missing:**

1. **Check if the middleware is loaded**
   ```python
   # In your settings.py, ensure this is in MIDDLEWARE:
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',  # Must be first
       'django.middleware.security.SecurityMiddleware',
       # ... other middleware
   ]
   ```

2. **Check if django-cors-headers is installed**
   ```bash
   pip list | grep cors
   ```

3. **Check server logs**
   ```bash
   # If using systemd
   sudo journalctl -u your-django-service -f

   # If using supervisor
   tail -f /var/log/supervisor/your-app.log

   # If using Docker
   docker-compose logs -f backend
   ```

### **If the server won't restart:**

1. **Check for syntax errors**
   ```bash
   python manage.py check
   ```

2. **Check for missing dependencies**
   ```bash
   pip install django-cors-headers
   ```

3. **Verify file permissions**
   ```bash
   ls -la settings.py
   ```

## 🧪 **Testing Scripts**

### **Use the provided test script**
```bash
python3 test_cors_fix.py
```

### **Manual testing with curl**
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  https://api-dashboard.niete.pk/api/auth/login/ \
  -v

# Test actual request
curl -X POST \
  -H "Origin: https://dashboard.niete.pk" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  https://api-dashboard.niete.pk/api/auth/login/ \
  -v
```

## 📋 **Checklist**

- [ ] Updated `settings.py` with new CORS configuration
- [ ] Updated production `.env` file
- [ ] Restarted the Django server
- [ ] Verified CORS headers are present in responses
- [ ] Tested login functionality from frontend
- [ ] No CORS errors in browser console

## 🎯 **Expected Result**

After completing these steps:
- ✅ Frontend can successfully make requests to the API
- ✅ No more CORS policy errors
- ✅ Authentication and all API endpoints work correctly
- ✅ Browser console shows no CORS-related errors

## 📞 **Support**

If you continue to experience issues after following these steps:
1. Check the server logs for any error messages
2. Verify the CORS configuration is correctly applied
3. Test with the provided scripts to isolate the issue
4. Consider temporarily enabling `CORS_ALLOW_ALL_ORIGINS=True` for debugging 