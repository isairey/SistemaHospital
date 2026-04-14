using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using Application.Common.Exceptions;
using DanpheEMR.Common.Exceptions;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Utilities;
using Google.Apis.Drive.v3.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;


namespace DanpheEMR.Controllers
{

    public class SecuritySettingsController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly RbacDbContext _rbacDbContext;
        private readonly ILogger<SecuritySettingsController> _logger;
        private object ipDataStr;

        public SecuritySettingsController(IOptions<MyConfiguration> _config, ILogger<SecuritySettingsController> logger) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _rbacDbContext = new RbacDbContext(connString);
            _logger = logger;
        }

        #region Get APIs

        [HttpGet]
        [Route("Applications")]
        public IActionResult Applications()
        {
            // if (reqType == "get-security-application")
            Func<object> func = () => (from p in _rbacDbContext.Applications.Include(a=>a.Permissions)
                                       select new 
                                       {
                                           ApplicationCode = p.ApplicationCode,
                                           ApplicationId = p.ApplicationId,
                                           ApplicationName = p.ApplicationName,
                                           CreatedBy = p.CreatedBy,
                                           CreatedOn = p.CreatedOn,
                                           Description = p.Description,
                                           IsActive = p.IsActive,
                                           ModifiedBy = p.ModifiedBy,
                                           Permissions = p.Permissions,
                                           Roles = p.Roles,
                                           ModifiedOn = p.ModifiedOn,
                                       })
                                       .OrderBy(p => p.ApplicationName).ToList();

            return InvokeHttpGetFunction(func);
        }



        [HttpGet]
        [Route("Routes")]
        public IActionResult Routes()
        {
            // if (reqType == "get-security-route")
            Func<object> func = () => _rbacDbContext.Routes.ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("Permissions")]
        public IActionResult Permissions()
        { //if (reqType == "get-security-permission")
            Func<object> func = () => (from p in _rbacDbContext.Permissions.Include("Application")
                                       select new
                                       {
                                           PermissionId = p.PermissionId,
                                           PermissionName = p.PermissionName,
                                           ApplicationId = p.ApplicationId,
                                           ApplicationName = p.Application.ApplicationName,
                                           CreatedBy = p.CreatedBy,
                                           IsActive = p.IsActive,
                                           CreatedOn = p.CreatedOn,
                                       })
                                          .OrderBy(p => p.ApplicationId).ToList();
            return InvokeHttpGetFunction(func);

        }

        [HttpGet]
        [Route("Roles")]
        public IActionResult Roles()
        {
            // if (reqType == "get-security-role")
            Func<object> func = () => (from r in _rbacDbContext.Roles.Include("Route").Include("Application").Where(r => r.IsSysAdmin == false)
                                       select new
                                       {
                                           RoleId = r.RoleId,
                                           RoleName = r.RoleName,
                                           RolePriority = r.RolePriority,
                                           RoleDescription = r.RoleDescription,
                                           RoleType = r.RoleType,
                                           ApplicationId = r.ApplicationId,
                                           ApplicationName = r.Application.ApplicationName,
                                           DefaultRouteId = r.DefaultRouteId,
                                           DefaultRouteName = r.Route.DisplayName,
                                           CreatedOn = r.CreatedOn,
                                           CreatedBy = r.CreatedBy
                                       }).OrderBy(r => r.RoleName).ToList();
            return InvokeHttpGetFunction(func);

        }

        [HttpGet]
        [Route("Users")]
        public IActionResult Users()
        {
            //if (reqType == "get-security-user")
            Func<object> func = () => GetUsers();
            return InvokeHttpGetFunction(func);
        }

        private object GetUsers()
        {
            var allUsrs = (from r in _rbacDbContext.Users.Include("Employee")
                           select r).ToList();
            var retUserList = (from r in allUsrs
                               join dept in _masterDbContext.Departments on r.Employee.DepartmentId equals dept.DepartmentId
                               select new
                               {
                                   UserId = r.UserId,
                                   EmployeeId = r.EmployeeId,
                                   UserName = r.UserName,
                                   Email = r.Email,
                                   EmployeeName = r.Employee.FullName,
                                   FirstName = r.Employee.FirstName,
                                   LastName = r.Employee.LastName,
                                   CreatedOn = r.CreatedOn,
                                   CreatedBy = r.CreatedBy,
                                   IsActive = r.IsActive,
                                   NeedsPasswordUpdate = r.NeedsPasswordUpdate,
                                   DepartmentName = dept.DepartmentName

                               }).OrderBy(e => e.FirstName).ThenBy(e => e.LastName).ToList();

            return retUserList;
        }
        [HttpGet]
        [Route("RolePermissions")]
        public IActionResult RolePermissions(int roleId)
        {
            // if (reqType == "get-security-rolepermission")
            Func<object> func = () => (from r in _rbacDbContext.RolePermissionMaps.Include("Role").Include("Permission").Include("Application")
                                       where (r.RoleId == roleId)
                                       select new
                                       {
                                           RolePermissionMapId = r.RolePermissionMapId,
                                           RoleId = r.RoleId,
                                           PermissionId = r.PermissionId,
                                           RoleName = r.Role.RoleName,
                                           PermissionName = r.Permission.PermissionName,
                                           CreatedOn = r.CreatedOn,
                                           CreatedBy = r.CreatedBy,
                                           ApplicationId = r.Permission.ApplicationId,
                                           ApplicationName = r.Permission.Application.ApplicationName,
                                           IsActive = r.IsActive
                                       }).OrderBy(r => r.PermissionName).ToList();
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("UserRoles")]
        public IActionResult UserRoles(int userId)
        {
            // if (reqType == "get-security-userrole")
            Func<object> func = () => (from r in _rbacDbContext.UserRoleMaps.Include("User").Include("Role")
                                       where (r.UserId == userId)
                                       select new
                                       {
                                           UserRoleMapId = r.UserRoleMapId,
                                           RoleId = r.RoleId,
                                           UserId = r.UserId,
                                           UserName = r.User.UserName,
                                           RoleName = r.Role.RoleName,
                                           CreatedOn = r.CreatedOn,
                                           CreatedBy = r.CreatedBy,
                                           IsActive = r.IsActive
                                       }).OrderBy(r => r.RoleId).ToList();
            return InvokeHttpGetFunction(func);

        }

        #endregion


        #region Post APIs

        [HttpPost]
        [Route("User")]
        public IActionResult PostUser()
        {
            //if (reqType == "post-security-user")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveUser(ipDataStr);
            return InvokeHttpPostFunction(func);
        }

        private object SaveUser(string ipDataStr)
        {
            RbacUser user = DanpheJSONConvert.DeserializeObject<RbacUser>(ipDataStr);
            user.Password = RBAC.EncryptPassword(user.Password);
            _rbacDbContext.Users.Add(user);
            _rbacDbContext.SaveChanges();

            var currEmployee = _rbacDbContext.Employees.Where(e => e.EmployeeId == user.EmployeeId).FirstOrDefault();

            var retUser = new
            {
                UserId = user.UserId,
                EmployeeId = user.EmployeeId,
                UserName = user.UserName,
                Email = user.Email,
                EmployeeName = currEmployee != null ? currEmployee.FullName : null,
                CreatedOn = user.CreatedOn,
                CreatedBy = user.CreatedBy,
                IsActive = user.IsActive
            };
            return retUser;
        }

        [HttpPost]
        [Route("Role")]
        public IActionResult PostRole()
        { // if (reqType == "post-security-role")
            string ipdatastr = this.ReadPostData();
            Func<object> func = () => SaveRole(ipdatastr);
            return InvokeHttpPostFunction(func);

        }
        private object SaveRole(string ipDataStr)
        {
            try
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var currentUserRoles = RBAC.GetUserAllRoles(currentUser.UserId);

                bool isAdmin = currentUserRoles.Any(r => r.IsSysAdmin || r.RoleName == "SuperAdmin");

                if (!isAdmin)
                {
                    _logger.LogWarning("User {UserId} attempted to add Roles", currentUser.UserId);
                    throw new ForbiddenException("You don't have permission to add Roles.");
                }

                RbacRole role = DanpheJSONConvert.DeserializeObject<RbacRole>(ipDataStr);
                _rbacDbContext.Roles.Add(role);
                _rbacDbContext.SaveChanges();
                return role;
            }
            catch (ForbiddenException ex)
            {
                _logger.LogError("Forbidden: User is not allowed to add role. Details: {ex}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unexpected error while adding role: {ex}", ex);
                throw new Exception("Could not add role due to an internal error.");
            }
        }

        [HttpPost]
        [Route("RolePermissions")]
        public IActionResult PostRolePermissions(int roleId)
        {
            //if (reqType == "post-security-rolePermission")
            string ipDataStr = this.ReadPostData();
            Func<int> func = () => SaveRolePermissions(roleId, ipDataStr);
            return InvokeHttpPostFunction(func);
        }
        private int SaveRolePermissions(int roleId, string ipDataStr)
        {
            try
            {
                if (roleId == null)
                {
                    throw new ArgumentNullException("{0} cannot be null", nameof(roleId));
                }

                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var currentUserRoles = RBAC.GetUserAllRoles(currentUser.UserId);

                bool isAdmin = currentUserRoles.Any(r => r.IsSysAdmin || r.RoleName == "SuperAdmin");

                if (!isAdmin)
                {
                    _logger.LogWarning("User {UserId} attempted to add RolePermissions", currentUser.UserId);
                    throw new ForbiddenException("You don't have permission to add RolePermissions.");
                }

                //step:1--Remove all existing mappings of this role.
                List<RolePermissionMap> existingMapping = _rbacDbContext.RolePermissionMaps.Where(r => r.RoleId == roleId).ToList();
                if (existingMapping != null && existingMapping.Count > 0)
                {

                    foreach (RolePermissionMap map in existingMapping)
                    {
                        _rbacDbContext.RolePermissionMaps.Remove(map);
                    }
                    _rbacDbContext.SaveChanges();


                }
                //step:2 -- Add new rolePermissions to this role.

                List<RolePermissionMap> rolePermissions = DanpheJSONConvert.DeserializeObject<List<RolePermissionMap>>(ipDataStr);
                rolePermissions.ForEach(roleP =>
                {
                    _rbacDbContext.RolePermissionMaps.Add(roleP);
                });

                return _rbacDbContext.SaveChanges();
            }
            catch (ArgumentNullException ex)
            {
                _logger.LogError("ArgumentNullException: {ex}", ex);
                throw;
            }
            catch (ForbiddenException ex)
            {
                _logger.LogError("Forbidden: User is not allowed to add role-permissions. Details: {ex}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unexpected error while adding role-permissions: {ex}", ex);
                throw new Exception("Could not add role due to an internal error.");
            }
            
        }


        [HttpPost]
        [Route("UserRoles")]
        public IActionResult PostUserRoles()
        {
            //if (reqType == "post-security-userRole")
            string ipDataStr = this.ReadPostData();
            Func<int> func = () => SaveUserRoles(ipDataStr);
            return InvokeHttpPostFunction(func);

        }
        private int SaveUserRoles(string ipDataStr)
        {
            List<UserRoleMap> rolePermissions = DanpheJSONConvert.DeserializeObject<List<UserRoleMap>>(ipDataStr);
            rolePermissions.ForEach(userRole =>
            {
                _rbacDbContext.UserRoleMaps.Add(userRole);
            });

            return _rbacDbContext.SaveChanges();

        }


        #endregion


        #region Put APIs

        [HttpPut]
        [Route("User")]
        public IActionResult PutUser()
        {
            //if (reqType == "put-security-user")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateUser(ipDataStr);
            return InvokeHttpPutFunction(func);
        }
        private object UpdateUser(string ipDataStr)
        {
            RbacUser user = DanpheJSONConvert.DeserializeObject<RbacUser>(ipDataStr);
            _rbacDbContext.Users.Attach(user);
            _rbacDbContext.Entry(user).State = EntityState.Modified;
            _rbacDbContext.Entry(user).Property(x => x.CreatedOn).IsModified = false;
            _rbacDbContext.Entry(user).Property(x => x.CreatedBy).IsModified = false;
            _rbacDbContext.SaveChanges();
            return user;

        }


        [HttpPut]
        [Route("Role")]
        public IActionResult PutRole()
        { //if (reqType == "put-security-role")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateRole(ipDataStr);
            return InvokeHttpPutFunction(func);

        }
        private object UpdateRole(string ipDataStr)
        {
            try
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var currentUserRoles = RBAC.GetUserAllRoles(currentUser.UserId);

                bool isAdmin = currentUserRoles.Any(r => r.IsSysAdmin || r.RoleName == "SuperAdmin");

                if (!isAdmin)
                {
                    _logger.LogWarning("User {UserId} attempted to update Roles", currentUser.UserId);
                    throw new ForbiddenException("You don't have permission to update Roles.");
                }

                RbacRole role = DanpheJSONConvert.DeserializeObject<RbacRole>(ipDataStr);
                _rbacDbContext.Roles.Attach(role);
                _rbacDbContext.Entry(role).State = EntityState.Modified;
                _rbacDbContext.Entry(role).Property(x => x.CreatedOn).IsModified = false;
                _rbacDbContext.Entry(role).Property(x => x.CreatedBy).IsModified = false;
                _rbacDbContext.SaveChanges();
                return role;
            }
            catch (ForbiddenException ex)
            {
                _logger.LogError("Forbidden: User is not allowed to update role. Details: {ex}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unexpected error while updating role: {ex}", ex);
                throw new Exception("Could not add role due to an internal error.");
            }

        }

        [HttpPut]
        [Route("RolePermissions")]
        public IActionResult PutRolePermissions()
        {
            // if (reqType == "put-security-rolePermission")
            string ipDataStr = this.ReadPostData();
            Func<int> func = () => UpdateRolePermissions(ipDataStr);
            return InvokeHttpPutFunction(func);
        }
        private int UpdateRolePermissions(string ipDataStr)
        {
            try
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var currentUserRoles = RBAC.GetUserAllRoles(currentUser.UserId);

                bool isAdmin = currentUserRoles.Any(r => r.IsSysAdmin || r.RoleName == "SuperAdmin");

                if (!isAdmin)
                {
                    _logger.LogWarning("User {UserId} attempted to update RolePermissions", currentUser.UserId);
                    throw new ForbiddenException("You don't have permission to update RolePermissions.");
                }

                List<RolePermissionMap> rolePermissions = DanpheJSONConvert.DeserializeObject<List<RolePermissionMap>>(ipDataStr);
                rolePermissions.ForEach(roleP =>
                {
                    _rbacDbContext.RolePermissionMaps.Attach(roleP);
                    _rbacDbContext.Entry(roleP).State = EntityState.Modified;
                    _rbacDbContext.Entry(roleP).Property(x => x.CreatedOn).IsModified = false;
                    _rbacDbContext.Entry(roleP).Property(x => x.CreatedBy).IsModified = false;
                });
                return _rbacDbContext.SaveChanges();
            }
            catch (ForbiddenException ex)
            {
                _logger.LogError("Forbidden: User is not allowed to update role-permissions. Details: {ex}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unexpected error while updating role-permissions: {ex}", ex);
                throw new Exception("Could not add role due to an internal error.");
            }
        }

        [HttpPut]
        [Route("UserRoles")]
        public IActionResult PutUserRoles()
        {
            // if (reqType == "put-security-userRole")
            string ipDataStr = this.ReadPostData();
            Func<int> func = () => UpdateUserRoles(ipDataStr);
            return InvokeHttpPutFunction(func);

        }
        private int UpdateUserRoles(string ipDataStr)
        {
            List<UserRoleMap> userRoles = DanpheJSONConvert.DeserializeObject<List<UserRoleMap>>(ipDataStr);
            userRoles.ForEach(userRole =>
            {
                _rbacDbContext.UserRoleMaps.Attach(userRole);
                _rbacDbContext.Entry(userRole).State = EntityState.Modified;
                _rbacDbContext.Entry(userRole).Property(x => x.CreatedOn).IsModified = false;
                _rbacDbContext.Entry(userRole).Property(x => x.CreatedBy).IsModified = false;
            });
             return _rbacDbContext.SaveChanges();
            
        }


        [HttpPut]
        [Route("ResetPassword")]
        public IActionResult PutResetPassword([FromBody] RbacUser user)
        {
            // if (reqType == "put-security-reset-password")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => UpdateResetPassword(user, currentUser);
            return InvokeHttpPutFunction(func);
        }
        private object UpdateResetPassword(RbacUser user, RbacUser currentUser)
        {
            try
            {
                //validate Password Reset Request
                ValidatePasswordResetRequest(user, currentUser);

                var existingUser = _rbacDbContext.Users.FirstOrDefault(u => u.UserId == user.UserId);
                if (existingUser == null)
                {
                    throw new NotFoundException("User not found.");

                }
                //encrypting current entered password and updating in table
                existingUser.Password = RBAC.EncryptPassword(user.Password);
                existingUser.ModifiedBy = currentUser.ModifiedBy;
                existingUser.ModifiedOn = currentUser.ModifiedOn;
         
                _rbacDbContext.Entry(existingUser).Property(x => x.ModifiedBy).IsModified = true;
                _rbacDbContext.Entry(existingUser).Property(x => x.ModifiedOn).IsModified = true;
                _rbacDbContext.Entry(existingUser).Property(x => x.Password).IsModified = true;
                _rbacDbContext.Entry(existingUser).Property(x => x.NeedsPasswordUpdate).IsModified = true;
                _rbacDbContext.SaveChanges();
                user.Password = " ";

                return user;

            }
            catch (ForbiddenException ex)
            {
                _logger.LogError("Forbidden: User is not allowed to reset password. Details: {ex}", ex);
                throw;
            }
            catch (BadRequestException ex)
            {
                _logger.LogError("Bad request during password reset: {ex}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError("Unexpected error during password reset: {ex}", ex);
                throw new Exception("Could not reset password due to an internal error.");
            }
        }

        private bool ValidatePasswordResetRequest(RbacUser user, RbacUser currentUser)
        {
            if (user == null || user.UserId <= 0)
            {
                throw new BadRequestException("Invalid user information provided for password reset.");
            }

            // Get the existing user from database to ensure we're working with valid data
            var existingUser = _rbacDbContext.Users.FirstOrDefault(u => u.UserId == user.UserId && u.IsActive == true);
            if (existingUser == null)
            {
                throw new ForbiddenException("Cannot reset password for inactive or non-existent user.");
            }

            if (user.UserId == currentUser.UserId)
            {
                return true;
            }

            var currentUserRoles = RBAC.GetUserAllRoles(currentUser.UserId);

            bool isAdmin = currentUserRoles.Any(role => role.IsSysAdmin || role.RoleName == "SuperAdmin");

            if (!isAdmin)
            {
                _logger.LogWarning("User {UserId} attempted to reset password for user {TargetUserId} without proper permissions",
                    currentUser.UserId, user.UserId);
                throw new ForbiddenException("You don't have permission to reset another user's password.");
            }

            return true;
        }

        [HttpPut]
        [Route("UserIsActive")]
        public IActionResult PutUserIsActive()
        {
            //if (reqType == "put-security-user-isactive")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateUserIsActive(ipDataStr);
            return InvokeHttpPutFunction(func);
        }


        private object UpdateUserIsActive(string ipDataStr)
        {
            RbacUser user = DanpheJSONConvert.DeserializeObject<RbacUser>(ipDataStr);
            //encrepting current entered password and updating in table
            // user.Password = RBAC.EncryptPassword(user.Password);

            _rbacDbContext.Users.Attach(user);
            _rbacDbContext.Entry(user).Property(x => x.IsActive).IsModified = true;
            _rbacDbContext.SaveChanges();
            return user;


        }

        #endregion
    }
}