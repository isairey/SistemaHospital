using DanpheEMR.Core.Caching;
using DanpheEMR.RateLimit.Factory;
using DanpheEMR.RateLimit.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using System;
using System.Net;

namespace DanpheEMR.Filters
{
    /// <summary>
    /// Decorates any MVC route that needs to have client requests limited by time using a rate limiting algorithm.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class RateLimitFilter : ActionFilterAttribute
    {

        /// <summary>
        /// A unique name for this Filter.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The algorithm to be used for rate limiting (e.g., "TokenBucket", "LeakyBucket", etc.).
        /// </summary>
        public string Algorithm { get; set; }

        /// <summary>
        /// The number of requests allowed within the time window.
        /// </summary>
        public int MaxRequests { get; set; }

        /// <summary>
        /// The time window size for rate limiting.
        /// </summary>
        public int WindowSize { get; set; }

        /// <summary>
        /// The maximum number of tokens the bucket can hold.
        /// </summary>
        public int Capacity { get; set; }

        /// <summary>
        /// The number of tokens refilled per second.
        /// </summary>
        public int RefillRate { get; set; }

        /// <summary>
        /// A message to display to the client when access is denied due to rate-limiting.
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Initializes the RateLimitFilter by selecting the rate limiting algorithm and configuring it.
        /// </summary>
        public RateLimitFilter()
        {
            // Default values can be set here or passed from the controller method parameters.
            Algorithm = "FixedWindow"; // Default algorithm
            MaxRequests = 10;          // Default max requests
            WindowSize = 10; // Default window size
            Message = "Too many requests. Please try again later.";
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // Resolve ICacheService dynamically from IServiceProvider
            var cacheService = context.HttpContext.RequestServices.GetRequiredService<ICacheService>();

            // Generate a unique key for the rate-limiting process (e.g., based on IP and endpoint)
            var routeData = context.RouteData;
            var controllerName = routeData.Values["controller"]?.ToString();
            var actionName = routeData.Values["action"]?.ToString();

            //var clientIP = context.HttpContext.Connection.RemoteIpAddress?.ToString();
            var clientIp = context.HttpContext.Connection.RemoteIpAddress;

            // Convert to IPv4 if it's an IPv6-mapped IPv4 address
            if (clientIp != null && clientIp.IsIPv4MappedToIPv6)
            {
                clientIp = clientIp.MapToIPv4();
            }

            string key = string.Concat(clientIp, Name, "-", controllerName, "-", actionName);

            // Try to get the rate limiter from the cache (CacheService)
            IRateLimiter rateLimiter = cacheService.GetFromCache<IRateLimiter>(key);
            if (rateLimiter is null)
            {
                // Create the rate limiter from the factory based on the chosen algorithm
                rateLimiter = RateLimiterFactory.CreateRateLimiter(Algorithm, MaxRequests, TimeSpan.FromSeconds(WindowSize), Capacity, RefillRate);

                // Set the rate limiter in the cache with an expiration time based on the window size
                cacheService.AddToCache(key, rateLimiter, WindowSize, useSlidingExpiration: false);
            }

            if (!rateLimiter.TryProcessRequest())
            {
                // Respond with 409 Too Many Requests
                context.Result = new ContentResult
                {
                    Content = Message,
                    StatusCode = (int)HttpStatusCode.Conflict
                };
                Log.Warning($"Rate limit exceeded for, {controllerName}/{actionName}. Status code: {HttpStatusCode.Conflict}. Message: {Message}");
            }
        }
    }
}
