# Production CORS and ALLOWED_HOSTS Fix

## 🚨 **Issue Identified**

The production server is experiencing two related issues:

1. **ALLOWED_HOSTS**: Missing `api-dashboard.niete.pk` and `dashboard.niete.pk`
2. **CORS**: Missing `https://dashboard.niete.pk` in `CORS_ALLOWED_ORIGINS`

The error shows that the preflight request (OPTIONS) is being blocked because the production server doesn't have the correct CORS configuration.

## 🔧 **Root Cause**

The production server is using `backend.settings` (not `main_api.settings`) and has different configurations than your local environment:

- **Production ALLOWED_HOSTS**: `['localhost', '127.0.0.1', 'localhost:3000', 'chatsql.taleemabad.com', 'www.chatsql.taleemabad.com']`
- **Production CORS_ALLOWED_ORIGINS**: Likely missing the new domains
- **Missing**: Both `api-dashboard.niete.pk` and `dashboard.niete.pk` in both settings

## 🚀 **Solution**

### **Option 1: Environment Variables (Recommended)**

Update the production server's environment variables:

```bash
# SSH into your production server
ssh user@your-production-server

# Set environment variables
export ALLOWED_HOSTS="localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk"

export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://chatsql.taleemabad.com,https://www.chatsql.taleemabad.com,https://dashboard.niete.pk,https://api-dashboard.niete.pk"

# Add to your .env file (if using one)
echo "ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk" >> .env
echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://chatsql.taleemabad.com,https://www.chatsql.taleemabad.com,https://dashboard.niete.pk,https://api-dashboard.niete.pk" >> .env
```

### **Option 2: Update Production Settings File**

If the production server has a `backend/settings.py` file, update it:

```python
# backend/settings.py

# ALLOWED_HOSTS configuration
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'localhost:3000',
    'chatsql.taleemabad.com',
    'www.chatsql.taleemabad.com',
    'api-dashboard.niete.pk',
    'dashboard.niete.pk'
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chatsql.taleemabad.com",
    "https://www.chatsql.taleemabad.com",
    "https://dashboard.niete.pk",
    "https://api-dashboard.niete.pk",
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

### **Option 3: Create Complete Production Settings File**

If `backend/settings.py` doesn't exist, create it with the complete configuration:

```python
# backend/settings.py
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'localhost:3000',
    'chatsql.taleemabad.com',
    'www.chatsql.taleemabad.com',
    'api-dashboard.niete.pk',
    'dashboard.niete.pk'
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'chatapi',
    'aiapi',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chatsql.taleemabad.com",
    "https://www.chatsql.taleemabad.com",
    "https://dashboard.niete.pk",
    "https://api-dashboard.niete.pk",
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

# Static files
STATIC_URL = '/backend-static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

## 🚀 **Deployment Steps**

### **1. SSH into Production Server**
```bash
ssh user@your-production-server
```

### **2. Navigate to Project Directory**
```bash
cd /path/to/your/django/project
```

### **3. Update Environment Variables**
```bash
# Set the environment variables
export ALLOWED_HOSTS="localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://chatsql.taleemabad.com,https://www.chatsql.taleemabad.com,https://dashboard.niete.pk,https://api-dashboard.niete.pk"

# Add to your .env file (if using one)
echo "ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk" >> .env
echo "CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://chatsql.taleemabad.com,https://www.chatsql.taleemabad.com,https://dashboard.niete.pk,https://api-dashboard.niete.pk" >> .env
```

### **4. Restart Django Application**
```bash
# If using systemd
sudo systemctl restart your-django-service

# If using supervisor
sudo supervisorctl restart your-django-app

# If using Docker
docker-compose restart backend

# If using PM2
pm2 restart your-app-name
```

### **5. Test the Changes**
```bash
# Test CORS preflight request
curl -X OPTIONS -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  https://api-dashboard.niete.pk/api/auth/login/

# Test actual login request
curl -X POST -H "Origin: https://dashboard.niete.pk" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  https://api-dashboard.niete.pk/api/auth/login/
```

## 🧪 **Testing Commands**

### **Test CORS Configuration**
```bash
# Test preflight request
curl -X OPTIONS -H "Origin: https://dashboard.niete.pk" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  https://api-dashboard.niete.pk/api/auth/login/

# Test with different origins
curl -X OPTIONS -H "Origin: https://api-dashboard.niete.pk" \
  -H "Access-Control-Request-Method: GET" \
  https://api-dashboard.niete.pk/api/health/
```

### **Expected Results**
- ✅ Status 200 for OPTIONS requests
- ✅ `Access-Control-Allow-Origin: https://dashboard.niete.pk` header present
- ✅ `Access-Control-Allow-Methods: POST, OPTIONS` header present
- ✅ `Access-Control-Allow-Headers: content-type` header present

## 🔍 **Troubleshooting**

### **If Still Getting CORS Errors**

1. **Check Current CORS Settings**
   ```bash
   # Connect to Django shell on production
   python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(settings.CORS_ALLOWED_ORIGINS)
   print(settings.ALLOWED_HOSTS)
   ```

2. **Check Environment Variables**
   ```bash
   echo $CORS_ALLOWED_ORIGINS
   echo $ALLOWED_HOSTS
   env | grep CORS
   env | grep ALLOWED_HOSTS
   ```

3. **Check if CORS Middleware is Active**
   ```python
   from django.conf import settings
   print('corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE)
   ```

4. **Test with curl**
   ```bash
   # Test preflight request
   curl -v -X OPTIONS -H "Origin: https://dashboard.niete.pk" \
     -H "Access-Control-Request-Method: POST" \
     https://api-dashboard.niete.pk/api/auth/login/
   ```

### **Common Issues**

1. **CORS Middleware Not First**
   - `corsheaders.middleware.CorsMiddleware` must be first in MIDDLEWARE list

2. **Environment Variables Not Set**
   - Make sure both `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are set

3. **Settings Module Wrong**
   - Verify `DJANGO_SETTINGS_MODULE` is set correctly

4. **Nginx Intercepting OPTIONS**
   - Check if Nginx is handling OPTIONS requests instead of passing to Django

## 📋 **Summary**

The production server needs both:
1. **ALLOWED_HOSTS**: Add `api-dashboard.niete.pk` and `dashboard.niete.pk`
2. **CORS_ALLOWED_ORIGINS**: Add `https://dashboard.niete.pk` and `https://api-dashboard.niete.pk`

After updating both configurations and restarting the Django application, the CORS errors should be resolved and the frontend should be able to communicate with the backend successfully. 