# Production ALLOWED_HOSTS Fix

## 🚨 **Issue Identified**

The production server is using a different Django settings configuration than the local development environment:

- **Local**: Uses `main_api.settings` 
- **Production**: Uses `backend.settings`
- **Production ALLOWED_HOSTS**: `['localhost', '127.0.0.1', 'localhost:3000', 'chatsql.taleemabad.com', 'www.chatsql.taleemabad.com']`
- **Missing**: `api-dashboard.niete.pk` and `dashboard.niete.pk`

## 🔧 **Solution**

### **Option 1: Update Production Environment Variables (Recommended)**

The production server is likely using environment variables to override the settings. Update the production environment:

```bash
# Set the environment variable on the production server
export ALLOWED_HOSTS="localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk"
```

### **Option 2: Update Production Settings File**

If the production server has a `backend/settings.py` file, update it:

```python
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'localhost:3000',
    'chatsql.taleemabad.com',
    'www.chatsql.taleemabad.com',
    'api-dashboard.niete.pk',
    'dashboard.niete.pk'
]
```

### **Option 3: Create Production Settings File**

If `backend/settings.py` doesn't exist, create it:

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
# Add to your .env file or environment
echo "ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,chatsql.taleemabad.com,www.chatsql.taleemabad.com,api-dashboard.niete.pk,dashboard.niete.pk" >> .env
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

### **5. Verify the Changes**
```bash
# Test the health check endpoint
curl https://api-dashboard.niete.pk/api/health/

# Test with explicit host header
curl -H 'Host: api-dashboard.niete.pk' https://api-dashboard.niete.pk/api/health/
```

## 🧪 **Testing Commands**

### **Test ALLOWED_HOSTS Configuration**
```bash
# Test both domains
curl -H 'Host: api-dashboard.niete.pk' https://api-dashboard.niete.pk/api/health/
curl -H 'Host: dashboard.niete.pk' https://dashboard.niete.pk/api/health/

# Test with different user agents
curl -H 'Host: api-dashboard.niete.pk' -H 'User-Agent: PostmanRuntime/7.45.0' https://api-dashboard.niete.pk/api/health/
```

### **Expected Results**
- ✅ Status 200 or 400 (not DisallowedHost error)
- ✅ No "Invalid HTTP_HOST header" error
- ✅ Request reaches Django successfully

## 🔍 **Troubleshooting**

### **If Still Getting DisallowedHost Error**

1. **Check Current ALLOWED_HOSTS**
   ```bash
   # Connect to Django shell on production
   python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(settings.ALLOWED_HOSTS)
   ```

2. **Check Environment Variables**
   ```bash
   echo $ALLOWED_HOSTS
   env | grep ALLOWED_HOSTS
   ```

3. **Check Settings Module**
   ```bash
   echo $DJANGO_SETTINGS_MODULE
   ```

4. **Restart All Services**
   ```bash
   # Restart web server (nginx/apache)
   sudo systemctl restart nginx
   
   # Restart Django application
   sudo systemctl restart your-django-service
   ```

### **Common Issues**

1. **Environment Variable Not Set**
   - Make sure `ALLOWED_HOSTS` is properly set in production
   - Check if the `.env` file is being loaded

2. **Wrong Settings Module**
   - Verify `DJANGO_SETTINGS_MODULE` is set correctly
   - Check if `backend.settings` exists or should be `main_api.settings`

3. **Caching Issues**
   - Clear any application caches
   - Restart the entire application stack

## 📋 **Summary**

The issue is that the production server:
1. Uses `backend.settings` instead of `main_api.settings`
2. Has different `ALLOWED_HOSTS` than the local environment
3. Doesn't include the new domains (`api-dashboard.niete.pk`, `dashboard.niete.pk`)

**Solution**: Update the production server's `ALLOWED_HOSTS` to include both new domains, either through environment variables or by updating the settings file.

After making these changes and restarting the Django application, both domains should work without DisallowedHost errors. 