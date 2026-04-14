using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.Services.NewClinical
{
    public class MedicationIntakeModel
    {
        [Key]
        public int MedicationIntakeId { get; set; }
        public string IntakeCode { get; set; }
        public string IntakeDisplayName { get; set; }
        public int IntakeNumber { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
