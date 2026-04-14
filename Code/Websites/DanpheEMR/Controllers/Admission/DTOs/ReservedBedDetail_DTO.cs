using System;

namespace DanpheEMR.Controllers.Admission.DTOs
{
    public class ReservedBedDetail_DTO
    {
        public DateTime StartedOn { get; set; }
        public string WardName { get; set; }
        public string BedFeatureName { get; set; }
        public string BedNumber { get; set; }
    }
}
