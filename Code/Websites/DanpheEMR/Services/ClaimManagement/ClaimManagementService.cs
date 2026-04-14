using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.BillingModels.POS;
using DanpheEMR.ServerModel.ClaimManagementModels;
using DanpheEMR.ServerModel.PharmacyModels;
using DanpheEMR.Services.ClaimManagement.DTOs;
using DanpheEMR.Services.Insurance;
using DanpheEMR.Services.Insurance.DTOs;
using DanpheEMR.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using static DanpheEMR.Services.Insurance.HIBApiResponses;

namespace DanpheEMR.Services.ClaimManagement
{
    public class ClaimManagementService : IClaimManagementService
    {
        #region Get
        public List<CreditOrganizationDTO> GetInsuranceApplicableCreditOrganizations(ClaimManagementDbContext _claimManagementDbContext)
        {
            var InsuranceApplicableCreditOrganizations = new List<CreditOrganizationDTO>();
            InsuranceApplicableCreditOrganizations = (from claimMangnt in _claimManagementDbContext.CreditOrganization
                                                      where claimMangnt.IsClaimManagementApplicable == true
                                                      select new CreditOrganizationDTO
                                                      {
                                                          OrganizationId = claimMangnt.OrganizationId,
                                                          OrganizationName = claimMangnt.OrganizationName,
                                                          IsActive = claimMangnt.IsActive,
                                                          CreatedOn = claimMangnt.CreatedOn,
                                                          CreatedBy = claimMangnt.CreatedBy,
                                                          ModifiedOn = claimMangnt.ModifiedOn,
                                                          ModifiedBy = claimMangnt.ModifiedBy,
                                                          IsDefault = claimMangnt.IsDefault,
                                                          IsClaimManagementApplicable = claimMangnt.IsClaimManagementApplicable,
                                                          IsClaimCodeCompulsory = claimMangnt.IsClaimCodeCompulsory,
                                                          IsClaimCodeAutoGenerate = claimMangnt.IsClaimCodeAutoGenerate,
                                                          DisplayName = claimMangnt.DisplayName,
                                                      }).ToList();
            return InsuranceApplicableCreditOrganizations;
        }

        public object GetBillForClaimReview(DateTime FromDate, DateTime ToDate, int CreditOrganizationId, int? PatientId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", FromDate),
                        new SqlParameter("@ToDate", ToDate),
                        new SqlParameter("@CreditOrganizationId", CreditOrganizationId),
                        new SqlParameter("@PatientId",PatientId)
                    };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_INS_InsuranceBillReview", paramList, _claimManagementgDbContext);
            return dt;
        }

        public bool IsClaimCodeAvailable(Int64 claimCode, int patientVisitId, int creditOrganizationId, string apiIntegrationName, int patientId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            if (claimCode == 0) return false;

            var claimStatus = _claimManagementgDbContext.InsuranceClaim
                .Where(b => b.ClaimCode == claimCode && b.CreditOrganizationId == creditOrganizationId)
                .ToList();

            // If no records found, claim code is available
            if (!claimStatus.Any())
                return true;

            var isAvailable = CheckClaimCodeAvailability(claimStatus, patientVisitId, apiIntegrationName, patientId);

            return isAvailable;
        }
        
        private bool CheckClaimCodeAvailability(IEnumerable<dynamic> records, int patientVisitId, string apiIntegrationName, int patientId)
        {
            if (!records.Any()) return true;

            bool isEchs = apiIntegrationName == ENUM_Scheme_ApiIntegrationNames.ECHS;
            return records.All(a => a.PatientId == patientId && (isEchs || a.PatientVisitId == patientVisitId) && (a.ClaimStatus != ENUM_ClaimManagement_ClaimStatus.PaymentPending || a.ClaimStatus != ENUM_ClaimManagement_ClaimStatus.Settled));
        }

        public object GetPendingClaims(int CreditOrganizationId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            //var result = _claimManagementgDbContext.InsuranceClaim.Where(a => a.CreditOrganizationId == CreditOrganizationId && a.ClaimStatus == ENUM_ClaimManagement_ClaimStatus.Initiated).AsNoTracking().ToList();
            //return result;

            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@CreditOrganizationId", CreditOrganizationId),
                    };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_INS_PendingClaims", paramList, _claimManagementgDbContext);
            return dt;
        }

        public object GetInvoicesByClaimId(int ClaimSubmissionId, ClaimManagementDbContext _claimManagementDbContext)
        {
            var billingInvoices = _claimManagementDbContext.BillingCreditBillStatus.Where(bill => bill.ClaimSubmissionId == ClaimSubmissionId).Select(a => new
            ClaimBillReviewDTO
            {
                CreditStatusId = a.BillingCreditBillStatusId,
                ClaimSubmissionId = a.ClaimSubmissionId,
                InvoiceRefId = a.BillingTransactionId,
                InvoiceNo = a.InvoiceNoFormatted,
                InvoiceDate = a.InvoiceDate,
                TotalAmount = a.SalesTotalBillAmount - a.ReturnTotalBillAmount,
                NonClaimableAmount = a.NonClaimableAmount,
                IsClaimable = a.IsClaimable,
                CreditModule = ENUM_ClaimManagement_CreditModule.Billing,
                FiscalYearId = a.FiscalYearId
            }).AsNoTracking().ToList();

            var pharmacyInvoices = _claimManagementDbContext.PharmacyCreditBillStatus.Where(bill => bill.ClaimSubmissionId == ClaimSubmissionId).Select(a => new
            ClaimBillReviewDTO
            {
                CreditStatusId = a.PhrmCreditBillStatusId,
                ClaimSubmissionId = a.ClaimSubmissionId,
                InvoiceRefId = a.InvoiceId,
                InvoiceNo = a.InvoiceNoFormatted,
                InvoiceDate = a.InvoiceDate,
                TotalAmount = a.SalesTotalBillAmount - a.ReturnTotalBillAmount,
                NonClaimableAmount = a.NonClaimableAmount,
                IsClaimable = a.IsClaimable,
                CreditModule = ENUM_ClaimManagement_CreditModule.Pharmacy,
                FiscalYearId = a.FiscalYearId
            }).AsNoTracking().ToList();

            var result = billingInvoices.Union(pharmacyInvoices).OrderBy(a => a.InvoiceDate).ToList();
            return result;
        }

        public object GetDocumentForPreviewByFileId(int fileId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            var selectedDocument = _claimManagementgDbContext.TXNUploadedFile.Where(doc => doc.FileId == fileId)
                                                                                 .Select(a => new
                                                                                 {
                                                                                     FileLocationFullPath = a.FileLocationFullPath,
                                                                                     FileExtension = a.FileExtension
                                                                                 })
                                                                                 .FirstOrDefault();
            byte[] fileArray = File.ReadAllBytes(selectedDocument.FileLocationFullPath);
            string BinaryData = Convert.ToBase64String(fileArray);
            return new { BinaryData, selectedDocument.FileExtension };
        }

        public object GetDocumentsByClaimCode(int ClaimCode, ClaimManagementDbContext _claimManagementDbContext)
        {
            var DocumentList = (from upload in _claimManagementDbContext.TXNUploadedFile.Where(doc => doc.ClaimCode == ClaimCode)
                                join emp in _claimManagementDbContext.EmployeeModels on upload.UploadedBy equals emp.EmployeeId
                                select new
                            UploadedFileDTO
                                {
                                    FileId = upload.FileId,
                                    FileDisplayName = upload.FileDisplayName,
                                    FileExtension = upload.FileExtension,
                                    FileDescription = upload.FileDescription,
                                    UploadedBy = upload.UploadedBy,
                                    UploadedOn = upload.UploadedOn,
                                    Size = upload.Size,
                                    FileUploadedBy = emp.FullName
                                }).ToList();
            return DocumentList;
        }

        public object GetPaymentPendingClaims(int CreditOrganizationId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@CreditOrganizationId", CreditOrganizationId),
                    };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_INS_PaymentPendingClaims", paramList, _claimManagementgDbContext);
            return dt;
        }

        public object GetInsurancePayments(int ClaimSubmissionId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            var result = _claimManagementgDbContext.InsuranceClaimPayment.Where(a => a.ClaimSubmissionId == ClaimSubmissionId).AsNoTracking().ToList();
            return result;
        }

        public object GetClaimDetailsForPreview(int ClaimSubmissionId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@ClaimSubmissionId", ClaimSubmissionId),
                    };
            DataSet dsClaimDetails = DALFunctions.GetDatasetFromStoredProc("SP_INS_GetClaimDetailsForPreview", paramList, _claimManagementgDbContext);
            DataTable dtHeaderDetails = dsClaimDetails.Tables[0];
            DataTable dtBillingDetails = dsClaimDetails.Tables[1];
            DataTable dtPharmacyDetails = dsClaimDetails.Tables[2];
            DataTable dtDocumentDetails = dsClaimDetails.Tables[3];
            var ClaimDetails = new
            {
                HeaderDetails = HeaderDetailsDTO.MapDataTableToSingleObject(dtHeaderDetails),
                BillingDetails = BillingDetailsDTO.MapDataTableToSingleObject(dtBillingDetails),
                PharmacyDetails = PharmacyDetailsDTO.MapDataTableToSingleObject(dtPharmacyDetails),
                DocumentDetails = DocumentDetailsDTO.MapDataTableToSingleObject(dtDocumentDetails)
            };
            return (ClaimDetails);
        }

        public object GetBillingCreditNotes(int BillingTransactionId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                var entity = new object();
                entity = _claimManagementgDbContext.BILLInvoiceReturn.Where(a => a.BillingTransactionId == BillingTransactionId).Select(a => new
                {
                    CreditNoteNumber = a.CreditNoteNumber,
                    FiscalYearId = a.FiscalYearId
                }).ToList();
                return entity;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given InvoiceRefId");
            }
        }

        public object GetPharmacyCreditNotes(int InvoiceId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                var entity = new object();
                entity = _claimManagementgDbContext.PHRMInvoiceReturn.Where(a => a.InvoiceId == InvoiceId).Select(a => new
                {
                    CreditNoteNumber = a.CreditNoteId,
                    FiscalYearId = a.FiscalYearId,
                    InvoiceReturnId = a.InvoiceReturnId
                }).ToList();
                return entity;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given InvoiceRefId");
            }
        }

        public object GetBillingCreditBillItems(int BillingTransactionId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@BillingTransactionId", BillingTransactionId)
                    };
                DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_INS_Claim_GetBillingCreditBillItems", paramList, _claimManagementgDbContext);
                return dt;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given InvoiceRefId");
            }
        }

        public object GetPharmacyCreditBillItems(int PharmacyInvoiceId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@PharmacyInvoiceId", PharmacyInvoiceId)
                    };
                DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_INS_Claim_GetPharmacyCreditBillItems", paramList, _claimManagementgDbContext);
                return dt;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given InvoiceRefId");
            }
        }

        public object GetApiIntegrationNameByOrganizationId(int OrganizationId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                var apiIntegrationName = _claimManagementgDbContext.Schemes
                                                                   .Where(o => o.DefaultCreditOrganizationId == OrganizationId)
                                                                   .Select(a => new
                                                                   {
                                                                       a.ApiIntegrationName
                                                                   })
                                                                   .FirstOrDefault();
                return apiIntegrationName;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given OrganizationId");
            }
        }

        public object GetInitiatedClaimCodesByPatientId(int PatientId, ClaimManagementDbContext _claimManagementDbContext)
        {
            if (PatientId == 0)
            {
                Log.Error($"{nameof(PatientId)} cannot be zero inorder to get claim codes!");
                throw new ArgumentNullException($"{nameof(PatientId)} cannot be zero inorder to get claim codes!");
            }
            var ClaimCodes = _claimManagementDbContext.InsuranceClaim
                                                      .Where(claim => claim.ClaimStatus == ENUM_ClaimManagement_ClaimStatus.Initiated && claim.PatientId == PatientId)
                                                      .Select(claim => claim.ClaimCode)
                                                      .Distinct()
                                                      .OrderByDescending(claimCode => claimCode)
                                                      .ToList();
            if (ClaimCodes.Count > 0)
            {
                return ClaimCodes;
            }
            else
            {
                throw new NoNullAllowedException("Claim Code not found.");
            }

        }


        public object GetFinalBillSummaryByClaimCode(Int64 ClaimCode, ClaimManagementDbContext _claimManagementgDbContext)
        {
            if (ClaimCode == 0)
            {
                Log.Error($"{nameof(ClaimCode)} cannot be zero inorder to get patient details!");
                throw new ArgumentNullException($"{nameof(ClaimCode)} cannot be zero inorder to get patient details!");
            }
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@ClaimCode", ClaimCode)
                    };
                DataSet ds = DALFunctions.GetDatasetFromStoredProc("SP_GetFinalBillSummaryByClaimCode", paramList, _claimManagementgDbContext);
                var FinalBillSummary = new
                {
                    PatientDetails = ds.Tables[0],
                    ChargeDetails = ds.Tables[1],
                };
                return FinalBillSummary;
            }
            catch (Exception ex)
            {
                throw new Exception(ex + "No Results found for the given InvoiceRefId");
            }

        }


        #endregion

        #region Post
        public object SaveClaimScrubbing(RbacUser currentUser, List<ClaimBillReviewDTO> bills, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (bills.Count > 0)
                    {
                        InsuranceClaim claim = new InsuranceClaim();
                        claim.PatientId = bills[0].PatientId;
                        claim.PatientVisitId = bills[0].PatientVisitId;
                        claim.PatientCode = bills[0].HospitalNo;
                        claim.ClaimCode = bills[0].ClaimCode;
                        claim.MemberNumber = bills[0].MemberNo;
                        claim.SchemeId = bills[0].SchemeId;
                        claim.CreditOrganizationId = bills[0].CreditOrganizationId;
                        claim.ClaimRemarks = "";
                        claim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.Initiated;
                        claim.ApprovedAmount = 0;
                        claim.ClaimedAmount = 0;
                        claim.RejectedAmount = 0;
                        claim.TotalBillAmount = bills.Sum(a => a.TotalAmount);
                        claim.NonClaimableAmount = bills.Sum(a => a.NonClaimableAmount);
                        claim.ClaimableAmount = claim.TotalBillAmount - claim.NonClaimableAmount;
                        claim.ClaimSubmittedOn = DateTime.Now;
                        claim.ClaimSubmittedBy = currentUser.EmployeeId;
                        _claimManagementgDbContext.InsuranceClaim.Add(claim);
                        _claimManagementgDbContext.SaveChanges();

                        bills.ForEach(bil =>
                        {
                            if (bil.CreditModule == ENUM_ClaimManagement_CreditModule.Billing)
                            {
                                var entity = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                                if (entity != null)
                                {
                                    entity.ClaimSubmissionId = claim.ClaimSubmissionId;
                                    entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Completed;
                                    entity.ModifiedBy = currentUser.EmployeeId;
                                    entity.ModifiedOn = DateTime.Now;
                                    _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                    _claimManagementgDbContext.SaveChanges();
                                }
                            }
                            else
                            {
                                var entity = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PhrmCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                                if (entity != null)
                                {
                                    entity.ClaimSubmissionId = claim.ClaimSubmissionId;
                                    entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Completed;
                                    entity.ModifiedBy = currentUser.EmployeeId;
                                    entity.ModifiedOn = DateTime.Now;
                                    _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                    _claimManagementgDbContext.SaveChanges();
                                }
                            }
                        });
                    }
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
        public object InsuranceClaimPayment(RbacUser currentUser, ClaimPaymentDTO paymentObject, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (paymentObject != null)
                    {
                        InsuranceClaimPayment paymentEntity = new InsuranceClaimPayment();
                        paymentEntity.ReceivedAmount = paymentObject.ReceivedAmount;
                        paymentEntity.ServiceCommission = paymentObject.ServiceCommission;
                        paymentEntity.Remarks = paymentObject.Remarks;
                        paymentEntity.ChequeNumber = paymentObject.ChequeNumber;
                        paymentEntity.BankName = paymentObject.BankName;
                        paymentEntity.ClaimCode = paymentObject.ClaimCode;
                        paymentEntity.CreditOrganizationId = paymentObject.CreditOrganizationId;
                        paymentEntity.ClaimSubmissionId = paymentObject.ClaimSubmissionId;
                        paymentEntity.ReceivedOn = DateTime.Now;
                        paymentEntity.ReceivedBy = currentUser.EmployeeId;
                        paymentEntity.PaymentDetails = paymentObject.PaymentDetails;
                        _claimManagementgDbContext.InsuranceClaimPayment.Add(paymentEntity);
                        _claimManagementgDbContext.SaveChanges();
                    }
                    var claim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == paymentObject.ClaimSubmissionId).FirstOrDefault();
                    if (claim != null)
                    {
                        claim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.PartiallyPaid;
                        claim.ModifiedBy = currentUser.EmployeeId;
                        claim.ModifiedOn = DateTime.Now;
                        _claimManagementgDbContext.Entry(claim).State = EntityState.Modified;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    dbContextTransaction.Commit();
                    return paymentObject;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
        #endregion

        #region Put
        public object UpdateClaimableStatus(RbacUser currentUser, Boolean claimableStatus, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    bill.ForEach(bil =>
                    {
                        if (bil.CreditModule == ENUM_ClaimManagement_CreditModule.Billing)
                        {
                            var entity = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsClaimable = claimableStatus;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }
                        else
                        {
                            var entity = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PhrmCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsClaimable = claimableStatus;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }
                    });
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdateClaimableStatusOfClaimGeneratedInvoice(RbacUser currentUser, Boolean claimableStatus, ClaimBillReviewDTO bill, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (bill != null)
                    {
                        if (bill.CreditModule == ENUM_ClaimManagement_CreditModule.Billing)
                        {
                            var entity = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingCreditBillStatusId == bill.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsClaimable = claimableStatus;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }
                        else if (bill.CreditModule == ENUM_ClaimManagement_CreditModule.Pharmacy)
                        {
                            var entity = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PhrmCreditBillStatusId == bill.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsClaimable = claimableStatus;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }

                        var claimEntity = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == bill.ClaimSubmissionId).FirstOrDefault();
                        if (claimEntity != null)
                        {
                            if (claimableStatus == true)
                            {
                                claimEntity.NonClaimableAmount -= (bill.TotalAmount - bill.NonClaimableAmount);
                                claimEntity.ClaimableAmount += (bill.TotalAmount - bill.NonClaimableAmount);
                                claimEntity.ModifiedBy = currentUser.EmployeeId;
                                claimEntity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(claimEntity).State = EntityState.Modified;
                            }
                            else if (claimableStatus == false)
                            {
                                claimEntity.NonClaimableAmount += (bill.TotalAmount - bill.NonClaimableAmount);
                                claimEntity.ClaimableAmount -= (bill.TotalAmount - bill.NonClaimableAmount);
                                claimEntity.ModifiedBy = currentUser.EmployeeId;
                                claimEntity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(claimEntity).State = EntityState.Modified;
                            }
                            _claimManagementgDbContext.SaveChanges();
                        }
                    }
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object RevertInvoiceToBillPreview(RbacUser currentUser, ClaimBillReviewDTO bill, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (bill != null)
                    {
                        if (bill.CreditModule == ENUM_ClaimManagement_CreditModule.Billing)
                        {
                            var entity = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingCreditBillStatusId == bill.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.ClaimSubmissionId = null;
                                entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Pending;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }
                        else
                        {
                            var entity = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PhrmCreditBillStatusId == bill.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.ClaimSubmissionId = null;
                                entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Pending;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                                _claimManagementgDbContext.SaveChanges();
                            }
                        }

                        var claimEntity = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == bill.ClaimSubmissionId).FirstOrDefault();
                        if (claimEntity != null)
                        {
                            claimEntity.TotalBillAmount -= bill.TotalAmount;
                            claimEntity.NonClaimableAmount -= bill.NonClaimableAmount;
                            claimEntity.ClaimableAmount -= (bill.TotalAmount - bill.NonClaimableAmount);
                            claimEntity.ModifiedBy = currentUser.EmployeeId;
                            claimEntity.ModifiedOn = DateTime.Now;
                            _claimManagementgDbContext.Entry(claimEntity).State = EntityState.Modified;
                            _claimManagementgDbContext.SaveChanges();
                        }
                    }
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
        public object SaveClaimAsDraft(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                SaveDocuments(currentUser, claimDTO, _claimManagementgDbContext);
                return null;
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message);
                throw ex;
            }

        }
        public async Task<object> SubmitClaim(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {

                    var scheme = _claimManagementgDbContext.Schemes.Where(a => a.SchemeId == claimDTO.claim.SchemeId).FirstOrDefault();
                    if (scheme != null)
                    {
                        if (scheme.ApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.NGHIS)
                        {
                            if (claimDTO.HIBClaimSubmitPayload is null)
                            {
                                Log.Error($"{nameof(claimDTO.HIBClaimSubmitPayload)} is null for Scheme {scheme.SchemeName} which is why Claim cannot be submitted!");
                                throw new InvalidOperationException($"{nameof(claimDTO.HIBClaimSubmitPayload)} is required for Scheme {scheme.SchemeName} to process further for claim Submission!");
                            }
                            var responseData = await HIBClaimSubmit(currentUser, claimDTO.HIBClaimSubmitPayload, claimDTO.claim, _claimManagementgDbContext);
                            dbContextTransaction.Commit();
                            return responseData;
                        }
                        else
                        {
                            if (claimDTO.claim is null)
                            {
                                Log.Error($"{nameof(claimDTO.claim)} is null for Scheme {scheme.SchemeName} which is why Claim cannot be submitted!");
                                throw new InvalidOperationException($"{nameof(claimDTO.claim)} is required for Scheme {scheme.SchemeName} to process further for claim Submission!");
                            }
                            var responseData = await SaveDocumentsAndClaim(currentUser, claimDTO, _claimManagementgDbContext);
                            dbContextTransaction.Commit();
                            return responseData;
                        }
                    }
                    else
                    {
                        Log.Error("Scheme is null");
                        throw new InvalidOperationException("Scheme is required");
                    }
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw;
                }
            }
        }
        private async Task<object> SaveDocumentsAndClaim(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            try
            {
                Log.Information("Claim Submission process has been Started");
                SaveClaim(currentUser, claimDTO.claim, _claimManagementgDbContext);
                Log.Information("Claim Submission process has been Completed");

                Log.Information("Claim Document Submission process has been Started");
                SaveDocuments(currentUser, claimDTO, _claimManagementgDbContext);
                Log.Information("Claim Document Submission process has been Completed");

                var result = new
                {
                    status = true,
                    message = "Successfully claim submitted"
                };

                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message);
                throw ex;
            }
        }

        private static void SaveDocuments(RbacUser currentUser, SubmitedClaimDTO claimDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            if (claimDTO.files.Count > 0)
            {
                var location = (from dbc in _claimManagementgDbContext.CoreCfgParameter
                                where dbc.ParameterGroupName == "ClaimManagement"
                                && dbc.ParameterName == "InsuranceClaimFileUploadLocation"
                                select dbc.ParameterValue).FirstOrDefault();

                List<dynamic> existingFiles = new List<dynamic>();
                existingFiles.AddRange(_claimManagementgDbContext.TXNUploadedFile
                                                                 .Where(a => a.ClaimCode == claimDTO.claim.ClaimCode)
                                                                 .ToList());
                if (!Directory.Exists(location))
                {
                    Directory.CreateDirectory(location);
                }

                var fileCounter = 1;

                foreach (var doc in claimDTO.files)
                {
                    existingFiles.RemoveAll(f => f.FileId == doc.FileId);

                    var matchingFile = _claimManagementgDbContext.TXNUploadedFile
                                                                 .Where(a => a.FileId == doc.FileId)
                                                                 .FirstOrDefault();

                    if (matchingFile != null)
                    {
                        matchingFile.FileDescription = doc.FileDescription;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    else
                    {
                        var claim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == claimDTO.claim.ClaimSubmissionId).FirstOrDefault();
                        string filename = claim.PatientCode.ToString() + "_" + claim.ClaimCode.ToString() + "_" + DateTime.Now.ToString("yyyyMMddHHmmss") + "_" + fileCounter.ToString();
                        string imgPath = Path.Combine(location, (filename + Path.GetExtension(doc.FileDisplayName)));
                        byte[] imageBytes = Convert.FromBase64String(doc.BinaryData);
                        File.WriteAllBytes(imgPath, imageBytes);

                        TXNUploadedFile file = new TXNUploadedFile();

                        file.FileDisplayName = doc.FileDisplayName;
                        file.FileName = filename;
                        file.FileId = doc.FileId;
                        file.FileExtension = doc.FileExtension;
                        file.FileLocationFullPath = imgPath;
                        file.FileDescription = doc.FileDescription;
                        file.UploadedBy = currentUser.EmployeeId;
                        file.UploadedOn = DateTime.Now;
                        file.ClaimCode = claimDTO.claim.ClaimCode;
                        file.PatientId = claimDTO.claim.PatientId;
                        file.SystemFeatureName = ENUM_FileUpload_SystemFeatureName.InsuranceClaim;
                        file.IsActive = true;
                        file.ReferenceNumber = claimDTO.claim.ClaimSubmissionId;
                        file.ReferenceEntityType = ENUM_FileUpload_ReferenceEntityType.InsuranceClaim;
                        file.PatientVisitId = null;
                        file.Size = doc.Size;

                        fileCounter++;

                        _claimManagementgDbContext.TXNUploadedFile.Add(file);
                        _claimManagementgDbContext.SaveChanges();
                    }
                }

                if (existingFiles != null)
                {
                    foreach (TXNUploadedFile files in existingFiles)
                    {
                        var fileTobeRemoved = _claimManagementgDbContext.TXNUploadedFile
                                                                        .Where(a => a.FileId == files.FileId)
                                                                        .FirstOrDefault();
                        var FileLocationFullPath = fileTobeRemoved.FileLocationFullPath;
                        if (fileTobeRemoved != null)
                        {
                            _claimManagementgDbContext.TXNUploadedFile.Remove(fileTobeRemoved);
                            _claimManagementgDbContext.SaveChanges();

                            File.Delete(FileLocationFullPath);
                        }
                    }
                }
            }
            else if (claimDTO.files.Count == 0)
            {
                var existingFiles = _claimManagementgDbContext.TXNUploadedFile
                                            .Where(a => a.ClaimCode == claimDTO.claim.ClaimCode)
                                            .ToList();
                if (existingFiles != null)
                {
                    _claimManagementgDbContext.TXNUploadedFile.RemoveRange(existingFiles);
                    _claimManagementgDbContext.SaveChanges();

                    foreach (TXNUploadedFile file in existingFiles)
                    {
                        File.Delete(file.FileLocationFullPath);
                    }
                }
            }
        }
        public object SaveClaim(RbacUser currentUser, InsuranceClaim claim, ClaimManagementDbContext _claimManagementgDbContext)
        {
            var Claim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == claim.ClaimSubmissionId).FirstOrDefault();
            if (claim != null)
            {
                Claim.ClaimedAmount = claim.ClaimedAmount;
                Claim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.PaymentPending;
                Claim.ClaimRemarks = claim.ClaimRemarks;
                Claim.ClaimableAmount = claim.ClaimableAmount;
                Claim.NonClaimableAmount = claim.NonClaimableAmount;
                Claim.TotalBillAmount = claim.TotalBillAmount;
                Claim.ModifiedBy = currentUser.EmployeeId;
                Claim.ModifiedOn = DateTime.Now;
                _claimManagementgDbContext.Entry(Claim).State = EntityState.Modified;
                _claimManagementgDbContext.SaveChanges();
                return claim;
            }
            else
            {
                Log.Error("Claim is null");
                throw new InvalidOperationException("Claim is required");
            }
        }
        public object UpdateClaimCodeOfInvoices(RbacUser currentUser, Int64 claimCode, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    bill.ForEach(bil =>
                    {
                        var visit = _claimManagementgDbContext.PatientVisits.Where(a => a.PatientVisitId == bil.PatientVisitId).FirstOrDefault();
                        if (visit != null)
                        {
                            visit.ClaimCode = claimCode;
                            visit.ModifiedBy = currentUser.EmployeeId;
                            visit.ModifiedOn = DateTime.Now;
                            _claimManagementgDbContext.Entry(visit).State = EntityState.Modified;
                        }

                        List<BillingTransactionCreditBillStatusModel> bills = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.PatientVisitId == bil.PatientVisitId).ToList();
                        if (bills != null)
                        {
                            bills.ForEach(credit =>
                            {
                                credit.ClaimCode = claimCode;
                                credit.ModifiedBy = currentUser.EmployeeId;
                                credit.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(credit).State = EntityState.Modified;

                            });
                        }
                        var billTxns = _claimManagementgDbContext.BillTxn.Where(a => a.PatientVisitId == bil.PatientVisitId).ToList();
                        if (billTxns != null)
                        {
                            billTxns.ForEach(billTxn =>
                            {
                                billTxn.ClaimCode = claimCode;
                                _claimManagementgDbContext.Entry(billTxn).State = EntityState.Modified;
                            });

                        }
                        var phrmBills = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PatientVisitId == bil.PatientVisitId).ToList();
                        if (phrmBills != null)
                        {
                            phrmBills.ForEach(phrmBill =>
                            {
                                phrmBill.ClaimCode = claimCode;
                                phrmBill.ModifiedBy = currentUser.EmployeeId;
                                phrmBill.ModifiedOn = DateTime.Now;
                                _claimManagementgDbContext.Entry(phrmBill).State = EntityState.Modified;
                            });
                        }
                        List<PHRMInvoiceTransactionModel> phrmTxns = _claimManagementgDbContext.PHRMInvoiceTransaction.Where(a => a.PatientVisitId == bil.PatientVisitId).ToList();
                        if (phrmTxns != null)
                        {
                            phrmTxns.ForEach(phrmTxn =>
                            {
                                phrmTxn.ClaimCode = claimCode;
                                _claimManagementgDbContext.Entry(phrmTxn).State = EntityState.Modified;
                            });
                        }
                    });
                    _claimManagementgDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdateApprovedAndRejectedAmount(RbacUser currentUser, PendingClaimDTO claimObject, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    var claim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == claimObject.ClaimSubmissionId).FirstOrDefault();
                    if (claim != null)
                    {
                        claim.ApprovedAmount = claimObject.ApprovedAmount;
                        claim.RejectedAmount = claimObject.RejectedAmount;
                        claim.ModifiedBy = currentUser.EmployeeId;
                        claim.ModifiedOn = DateTime.Now;
                        _claimManagementgDbContext.Entry(claim).State = EntityState.Modified;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    dbContextTransaction.Commit();
                    return claim;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object ConcludeClaim(RbacUser currentUser, int ClaimSubmissionId, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    var claim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == ClaimSubmissionId).FirstOrDefault();
                    if (claim != null)
                    {
                        claim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.Settled;
                        claim.ModifiedBy = currentUser.EmployeeId;
                        claim.ModifiedOn = DateTime.Now;
                        _claimManagementgDbContext.Entry(claim).State = EntityState.Modified;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object RevertClaimToBackToClaimScrubbing(RbacUser currentUser, int ClaimSubmissionId, ClaimManagementDbContext _claimManagementDbContext)
        {
            using (var dbContextTransaction = _claimManagementDbContext.Database.BeginTransaction())
            {
                try
                {
                    var isPaymentInitiated = _claimManagementDbContext.InsuranceClaimPayment.Any(payment => payment.ClaimSubmissionId == ClaimSubmissionId);
                    if (isPaymentInitiated)
                    {
                        throw new Exception("Some Payments is alredy done against this claim, therefore unable to revert this claim back to claim scrubbing.");
                    }
                    var claim = _claimManagementDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == ClaimSubmissionId).FirstOrDefault();
                    if (claim != null)
                    {
                        claim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.Initiated;
                        claim.NonClaimableAmount = 0;
                        claim.RejectedAmount = 0;
                        claim.ApprovedAmount = 0;
                        claim.ClaimedAmount = 0;
                        claim.ModifiedBy = currentUser.EmployeeId;
                        claim.ModifiedOn = DateTime.Now;
                        _claimManagementDbContext.Entry(claim).State = EntityState.Modified;
                        _claimManagementDbContext.SaveChanges();
                    }
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdateBillingCreditItemClaimableStatus(RbacUser currentUser, BillingCreditBillItemDTO BillingCreditBillItemDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    var matchingCreditBillItem = _claimManagementgDbContext.BillingCreditBillItemStatus.Where(a => a.BillingCreditBillItemStatusId == BillingCreditBillItemDTO.BillingCreditBillItemStatusId).FirstOrDefault();
                    if (matchingCreditBillItem == null)
                    {
                        BillingTransactionCreditBillItemStatusModel NewBillingCreditBillItem = new BillingTransactionCreditBillItemStatusModel();
                        NewBillingCreditBillItem.BillingCreditBillStatusId = BillingCreditBillItemDTO.BillingCreditBillStatusId;
                        NewBillingCreditBillItem.BillingTransactionId = BillingCreditBillItemDTO.BillingTransactionId;
                        NewBillingCreditBillItem.BillingTransactionItemId = BillingCreditBillItemDTO.BillingTransactionItemId;
                        NewBillingCreditBillItem.ServiceDepartmentId = BillingCreditBillItemDTO.ServiceDepartmentId;
                        NewBillingCreditBillItem.ServiceItemId = BillingCreditBillItemDTO.ServiceItemId;
                        NewBillingCreditBillItem.NetTotalAmount = BillingCreditBillItemDTO.NetTotalAmount;
                        NewBillingCreditBillItem.IsClaimable = BillingCreditBillItemDTO.IsClaimable;
                        NewBillingCreditBillItem.CreatedBy = currentUser.EmployeeId;
                        NewBillingCreditBillItem.CreatedOn = DateTime.Now;
                        NewBillingCreditBillItem.IsActive = true;
                        _claimManagementgDbContext.BillingCreditBillItemStatus.Add(NewBillingCreditBillItem);
                        _claimManagementgDbContext.SaveChanges();
                    }
                    else if (matchingCreditBillItem != null)
                    {
                        matchingCreditBillItem.IsClaimable = BillingCreditBillItemDTO.IsClaimable;
                        matchingCreditBillItem.ModifiedBy = currentUser.EmployeeId;
                        matchingCreditBillItem.ModifiedOn = DateTime.Now;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    var matchingCreditBill = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingTransactionId == BillingCreditBillItemDTO.BillingTransactionId).FirstOrDefault();
                    if (matchingCreditBill != null)
                    {
                        var matchingInsuranceClaim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == matchingCreditBill.ClaimSubmissionId).FirstOrDefault();
                        if (BillingCreditBillItemDTO.IsClaimable == false)
                        {
                            matchingCreditBill.NonClaimableAmount += BillingCreditBillItemDTO.NetTotalAmount;
                            matchingCreditBill.NetReceivableAmount -= BillingCreditBillItemDTO.NetTotalAmount;
                            if ((matchingInsuranceClaim != null) && (matchingCreditBill.IsClaimable == true))
                            {
                                matchingInsuranceClaim.NonClaimableAmount += BillingCreditBillItemDTO.NetTotalAmount;
                                matchingInsuranceClaim.ClaimableAmount -= BillingCreditBillItemDTO.NetTotalAmount;
                            }
                        }
                        else if (BillingCreditBillItemDTO.IsClaimable == true)
                        {
                            matchingCreditBill.NonClaimableAmount -= BillingCreditBillItemDTO.NetTotalAmount;
                            matchingCreditBill.NetReceivableAmount += BillingCreditBillItemDTO.NetTotalAmount;
                            if ((matchingInsuranceClaim != null) && (matchingCreditBill.IsClaimable == true))
                            {
                                matchingInsuranceClaim.NonClaimableAmount -= BillingCreditBillItemDTO.NetTotalAmount;
                                matchingInsuranceClaim.ClaimableAmount += BillingCreditBillItemDTO.NetTotalAmount;
                            }
                        }
                    }
                    _claimManagementgDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return matchingCreditBill.NonClaimableAmount;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdatePharmacyCreditItemClaimableStatus(RbacUser currentUser, PharmacyCreditBillItemDTO PharmacyCreditBillItemDTO, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    var matchingCreditBillItem = _claimManagementgDbContext.PharmacyCreditBillItemStatus.Where(a => a.PhrmCreditBillItemStatusId == PharmacyCreditBillItemDTO.PhrmCreditBillItemStatusId).FirstOrDefault();
                    if (matchingCreditBillItem == null)
                    {
                        PHRMTransactionCreditBillItemStatusModel NewPharmacyCreditBillItem = new PHRMTransactionCreditBillItemStatusModel();
                        NewPharmacyCreditBillItem.PhrmCreditBillStatusId = PharmacyCreditBillItemDTO.PhrmCreditBillStatusId;
                        NewPharmacyCreditBillItem.InvoiceId = PharmacyCreditBillItemDTO.InvoiceId;
                        NewPharmacyCreditBillItem.InvoiceItemId = PharmacyCreditBillItemDTO.InvoiceItemId;
                        NewPharmacyCreditBillItem.ItemId = PharmacyCreditBillItemDTO.ItemId;
                        NewPharmacyCreditBillItem.NetTotalAmount = PharmacyCreditBillItemDTO.NetTotalAmount;
                        NewPharmacyCreditBillItem.IsClaimable = PharmacyCreditBillItemDTO.IsClaimable;
                        NewPharmacyCreditBillItem.CreatedBy = currentUser.EmployeeId;
                        NewPharmacyCreditBillItem.CreatedOn = DateTime.Now;
                        NewPharmacyCreditBillItem.IsActive = true;
                        _claimManagementgDbContext.PharmacyCreditBillItemStatus.Add(NewPharmacyCreditBillItem);
                        _claimManagementgDbContext.SaveChanges();
                    }
                    else if (matchingCreditBillItem != null)
                    {
                        matchingCreditBillItem.IsClaimable = PharmacyCreditBillItemDTO.IsClaimable;
                        matchingCreditBillItem.ModifiedBy = currentUser.EmployeeId;
                        matchingCreditBillItem.ModifiedOn = DateTime.Now;
                        _claimManagementgDbContext.SaveChanges();
                    }
                    var matchingCreditBill = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.InvoiceId == PharmacyCreditBillItemDTO.InvoiceId).FirstOrDefault();
                    if (matchingCreditBill != null)
                    {
                        var matchingInsuranceClaim = _claimManagementgDbContext.InsuranceClaim.Where(a => a.ClaimSubmissionId == matchingCreditBill.ClaimSubmissionId).FirstOrDefault();
                        if (PharmacyCreditBillItemDTO.IsClaimable == false)
                        {
                            matchingCreditBill.NonClaimableAmount += PharmacyCreditBillItemDTO.NetTotalAmount;
                            matchingCreditBill.NetReceivableAmount -= PharmacyCreditBillItemDTO.NetTotalAmount;
                            if ((matchingInsuranceClaim != null) && (matchingCreditBill.IsClaimable == true))
                            {
                                matchingInsuranceClaim.NonClaimableAmount += PharmacyCreditBillItemDTO.NetTotalAmount;
                                matchingInsuranceClaim.ClaimableAmount -= PharmacyCreditBillItemDTO.NetTotalAmount;
                            }
                        }
                        else if (PharmacyCreditBillItemDTO.IsClaimable == true)
                        {
                            matchingCreditBill.NonClaimableAmount -= PharmacyCreditBillItemDTO.NetTotalAmount;
                            matchingCreditBill.NetReceivableAmount += PharmacyCreditBillItemDTO.NetTotalAmount;
                            if ((matchingInsuranceClaim != null) && (matchingCreditBill.IsClaimable == true))
                            {
                                matchingInsuranceClaim.NonClaimableAmount -= PharmacyCreditBillItemDTO.NetTotalAmount;
                                matchingInsuranceClaim.ClaimableAmount += PharmacyCreditBillItemDTO.NetTotalAmount;
                            }
                        }
                    }
                    _claimManagementgDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return matchingCreditBill.NonClaimableAmount;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object UpdateInsuranceClaimPayment(RbacUser currentUser, ClaimPaymentDTO paymentObject, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (paymentObject != null)
                    {
                        InsuranceClaimPayment paymentEntity = _claimManagementgDbContext.InsuranceClaimPayment.Where(a => a.ClaimPaymentId == paymentObject.ClaimPaymentId).FirstOrDefault();
                        if (paymentEntity != null)
                        {
                            paymentEntity.ReceivedAmount = paymentObject.ReceivedAmount;
                            paymentEntity.ServiceCommission = paymentObject.ServiceCommission;
                            paymentEntity.Remarks = paymentObject.Remarks;
                            paymentEntity.ChequeNumber = paymentObject.ChequeNumber;
                            paymentEntity.BankName = paymentObject.BankName;
                            paymentEntity.ReceivedOn = DateTime.Now;
                            paymentEntity.ReceivedBy = currentUser.EmployeeId;
                            paymentEntity.PaymentDetails = paymentObject.PaymentDetails;
                            _claimManagementgDbContext.Entry(paymentEntity).State = EntityState.Modified;
                            _claimManagementgDbContext.SaveChanges();
                        }
                    }
                    dbContextTransaction.Commit();
                    return paymentObject;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        public object GetECHSPatientWithVisitInformation(string search, ClaimManagementDbContext _claimManagementgDbContext)
        {
            DataTable dtEchsPatient = DALFunctions.GetDataTableFromStoredProc("SP_PAT_ECHSPatientsListWithVisitinformation",
                     new List<SqlParameter>() { new SqlParameter("@SearchTxt", search) }, _claimManagementgDbContext);
            return dtEchsPatient;
        }

        #endregion
        #region Claim Submission For HIB Patient

        public async Task<object> HIBClaimSubmit(RbacUser currentUser, ClaimSubmitRequest claimSubmitRequest, InsuranceClaim claim, ClaimManagementDbContext claimManagementDbContext)
        {
            AdminParametersModel HIBConfigurationParameter = GetHIBConfigurationParameter(claimManagementDbContext);
            var HIBConfig = DanpheJSONConvert.DeserializeObject<HIBApiConfig>(HIBConfigurationParameter.ParameterValue);
            var hibCredentials = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes(HIBConfig.HIBUsername + ":" + HIBConfig.HIBPassword));



            using (HttpClient client = new HttpClient())
            {
                ConfigureHttpClient(client, HIBConfig, hibCredentials);

                var jsonContent = JsonConvert.SerializeObject(claimSubmitRequest);

                // Remove 'nmc' and 'careType' properties from ClaimSubmitRequest if old API is used
                if (!HIBConfig.IsLatestAPI)
                {
                    JObject jsonObject = JObject.Parse(jsonContent);
                    // Remove properties
                    jsonObject.Remove("nmc");
                    jsonObject.Remove("careType");
                    jsonContent = jsonObject.ToString();
                }


                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                try
                {
                    Log.Information($"The Payload we are submitting to the HIB server is {jsonContent}");
                    var clientResponse = await client.PostAsync($"Claim/", content);
                    if (clientResponse.IsSuccessStatusCode)
                    {
                        Log.Information("Claim is successfully submitted at the HIB Server!");
                        var response = await clientResponse.Content.ReadAsStringAsync();
                        //var serializeData = JsonConvert.DeserializeObject<ClaimSubmitResponse>(response);

                        var claimApiResponse = new InsuranceClaimAPIResponse();
                        claimApiResponse.ClaimSubmissionId = claim.ClaimSubmissionId;
                        claimApiResponse.ResponseStatus = clientResponse.IsSuccessStatusCode;
                        claimApiResponse.ResponseData = response;
                        claimApiResponse.CreditOrganizationId = claim.CreditOrganizationId;
                        claimApiResponse.PostedBy = currentUser.EmployeeId;
                        claimApiResponse.PostedOn = DateTime.Now;
                        claimApiResponse.RequestApiURL = HIBConfig.HIBUrl + "Claim";
                        claimManagementDbContext.insuranceClaimAPIResponses.Add(claimApiResponse);
                        await claimManagementDbContext.SaveChangesAsync(cancellationToken: default);
                        Log.Information("Claim is successfully submitted and The response is successfully saved in our server");


                        var insuranceClaim = await claimManagementDbContext.InsuranceClaim.FirstOrDefaultAsync(i => i.ClaimSubmissionId == claim.ClaimSubmissionId);
                        if(insuranceClaim != null)
                        {
                            insuranceClaim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.PaymentPending;
                            insuranceClaim.ModifiedBy = currentUser.EmployeeId;
                            insuranceClaim.ModifiedOn = DateTime.Now;

                            claimManagementDbContext.Entry(insuranceClaim).State = EntityState.Modified;
                            await claimManagementDbContext.SaveChangesAsync(cancellationToken: default);
                        }

                        var result = new
                        {
                            status = true,
                            message = "Successfully claim submitted"
                        };

                        return result;
                    }
                    else
                    {
                        Log.Warning("Claim Submission failed with error messages");
                        var errorString = await clientResponse.Content.ReadAsStringAsync();
                        Log.Warning($"Claim Submission failed with error message as \n {errorString}");

                        var claimApiResponseForError = new InsuranceClaimAPIResponse();
                        claimApiResponseForError.ClaimSubmissionId = claim.ClaimSubmissionId;
                        claimApiResponseForError.ResponseStatus = false;
                        claimApiResponseForError.CreditOrganizationId = claim.CreditOrganizationId;
                        claimApiResponseForError.PostedBy = currentUser.EmployeeId;
                        claimApiResponseForError.PostedOn = DateTime.Now;
                        claimApiResponseForError.RequestApiURL = HIBConfig.HIBUrl + "Claim";
                        claimApiResponseForError.ErrorMessage = errorString;
                        claimManagementDbContext.insuranceClaimAPIResponses.Add(claimApiResponseForError);
                        await claimManagementDbContext.SaveChangesAsync(cancellationToken: default);

                        Log.Warning($"Claim Submission failed and error response is saved in our server");

                        var result = new
                        {
                            status = false,
                            message = errorString
                        };
                        return result;
                    }
                }
                catch (Exception ex)
                {
                    Log.Error($"Could not perform Claim Submission Process {ex.Message.ToString()}");
                    throw ex;
                }
            }
        }
        public object GetReportsByClaimCode(long ClaimCode, ClaimManagementDbContext _claimManagementgDbContext)
        {
            DataTable reportsByClaimCode = DALFunctions.GetDataTableFromStoredProc("SP_Claim_Wise_Lab_Radiology_DischargeSummary_RPT",
                               new List<SqlParameter>() { new SqlParameter("@ClaimCode", ClaimCode) }, _claimManagementgDbContext);
            return reportsByClaimCode;
        }
        #endregion
        private static AdminParametersModel GetHIBConfigurationParameter(ClaimManagementDbContext ClaimManagementDbContext)
        {
            var HIBConfigurationParameter = ClaimManagementDbContext.CoreCfgParameter.Where(a => a.ParameterGroupName == "GovInsurance" && a.ParameterName == "HIBConfiguration").FirstOrDefault();
            if (HIBConfigurationParameter == null)
            {
                throw new Exception("HIB Configuration Parameter Not Found");
            }

            return HIBConfigurationParameter;
        }
        private static void ConfigureHttpClient(HttpClient client, HIBApiConfig config, string hibCredentials)
        {
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Authorization", "Basic " + hibCredentials);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add(config.HIBRemotekey, config.HIBRemoteValue);
            client.BaseAddress = new Uri(config.HIBUrl);
        }
        public List<Diagnosis_DTO> GetDiagnosis(ClaimManagementDbContext claimManagementDbContext)
        {
            var diagnosisis = claimManagementDbContext.ICD10Codes
                .Where(c => c.Active)
                .Select(c => new Diagnosis_DTO
                {
                    ICDCode = c.ICD10Code,
                    ICDDescription = c.ICD10Description,
                    Icd10Id = c.ICD10ID
                }).ToList();
            return diagnosisis;

        }

        /// <summary>
        /// To check if Claim Code is already settled. (Ex. ECHS patient)
        /// </summary>
        /// <param name="ClaimCode"></param>
        /// <param name="_claimManagementgDbContext"></param>
        /// <returns>This return true if Claim is already settled other wise return false</returns>
        public object CheckIfClaimCodeAlreadySettled(Int64 ClaimCode, ClaimManagementDbContext _claimManagementgDbContext)
        {
            if (ClaimCode != 0)
            {
                var result = _claimManagementgDbContext.InsuranceClaim.Any(a => a.ClaimCode == ClaimCode && (a.ClaimStatus == ENUM_ClaimManagement_ClaimStatus.PaymentPending || a.ClaimStatus == ENUM_ClaimManagement_ClaimStatus.Settled));
                return result;
            }
            else
            {
                return false;
            }
        }
        public object UpdateDocumentReceivedStatus(RbacUser currentUser, List<ClaimBillReviewDTO> bill, ClaimManagementDbContext _claimManagementgDbContext)
        {
            using (var dbContextTransaction = _claimManagementgDbContext.Database.BeginTransaction())
            {
                try
                {
                    bill.ForEach(bil =>
                    {
                        if (bil.CreditModule == ENUM_ClaimManagement_CreditModule.Billing)
                        {
                            var entity = _claimManagementgDbContext.BillingCreditBillStatus.Where(a => a.BillingCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsDocumentReceived = bil.IsDocumentReceived;
                                entity.Remarks = bil.Remarks;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                entity.DocumentReceivedDate = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                            }
                        }
                        else
                        {
                            var entity = _claimManagementgDbContext.PharmacyCreditBillStatus.Where(a => a.PhrmCreditBillStatusId == bil.CreditStatusId).FirstOrDefault();
                            if (entity != null)
                            {
                                entity.IsDocumentReceived = bil.IsDocumentReceived;
                                entity.Remarks = bil.Remarks;
                                entity.ModifiedBy = currentUser.EmployeeId;
                                entity.ModifiedOn = DateTime.Now;
                                entity.DocumentReceivedDate = DateTime.Now;
                                _claimManagementgDbContext.Entry(entity).State = EntityState.Modified;
                            }
                        }
                    });
                    _claimManagementgDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
        public object GetClaimDocumentReceivedReport(DateTime FromDate, DateTime ToDate, int? PatientId, long? ClaimCode, string InvoiceNo, ClaimManagementDbContext _claimManagementgDbContext)
        {
            DataTable claimDocumentReceivedReport = DALFunctions.GetDataTableFromStoredProc("SP_RPT_ClaimDocumentReceived",
                              new List<SqlParameter>() {
                        new SqlParameter("@FromDate", FromDate),
                        new SqlParameter("@ToDate", ToDate),
                        new SqlParameter("@PatientId", PatientId),
                        new SqlParameter("@ClaimCode",ClaimCode),
                        new SqlParameter("@InvoiceNo",InvoiceNo)}, _claimManagementgDbContext);
            return claimDocumentReceivedReport;
        }
    }
}
