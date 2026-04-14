using DanpheEMR.Core;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.ClaimManagementModels;
using DanpheEMR.Services.ClaimManagement.DTOs;
using DanpheEMR.Services.Insurance.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DanpheEMR.Services.ClaimManagement
{
    public interface IClaimManagementService
    {
        #region Get
        List<CreditOrganizationDTO> GetInsuranceApplicableCreditOrganizations(ClaimManagementDbContext claimManagementDbContext);
        object GetBillForClaimReview(DateTime FromDate, DateTime ToDate, int CreditOrganizationId,int? PatientId, ClaimManagementDbContext claimManagementDbContext);
        bool IsClaimCodeAvailable(Int64 ClaimCode, int CheckIsClaimCodeAvailable, int CreditOrganizationId, string ApiIntegrationName, int PatientId, ClaimManagementDbContext claimManagementDbContext);
        object GetPendingClaims(int CreditOrganizationId, ClaimManagementDbContext claimManagementDbContext);
        object GetInvoicesByClaimId(int ClaimSubmissionId, ClaimManagementDbContext claimManagementDbContext);
        object GetDocumentForPreviewByFileId(int fileId, ClaimManagementDbContext claimManagementDbContext);
        object GetDocumentsByClaimCode(int ClaimCode, ClaimManagementDbContext claimManagementDbContext);
        object GetPaymentPendingClaims(int CreditOrganizationId, ClaimManagementDbContext claimManagementDbContext);
        object GetInsurancePayments(int ClaimSubmissionId, ClaimManagementDbContext claimManagementDbContext);
        object GetClaimDetailsForPreview(int ClaimSubmissionId, ClaimManagementDbContext _claimManagementgDbContext);
        object GetBillingCreditNotes(int BillingTransactionId, ClaimManagementDbContext claimManagementDbContext);
        object GetPharmacyCreditNotes(int InvoiceId, ClaimManagementDbContext claimManagementDbContext);
        object GetBillingCreditBillItems(int BillingTransactionId, ClaimManagementDbContext _claimManagementgDbContext);
        object GetPharmacyCreditBillItems(int PharmacyInvoiceId, ClaimManagementDbContext _claimManagementgDbContext);
        object GetApiIntegrationNameByOrganizationId(int OrganizationId, ClaimManagementDbContext _claimManagementgDbContext);
        object GetECHSPatientWithVisitInformation(string search, ClaimManagementDbContext _claimManagementgDbContext);
        object GetReportsByClaimCode(long ClaimCode, ClaimManagementDbContext _claimManagementgDbContext);
        object GetInitiatedClaimCodesByPatientId(int PatientId, ClaimManagementDbContext _claimManagementgDbContext);
        object CheckIfClaimCodeAlreadySettled(Int64 ClaimCode, ClaimManagementDbContext _claimManagementgDbContext);
        object GetFinalBillSummaryByClaimCode(Int64 ClaimCode, ClaimManagementDbContext _claimManagementgDbContext);
        object GetClaimDocumentReceivedReport(DateTime FromDate, DateTime ToDate, int? PatientId, long? ClaimCode, string InvoiceNo, ClaimManagementDbContext _claimManagementgDbContext);

        #endregion

        #region POST
        object SaveClaimScrubbing(RbacUser currentUser, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext claimManagementDbContext);
        object InsuranceClaimPayment(RbacUser currentUser, ClaimPaymentDTO paymentObject, ClaimManagementDbContext claimManagementDbContext);
        #endregion

        #region Put
        object UpdateClaimableStatus(RbacUser currentUser, Boolean claimableStatus, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext claimManagementDbContext);
        object UpdateClaimableStatusOfClaimGeneratedInvoice(RbacUser currentUser, Boolean claimableStatus, ClaimBillReviewDTO bill, ClaimManagementDbContext _claimManagementgDbContext);
        object RevertInvoiceToBillPreview(RbacUser currentUser, ClaimBillReviewDTO bill, ClaimManagementDbContext _claimManagementgDbContext);
        Task<object> SubmitClaim(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext claimManagementDbContext);
        object UpdateClaimCodeOfInvoices(RbacUser currentUser, Int64 claimCode, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext claimManagementDbContext);
        object UpdateApprovedAndRejectedAmount(RbacUser currentUser, PendingClaimDTO claimObject, ClaimManagementDbContext _claimManagementgDbContext);
        object ConcludeClaim(RbacUser currentUser, int ClaimSubmissionId, ClaimManagementDbContext _claimManagementgDbContext);
        object RevertClaimToBackToClaimScrubbing(RbacUser currentUser, int ClaimSubmissionId, ClaimManagementDbContext _claimManagementDbContext);
        object UpdateBillingCreditItemClaimableStatus(RbacUser currentUser, BillingCreditBillItemDTO BillingCreditBillItemDTO, ClaimManagementDbContext _claimManagementgDbContext);
        object UpdatePharmacyCreditItemClaimableStatus(RbacUser currentUser, PharmacyCreditBillItemDTO PharmacyCreditBillItemDTO, ClaimManagementDbContext _claimManagementgDbContext);
        object UpdateInsuranceClaimPayment(RbacUser currentUser, ClaimPaymentDTO paymentObject, ClaimManagementDbContext claimManagementDbContext);
        object SaveClaim(RbacUser currentUser, InsuranceClaim claim, ClaimManagementDbContext claimManagementDbContext);
        object SaveClaimAsDraft(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext claimManagementDbContext);
        List<Diagnosis_DTO> GetDiagnosis(ClaimManagementDbContext insuranceDbContext);
        object UpdateDocumentReceivedStatus(RbacUser currentUser, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext claimManagementDbContext);

        #endregion
    }
}
