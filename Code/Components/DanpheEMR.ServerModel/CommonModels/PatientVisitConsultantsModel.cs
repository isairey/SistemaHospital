using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.CommonModels
{
    public class PatientVisitConsultantsModel
    {
        [Key]
        public int PatientVisitConsultantId { get; set; }
        public int PatientVisitId { get; set; }
        public int PatientId { get; set; }
        public string VisitType { get; set; }
        public int ConsultantId { get; set; }
        public bool IsPrimaryConsultant { get; set; }
        public bool IsChargeApplicable { get; set; }
        public int? PatientBedInfoId { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}
