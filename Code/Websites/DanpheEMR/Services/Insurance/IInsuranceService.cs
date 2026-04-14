using DanpheEMR.Core;
using DanpheEMR.DalLayer;
using static DanpheEMR.Services.Insurance.HIBApiResponses;
using System.Threading.Tasks;
using DanpheEMR.ServerModel.PatientModels;
using System.Data;
using System;

namespace DanpheEMR.Services.Insurance
{
    public interface IInsuranceService
    {
        Task<GetPatientDetailsAndEligibilityApiResponse> GetPatientDetails(string NSHINumber, CoreDbContext coreDbContext, InsuranceDbContext insuranceDbContext);
        Task<GetEligibilityApiResponse> CheckEligibility(string NSHINumber, CoreDbContext coreDbContext);
        Task<PatientSchemeMapModel> GetNHSIPatientDetailLocally(InsuranceDbContext insuranceDbContext, int patientId, int schemeId);
        DataSet GetClaimableInvoicesDetailInfo(string phrmInvoiceIds, string billingInvoiceId, InsuranceDbContext insuranceDbContext);
        bool CheckIfClaimSubmitted(long claimCode, InsuranceDbContext insuranceDbContext);
        object DoctorsListWithNMCNo(InsuranceDbContext insuranceDbContext);
        /// <summary>
        /// This method fetch capping information of an Insuree by Membership Number from HIB Api
        /// </summary>
        /// <param name="NSHINumber"></param>
        /// <param name="coreDbContext"></param>
        /// <returns>This method returns all the capping information of a particular insuree</returns>
        Task<CappingResponseInfo> GetCappingResponseByCHFID(string NSHINumber, CoreDbContext coreDbContext);
    }
}
