using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PostIntakeOutput_DTO
    {
        public int? InputOutputId { get; set; }
        public int PatientVisitId { get; set; }
        public int InputOutputParameterMainId { get; set; }
        public int? InputOutputParameterChildId { get; set; }
        public double IntakeOutputValue { get; set; }
        public int Balance { get; set; }
        public string Unit { get; set; }
        public string IntakeOutputType { get; set; }
        public int? CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public string CreatedOn { get; set; }
        public string ModifiedOn { get; set; }
        public string Color { get; set; }
        public string Quality { get; set; }
        public string Remarks { get; set; }
        public string Contents { get; set; }
        public bool IsActive { get; set; }
    }
}
