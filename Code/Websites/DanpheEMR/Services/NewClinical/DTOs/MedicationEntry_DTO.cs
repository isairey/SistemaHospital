using System;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class MedicationEntry_DTO
    {
        public int CardexplanId { get; set; }
        public DateTime MedicationTakenDate { get; set; }
        public TimeSpan MedicationTakenTime { get; set; }
        public string Comments { get; set; }
    }
}
