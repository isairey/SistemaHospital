using System;
using System.Collections.Generic;
using DanpheEMR.RateLimit.Interfaces;

namespace DanpheEMR.RateLimit.Algorithms
{
    /// <summary>
    /// Implements the Sliding Window Log Algorithm for rate limiting.
    /// Maintains a log of request timestamps to enforce a maximum number of requests within a sliding time window.
    /// </summary>
    public class SlidingWindowLogRateLimiter : IRateLimiter
    {
        /// <summary>
        /// A list that stores the timestamps of requests.
        /// </summary>
        private readonly List<DateTime> _requestTimestamps = new List<DateTime>();

        /// <summary>
        /// The maximum number of requests allowed within the time window.
        /// </summary>
        private readonly int _maxRequests;

        /// <summary>
        /// The size of the sliding time window during which requests are counted.
        /// </summary>
        private readonly TimeSpan _windowSize;

        /// <summary>
        /// Initializes a new instance of the <see cref="SlidingWindowLogRateLimiter"/> class.
        /// </summary>
        /// <param name="maxRequests">The maximum number of requests allowed within the sliding time window.</param>
        /// <param name="windowSize">The size of the sliding time window.</param>
        public SlidingWindowLogRateLimiter(int maxRequests, TimeSpan windowSize)
        {
            _maxRequests = maxRequests;
            _windowSize = windowSize;
        }

        /// <summary>
        /// Attempts to process a request based on the sliding window log algorithm.
        /// </summary>
        /// <returns>
        /// <c>true</c> if the request is allowed within the limits of the sliding time window; otherwise, <c>false</c>.
        /// </returns>
        /// <remarks>
        /// Removes outdated request timestamps that fall outside of the current time window
        /// and checks if the new request can be accommodated.
        /// </remarks>
        public bool TryProcessRequest()
        {
            DateTime now = DateTime.UtcNow;

            // Remove outdated requests that are outside the sliding window
            _requestTimestamps.RemoveAll(t => now - t > _windowSize);

            // Check if a new request can be accommodated within the limit
            if (_requestTimestamps.Count < _maxRequests)
            {
                _requestTimestamps.Add(now);
                return true; // Request is allowed
            }

            return false; // Request is denied
        }
    }
}
