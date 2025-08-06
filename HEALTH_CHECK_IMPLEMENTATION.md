# Health Check API Implementation

## 🏥 **Overview**

A comprehensive health check endpoint has been implemented at `/api/health/` to monitor the system status, database connectivity, system resources, and CORS configuration.

## 📍 **Endpoint Details**

- **URL**: `https://api-dashboard.niete.pk/api/health/`
- **Method**: `GET`
- **Authentication**: None required (public endpoint)
- **Response**: JSON with comprehensive system status

## 🔧 **Implementation**

### **Enhanced HealthCheckView**

The health check endpoint provides detailed information about:

1. **Basic System Info**
   - Status (ok/degraded/error)
   - Timestamp
   - Version
   - Environment (development/production)
   - Debug mode status

2. **Database Health**
   - Connection status
   - Query execution test

3. **System Resources**
   - CPU usage percentage
   - Memory usage percentage
   - Disk usage percentage

4. **CORS Configuration**
   - Configured origins
   - Frontend origin allowance status

5. **API Endpoints**
   - List of available endpoints

## 📊 **Response Format**

### **Successful Response (200 OK)**
```json
{
  "status": "ok",
  "timestamp": "2025-08-06T09:30:00.123456",
  "version": "1.0.0",
  "environment": "production",
  "debug": false,
  "database": {
    "status": "ok",
    "connection": "active"
  },
  "system": {
    "cpu_percent": 15.2,
    "memory_percent": 45.8,
    "disk_percent": 23.1
  },
  "cors": {
    "configured_origins": [
      "https://dashboard.niete.pk",
      "https://api-dashboard.niete.pk"
    ],
    "frontend_origin_allowed": true
  },
  "endpoints": {
    "auth": "/api/auth/login/",
    "health": "/api/health/",
    "data": "/api/bigquery/aggregated-data/",
    "messages": "/api/messages/"
  }
}
```

### **Error Response (500 Internal Server Error)**
```json
{
  "status": "error",
  "error": "Database connection failed",
  "timestamp": "2025-08-06T09:30:00.123456"
}
```

## 🧪 **Testing**

### **Using curl**
```bash
# Test local development
curl http://localhost:8000/api/health/

# Test production
curl https://api-dashboard.niete.pk/api/health/
```

### **Using the test script**
```bash
python3 test_health_check.py
```

## 🔍 **Monitoring Use Cases**

### **1. Load Balancer Health Checks**
- Load balancers can use this endpoint to determine if the server is healthy
- Returns 200 OK for healthy, 500 for unhealthy

### **2. System Monitoring**
- Monitor CPU, memory, and disk usage
- Track database connectivity
- Verify CORS configuration

### **3. DevOps Monitoring**
- Integration with monitoring tools (Prometheus, Grafana, etc.)
- Alerting based on system resource thresholds
- Database connectivity monitoring

### **4. CORS Debugging**
- Verify that frontend domain is properly configured
- Check CORS origins list
- Debug cross-origin issues

## 📈 **Status Levels**

| Status | Description | HTTP Code |
|--------|-------------|-----------|
| `ok` | All systems operational | 200 |
| `degraded` | Some systems impaired but functional | 200 |
| `error` | Critical systems down | 500 |

## 🔧 **Configuration**

### **Dependencies**
- `psutil==5.9.8` - For system resource monitoring
- Already added to `requirements.txt`

### **Environment Variables**
- `ENVIRONMENT` - Set to 'production' or 'development'
- `DEBUG` - Django debug mode

## 🚀 **Deployment**

### **1. Install Dependencies**
```bash
cd backend
pip install psutil==5.9.8
```

### **2. Restart Django Server**
```bash
# If using gunicorn
sudo systemctl restart your-django-service

# If using Docker
docker-compose restart backend
```

### **3. Test the Endpoint**
```bash
curl https://api-dashboard.niete.pk/api/health/
```

## 📋 **Monitoring Integration**

### **Prometheus Integration**
The health check can be integrated with Prometheus for metrics collection:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'django-health'
    static_configs:
      - targets: ['api-dashboard.niete.pk']
    metrics_path: '/api/health/'
    scrape_interval: 30s
```

### **Grafana Dashboard**
Create dashboards to monitor:
- System resource usage
- Database connectivity
- API response times
- CORS configuration status

## 🔍 **Troubleshooting**

### **Common Issues**

1. **psutil Import Error**
   ```bash
   pip install psutil==5.9.8
   ```

2. **Database Connection Issues**
   - Check database server status
   - Verify connection settings in `settings.py`

3. **System Resource Errors**
   - Ensure psutil is installed
   - Check file permissions

4. **CORS Configuration Issues**
   - Verify `CORS_ALLOWED_ORIGINS` in settings
   - Check middleware order

## 📚 **References**

- [Django Health Check Best Practices](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [psutil Documentation](https://psutil.readthedocs.io/)
- [REST API Health Check Patterns](https://microservices.io/patterns/observability/health-check-api.html)

## ✅ **Benefits**

1. **Proactive Monitoring** - Detect issues before they affect users
2. **Load Balancer Integration** - Automatic failover for unhealthy instances
3. **DevOps Visibility** - Real-time system status monitoring
4. **CORS Debugging** - Verify cross-origin configuration
5. **Performance Tracking** - Monitor system resource usage

---

**The health check endpoint is now ready for production use and provides comprehensive system monitoring capabilities.** 