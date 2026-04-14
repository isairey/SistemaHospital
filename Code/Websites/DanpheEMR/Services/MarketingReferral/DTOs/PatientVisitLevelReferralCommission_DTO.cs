using System;

namespace DanpheEMR.Services.MarketingReferral.DTOs
{
    public class PatientVisitLevelReferralCommission_DTO
    {
        public int PatientReferralCommissionId { get; set; }
        public DateTime VisitDate { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int ReferringPartyId { get; set; }
        public int ReferralSchemeId { get; set; }
        public decimal ReferralAmount { get; set; }
        public string Remarks { get; set; }
        public bool IsActive { get; set; }
    }
}
