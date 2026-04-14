using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using DanpheEMR.Security;
using Microsoft.Extensions.Options;
using DanpheEMR.Core.Configuration;
using Microsoft.AspNetCore.Http;
using DanpheEMR.Utilities;
using Newtonsoft.Json;
using DanpheEMR.CommonTypes;
using System.IO;
using DanpheEMR.Core;
using DanpheEMR.Core.Parameters;
using Audit.WebApi;
using DanpheEMR.ServerModel;
using DanpheEMR.DalLayer;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using Google.Apis.Drive.v3.Data;
using DanpheEMR.Enums;
using DanpheEMR.Core.Caching;
using DanpheEMR.Services.Authorization;
using DocumentFormat.OpenXml.Spreadsheet;
using DanpheEMR.Filters;

namespace DanpheEMR.Controllers
{
    //IMPORTANT: AccountController shouldn't inherit from CommonController, since in this case, we have to allow anonymous authentication.
    public class AccountController : Controller
    {

        DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
        private readonly string connString = null;
        private readonly string connStringAdmin = null;

        private string JwtKey;
        private string JwtIssuer;
        private string JwtAudience;
        private string JwtValidMinutes;
        private readonly ICacheService _cacheService;

        public AccountController(IOptions<MyConfiguration> _config, ICacheService cacheService)
        {
            connString = _config.Value.Connectionstring;
            connStringAdmin = _config.Value.ConnectionStringAdmin;
            JwtKey = _config.Value.JwtTokenConfig.JwtKey;
            JwtIssuer = _config.Value.JwtTokenConfig.JwtIssuer;
            JwtAudience = _config.Value.JwtTokenConfig.JwtAudience;
            JwtValidMinutes = _config.Value.JwtTokenConfig.JwtValidMinutes;
            _cacheService = cacheService;
        }

        public IActionResult LicenseExpired()
        {
            return View();
        }

        [HttpGet]
        [AllowAnonymous]
        //[AuditApi(EventTypeName = "Login",
        //IncludeHeaders = true, IncludeResponseHeaders = true, IncludeResponseBody = true, IncludeRequestBody = true, IncludeModelState = true)]
        public IActionResult Login(string returnUrl = null)
        {
            DateTime centuryBegin = new DateTime(2001, 1, 1);
            DateTime currentDate = DateTime.Now;
            //Generate unique tick to make it a selector
            long ticksElapsed = currentDate.Ticks - centuryBegin.Ticks;

            //Generate unique string associated with selector --called Validator
            Guid gd = Guid.NewGuid();
            string GuidString = Convert.ToBase64String(gd.ToByteArray());
            GuidString = GuidString.Replace("=", "");
            GuidString = GuidString.Replace("+", "");

            //tick is also used as a salt
            GuidString = GuidString + ticksElapsed.ToString();

            //generate Hash of the Validator, that can be used as a token
            string msgDigest = ComputeSha256Hash(GuidString);


            CoreDbContext coreDbContext = new CoreDbContext(connString);
            ParameterModel whiteLabelParam = coreDbContext.Parameters
        .Where(p => p.ParameterGroupName == "WhiteLabel" && p.ParameterName == "WhiteLabel")
        .FirstOrDefault();

            string heading = "Default Heading";
            if (whiteLabelParam != null && !string.IsNullOrEmpty(whiteLabelParam.ParameterValue))
            {
                var jsonValue = JsonConvert.DeserializeObject<Dictionary<string, string>>(whiteLabelParam.ParameterValue);
                if (jsonValue.ContainsKey("DANPHEEMR"))
                {
                    heading = jsonValue["DANPHEEMR"];
                }
            }
            ViewData["CustomHeading"] = heading;

            
    
            string footertext= "Default FooterText";
            if (whiteLabelParam != null && !string.IsNullOrEmpty(whiteLabelParam.ParameterValue))
            {
                var jsonValue = JsonConvert.DeserializeObject<Dictionary<string, string>>(whiteLabelParam.ParameterValue);
                if (jsonValue.ContainsKey("DanpheHealth"))
                {
                    footertext = jsonValue["DanpheHealth"];
                }
            }
            ViewData["CustomFooterText"] = footertext;

            ParameterModel licenseParam = coreDbContext.Parameters.Where(p => p.ParameterGroupName == "TenantMgnt" && p.ParameterName == "SoftwareLicense")
                        .FirstOrDefault();

            string paramValue = licenseParam != null ? licenseParam.ParameterValue : null;

            if (paramValue != null)
            {
                // var paramValueJson = Newtonsoft.Json.Linq.JObject.Parse(paramValue);
                //format of parameter:softwarelicense is as below
                var definition = new { StartDate = "", EndDate = "", ExpiryNoticeDays = "", LicenseType = "" };
                var license = JsonConvert.DeserializeAnonymousType(paramValue, definition);

                DateTime startDate = Convert.ToDateTime(RBAC.DecryptPassword(license.StartDate));
                DateTime endDate = Convert.ToDateTime(RBAC.DecryptPassword(license.EndDate));
                int expiryNoticeDays = Convert.ToInt32(RBAC.DecryptPassword(license.ExpiryNoticeDays));

                double remainingDays = (endDate - DateTime.Now).TotalDays;

                if (remainingDays < 0)
                {
                    TempData["LicenseMessage"] = "License expired on: " + endDate.ToString("yyyy-MMM-dd");

                    return RedirectToAction("LicenseExpired", "Account");
                }

                if (expiryNoticeDays > remainingDays)
                {
                    ViewData["ExpiryNotice"] = "Notice ! Your Software License is expiring in " + Convert.ToInt32(remainingDays) + " days.";

                    //display remaining days through viewdata.
                }
            }
            else
            {
                TempData["LicenseMessage"] = "License Information not found..";

                return RedirectToAction("LicenseExpired", "Account");
            }


            //start: sud:16Jul'19-- If One user is already logged in - (check from session) - Load home index page directly. 
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            if (currentUser != null && currentUser.UserId != 0)
            {
                return RedirectToAction("Index", "Home");
            }
            //end: sud:16Jul'19-- If One user is already logged in - (check from session) - Load home index page directly.


            if (!string.IsNullOrEmpty(Request.Cookies["uRef"]))
            {
                SystemAdminDbContext adminDbContext = new SystemAdminDbContext(connStringAdmin);

                var selector = Convert.ToInt64(Request.Cookies["uRef"]);
                var validatorWithSalt = Request.Cookies["uData"] + Request.Cookies["uRef"];
                var hashedValidator = ComputeSha256Hash(validatorWithSalt);

                //To make sure that only one UserId will be selected at a time
                var userIdList = (from sysAuthInfo in adminDbContext.CookieInformation
                                  where sysAuthInfo.Selector == selector
                                  && sysAuthInfo.HashedToken == hashedValidator
                                  select sysAuthInfo.UserId).ToList();


                if (userIdList.Count == 1)
                {
                    RbacUser validUser = RBAC.GetUser(userIdList[0]);
                    LoginViewModel model = new LoginViewModel();
                    model.UserName = validUser.UserName;

                    //seting session for current valid user
                    if (validUser != null)
                    {
                        //Check user status is Active or not, If user is InActive then return to login page
                        if (validUser.IsActive == false)
                        {
                            RemoveRememberMeCookie();
                            RemoveSessionValues();
                            ViewData["status"] = "user-inactive";
                            return View(model);
                        }

                        validUser.Password = "";

                        UpdateRememberMeCookie(selector);
                        SetSessionVariable(validUser);
                        return RedirectToAction("Index", "Home");
                    }
                }
                else
                {
                    RemoveRememberMeCookie();
                    RemoveSessionValues();
                    return View();
                }
            }




            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }
        // POST: /Account/Login
        [RateLimitFilter(Name = "LoginRateLimit", Algorithm = "FixedWindow", MaxRequests = 5, WindowSize = 1, Message = "You must wait {n} seconds before accessing this url again.")]
        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        [AuditApi(EventTypeName = "Login",
        IncludeHeaders = true, IncludeResponseHeaders = true, IncludeResponseBody = true, IncludeRequestBody = true, IncludeModelState = true)]
        public IActionResult Login(LoginViewModel model, string returnUrl = null)
        {
            if (ModelState.IsValid)
            {

                SystemAdminDbContext adminDbContext = new SystemAdminDbContext(connStringAdmin);

                RbacUser validUser = RBAC.GetUser(model.UserName, model.Password);

                LoginInformationModel LoginInfo = new LoginInformationModel();


                //seting session for current valid user
                if (validUser != null)
                {
                    //Check user status is Active or not, If user is InActive then return to login page
                    if (validUser.IsActive == false)
                    {
                        ViewData["status"] = "user-inactive";
                        return View(model);
                    }
                    validUser.Password = "";

                    LoginInfo.EmployeeId = validUser.EmployeeId;
                    LoginInfo.ActionName = "login";
                    LoginInfo.CreatedOn = System.DateTime.Now;
                    LoginInfo.UserName = validUser.UserName;
                    adminDbContext.LoginInformation.Add(LoginInfo);
                    adminDbContext.SaveChanges();

                    SetSessionVariable(validUser);
                    JwtSecurityToken token = GenerateJwtToken(validUser);
                    var tokenResult = new
                    {
                        token = new JwtSecurityTokenHandler().WriteToken(token)
                    };

                    TempData["loginJwtToken"] = tokenResult.token; // Keep the login token in TempData to send it back to Angular Client., Krishna, 13thJan'23
                    SetRolePolicyMappingInCache(validUser.UserId); //Store Role Policy Mapping based on UserId in Cache to reduce database roundtrips.

                    if (model.RememberMe)
                    {
                        DateTime centuryBegin = new DateTime(2001, 1, 1);
                        DateTime currentDate = DateTime.Now;
                        //Generate unique tick to make it a selector
                        long ticksElapsed = currentDate.Ticks - centuryBegin.Ticks;

                        SetRememberMeCookieVariable(ticksElapsed, validUser.UserId);
                    }
                    var auditScope = this.GetCurrentAuditScope();
                    if(auditScope != null)
                    {
                        // password = ""
                        ((DanpheEMR.Security.LoginViewModel)((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.ActionParameters["model"]).Password = "";
                        // formvariable = null
                        ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.FormVariables = null;
                        // request body URL, replace password with *****
                        var url = ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.RequestBody.Value;
                        Regex yourRegex = new Regex(@"password=([^\&]+)");
                        string replacedURL = yourRegex.Replace(url.ToString(), "password=*****");
                        ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.RequestBody.Value = replacedURL;
                    }
                    return RedirectToAction("Index", "Home");
                }
                else
                {
                    LoginInfo.ActionName = "invalid-login-attempt";
                    LoginInfo.EmployeeId = null;
                    LoginInfo.CreatedOn = System.DateTime.Now;
                    LoginInfo.UserName = model.UserName;
                    adminDbContext.LoginInformation.Add(LoginInfo);
                    adminDbContext.SaveChanges();
                }



                ViewData["status"] = "login-failed";
                return View(model);
            }
            //If we got this far, something failed, redisplay form
            return View(model);
        }

        private void SetRolePolicyMappingInCache(int userId)
        {
            string cacheKey = $"policy_roles_{userId}";

            RbacDbContext dbContext = new RbacDbContext(connString);

            List<RolePolicyMappingDTO> rolesPolicy = (from policyRoleMapping in dbContext.RbacPolicyRoleMappings
                                                      join policy in dbContext.RbacPolicies on policyRoleMapping.PolicyId equals policy.PolicyId
                                                      join roles in dbContext.Roles on policyRoleMapping.RoleId equals roles.RoleId
                                                      join usrRole in dbContext.UserRoleMaps on roles.RoleId equals usrRole.RoleId
                                                      where usrRole.UserId == userId && policyRoleMapping.IsActive == true && usrRole.IsActive == true && roles.IsActive == true
                                                      select new RolePolicyMappingDTO
                                                      {
                                                          PolicyName = policy.PolicyName,
                                                          UserId = usrRole.UserId,
                                                          RoleName = roles.RoleName
                                                      }).ToList();

            // Cache the result for furutre requests
            _cacheService.AddToCache(cacheKey, rolesPolicy, minutesToCache: 60, useSlidingExpiration: true);

        }

        //[HttpPost]
        //[AllowAnonymous]
        //[ValidateAntiForgeryToken]
        //[AuditApi(EventTypeName = "Logout",
        //IncludeHeaders = true, IncludeResponseHeaders = true, IncludeResponseBody = true, IncludeRequestBody = true, IncludeModelState = true)]
        public IActionResult Logout(string returnUrl = null)
        {
            //HttpContext.Session.Set<RbacUser>("currentuser", null);   
            //Remove all sessin variable values
            SystemAdminDbContext adminDbContext = new SystemAdminDbContext(connStringAdmin);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            LoginInformationModel LoginInfo = new LoginInformationModel();

            //once logged out currentuser gets null, so don't go inside if it's null..
            if (currentUser != null)
            {
                //remove cached role policy cache.
                string cacheKey = $"policy_roles_{currentUser.UserId}";
                if (_cacheService.ExistsInCache(cacheKey))
                {
                    _cacheService.RemoveFromCache(cacheKey);
                }

                LoginInfo.EmployeeId = currentUser.EmployeeId;
                LoginInfo.UserName = currentUser.UserName;
                LoginInfo.ActionName = "logout";
                LoginInfo.CreatedOn = System.DateTime.Now;
                adminDbContext.LoginInformation.Add(LoginInfo);
                adminDbContext.SaveChanges();
            }



            RemoveRememberMeCookie();
            RemoveSessionValues();
            //HttpContext.Session.Remove("currentuser");
            LoginViewModel newLogin = new LoginViewModel();
            ViewData["status"] = "logout-success";

            CoreDbContext coreDbContext = new CoreDbContext(connString);
            ParameterModel whiteLabelParam = coreDbContext.Parameters
        .Where(p => p.ParameterGroupName == "WhiteLabel" && p.ParameterName == "WhiteLabel")
        .FirstOrDefault();

            string heading = "Default Heading";
            if (whiteLabelParam != null && !string.IsNullOrEmpty(whiteLabelParam.ParameterValue))
            {
                var jsonValue = JsonConvert.DeserializeObject<Dictionary<string, string>>(whiteLabelParam.ParameterValue);
                if (jsonValue.ContainsKey("DANPHEEMR"))
                {
                    heading = jsonValue["DANPHEEMR"];
                }
            }
            ViewData["CustomHeading"] = heading;

            string footertext = "Default FooterText";
            if (whiteLabelParam != null && !string.IsNullOrEmpty(whiteLabelParam.ParameterValue))
            {
                var jsonValue = JsonConvert.DeserializeObject<Dictionary<string, string>>(whiteLabelParam.ParameterValue);
                if (jsonValue.ContainsKey("DanpheHealth"))
                {
                    footertext = jsonValue["DanpheHealth"];
                }
            }
            ViewData["CustomFooterText"] = footertext;


            return View("Login", newLogin);
        }

        //Action for return to PageNotFound page
        public IActionResult PageNotFound()
        {
            try
            {
                //remove all session variable values
                //RemoveSessionValues();
                LoginViewModel newLogin = new LoginViewModel();
                return View("PageNotFound");
            }
            catch (Exception ex)
            { throw ex; }
        }
        public IActionResult ForgotPassword()
        {
            return View();
        }

        public IActionResult ChangePassword()
        {
            //RbacUser validUser = RBAC.GetUser(chmodel.UserName, chmodel.Password);
            //string str = Request.Form.Keys.First<string>();
            Stream req = Request.Body;
            req.Seek(0, System.IO.SeekOrigin.Begin);
            string str = new StreamReader(req).ReadToEnd();
            ChangePasswordViewModel chmodel = JsonConvert.DeserializeObject<ChangePasswordViewModel>(str);
            RbacUser updatepass = RBAC.UpdateDefaultPasswordOfUser(chmodel.UserName, chmodel.Password, chmodel.ConfirmPassword);

            if (updatepass != null)
            {
                updatepass.NeedsPasswordUpdate = false;

                //Update property for Current Session as well. 
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
                currentUser.NeedsPasswordUpdate = false;
                HttpContext.Session.Set<RbacUser>("currentuser", currentUser);

                //RemoveRememberMeCookie();
                //RemoveSessionValues();
                responseData.Status = "OK";
                responseData.Results = null; ////Assigning Result to NULL because we Don't have to Show Password of User in Client side (i.e Client Debugging Side)
                var s = Json(DanpheJSONConvert.SerializeObject(responseData, true));

                return s;
            }
            else
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = "Current Password is Wrong";
                var s = Json(DanpheJSONConvert.SerializeObject(responseData, true));

                return s;
            }

        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult UnAuthorizeAccess(string returnUrl = null)
        {
            return View();
        }

        #region Set all session variable values
        //This method set session variable i.e.current login user, permissions for current login
        public void SetSessionVariable(RbacUser currentValidUser)
        {
            try
            {
                //set currentuser 
                HttpContext.Session.Set<RbacUser>("currentuser", currentValidUser);
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
                if (currentUser != null)
                {
                    //Get all valid permission for input user                      
                    List<RbacPermission> validPermissionList = RBAC.GetUserAllPermissions(currentUser.UserId).ToList();
                    //List<RbacRole> validRoles = 
                    //Set permission session variable value for logged in user
                    HttpContext.Session.Set<List<RbacPermission>>("validpermissionlist", validPermissionList);

                    //Get all valid permission for input user                      
                    List<RbacRole> validUsrRoles = RBAC.GetUserAllRoles(currentUser.UserId);
                    //List<RbacRole> validRoles = 
                    //Set permission session variable value for logged in user
                    HttpContext.Session.Set<List<RbacRole>>("user-roles", validUsrRoles);

                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
        #endregion

        #region Set Cookie variable values
        public void SetRememberMeCookieVariable(long selector,int userId)
        {
            try
            {
                SystemAdminDbContext sysDbContext = new SystemAdminDbContext(connStringAdmin);

                CookieAuthInfoModel authModel = new CookieAuthInfoModel();

                //Generate unique string associated with selector --called Validator
                Guid gd = Guid.NewGuid();

                string GuidString = Convert.ToBase64String(gd.ToByteArray());
                GuidString = GuidString.Replace("=", "");
                GuidString = GuidString.Replace("+", "");

                //tick is also used as a salt
                var GuidStrWithSalt = GuidString + selector.ToString();

                //generate Hash of the Validator, that can be used as a token
                string msgDigest = ComputeSha256Hash(GuidStrWithSalt);

                authModel.Selector = selector;
                authModel.HashedToken = msgDigest;
                authModel.UserId = userId;
                authModel.Expires = System.DateTime.Now.AddYears(2);

                sysDbContext.CookieInformation.Add(authModel);
                sysDbContext.SaveChanges();

                Response.Cookies.Append("uRef", selector.ToString(),
                    new Microsoft.AspNetCore.Http.CookieOptions
                    {
                        Expires = authModel.Expires
                    });
                Response.Cookies.Append("uData", GuidString, new Microsoft.AspNetCore.Http.CookieOptions
                {
                    Expires = authModel.Expires
                });
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
        #endregion



        #region Removing all session variables
        //This method remove all session variable values
        //Mostly called when logout user

        public void RemoveSessionValues()
        {
            //it clears all session variable 
            HttpContext.Session.Clear();
            ////Remove currentuser values
            //HttpContext.Session.Remove("currentuser");
            ////Remove All Permission from session variable
            //HttpContext.Session.Remove("validpermissionlist");
            ////Remove all RouteList
            //HttpContext.Session.Remove("validRouteList");
            //HttpContext.Session.Remove("activeBillingCounter");
        }
        #endregion

        #region Removing cookie
        public void RemoveRememberMeCookie()
        {
            Response.Cookies.Delete("uData");
            Response.Cookies.Delete("uRef");
        }
        #endregion

        #region Update cookie
        public void UpdateRememberMeCookie(long selector)
        {
            SystemAdminDbContext sysDbContext = new SystemAdminDbContext(connStringAdmin);

            CookieAuthInfoModel authModel = (from sysAuthInfo in sysDbContext.CookieInformation
                                             where sysAuthInfo.Selector == selector
                                             select sysAuthInfo).FirstOrDefault();


            //Generate unique string associated with selector --called Validator
            Guid gd = Guid.NewGuid();

            string GuidString = Convert.ToBase64String(gd.ToByteArray());
            GuidString = GuidString.Replace("=", "");
            GuidString = GuidString.Replace("+", "");

            //tick is also used as a salt
            var GuidStrWithSalt = GuidString + selector.ToString();

            //generate Hash of the Validator, that can be used as a token
            string msgDigest = ComputeSha256Hash(GuidStrWithSalt);

            authModel.HashedToken = msgDigest;

            sysDbContext.Entry(authModel).Property(x => x.HashedToken).IsModified = true;

            Response.Cookies.Delete("uData");
            Response.Cookies.Append("uData", GuidString, new Microsoft.AspNetCore.Http.CookieOptions
            {
                Expires = authModel.Expires
            });

            sysDbContext.SaveChanges();

        }
        #endregion

        #region create Hash of the Given string
        static string ComputeSha256Hash(string rawData)
        {
            // Create a SHA256   
            using (SHA256 sha256Hash = SHA256.Create())
            {
                // ComputeHash - returns byte array  
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));

                // Convert byte array to a string   
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
        #endregion



        /// <summary>
        /// Authenticates a user and generates a JWT token for accessing DanpheEMR services.
        /// </summary>
        /// <param name="loginDto">The login credentials containing username and password.</param>
        /// <returns>
        /// Returns an <see cref="OkObjectResult"/> with the JWT token if the login is successful.
        /// Returns an <see cref="UnauthorizedResult"/> if the login credentials are invalid.
        /// Returns a <see cref="BadRequestResult"/> if the input is invalid.
        /// Returns a <see cref="StatusCodeResult"/> with status code 500 if an internal server error occurs.
        /// </returns>
        /// <response code="200">Returns the JWT token and a success message upon successful login.</response>
        /// <response code="400">Returned when the input is invalid or missing.</response>
        /// <response code="401">Returned when the user credentials are invalid.</response>
        /// <response code="500">Returned when an internal server error occurs.</response>
        /// 5
        [RateLimitFilter(Name = "LoginToDanpheEMRRateLimit", Algorithm = "FixedWindow", MaxRequests = 5, WindowSize = 1, Message = "You must wait {n} seconds before accessing this url again.")]
        [HttpPost]
        [Route("api/Account/GetLoginJwtToken")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public IActionResult LoginToDanpheEMR([FromBody] LoginDto loginDto)
        {

                SystemAdminDbContext adminDbContext = new SystemAdminDbContext(connStringAdmin);

                RbacUser validUser = RBAC.GetUser(loginDto.UserName, loginDto.Password);

                LoginInformationModel LoginInfo = new LoginInformationModel();


                //seting session for current valid user
                if (validUser != null)
                {
                    
                    validUser.Password = "";

                    LoginInfo.EmployeeId = validUser.EmployeeId;
                    LoginInfo.ActionName = "login";
                    LoginInfo.CreatedOn = System.DateTime.Now;
                    LoginInfo.UserName = validUser.UserName;
                    adminDbContext.LoginInformation.Add(LoginInfo);
                    adminDbContext.SaveChanges();

                    SetSessionVariable(validUser);
                    JwtSecurityToken token = GenerateJwtToken(validUser);
                    var tokenResult = new
                    {
                        token = new JwtSecurityTokenHandler().WriteToken(token)
                    };
                    
                    var auditScope = this.GetCurrentAuditScope();
                    if (auditScope != null)
                    {
                        // password = ""
                        ((DanpheEMR.Security.LoginViewModel)((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.ActionParameters["model"]).Password = "";
                        // formvariable = null
                        ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.FormVariables = null;
                        // request body URL, replace password with *****
                        var url = ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.RequestBody.Value;
                        Regex yourRegex = new Regex(@"password=([^\&]+)");
                        string replacedURL = yourRegex.Replace(url.ToString(), "password=*****");
                        ((Audit.WebApi.AuditEventWebApi)auditScope.Event).Action.RequestBody.Value = replacedURL;
                    }
                var result = new
                {
                    message = "Login Successful you can use this token further",
                    loginJwtToken = tokenResult.token,

                };
                return Ok(result);
                }
                else
                {
                    LoginInfo.ActionName = "invalid-login-attempt";
                    LoginInfo.EmployeeId = null;
                    LoginInfo.CreatedOn = System.DateTime.Now;
                    LoginInfo.UserName = loginDto.UserName;
                    adminDbContext.LoginInformation.Add(LoginInfo);
                    adminDbContext.SaveChanges();
                return Unauthorized();
                }

        }


        //Krishna, 13thJan'23 This method is responsible to generate the JWT Token keeping currentUser as its Claim
        private JwtSecurityToken GenerateJwtToken(RbacUser currentUser)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var userClaims = new[]
            {
                new Claim(ENUM_ClaimTypes.currentUser, JsonConvert.SerializeObject(currentUser)),
                new Claim(ENUM_ClaimTypes.userId, currentUser.UserId.ToString())
            };

            var token = new JwtSecurityToken(
                                             issuer: JwtIssuer,
                                             audience: JwtAudience,
                                             userClaims,
                                             expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(JwtValidMinutes)),
                                             signingCredentials: creds);
            return token;
        }
    }
}