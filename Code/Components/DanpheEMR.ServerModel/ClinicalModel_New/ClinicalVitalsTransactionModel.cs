using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalVitalsTransactionModel
    {
        [Key]
        public int TxnVitalsId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int VitalsId { get; set; }
        public string VitalsValue { get; set; }
        public string Unit { get; set; }
        public string OtherVariable { get; set; }
        public string Remarks { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
