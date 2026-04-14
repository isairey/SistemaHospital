using System;
using System.Runtime.Caching;

namespace DanpheEMR.Core.Caching
{
    /// <summary>
    /// A service that provides in-memory caching functionality using <see cref="MemoryCache"/>.
    /// Implements the <see cref="ICacheService"/> interface.
    /// </summary>
    public class CacheService : ICacheService
    {
        // Instance of MemoryCache to hold cached items
        private MemoryCache _cache = MemoryCache.Default;

        /// <summary>
        /// Adds an item to the cache with a specified key, expiration time, and expiration type.
        /// </summary>
        /// <param name="key">The unique key identifying the cached item.</param>
        /// <param name="value">The object to cache.</param>
        /// <param name="minutesToCache">The number of minutes the item should remain in the cache. Default is 30 minutes.</param>
        /// <param name="useSlidingExpiration">Specifies whether to use sliding expiration. Default is true.</param>
        public void AddToCache(string key, object value, int minutesToCache = 30, bool useSlidingExpiration = true)
        {
            var policy = useSlidingExpiration
                ? new CacheItemPolicy
                {
                    SlidingExpiration = TimeSpan.FromMinutes(minutesToCache)
                }
                : new CacheItemPolicy
                {
                    AbsoluteExpiration = DateTimeOffset.Now.AddMinutes(minutesToCache)
                };

            _cache.Set(key, value, policy);
        }

        /// <summary>
        /// Retrieves an item from the cache by its key.
        /// </summary>
        /// <typeparam name="T">The expected type of the cached item.</typeparam>
        /// <param name="key">The unique key identifying the cached item.</param>
        /// <returns>The cached item if found; otherwise, the default value of type <typeparamref name="T"/>.</returns>
        public T GetFromCache<T>(string key)
        {
            return _cache.Contains(key) ? (T)_cache[key] : default;
        }

        /// <summary>
        /// Removes an item from the cache by its key.
        /// </summary>
        /// <param name="key">The unique key identifying the cached item to remove.</param>
        public void RemoveFromCache(string key)
        {
            _cache.Remove(key);
        }

        /// <summary>
        /// Checks if an item with the specified key exists in the cache.
        /// </summary>
        /// <param name="key">The unique key identifying the cached item.</param>
        /// <returns>True if the item exists in the cache; otherwise, false.</returns>
        public bool ExistsInCache(string key)
        {
            return _cache.Contains(key);
        }
    }
}
