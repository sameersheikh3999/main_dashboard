#!/usr/bin/env python
"""
Script to clear rate limiting cache for development purposes.
Run this if you're getting 429 errors and need to reset the rate limits.
"""

import os
import django
import redis

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

def clear_rate_limit_cache():
    """Clear Redis cache to reset rate limits"""
    try:
        # Connect to Redis
        r = redis.Redis(host='127.0.0.1', port=6379, db=0)
        
        # Clear all keys (this will reset all rate limits)
        r.flushall()
        
        print("✅ Rate limiting cache cleared successfully!")
        print("You can now make requests without hitting rate limits.")
        
    except redis.ConnectionError:
        print("❌ Could not connect to Redis. Make sure Redis is running:")
        print("   sudo systemctl start redis-server")
    except Exception as e:
        print(f"❌ Error clearing cache: {e}")

if __name__ == "__main__":
    clear_rate_limit_cache() 