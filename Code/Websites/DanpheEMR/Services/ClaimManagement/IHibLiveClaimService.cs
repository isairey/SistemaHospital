using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.ClaimManagement.DTOs;
using System.Threading.Tasks;

namespace DanpheEMR.Services.ClaimManagement
{
    public interface IHibLiveClaimService
    {
        Task<HibLiveClaimResponse> SubmitHibLiveClaim(RbacUser rbacUser, HibLiveClaimDTO hibLiveClaim, ClaimManagementDbContext claimManagementDbContext, InsuranceDbContext insuranceDbContext, BillingDbContext billingDbContext, PharmacyDbContext pharmacyDbContext);
    }
}
