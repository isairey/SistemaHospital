using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.ClinicalModels;
using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.ClaimManagement.DTOs
{
    public class HibLiveClaimSubmissionDTO
    {
        public int InvoiceId { get; set; }
        public Int64? ClaimCode { get; set; } = default(Int64);
        public int PatientId { get; set; } = 0;
        public int PatientVisitId { get; set; } = 0;
        public string PatientCode { get; set; } = string.Empty;
        public string MemberNo { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; } = decimal.Zero;
        public int SchemeId { get; set; } = 0;
        public int CreditOrganizationId { get; set; } = 0;
        public string ModuleName { get; set; }
        public DateTime InvoiceDate { get; set; } = DateTime.Now;
        public List<DiagnosisModel> Diagnosis { get; set; } = new List<DiagnosisModel>();
        public string NmcNo { get; set; } = string.Empty;
        public string PolicyHolderUUID { get; set; } = string.Empty;
        public string VisitType { get; set; } = string.Empty;
        public string FirstServicePoint { get; set; } = string.Empty;
        public List<HibTransactionItemDto> InvoiceItems { get; set; } = new List<HibTransactionItemDto>();
        public List<string> Explanations { get; set; } = new List<string>();
        public string ClaimDocs { get; set; } = string.Empty;
    }
}
