using System;
using System.Collections.Generic;
using DanpheEMR.RateLimit.Interfaces;

namespace DanpheEMR.RateLimit.Algorithms
{
    /// <summary>
    /// Implements the Leaky Bucket Algorithm for rate limiting.
    /// Ensures a consistent and predictable flow of request processing.
    /// </summary>
    public class LeakyBucketRateLimiter : IRateLimiter
    {
        /// <summary>
        /// A queue to store timestamps of incoming requests.
        /// Helps in tracking when requests were received to enforce the process rate.
        /// </summary>
        private readonly Queue<DateTime> _requestQueue = new Queue<DateTime>();

        /// <summary>
        /// The maximum number of requests that can be held in the queue at any time.
        /// Requests beyond this size are denied.
        /// </summary>
        private readonly int _maxQueueSize;

        /// <summary>
        /// The time interval between processing consecutive requests.
        /// </summary>
        private readonly TimeSpan _processRate;

        /// <summary>
        /// Initializes a new instance of the <see cref="LeakyBucketRateLimiter"/> class.
        /// </summary>
        /// <param name="maxQueueSize">The maximum number of requests that can be queued for processing.</param>
        /// <param name="processRate">The rate at which requests are processed from the bucket.</param>
        public LeakyBucketRateLimiter(int maxQueueSize, TimeSpan processRate)
        {
            _maxQueueSize = maxQueueSize;
            _processRate = processRate;
        }

        /// <summary>
        /// Attempts to process a new request based on the current state of the bucket.
        /// </summary>
        /// <returns>
        /// <c>true</c> if the request is allowed and added to the queue; otherwise, <c>false</c>.
        /// </returns>
        /// <remarks>
        /// Older requests that have exceeded the processing time are removed from the queue to maintain a constant processing rate.
        /// </remarks>
        public bool TryProcessRequest()
        {
            DateTime now = DateTime.UtcNow;

            // Leak requests at a constant rate
            while (_requestQueue.Count > 0 && now - _requestQueue.Peek() > _processRate)
            {
                _requestQueue.Dequeue();
            }

            if (_requestQueue.Count < _maxQueueSize)
            {
                _requestQueue.Enqueue(now);
                return true; // Request is allowed
            }

            return false; // Request is denied
        }
    }
}
