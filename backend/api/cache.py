from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

def cache_key_generator(*args, **kwargs):
    """Generate a cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}:{v}" for k, v in sorted(kwargs.items())])
    key_string = "|".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

def cache_result(timeout=300, key_prefix=""):
    """
    Decorator to cache function results
    
    Args:
        timeout (int): Cache timeout in seconds (default: 5 minutes)
        key_prefix (str): Prefix for cache key
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{cache_key_generator(*args, **kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            logger.debug(f"Cached result for key: {cache_key}")
            
            return result
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern):
    """Invalidate all cache keys matching a pattern"""
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern(pattern)
    else:
        # Fallback for cache backends that don't support pattern deletion
        logger.warning("Cache backend doesn't support pattern deletion")

class BigQueryCache:
    """Cache manager for BigQuery operations"""
    
    @staticmethod
    @cache_result(timeout=1800, key_prefix="bq")  # 30 minutes
    def get_teacher_data(filters=None):
        """Cache teacher data queries"""
        from .views import BigQueryTeacherDataView
        view = BigQueryTeacherDataView()
        return view._get_teacher_data(filters or {})
    
    @staticmethod
    @cache_result(timeout=3600, key_prefix="bq")  # 1 hour
    def get_filter_options():
        """Cache filter options"""
        from .views import BigQueryFilterOptionsView
        view = BigQueryFilterOptionsView()
        return view._get_filter_options()
    
    @staticmethod
    @cache_result(timeout=1800, key_prefix="bq")  # 30 minutes
    def get_summary_stats(filters=None):
        """Cache summary statistics"""
        from .views import BigQuerySummaryStatsView
        view = BigQuerySummaryStatsView()
        return view._get_summary_stats(filters or {})
    
    @staticmethod
    def invalidate_teacher_data():
        """Invalidate teacher data cache"""
        invalidate_cache_pattern("bq:get_teacher_data:*")
    
    @staticmethod
    def invalidate_filter_options():
        """Invalidate filter options cache"""
        invalidate_cache_pattern("bq:get_filter_options:*")
    
    @staticmethod
    def invalidate_summary_stats():
        """Invalidate summary stats cache"""
        invalidate_cache_pattern("bq:get_summary_stats:*")

class ConversationCache:
    """Cache manager for conversation operations"""
    
    @staticmethod
    @cache_result(timeout=300, key_prefix="conv")  # 5 minutes
    def get_user_conversations(user_id):
        """Cache user conversations"""
        from .models import Conversation
        return list(Conversation.objects.filter(
            aeo_id=user_id
        ) | Conversation.objects.filter(
            principal_id=user_id
        ).values())
    
    @staticmethod
    @cache_result(timeout=60, key_prefix="conv")  # 1 minute
    def get_conversation_messages(conversation_id):
        """Cache conversation messages"""
        from .models import Message
        return list(Message.objects.filter(
            conversation_id=conversation_id
        ).order_by('timestamp').values())
    
    @staticmethod
    def invalidate_user_conversations(user_id):
        """Invalidate user conversations cache"""
        invalidate_cache_pattern(f"conv:get_user_conversations:*{user_id}*")
    
    @staticmethod
    def invalidate_conversation_messages(conversation_id):
        """Invalidate conversation messages cache"""
        invalidate_cache_pattern(f"conv:get_conversation_messages:*{conversation_id}*")

class UserCache:
    """Cache manager for user operations"""
    
    @staticmethod
    @cache_result(timeout=600, key_prefix="user")  # 10 minutes
    def get_principals():
        """Cache principals list"""
        from .models import UserProfile
        return list(UserProfile.objects.filter(role='Principal').select_related('user').values(
            'user__id', 'user__username', 'user__email', 'school_name'
        ))
    
    @staticmethod
    @cache_result(timeout=600, key_prefix="user")  # 10 minutes
    def get_aeos():
        """Cache AEOs list"""
        from .models import UserProfile
        return list(UserProfile.objects.filter(role='AEO').select_related('user').values(
            'user__id', 'user__username', 'user__email'
        ))
    
    @staticmethod
    def invalidate_principals():
        """Invalidate principals cache"""
        invalidate_cache_pattern("user:get_principals:*")
    
    @staticmethod
    def invalidate_aeos():
        """Invalidate AEOs cache"""
        invalidate_cache_pattern("user:get_aeos:*")

def clear_all_caches():
    """Clear all application caches"""
    cache.clear()
    logger.info("All caches cleared")

def get_cache_stats():
    """Get cache statistics (if supported by backend)"""
    if hasattr(cache, 'get_stats'):
        return cache.get_stats()
    return {"message": "Cache statistics not available for this backend"} 