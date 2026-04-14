using DanpheEMR.RateLimit.Algorithms;
using DanpheEMR.RateLimit.Interfaces;
using System;

namespace DanpheEMR.RateLimit.Factory
{
    /// <summary>
    /// Factory class for creating rate limiter instances based on the selected algorithm.
    /// </summary>
    public static class RateLimiterFactory
    {
        /// <summary>
        /// Creates an instance of the specified rate-limiting algorithm.
        /// </summary>
        /// <param name="algorithm">The name of the rate-limiting algorithm.</param>
        /// <param name="maxRequests">The maximum allowed requests (used by applicable algorithms).</param>
        /// <param name="windowSize">The time window size (used by applicable algorithms).</param>
        /// <param name="capacity">The capacity of the bucket (used by TokenBucket).</param>
        /// <param name="refillRate">The refill rate for the bucket (used by TokenBucket).</param>
        /// <returns>An instance of <see cref="IRateLimiter"/> configured for the specified algorithm.</returns>
        /// <exception cref="ArgumentException">Thrown when an invalid algorithm name is specified.</exception>
        public static IRateLimiter CreateRateLimiter(string algorithm, int maxRequests, TimeSpan windowSize, int capacity, int refillRate)
        {
            IRateLimiter rateLimiter;

            switch (algorithm)
            {
                case "FixedWindow":
                    rateLimiter = new FixedWindowRateLimiter(maxRequests, windowSize);
                    break;

                case "TokenBucket":
                    rateLimiter = new TokenBucketRateLimiter(capacity, refillRate);
                    break;

                case "LeakyBucket":
                    rateLimiter = new LeakyBucketRateLimiter(maxRequests, windowSize);
                    break;

                case "SlidingWindowLog":
                    rateLimiter = new SlidingWindowLogRateLimiter(maxRequests, windowSize);
                    break;

                default:
                    throw new ArgumentException("Invalid rate-limiting algorithm specified.");
            }

            return rateLimiter;
        }
    }
}
