namespace DanpheEMR.Core.Caching
{
    public interface ICacheService
    {
        void AddToCache(string key, object value, int minutesToCache = 30, bool useSlidingExpiration = true);
        T GetFromCache<T>(string key);
        void RemoveFromCache(string key);
        bool ExistsInCache(string key);
    }
}
