using Audit.SqlServer.Providers;
using DanpheEMR.CommonTypes;
using DanpheEMR.Controllers.Settings.DTO;
using DanpheEMR.Core.Caching;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.DependencyInjection;
using DanpheEMR.Filters;
using DanpheEMR.Middlewares;
using DanpheEMR.RateLimit.Factory;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.Services.Authorization;
using DanpheEMR.Services.Pharmacy.Mapper.PurchaseOrder;
using DanpheEMR.Utilities;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Serialization;
using System;
using System.Data.SqlClient;
using System.IO;

namespace DanpheEMR
{
    public class Startup
    {

        public IConfigurationRoot Configuration { get; }
        public IHostingEnvironment CurrentEnvironment { get; set; }

        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();
            Configuration = builder.Build();

            CurrentEnvironment = env;
            //check audit is enable or disable             
            if ((!string.IsNullOrEmpty(Configuration["IsAuditEnable"])) && Convert.ToBoolean(Configuration["IsAuditEnable"]) == true)
            {
                string adminConstr = Configuration["ConnectionStringAdmin"];
                SqlConnectionStringBuilder conBuilderObj = new SqlConnectionStringBuilder(adminConstr);
                string encPwd = conBuilderObj.Password;
                if (!string.IsNullOrEmpty(encPwd))  //check is it encrypted or not
                {
                    string decPwd = DecryptPassword(encPwd);
                    conBuilderObj.Password = decPwd;
                }
                Audit.Core.Configuration.DataProvider = new SqlDataProvider()
                {
                    ConnectionString = conBuilderObj.ConnectionString,
                    Schema = "dbo",
                    TableName = "DanpheAudit",
                    IdColumnName = "AuditId",
                    JsonColumnName = "Data",
                    LastUpdatedDateColumnName = "LastUpdatedDate"
                };
            }


        }


        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            //start--for rbac-testing--sudarshanr--2march-2017
            //services.AddSession();

            // Adds a default in-memory implementation of IDistributedCache.
            //services.AddDistributedMemoryCache();//removed after using sqlserver-distributed cache-18apr'17-sudarshan

            services.AddSession(options =>
            {
                //IMPORTANT-- remove the hardcoded value 20 from below
                //keep short timeout like max 2-3 hours, 
                //we've to redirect to login once the session expires.
                //options.IdleTimeout = TimeSpan.FromHours(2);
                options.IdleTimeout = TimeSpan.FromMinutes(480); //here 480 minutes = 8 hours
                options.CookieHttpOnly = true;

            });
            //end--for rbac-testing--sudarshanr

            //Krishna, 19thMay'23, Moved all the interfaces and services that were registered here into an extension method, Do not registered them in Startup file itself,
            //instead add them in that extension method(used just below this comment)
            services.AddDanpheServices(Configuration);

            services.AddHttpContextAccessor();

            services.AddAutoMapper(typeof(MappingProfile));
            services.AddAutoMapper(typeof(PurchaseOrderMappingProfile));

            // Add framework services.
            services.AddOptions();

            services.Configure<MyConfiguration>(Configuration);
            services.AddSignalR();

            //Krishna, 19thMay'23, Moved the registration of Swagger and JWT to an extension method inside ConfigureServices class.
            services.AddSwaggerAndJwtServices(Configuration);

            //start: sud-9Jan'19 for pwd encryption testing

            //For DanpheEMR Database connectionstring..
            //reads connectionstring
            string connStr = Configuration["Connectionstring"];
            //this inbuilt class maps connString to separate properties                                                  
            SqlConnectionStringBuilder connStringBuilder = new SqlConnectionStringBuilder(connStr);
            string encPassword = connStringBuilder.Password;
            //if password is present, it must be in encrypted form., only then go for decryption, else keep it as it is.
            if (!string.IsNullOrEmpty(encPassword))
            {
                //decrypt the password and re-assign the values to actual Connstring
                string decrypted = DecryptPassword(encPassword);//this calls our internal function of RBAC
                connStringBuilder.Password = decrypted;
                Configuration["Connectionstring"] = connStringBuilder.ToString();
            }

            //For DanpheAdmin Database connectionstring.
            string connStrAdmin = Configuration["ConnectionStringAdmin"];
            SqlConnectionStringBuilder connStringBuilder2 = new SqlConnectionStringBuilder(connStrAdmin);
            string encPwd_Admin = connStringBuilder2.Password;
            //if password is present, only then go for decryption, else keep it as it is.
            if (!string.IsNullOrEmpty(encPwd_Admin))
            {
                string decPwd_Admin = DecryptPassword(encPwd_Admin);//this calls our internal function of RBAC
                connStringBuilder2.Password = decPwd_Admin;
                Configuration["ConnectionStringAdmin"] = connStringBuilder2.ToString();
            }

            //end: sud-9Jan'19 for pwd encryption testing


            services.AddMvc()
                        .AddJsonOptions(options => options.SerializerSettings.ContractResolver = new DefaultContractResolver()); // added for disabling serialising json with  camel case

            //services.AddMvc().AddApplicationPart(typeof(LoginViewModel).Assembly);
            //start: using service configuration for caching class.--sudarshan 1march'17
            //once we've added appsetting.json into the Configuration, it's accessible easily using the key.
            string connString = Configuration["Connectionstring"];
            int cacheExpMins = Convert.ToInt32(Configuration["CacheExpirationMinutes"]);
            //add cache as singleton since there should be one global object of it.. 
            services.AddSingleton<DanpheCache>(new DanpheCache(connString, cacheExpMins));
            //end: using service configuration for caching class.

            // Register CacheService as Singleton
            services.AddSingleton<ICacheService, CacheService>();

            //used in LabReportExport to differntiate abnormal values based on this parameter
            bool highlightAbnormalLabResult = Convert.ToBoolean(Configuration["highlightAbnormalLabResult"]);

            //AuditTrail Enable and Disable 
            string auditValueStr = Configuration["IsAuditEnable"];
            if (!string.IsNullOrEmpty(auditValueStr))
            {
                bool IsAuditEnable = Convert.ToBoolean(auditValueStr);
                if (IsAuditEnable == false)
                {
                    Audit.Core.Configuration.AuditDisabled = true;
                }
            }
            else
            {
                Audit.Core.Configuration.AuditDisabled = true;
            }

            ////for distributed sqlserver caching --added: 18Apr2017-sudarshan
            //services.AddDistributedSqlServerCache(options =>
            //{
            //    options.ConnectionString = connString;
            //    options.SchemaName = "dbo";
            //    options.TableName = "CORE_DistributedCache"; // this has to be same what we gave while running the command.
            //});

            //add RBAC also as a singleton service.          
            services.AddSingleton<RBAC>(new RBAC(connString, cacheExpMins));
            ///add nepali date as a singleton for one time initialization.
            services.AddSingleton<NepaliDate>(new NepaliDate(connString));

            services.AddRateLimit(Configuration);
            services.AddScoped<AuthorizationFilter>();


            //Add RolePolicyService, we need cache Service in RolePolicyService which is why we are injecting the dependency of it through constructor.
            services.AddScoped<RolePolicyService>(sp =>
            {
                var cacheService = sp.GetRequiredService<ICacheService>();
                return new RolePolicyService(connString, cacheService);
            });


            //add FileUploader as a singleton as well
            string storagePath = CurrentEnvironment.WebRootPath + "\\" + Configuration["FileStorageRelativeLocation"];
            services.AddSingleton<FileUploader>(new FileUploader(storagePath));


            services.Configure((RazorViewEngineOptions options) =>
                {
                    var previous = options.CompilationCallback;
                    options.CompilationCallback = (context) =>
                    {
                        previous?.Invoke(context);

                        context.Compilation = context.Compilation.
                                    AddReferences(MetadataReference.CreateFromFile(typeof(
                                     MasterDbContext).Assembly.Location));

                        context.Compilation = context.Compilation.
                                   AddReferences(MetadataReference.CreateFromFile(typeof(
                                   CountryModel).Assembly.Location));
                        context.Compilation = context.Compilation.
                                   AddReferences(MetadataReference.CreateFromFile(typeof(
                                   CountrySubDivisionModel).Assembly.Location));

                        context.Compilation = context.Compilation.
                                   AddReferences(MetadataReference.CreateFromFile(typeof(
                                   ICD10CodeModel).Assembly.Location));
                        context.Compilation = context.Compilation.
                                   AddReferences(MetadataReference.CreateFromFile(typeof(
                                   EmployeeModel).Assembly.Location));
                        context.Compilation = context.Compilation.
                                  AddReferences(MetadataReference.CreateFromFile(typeof(
                                  ServiceDepartmentModel).Assembly.Location));
                        context.Compilation = context.Compilation.
                                AddReferences(MetadataReference.CreateFromFile(typeof(LoginViewModel).Assembly.Location));
                        context.Compilation = context.Compilation.
                               AddReferences(MetadataReference.CreateFromFile(typeof(DanpheRoute).Assembly.Location));
                        context.Compilation = context.Compilation.
                             AddReferences(MetadataReference.CreateFromFile(typeof(DanpheCache).Assembly.Location));

                    };
                }); ;
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            //Log.Logger = new LoggerConfiguration()
            //                .ReadFrom.Configuration(Configuration)
            //                .Enrich.FromLogContext()
            //                .CreateLogger();

            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            app.UseDeveloperExceptionPage();
            app.UseMiddleware<RewindMiddleWare>();
            //start--for rbac-testing--sudarshanr--2march-2017
            app.UseSession();

            //end--for rbac-testing--sudarshanr
            app.UseMiddleware<ExceptionMiddleware>(); //Krishna, 8thSept'23, Add a Global Exception Handler

            app.UseMvc(
                routes =>
                {
                    routes.MapRoute("DefaultRoute", "{controller}/{action}");
                    routes.MapRoute(name: "Default", template: "{controller}/{action}", defaults: new { controller = "Account", action = "Login" });
                }
                );
            app.UseFileServer();

            app.UseSignalR(option =>
            {
                option.MapHub<FonePayHub>("/FonePayTransactionStatus");
            });

            // set a home page
            DefaultFilesOptions defaultoptions = new DefaultFilesOptions();
            defaultoptions.DefaultFileNames.Clear();
            defaultoptions.DefaultFileNames.Add("UI/Main.html");
            app.UseDefaultFiles(defaultoptions);
            //app.UseMiddleware<>
            app.UseStaticFiles();
            // this will serve up node_modules
            // this code is bad here i am saying add the mode_modules
            // with wwwroot. This i did because when a page runs 
            // inside wwwroot he has no way to access folders outside
            // the wwwroot. Putting this complete folder inside
            // wwwroot would be a kill. So later 
            // we need to write a grunt task which will copy the necessaayr files
            // to wwwroot. The task woul sit here

            string isDevEnv = Configuration["environment:isdevelopment"];


            if (bool.Parse(isDevEnv))//env.IsDevelopment build it only if it's development.
            {
                var provider = new PhysicalFileProvider(
                              Path.Combine(env.ContentRootPath, "wwwroot\\DanpheApp\\node_modules")
                          );
                var options = new FileServerOptions();
                options.RequestPath = "/node_modules";
                options.StaticFileOptions.FileProvider = provider;
                options.EnableDirectoryBrowsing = true;
                app.UseFileServer(options);

                //Use Swagger
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "DanpheEMR-APIs-v1");
                });
            }
        }


        //start: sud-9Jan'19-- for ConnectionString encryption/decryption

        //use existing decrypt method from RBAC.
        private string DecryptPassword(string encryptedPwd)
        {
            string retVal = DanpheEMR.Security.RBAC.DecryptPassword(encryptedPwd);
            return retVal;
        }

        //end: sud-9Jan'19-- for ConnectionString encryption/decryption

    }
}
