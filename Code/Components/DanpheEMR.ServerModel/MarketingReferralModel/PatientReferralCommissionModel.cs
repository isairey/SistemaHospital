using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.MarketingReferralModel
{
    public class PatientReferralCommissionModel
    {
        [Key]
        public int PatientReferralCommissionId { get; set; }
        public DateTime VisitDate { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int ReferringPartyId { get; set; }
        public int ReferralSchemeId { get; set; }
        public decimal ReferralAmount { get; set; }
        public string Remarks { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
