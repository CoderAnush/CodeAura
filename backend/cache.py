"""
Redis Cache Implementation
"""
import json
import hashlib
from typing import Any, Optional
from backend.config import settings

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

# Initialize Redis client (optional)
if REDIS_AVAILABLE:
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    except Exception as e:
        print(f"Redis connection failed: {e}. Using in-memory cache.")
        redis_client = None
else:
    redis_client = None
    print("Redis not available. Using in-memory cache.")


def get_cache_key(prefix: str, *args) -> str:
    """Generate cache key from prefix and arguments"""
    key_string = f"{prefix}:{':'.join(map(str, args))}"
    return hashlib.md5(key_string.encode()).hexdigest()


def get_cached_result(key: str) -> Optional[Any]:
    """Get cached result from Redis or memory"""
    if redis_client is None:
        # Simple in-memory cache
        return None
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        print(f"Cache get error: {e}")
    return None


def set_cached_result(key: str, value: Any, ttl_hours: int = 24) -> bool:
    """Set cached result in Redis or memory"""
    if redis_client is None:
        return False
    try:
        redis_client.setex(
            key,
            ttl_hours * 3600,  # Convert hours to seconds
            json.dumps(value, default=str)
        )
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False


def invalidate_cache(pattern: str) -> int:
    """Invalidate cache keys matching pattern"""
    if redis_client is None:
        return 0
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return 0


def flush_cache() -> bool:
    """Flush entire cache"""
    if redis_client is None:
        return True
    try:
        redis_client.flushdb()
        return True
    except Exception as e:
        print(f"Cache flush error: {e}")
        return False
