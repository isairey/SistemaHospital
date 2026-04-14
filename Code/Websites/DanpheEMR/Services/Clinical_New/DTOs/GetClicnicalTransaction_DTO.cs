using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class GetClicnicalTransaction_DTO
    {
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
        public string VitalsGroup { get; set; }
        public int DisplayOrder { get; set; }
        public string VitalsType { get; set; }
        public string InputType { get; set; }
        public string VitalsName { get; set; }
    }
}
