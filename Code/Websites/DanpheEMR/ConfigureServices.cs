using DanpheEMR.Enums;
using DanpheEMR.Filters;
using DanpheEMR.RateLimit.Factory;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Swashbuckle.AspNetCore.Swagger;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR
{
    /*
       Author: Krishna, 
       Creation: 19thMay'23
       Purpose: 1. Make Startup Clean and Readable
                2. To Achieve Separation of Concerns
                3. Startup class was getting bulky, which leads to less  maintainable code.
    */
    public static class ConfigureServices
    {
        public static IServiceCollection AddSwaggerAndJwtServices(this IServiceCollection services, IConfigurationRoot Configuration)
        {
            // Add Swagger
            services.AddSwaggerGen(config =>
            {
                config.SwaggerDoc("v1", new Info
                {
                    Title = "DanpheEMR APIs",
                    Version = "v1",
                    Contact = new Contact()
                    {
                        Name = "DanpheEMR",
                        Email = "info.danphe-emr.com",
                        Url = new Uri("https://danphehealth.com/").ToString()
                    },
                    Description = "We are testing Swagger in DanpheEMR",
                    TermsOfService = "This section includes Terms and Services"
                });
                config.AddSecurityDefinition("Bearer", new ApiKeyScheme
                {
                    In = "header",
                    Description = "Please enter your JWT token here starting with Bearer followed by single white space",
                    Name = "Authorization",
                    Type = "apiKey"
                });

                config.AddSecurityRequirement(new Dictionary<string, IEnumerable<string>> {
                { "Bearer", Enumerable.Empty<string>() },
                });

                //DanpheEmrAPI.xml file is created by the Project>build event
                //and it is read by swagger to show in the api documentation.
                //We can show: <summary>, <remarks>, <response>
                var filePath = Path.Combine(System.AppContext.BaseDirectory, "DanpheEmrAPI.xml");
                config.IncludeXmlComments(filePath);

            });


            //Add JWT
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            // Adding Jwt Bearer
            .AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    // The signing key must match
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["JwtTokenConfig:JwtKey"])),
                    ValidateIssuer = true,
                    ValidIssuer = Configuration["JwtTokenConfig:JwtIssuer"],
                    ValidateAudience = true,
                    ValidAudience = Configuration["JwtTokenConfig:JwtAudience"],
                    ValidateLifetime = true,
                    RequireSignedTokens = true,
                };
                //Additional Event Handlers for Detailed Validation.
                options.Events = new JwtBearerEvents
                {
                    //Custom Token validation Logic
                    OnTokenValidated = async context =>
                    {
                        //Extract Claims Principal
                        var claimsPrincipal = context.Principal;
                        // Custom validation logic
                        if (claimsPrincipal == null)
                        {
                            context.Fail("No claims principal found");
                            return;
                        }

                        // Example: Additional custom validation
                        var userIdClaim = claimsPrincipal.FindFirst(ENUM_ClaimTypes.userId);
                        if (userIdClaim == null)
                        {
                            context.Fail("Missing user identifier");
                            return;
                        }
                    },
                    //Handle Authentication Failures
                    OnAuthenticationFailed = context =>
                    {
                        // Log specific authentication failure reasons
                        if (context.Exception is SecurityTokenExpiredException)
                        {
                            context.Response.Headers.Add("Token-Expired", "true");
                        }

                        // Log the specific authentication failure
                        Log.Error($"Authentication failed: {context.Exception.Message}");

                        return Task.CompletedTask;
                    }
                };
            });
            return services;
        }

        public static IServiceCollection AddRateLimit(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<RateLimitFilter>();
            return services;
        }
    }
}
