using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.Security
{
    public class RbacPolicy
    {
        [Key]
        public int PolicyId { get; private set; }
        public string PolicyName { get; private set; }
        public string Description { get; private set; }

        //private constructor to avoid object creation from other classes
        private RbacPolicy() { }

        //public static factory method to create an object from other classes
        public static RbacPolicy CreatePolicy(string policyName, string description)
        {
            try
            {
                ValidatePolicyCreation(policyName, description);

                var policy = new RbacPolicy
                {
                    PolicyName = policyName,
                    Description = description
                };
                return policy;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        private static void ValidatePolicyCreation(string policyName, string description)
        {
            if (string.IsNullOrWhiteSpace(policyName))
            {
                throw new ArgumentNullException("PolicyName is mandatory while creating a policy.");
            }

            if (string.IsNullOrWhiteSpace(description))
            {
                throw new ArgumentNullException("Poicy Description is mandatory while creating a policy.");
            }
        }

        public void UpdatePolicyDescription(string description)
        {
            Description = description;
        }
    }
}
