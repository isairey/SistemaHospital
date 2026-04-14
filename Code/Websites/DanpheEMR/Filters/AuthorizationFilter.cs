using DanpheEMR.Common.Exceptions;
using DanpheEMR.Security;
using DanpheEMR.Services.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text;

namespace DanpheEMR.Filters
{
    /// <summary>
    /// An action filter that validates the user's authorization based on a provided JWT token and policy name.
    /// </summary>
    public class AuthorizationFilter : ActionFilterAttribute
    {
        private readonly string _policyName;
        //private readonly RolePolicyService _rolePolicyService;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthorizationFilter"/> class.
        /// </summary>
        /// <param name="policyName">The policy name to check for authorization.</param>
        public AuthorizationFilter(string policyName)
        {
            _policyName = policyName;
        }

        /// <summary>
        /// Called before the action method is executed.
        /// Validates the JWT token, retrieves the user ID, checks the user's roles, 
        /// and verifies if the user has permission for the required policy.
        /// </summary>
        /// <param name="context">The context for the action filter.</param>
        /// <exception cref="UnauthorizedAccessException">Thrown if the token is invalid or missing.</exception>
        /// <exception cref="ForbiddenException">Thrown if the user does not have the required permissions.</exception>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            try
            {
                base.OnActionExecuting(context);

                // Resolve RolePolicyService using RequestServices
                var _rolePolicyService = context.HttpContext.RequestServices.GetRequiredService<RolePolicyService>();


                var request = context.HttpContext.Request;

                // 1. Validate JWT token
                string token = request.Headers["Authorization"];
                if (string.IsNullOrEmpty(token))
                {
                    throw new UnauthorizedAccessException("No token provided");
                }

                token = token.Replace("Bearer ", "");
                var tokenHandler = new JwtSecurityTokenHandler();

                var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();

                var key = Encoding.ASCII.GetBytes(configuration["JwtTokenConfig:JwtKey"]);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = configuration["JwtTokenConfig:JwtIssuer"],
                    ValidateAudience = true,
                    ValidAudience = configuration["JwtTokenConfig:JwtAudience"],
                    ValidateLifetime = true,
                    RequireSignedTokens = true,
                };

                ClaimsPrincipal claimsPrincipal;
                try
                {
                    var tokenValidationResult = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                    claimsPrincipal = tokenValidationResult;
                }
                catch (Exception)
                {
                    throw new UnauthorizedAccessException("Invalid token");
                }

                // 2. Get user ID from claims
                var userId = claimsPrincipal.Claims.FirstOrDefault(x => x.Type == "userId")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    throw new UnauthorizedAccessException("Invalid token: user ID missing");
                }

                // 3. Get the current controller and action
                var routeData = context.RouteData;
                var controllerName = routeData.Values["controller"]?.ToString();
                var actionName = routeData.Values["action"]?.ToString();

                if (string.IsNullOrEmpty(controllerName) || string.IsNullOrEmpty(actionName))
                {
                    throw new UnauthorizedAccessException("Invalid request: Controller or Action not found");
                }

                // 4. Get the controller type
                var controllerType = Assembly.GetExecutingAssembly()
                    .GetTypes()
                    .FirstOrDefault(t => t.Name.Equals($"{controllerName}Controller", StringComparison.OrdinalIgnoreCase));

                if (controllerType == null)
                {
                    throw new UnauthorizedAccessException("Controller not found");
                }

                // 5. Get the action method
                var methodInfo = controllerType.GetMethod(actionName);
                if (methodInfo == null)
                {
                    throw new UnauthorizedAccessException("Action method not found");
                }

                // 6. Check for PolicyName
                var requiredPolicy = _policyName;

                // 7. Get user roles
                var userRoles = RBAC.GetUserAllRoles(int.Parse(userId));

                // Bypass other processes for admin user
                if (userRoles.Any(role => role.IsSysAdmin == true))
                {
                    return;
                }

                // 8. Check roles against required policy
                var allowedRolesTask = _rolePolicyService.GetRolesForPolicy(requiredPolicy, int.Parse(userId));
                allowedRolesTask.Wait(); // Block until roles are fetched
                var allowedRoles = allowedRolesTask.Result;
                if(allowedRoles is null)
                {
                    throw new ForbiddenException("User does not have required permissions");
                }
                else
                {
                    if (!userRoles.Any(role => allowedRoles.Select(s => s.RoleName).Contains(role.RoleName)))
                    {
                        throw new ForbiddenException("User does not have required permissions");
                    }
                }
            }
            catch (ForbiddenException ex)
            {
                throw new ForbiddenException($"Forbidden, {ex.Message}");
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
