using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.ClinicalModels
{
    public class DiagnosisModel
    {
        [Key]
        public int DiagnosisId { get; set; }
        public int ICDId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string DiagnosisCodeDescription { get; set; }
        public string DiagnosisCode { get; set; }
        public string DiagnosisType { get; set; }
        public Boolean IsCauseOfDeath { get; set; }
        public string Remarks { get; set; }
        public string ModificationHistory { get; set; }
        public int CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
