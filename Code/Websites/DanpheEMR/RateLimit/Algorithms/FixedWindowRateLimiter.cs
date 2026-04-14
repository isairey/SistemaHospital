using DanpheEMR.RateLimit.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Linq;

namespace DanpheEMR.RateLimit.Algorithms
{
    /// <summary>
    /// Implements the Fixed Window rate-limiting algorithm.
    /// </summary>
    public class FixedWindowRateLimiter : IRateLimiter
    {
        private readonly ConcurrentDictionary<DateTime, int> _requestCounts = new ConcurrentDictionary<DateTime, int>();

        private readonly int _maxRequests;
        private readonly TimeSpan _windowSize;

        /// <summary>
        /// Initializes a new instance of the <see cref="FixedWindowRateLimiter"/> class.
        /// </summary>
        /// <param name="maxRequests">The maximum number of requests allowed per window.</param>
        /// <param name="windowSize">The size of the time window.</param>
        public FixedWindowRateLimiter(int maxRequests, TimeSpan windowSize)
        {
            _maxRequests = maxRequests;
            _windowSize = windowSize;
        }

        /// <summary>
        /// Attempts to process a request based on the Fixed Window algorithm.
        /// </summary>
        /// <returns>
        /// <c>true</c> if the request is allowed; otherwise, <c>false</c>.
        /// </returns>
        public bool TryProcessRequest()
        {
            // Calculate the current window start time
            DateTime currentWindow = GetCurrentWindow();

            // Get or add the current window's request count
            int currentCount = _requestCounts.AddOrUpdate(currentWindow, 1, (_, count) => count + 1);

            // Remove expired windows
            CleanupExpiredWindows();

            // Check if the current window's request count exceeds the limit
            return currentCount <= _maxRequests;
        }

        /// <summary>
        /// Calculates the start time of the current window.
        /// </summary>
        /// <returns>The start time of the current window.</returns>
        private DateTime GetCurrentWindow()
        {
            // Round the current UTC time down to the nearest window size boundary
            long ticksPerWindow = _windowSize.Ticks;
            return new DateTime((DateTime.UtcNow.Ticks / ticksPerWindow) * ticksPerWindow);
        }

        /// <summary>
        /// Cleans up expired windows to prevent memory growth.
        /// </summary>
        private void CleanupExpiredWindows()
        {
            DateTime threshold = DateTime.UtcNow - _windowSize;

            // Remove any windows that have expired based on the current window size
            var expiredWindows = _requestCounts.Keys.Where(window => window < threshold).ToList();

            foreach (var expiredWindow in expiredWindows)
            {
                _requestCounts.TryRemove(expiredWindow, out _);
            }
        }
    }
}
