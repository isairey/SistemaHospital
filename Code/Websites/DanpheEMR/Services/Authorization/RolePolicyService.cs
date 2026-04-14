using DanpheEMR.Core.Caching;
using DanpheEMR.Security;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Authorization
{
    public class RolePolicyService
    {
        private static string connStringName;
        private readonly ICacheService _cacheService;

        public RolePolicyService(string connectionString, ICacheService cacheService)
        {
            connStringName = connectionString;
            _cacheService = cacheService;
        }

        /// <summary>
        /// This method returns the mapping of roles and policies based on policyName
        /// </summary>
        /// <param name="policyName">Name of the policy for which mapping is needed</param>
        /// <param name="userId">UserId of the logged in User</param>
        /// <returns>It returns the list of roles that are mapped with provided policy</returns>
        /// <exception cref="InvalidOperationException">Invalid Operation Exception is thrown if policy with provided policy isnot found.</exception>
        public async Task<List<RolePolicyMappingDTO>> GetRolesForPolicy(string policyName, int userId)
        {
            string cacheKey = $"policy_roles_{userId}";

            //Try to get from cache first
            var cachedRoles = _cacheService.GetFromCache<List<RolePolicyMappingDTO>>(cacheKey);

            if(cachedRoles != null)
            {
                var policyRoles = cachedRoles.Where(s => s.PolicyName == policyName).ToList();
                return policyRoles;
            }

            // If not in cache, fetch from database
            RbacDbContext dbContext = new RbacDbContext(connStringName);

            List<RolePolicyMappingDTO> rolesPolicy = await (from policyRoleMapping in dbContext.RbacPolicyRoleMappings
                                                      join policy in dbContext.RbacPolicies on policyRoleMapping.PolicyId equals policy.PolicyId
                                                      join roles in dbContext.Roles on policyRoleMapping.RoleId equals roles.RoleId
                                                      join usrRole in dbContext.UserRoleMaps on roles.RoleId equals usrRole.RoleId
                                                      where usrRole.UserId == userId && policyRoleMapping.IsActive == true && usrRole.IsActive == true && roles.IsActive == true
                                                      select new RolePolicyMappingDTO
                                                      {
                                                          PolicyName = policy.PolicyName,
                                                          UserId = usrRole.UserId,
                                                          RoleName = roles.RoleName
                                                      }).ToListAsync(cancellationToken: default);

            // Cache the result for furutre requests
            _cacheService.AddToCache(cacheKey, rolesPolicy, minutesToCache: 60, useSlidingExpiration: true);

            var requiredPolicyRoles = rolesPolicy.Where(s => s.PolicyName == policyName).ToList();

            return rolesPolicy;
        }
    }
}
