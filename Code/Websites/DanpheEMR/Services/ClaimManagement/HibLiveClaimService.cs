using Application.Common.Exceptions;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.ClaimManagementModels;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.Services.ClaimManagement.DTOs;
using DanpheEMR.Services.Insurance;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using static DanpheEMR.Services.Insurance.DTOs.ClaimUploadFileRequest_DTO;
using static DanpheEMR.Services.Insurance.HIBApiResponses;

namespace DanpheEMR.Services.ClaimManagement
{
    public class HibLiveClaimService : IHibLiveClaimService
    {
        private readonly IClaimManagementService _claimManagementService;
        private readonly IHIBClaimDocService _hibClaimDocService;
        private readonly ILogger<HibLiveClaimService> _logger;

        public HibLiveClaimService(IClaimManagementService claimManagementService, IHIBClaimDocService hibClaimDocService, ILogger<HibLiveClaimService> logger)
        {
            _claimManagementService = claimManagementService;
            _hibClaimDocService = hibClaimDocService;
            _logger = logger;
        }
        public async Task<HibLiveClaimResponse> SubmitHibLiveClaim(
            RbacUser currentUser,
            HibLiveClaimDTO hibLiveClaim,
            ClaimManagementDbContext claimManagementDbContext,
            InsuranceDbContext insuranceDbContext,
            BillingDbContext billingDbContext,
            PharmacyDbContext pharmacyDbContext)
        {
            try
            {
                var (invoice, patientScheme, visit, employee, diagnosis) = await ValidateAndGetClaimData(hibLiveClaim, claimManagementDbContext, billingDbContext, pharmacyDbContext);

                var hibLiveClaimSubmission = CreateHibLiveClaimSubmission(hibLiveClaim, invoice, patientScheme, visit, employee, diagnosis);

                return await SubmitClaimAndUploadDocument(currentUser, claimManagementDbContext, insuranceDbContext, hibLiveClaimSubmission);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to process HIB Live Claim for invoice {hibLiveClaim.InvoiceId} of {hibLiveClaim.ModuleName} module");
                throw;
            }
        }

        private async Task<(dynamic invoice, PatientSchemeMapModel patientScheme, VisitModel visit, EmployeeModel employee, List<DiagnosisModel> diagnosis)>
            ValidateAndGetClaimData(
                HibLiveClaimDTO hibLiveClaim,
                ClaimManagementDbContext claimManagementDbContext,
                BillingDbContext billingDbContext,
                PharmacyDbContext pharmacyDbContext)
        {
            dynamic invoice = await GetInvoice(hibLiveClaim, billingDbContext, pharmacyDbContext);

            var patientScheme = await GetPatientScheme(invoice.PatientId, invoice.SchemeId, billingDbContext);
            var visit = await GetVisit(invoice.PatientVisitId, claimManagementDbContext);
            var employee = await GetEmployee(visit.PerformerId, claimManagementDbContext);
            var diagnosis = await GetDiagnosis(hibLiveClaim, invoice.PatientVisitId, invoice.PatientId, claimManagementDbContext);

            return (invoice, patientScheme, visit, employee, diagnosis);
        }

        private async Task<dynamic> GetInvoice(HibLiveClaimDTO hibLiveClaim, BillingDbContext billingDbContext, PharmacyDbContext pharmacyDbContext)
        {
            if (hibLiveClaim.ModuleName.ToLower() == ENUM_ModuleNames.Billing.ToLower())
            {
                return await billingDbContext.BillingTransactions
                    .Include(b => b.BillingTransactionItems)
                    .FirstOrDefaultAsync(txn => txn.BillingTransactionId == hibLiveClaim.InvoiceId)
                    ?? throw new NotFoundException($"Billing Invoice not found with InvoiceId {hibLiveClaim.InvoiceId}");
            }
            else
            {
                return await pharmacyDbContext.PHRMInvoiceTransaction
                    .Include(b => b.InvoiceItems)
                    .FirstOrDefaultAsync(txn => txn.InvoiceId == hibLiveClaim.InvoiceId)
                    ?? throw new NotFoundException($"Pharmacy Invoice not found with InvoiceId {hibLiveClaim.InvoiceId}");
            }
        }

        private async Task<PatientSchemeMapModel> GetPatientScheme(int patientId, int schemeId, BillingDbContext billingDbContext)
        {
            var patScheme = await billingDbContext.PatientSchemeMaps
                .FirstOrDefaultAsync(p => p.PatientId == patientId && p.SchemeId == schemeId);

            if (patScheme == null)
            {
                throw new InvalidOperationException($"Patient Scheme not found with PatientId {patientId} and SchemeId {schemeId}");
            }

            if (string.IsNullOrEmpty(patScheme.PolicyHolderUID))
            {
                throw new InvalidOperationException($"PolicyHolderUUID is missing for Patient {patientId} and SchemeId {schemeId}");
            }

            return patScheme;
        }

        private async Task<VisitModel> GetVisit(int visitId, ClaimManagementDbContext claimManagementDbContext)
        {
            var visit = await claimManagementDbContext.PatientVisits
                .FirstOrDefaultAsync(p => p.PatientVisitId == visitId);

            if (visit == null)
            {
                throw new InvalidOperationException($"There is no Visit created for the PatientVisitId {visitId}");
            }

            if (visit.PerformerId == null)
            {
                throw new InvalidOperationException($"There is no Performer assigned for the visit {visitId}");
            }

            return visit;
        }

        private async Task<EmployeeModel> GetEmployee(int? performerId, ClaimManagementDbContext claimManagementDbContext)
        {
            var employee = await claimManagementDbContext.EmployeeModels
                .FirstOrDefaultAsync(e => e.EmployeeId == performerId);

            if (employee == null)
            {
                throw new InvalidOperationException($"There is no Employee with PerformerId {performerId}");
            }

            if (employee.MedCertificationNo == null)
            {
                throw new InvalidOperationException($"There is no NMCNo added for PerformerId {performerId}");
            }

            return employee;
        }

        private async Task<List<DiagnosisModel>> GetDiagnosis(HibLiveClaimDTO hibLiveClaim, int visitId, int patientId, ClaimManagementDbContext claimManagementDbContext)
        {
            var diagnosis = await claimManagementDbContext.Diagnosis
                .Where(d => d.PatientVisitId == visitId && d.PatientId == patientId && d.IsActive == true)
                .ToListAsync();

            if(hibLiveClaim.InvoiceFrom == "Appointment")
            {
                return null;
            }
            if (diagnosis.Count == 0)
            {
                throw new InvalidOperationException($"Diagnosis are not added for the patient with PatientId {patientId} and VisitId {visitId}");
            }

            return diagnosis;
        }

        private HibLiveClaimSubmissionDTO CreateHibLiveClaimSubmission(
            HibLiveClaimDTO hibLiveClaim,
            dynamic invoice,
            PatientSchemeMapModel patientScheme,
            VisitModel visit,
            EmployeeModel employee,
            List<DiagnosisModel> diagnosis)
        {
            return new HibLiveClaimSubmissionDTO
            {
                InvoiceId = hibLiveClaim.ModuleName.ToLower() == ENUM_ModuleNames.Billing.ToLower() ? invoice.BillingTransactionId : invoice.InvoiceId,
                ClaimCode = invoice.ClaimCode,
                PatientId = invoice.PatientId,
                PatientVisitId = (int)invoice.PatientVisitId,
                SchemeId = invoice.SchemeId,
                TotalAmount = (decimal)invoice.TotalAmount,
                MemberNo = patientScheme.PolicyNo,
                PatientCode = patientScheme.PatientCode,
                CreditOrganizationId = (int)invoice.OrganizationId,
                InvoiceDate = hibLiveClaim.ModuleName.ToLower() == ENUM_ModuleNames.Billing.ToLower() ? invoice.CreatedOn : invoice.CreateOn,
                Diagnosis = diagnosis,
                NmcNo = employee.MedCertificationNo,
                PolicyHolderUUID = patientScheme.PolicyHolderUID,
                FirstServicePoint = patientScheme.Ins_FirstServicePoint,
                Explanations = hibLiveClaim.Explanation,
                InvoiceItems = MapInvoiceItems(invoice, hibLiveClaim.ModuleName),
                VisitType = visit.VisitType,
                ModuleName = hibLiveClaim.ModuleName,
                ClaimDocs = hibLiveClaim.ClaimDoc
            };
        }

        private List<HibTransactionItemDto> MapInvoiceItems(dynamic invoice, string moduleName)
        {

            List<HibTransactionItemDto> hibTransactionItems = new List<HibTransactionItemDto>();
            if (moduleName.ToLower() == ENUM_ModuleNames.Billing.ToLower())
            {
                List<BillingTransactionItemModel> items = invoice.BillingTransactionItems;
                return items.Select(itm => new HibTransactionItemDto
                {
                    Quantity = (int)itm.Quantity,
                    UnitPrice = (decimal)itm.Price,
                    ItemCode = itm.ItemCode,
                    ModuleName = moduleName
                }).ToList();
            }
            else
            {
                List<PHRMInvoiceTransactionItemsModel> items = invoice.InvoiceItems;
                return items.Select(itm => new HibTransactionItemDto
                {
                    Quantity = (int)itm.Quantity,
                    UnitPrice = (decimal)itm.SalePrice,
                    ItemCode = itm.ItemCode,
                    ModuleName = moduleName
                }).ToList();
            }
        }

        private async Task<HibLiveClaimResponse> SubmitClaimAndUploadDocument(
          RbacUser currentUser,
          ClaimManagementDbContext claimManagementDbContext,
          InsuranceDbContext insuranceDbContext,
          HibLiveClaimSubmissionDTO hibLiveClaimSubmission)
        {
            try
            {
                var submitedClaim = await PrepareClaimSubmissionDetail(currentUser, hibLiveClaimSubmission, claimManagementDbContext);

                dynamic claimResponse = await _claimManagementService.SubmitClaim(currentUser, submitedClaim, claimManagementDbContext);

                if (claimResponse?.status != true)
                {
                    return new HibLiveClaimResponse
                    {
                        Status = false,
                        Message = claimResponse?.messgae ?? "Could not submit HIB LIVE Claim."
                    };
                }

                return await UploadClaimDocuments(currentUser, insuranceDbContext, submitedClaim);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception Caught while submitting HIB Live Claim with exception details: {ex.ToString()}");
                throw;
            }
        }

        private async Task<HibLiveClaimResponse> UploadClaimDocuments(
            RbacUser currentUser,
            InsuranceDbContext insuranceDbContext,
            SubmitedClaimDTO submitedClaim)
        {
            if (submitedClaim.files == null)
            {
                return new HibLiveClaimResponse
                {
                    Status = true,
                    Message = "Claim is Submitted Successfully but There were no Documents to be submitted"
                };
            }

            var claimUploadSingleFileRequest = CreateClaimFileUploadObject(submitedClaim);

            var docSubmissionResponse = await _hibClaimDocService.UploadSingleFile(claimUploadSingleFileRequest, currentUser, insuranceDbContext);

            return docSubmissionResponse?.status == ENUM_HIBClaimDocResponseStatus.success
                ? new HibLiveClaimResponse { Status = true, Message = "Claim And Claim Document Submitted successfully!" }
                : new HibLiveClaimResponse { Status = true, Message = "Claim is Submitted Successfully but Claim Document Submission Failed" };
        }

        private ClaimUploadSingleFileRequest_DTO CreateClaimFileUploadObject(SubmitedClaimDTO submitedClaim)
        {
            ClaimUploadSingleFileRequest_DTO claimUploadSingleFileRequest = new ClaimUploadSingleFileRequest_DTO();
            claimUploadSingleFileRequest.file = submitedClaim.files[0].BinaryData;
            claimUploadSingleFileRequest.claim_id = submitedClaim.files[0].ClaimCode.ToString();
            claimUploadSingleFileRequest.name = submitedClaim.files[0].FileName;
            claimUploadSingleFileRequest.PatientId = submitedClaim.files[0].PatientId;
            return claimUploadSingleFileRequest;
        }

        private async Task<SubmitedClaimDTO> PrepareClaimSubmissionDetail(
            RbacUser currentUser,
            HibLiveClaimSubmissionDTO hibLiveClaimSubmission,
            ClaimManagementDbContext claimManagementDbContext)
        {
            return new SubmitedClaimDTO
            {
                claim = await CreateInsuranceClaimObjectAsync(currentUser, claimManagementDbContext, hibLiveClaimSubmission),
                files = GenerateClaimFiles(hibLiveClaimSubmission),
                HIBClaimSubmitPayload = await CreateClaimSubmissionRequestAsync(hibLiveClaimSubmission, claimManagementDbContext)
            };
        }


        private async Task<InsuranceClaim> CreateInsuranceClaimObjectAsync(RbacUser currentUser, ClaimManagementDbContext claimManagementDbContext, HibLiveClaimSubmissionDTO hibLiveClaimSubmission)
        {
            DateTime currentDate = DateTime.Now;
            using (var dbContextTransaction = claimManagementDbContext.Database.BeginTransaction())
            {
                try
                {
                    InsuranceClaim insuranceClaim;
                    insuranceClaim = await claimManagementDbContext.InsuranceClaim.FirstOrDefaultAsync(i => i.ClaimCode == hibLiveClaimSubmission.ClaimCode && i.InvoiceIdCSV.Contains(hibLiveClaimSubmission.InvoiceId.ToString()) && i.ModuleName == hibLiveClaimSubmission.ModuleName.ToLower());
                    if (insuranceClaim == null)
                    {
                        insuranceClaim = new InsuranceClaim();
                        insuranceClaim.ClaimCode = hibLiveClaimSubmission.ClaimCode;
                        insuranceClaim.PatientId = hibLiveClaimSubmission.PatientId;
                        insuranceClaim.PatientCode = hibLiveClaimSubmission.PatientCode;
                        insuranceClaim.PatientVisitId = hibLiveClaimSubmission.PatientVisitId;
                        insuranceClaim.CreditOrganizationId = hibLiveClaimSubmission.CreditOrganizationId;
                        insuranceClaim.MemberNumber = hibLiveClaimSubmission.MemberNo;
                        insuranceClaim.TotalBillAmount = hibLiveClaimSubmission.TotalAmount;
                        insuranceClaim.ClaimableAmount = hibLiveClaimSubmission.TotalAmount;
                        insuranceClaim.ClaimedAmount = hibLiveClaimSubmission.TotalAmount;
                        insuranceClaim.SchemeId = hibLiveClaimSubmission.SchemeId;
                        insuranceClaim.ClaimStatus = ENUM_ClaimManagement_ClaimStatus.Initiated;
                        insuranceClaim.ClaimSubmittedOn = currentDate;
                        insuranceClaim.ClaimSubmittedBy = currentUser.EmployeeId;
                        insuranceClaim.InvoiceIdCSV = hibLiveClaimSubmission.InvoiceId.ToString();
                        insuranceClaim.ModuleName = hibLiveClaimSubmission.ModuleName.ToLower();

                        claimManagementDbContext.InsuranceClaim.Add(insuranceClaim);
                        await claimManagementDbContext.SaveChangesAsync();
                    }

                    
                    if (hibLiveClaimSubmission.ModuleName.ToLower() == ENUM_ClaimManagement_CreditModule.Billing.ToLower())
                    {
                        var entity = claimManagementDbContext.BillingCreditBillStatus.Where(a => a.BillingTransactionId == hibLiveClaimSubmission.InvoiceId).FirstOrDefault();
                        if (entity != null)
                        {
                            entity.IsClaimable = true;
                            entity.ModifiedBy = currentUser.EmployeeId;
                            entity.ModifiedOn = currentDate;
                            entity.ClaimSubmissionId = insuranceClaim.ClaimSubmissionId;
                            entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Completed;
                            claimManagementDbContext.Entry(entity).State = EntityState.Modified;
                        }
                    }
                    else
                    {
                        var entity = claimManagementDbContext.PharmacyCreditBillStatus.Where(a => a.InvoiceId == hibLiveClaimSubmission.InvoiceId).FirstOrDefault();
                        if (entity != null)
                        {
                            entity.IsClaimable = true;
                            entity.ModifiedBy = currentUser.EmployeeId;
                            entity.ModifiedOn = currentDate;
                            entity.ClaimSubmissionId = insuranceClaim.ClaimSubmissionId;
                            entity.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Completed;
                            claimManagementDbContext.Entry(entity).State = EntityState.Modified;
                        }
                    }
                    await claimManagementDbContext.SaveChangesAsync();
                    dbContextTransaction.Commit();

                    return insuranceClaim;
                }
                catch (Exception)
                {
                    dbContextTransaction.Rollback();
                    _logger.LogError($"Could not Generate Insurance claim Object for Invoice {hibLiveClaimSubmission.InvoiceId} of {hibLiveClaimSubmission.ModuleName} module.");
                    throw;
                }
            }

        }

        private List<UploadedFileDTO> GenerateClaimFiles(HibLiveClaimSubmissionDTO hibLiveClaimSubmission)
        {
            if (string.IsNullOrEmpty(hibLiveClaimSubmission.ClaimDocs))
            {
                return null;
            }
            List<UploadedFileDTO> uploadedFiles = new List<UploadedFileDTO>();
            UploadedFileDTO uploadedFile = new UploadedFileDTO();

            uploadedFile.PatientId = hibLiveClaimSubmission.PatientId;
            uploadedFile.PatientVisitId = hibLiveClaimSubmission.PatientVisitId;
            uploadedFile.ClaimCode = hibLiveClaimSubmission.ClaimCode;
            uploadedFile.ReferenceNumber = hibLiveClaimSubmission.InvoiceId;
            uploadedFile.BinaryData = hibLiveClaimSubmission.ClaimDocs;
            uploadedFile.FileName = $"{hibLiveClaimSubmission.PatientCode}_{hibLiveClaimSubmission.InvoiceId}_Invoice";
            uploadedFiles.Add(uploadedFile);
            return uploadedFiles;
        }

        private async Task<ClaimSubmitRequest> CreateClaimSubmissionRequestAsync(HibLiveClaimSubmissionDTO hibLiveClaimSubmission, ClaimManagementDbContext claimManagementDbContext)
        {
            HIBConfigurationParameterDto hibConfigurationParameter = GetHIBIntegrationParameter(claimManagementDbContext);

            ClaimSubmitRequest claimSubmitRequest = new ClaimSubmitRequest();
            claimSubmitRequest.resourceType = ENUM_FHIRReourceTypes.Claim;
            claimSubmitRequest.id = hibLiveClaimSubmission.PolicyHolderUUID;
            claimSubmitRequest.billablePeriod = new BillablePeriod
            {
                start = hibLiveClaimSubmission.InvoiceDate.ToString(),
                end = hibLiveClaimSubmission.InvoiceDate.ToString()
            };
            claimSubmitRequest.created = DateTime.Now.ToString();
            if(hibLiveClaimSubmission.Diagnosis != null)
            {
                claimSubmitRequest.diagnosis = PrepareDiagnosis(hibLiveClaimSubmission.Diagnosis);
            }
            else
            {
                claimSubmitRequest.diagnosis = new List<Diagnosis>();
            }

            claimSubmitRequest.enterer = new Reference
            {
                reference = hibConfigurationParameter.Enterer
            };
            claimSubmitRequest.facility = new Facility
            {
                reference = hibConfigurationParameter.Facility
            };
            claimSubmitRequest.identifier = PrepareIdentifier(hibLiveClaimSubmission.ClaimCode, hibLiveClaimSubmission.PolicyHolderUUID);

            claimSubmitRequest.item = PrepareItems(hibLiveClaimSubmission.InvoiceItems);

            claimSubmitRequest.total = new Total
            {
                value = hibLiveClaimSubmission.TotalAmount
            };

            claimSubmitRequest.patient = new HIBApiResponses.Patient
            {
                reference = $"Patient/{hibLiveClaimSubmission.PolicyHolderUUID}"
            };
            claimSubmitRequest.nmc = hibLiveClaimSubmission.NmcNo;
            claimSubmitRequest.type = new PatientType
            {
                text = GetPatientType(hibLiveClaimSubmission.VisitType, hibLiveClaimSubmission.FirstServicePoint, claimManagementDbContext)
            };
            claimSubmitRequest.careType = hibLiveClaimSubmission.VisitType == ENUM_VisitType.outpatient ? ENUM_HIBCareType.Outpatient : ENUM_HIBCareType.InPatient;
            claimSubmitRequest.information = PrepareClaimInformation(hibLiveClaimSubmission.Explanations);

            return claimSubmitRequest;
        }

        private List<Item> PrepareItems(List<HibTransactionItemDto> invoiceItems)
        {
            List<Item> items = new List<Item>();
            for (int i = 0; i < invoiceItems.Count(); i++)
            {
                Item item = new Item();
                item.sequence = i + 1;
                item.quantity = new Quantity
                {
                    value = invoiceItems[i].Quantity
                };
                item.category = new ItemCategory
                {
                    text = invoiceItems[i].ModuleName.ToLower() == ENUM_ModuleNames.Billing.ToLower() ? ENUM_HIBClaimCategory.Service : ENUM_HIBClaimCategory.Item,
                };
                item.service = new Service
                {
                    text = invoiceItems[i].ItemCode
                };
                item.unitPrice = new UnitPrice
                {
                    value = invoiceItems[i].UnitPrice
                };
                items.Add(item);
            }
            return items;
        }

        public HIBConfigurationParameterDto GetHIBIntegrationParameter(ClaimManagementDbContext claimManagementDbContext)
        {
            var param = claimManagementDbContext.CoreCfgParameter.FirstOrDefault(a =>
                a.ParameterGroupName == "GovInsurance" && a.ParameterName == "HIBConfiguration");

            if (param != null)
            {
                HIBConfigurationParameterDto hIBConfigurationParameter = JsonConvert.DeserializeObject<HIBConfigurationParameterDto>(param.ParameterValue);
                return hIBConfigurationParameter;
            }
            else
            {
                return null;
            }
        }

        private List<Diagnosis> PrepareDiagnosis(List<DiagnosisModel> diagnosis)
        {
            List<Diagnosis> medicalDiagnosis = new List<Diagnosis>();
            for (int i = 0; i < diagnosis.Count(); i++)
            {
                Diagnosis d = new Diagnosis();
                d.type = new List<HibClaimType>();
                d.sequence = 1; /*Here Sequence is hardcoded as 1, refering to the document provided from HIB*/;
                Coding coding = new Coding();
                coding.code = diagnosis[i].DiagnosisCode;
                DiagnosisCodeableConcept diagnosisCodeableConcept = new DiagnosisCodeableConcept();
                diagnosisCodeableConcept.coding = new List<Coding>();
                diagnosisCodeableConcept.coding.Add(coding);
                d.diagnosisCodeableConcept = diagnosisCodeableConcept;
                HibClaimType claimType = new HibClaimType();
                claimType.text = i == 0 ? ENUM_ICDCoding.ICD10 : ENUM_ICDCoding.ICD11; /*Here according to the document provided by HIB, for the first diagnosis it should be icd_0 and for next diagnosis it should be icd_1*/
                d.type.Add(claimType);
                medicalDiagnosis.Add(d);
            }
            return medicalDiagnosis;
        }

        private List<Identifier> PrepareIdentifier(long? claimCode, string policyHolderUUID)
        {
            List<Identifier> identifiers = new List<Identifier>();

            Identifier acsnIdentifier = PrepareAcsnIdentifierCoding(policyHolderUUID);

            Identifier mrIdentifier = PrepareMrIdentifierCoding(claimCode);

            identifiers.Add(acsnIdentifier);
            identifiers.Add(mrIdentifier);

            return identifiers;
        }

        private Identifier PrepareAcsnIdentifierCoding(string policyHolderUUID)
        {
            Identifier acsnIdentifier = new Identifier();
            List<IdentifierCoding> acsnCodings = new List<IdentifierCoding>();
            IdentifierCoding acsnCoding = new IdentifierCoding();
            acsnCoding.system = ENUM_HIBValueSetIdentifierUrl.system;
            acsnCoding.code = ENUM_HIBCodingValue.ACSNCodingSystem;
            acsnCodings.Add(acsnCoding);
            HIBApiResponses.Type acsnType = new HIBApiResponses.Type();
            acsnType.coding = acsnCodings;
            acsnIdentifier.type = acsnType;
            acsnIdentifier.use = ENUM_HIBIdentifierUseValue.Use;
            acsnIdentifier.value = policyHolderUUID;
            return acsnIdentifier;
        }

        private Identifier PrepareMrIdentifierCoding(long? claimCode)
        {
            Identifier mrIdentifier = new Identifier();
            List<IdentifierCoding> mrCodings = new List<IdentifierCoding>();
            IdentifierCoding mrCoding = new IdentifierCoding();
            mrCoding.system = ENUM_HIBValueSetIdentifierUrl.system;
            mrCoding.code = ENUM_HIBCodingValue.MRCodingSystem;
            mrCodings.Add(mrCoding);
            HIBApiResponses.Type mdTypes = new HIBApiResponses.Type();
            mdTypes.coding = mrCodings;
            mrIdentifier.type = mdTypes;
            mrIdentifier.use = ENUM_HIBIdentifierUseValue.Use;
            mrIdentifier.value = claimCode.ToString();
            return mrIdentifier;
        }

        private string GetPatientType(string visitType, string firstServicePoint, ClaimManagementDbContext claimManagementDbContext)
        {
            var configuredFirstPoint = claimManagementDbContext.CoreCfgParameter.FirstOrDefault(p => p.ParameterGroupName == "GovInsurance" && p.ParameterName == "FirstServicePointName").ParameterValue;
            string[] visitTypes = { "outpatient", "inpatient" };
            if (visitType.Contains(visitType) && firstServicePoint == configuredFirstPoint)
            {
                return ENUM_VisitTypeFormattedForHIB.OutpatientAndInPatient;
            }
            else if (visitType == ENUM_VisitType.emergency)
            {
                return ENUM_VisitTypeFormattedForHIB.Emergency;
            }
            else if (visitType.Contains(visitType) && firstServicePoint != configuredFirstPoint)
            {
                return ENUM_VisitTypeFormattedForHIB.Referral;
            }
            else
            {
                return ENUM_VisitTypeFormattedForHIB.OutpatientAndInPatient;
            }
        }

        private List<ClaimInformation> PrepareClaimInformation(List<string> explanations)
        {
            List<ClaimInformation> claimInformation = new List<ClaimInformation>();
            for (int i = 0; i < explanations.Count(); i++)
            {
                ClaimInformation ci = new ClaimInformation();
                ci.sequence = i + 1;
                ci.category = new Category
                {
                    text = ENUM_HibClaimInformationCategory.Explanation
                };
                ci.valueString = explanations[i];
                claimInformation.Add(ci);
            }
            return claimInformation;
        }
    }
}
