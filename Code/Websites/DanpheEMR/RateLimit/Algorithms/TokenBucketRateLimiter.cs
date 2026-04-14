using System;
using DanpheEMR.RateLimit.Interfaces;

namespace DanpheEMR.RateLimit.Algorithms
{
    /// <summary>
    /// Implements the Token Bucket Algorithm for rate limiting.
    /// Allows bursts of requests while enforcing a steady refill rate to regulate traffic.
    /// </summary>
    public class TokenBucketRateLimiter : IRateLimiter
    {
        /// <summary>
        /// The current number of tokens available in the bucket.
        /// </summary>
        private int _tokens;

        /// <summary>
        /// The maximum capacity of the bucket, i.e., the maximum number of tokens it can hold.
        /// </summary>
        private readonly int _capacity;

        /// <summary>
        /// The rate at which tokens are refilled in the bucket, measured in tokens per second.
        /// </summary>
        private readonly int _refillRate;

        /// <summary>
        /// The timestamp of the last refill operation.
        /// </summary>
        private DateTime _lastRefill;

        /// <summary>
        /// Initializes a new instance of the <see cref="TokenBucketRateLimiter"/> class.
        /// </summary>
        /// <param name="capacity">The maximum number of tokens the bucket can hold.</param>
        /// <param name="refillRatePerSecond">The number of tokens refilled per second.</param>
        public TokenBucketRateLimiter(int capacity, int refillRatePerSecond)
        {
            _capacity = capacity;
            _tokens = capacity;
            _refillRate = refillRatePerSecond;
            _lastRefill = DateTime.UtcNow;
        }

        /// <summary>
        /// Refills the bucket with tokens based on the time elapsed since the last refill.
        /// </summary>
        private void Refill()
        {
            DateTime now = DateTime.UtcNow;
            var elapsedSeconds = (now - _lastRefill).TotalSeconds;

            if (elapsedSeconds > 0)
            {
                _tokens = Math.Min(_capacity, _tokens + (int)(elapsedSeconds * _refillRate));
                _lastRefill = now;
            }
        }

        /// <summary>
        /// Attempts to consume a token from the bucket.
        /// </summary>
        /// <returns>
        /// <c>true</c> if a token is successfully consumed, allowing the request; otherwise, <c>false</c>.
        /// </returns>
        /// <remarks>
        /// Consuming a token is only possible if there is at least one token available in the bucket.
        /// </remarks>
        public bool TryProcessRequest()
        {
            Refill();
            if (_tokens > 0)
            {
                _tokens--;
                return true; // Request is allowed
            }
            return false; // Request is denied
        }
    }
}
