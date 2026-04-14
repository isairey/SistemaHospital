using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using System;
using Serilog;
using DanpheEMR.Common.DTOs;
using Application.Common.Exceptions;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Utilities;
using System.Linq;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DanpheEMR.Common.Exceptions;

namespace DanpheEMR.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                var userId = 0;

                if(context.Session != null)
                {
                    RbacUser currentUser = context.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                    userId = currentUser != null ? currentUser.EmployeeId : 0;

                    //Define excluded Paths
                    List<string> excludedPaths = new List<string>
                    {
                        "/",
                        "/Account/Login",
                        "/Account/Logout",
                        "/Account/LicenseExpired",
                        "/api/Account/GetLoginJwtToken",
                        "/api/Patient/GetPatientByPatientCode"
                    };

                    // Define prefixes and exact paths to exclude
                    string[] pathPrefixes =
                    {
                        "/DanpheApp/dist/DanpheApp/",
                        "/assets-dph/",
                        "/themes/theme-default/",
                        "/favicon.ico",
                        "/swagger",
                    };

                    //Read Request Path from Context.
                    string requestPath = context.Request.Path.Value;

                    // Check if the currentUser is null and if the request path should be excluded
                    bool isExcludedPath = excludedPaths.Contains(requestPath) ||
                                          pathPrefixes.Any(prefix => requestPath.StartsWith(prefix));

                    if (currentUser is null && !isExcludedPath)
                    {
                        throw new SessionExpiredException("DanpheSessionExpired");
                    }

                    string token = context.Request.Headers["Authorization"];
                    if (userId > 0 && token != null)
                    {
                        if (string.IsNullOrEmpty(token))
                        {
                            throw new UnauthorizedAccessException("No token provided");
                        }

                        token = token.Replace("Bearer ", "");
                        var tokenHandler = new JwtSecurityTokenHandler();

                        var configuration = context.RequestServices.GetRequiredService<IConfiguration>();

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
                    }
                }
                else
                {
                    throw new SessionExpiredException("DanpheSessionExpired");
                }
                if(!context.Request.Path.Value.Contains("/DanpheApp/dist/DanpheApp/"))
                {
                    Log.ForContext("UserId", userId).Information($"User with EmployeeId: {userId} Requested, {context.Request.Path.Value}");
                }

                await _next(context);
            }
            catch (Exception exception)
            {

                string errorId = Guid.NewGuid().ToString();
                var errorJson = new
                {
                    ErrorId = errorId,
                    StackTrace = exception.StackTrace
                };
                Log.Information("{@errorJson}", errorJson);//This will give the JSON of ErrorId and StackTrace of Exception in Log

                var userId = 0;

                if (context.Session != null)
                {
                    RbacUser currentUser = context.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                    userId = currentUser != null ? currentUser.EmployeeId : 0;
                }
                if (!context.Request.Path.Value.Contains("/DanpheApp/dist/DanpheApp/"))
                {
                    Log.ForContext("UserId", userId).Information($"User with EmployeeId: {userId} got exception on request, {context.Request.Path.Value}, exception Details, \n {exception.ToString()}");
                }

                // Handle session expiration separately
                if (exception is SessionExpiredException)
                {
                    Log.Error("DanpheSessionExpired, Hence redirecting user to login page!");
                    context.Response.Redirect("/Account/Login");

                    //Below logic is to check whether the request is for API or web URL, currently we are not checking it.
                    //if (context.Request.Headers["Accept"].ToString().Contains("application/json"))
                    //{
                    //    // If it's an API request, return a JSON error
                    //    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    //    context.Response.ContentType = "application/json";
                    //    var errRes = new
                    //    {
                    //        Error = "DanpheSessionExpired",
                    //        RedirectUrl = "/Account/Login"
                    //    };
                    //    await context.Response.WriteAsync(JsonConvert.SerializeObject(errRes));
                    //}
                    //else
                    //{
                    //    // If it's a web request, redirect to login page
                    //    Log.Error("DanpheSessionExpired, Hence redirecting user to login page!");
                    //    context.Response.Redirect("/Account/Login");
                    //}
                    return;
                }

                var errorResult = new ErrorResult
                {
                    Source = exception.TargetSite?.DeclaringType?.FullName,
                    Exception = exception.Message.Trim(),
                    ErrorId = errorId,
                    SupportMessage = $"Error Id: {errorId} for further analysis.",
                    StatusCode = context.Response.StatusCode
                };
                errorResult.Messages.Add(exception.Message);

                if (exception.GetType() != typeof(CustomException) && exception.InnerException != null)
                {
                    while (exception.InnerException != null)
                    {
                        exception = exception.InnerException;
                    }
                }

                switch (exception)
                {
                    case CustomException e:
                        errorResult.StatusCode = (int)e.StatusCode;
                        if (e.ErrorMessages != null)
                        {
                            errorResult.Messages = e.ErrorMessages;
                        }
                        break;

                    case KeyNotFoundException e:
                        errorResult.StatusCode = (int)HttpStatusCode.NotFound;
                        break;

                    default:
                        errorResult.StatusCode = (int)HttpStatusCode.InternalServerError;
                        break;
                }

                if (!context.Request.Path.Value.Contains("/DanpheApp/dist/DanpheApp/"))
                {
                    Log.ForContext("UserId", userId).Error($"{errorResult.Exception} Request failed with Status Code {errorResult.StatusCode} and Error Id {errorId}.");
                }
                var response = context.Response;
                if (!response.HasStarted)
                {
                    response.ContentType = "application/json";
                    response.StatusCode = errorResult.StatusCode;
                    await response.WriteAsync(JsonConvert.SerializeObject(errorResult));
                }
                else
                {
                    Log.Warning("Can't write error response. Response has already started.");
                }
            }
        }
    }
}
