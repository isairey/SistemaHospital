using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.Security
{
    public class RbacPolicyRoleMapping
    {
        [Key]
        public int RolePolicyMapId { get; private set; }
        public int RoleId { get; private set; }
        public int PolicyId { get; private set; }
        public bool IsActive { get; private set; }

        //private constructor to avoid object creation from outside
        private RbacPolicyRoleMapping() { }

        //public static factory method to create object from outside.
        public static RbacPolicyRoleMapping CreateRolePolicyMapping(int roleId, int policyId)
        {
            ValidateRolePolicyMapping(roleId, policyId);

            var rolePolicyMap = new RbacPolicyRoleMapping
            {
                RoleId = roleId,
                PolicyId = policyId
            };
            return rolePolicyMap;
        }

        private static void ValidateRolePolicyMapping(int roleId, int policyId)
        {
            if (roleId == 0)
            {
                throw new ArgumentNullException("RoleId is mandatory to map Role with any Policy");
            }

            if (policyId == 0)
            {
                throw new ArgumentNullException("PolicyId is mandatory to map Role with any Policy");
            }
        }

        public void DeactivateRolePolicyMapping(int rolePolicyMapId)
        {
            IsActive = false;
        }
    }
}
