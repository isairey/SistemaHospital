namespace DanpheEMR.RateLimit.Interfaces
{
    /// <summary>
    /// Interface for rate-limiting algorithms.
    /// </summary>
    public interface IRateLimiter
    {
        /// <summary>
        /// Attempts to process a request based on the implemented algorithm.
        /// </summary>
        /// <returns>
        /// <c>true</c> if the request is allowed; otherwise <c>false</c>.
        /// </returns>
        bool TryProcessRequest();
    }
}
