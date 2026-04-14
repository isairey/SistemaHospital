using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.Services.NewClinical
{
    public class ClinicalMedicationFrequencyStandardModel
    {
        [Key]
        public int MedicationFrequencyStanderdId { get; set; }
        public string FrequencyCode { get; set; }
        public string FrequencyDisplayName { get; set; }
        public int FrequencyInNumber { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }

    }
}
