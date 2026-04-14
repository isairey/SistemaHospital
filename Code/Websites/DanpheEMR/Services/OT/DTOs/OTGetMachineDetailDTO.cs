using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetMachineDetailDTO
    {
        public int MachineDetailId { get; set; }
        public int OTMachineId { get; set; }
        public string MachineName { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int OTBookingId { get; set; }
        public decimal Charge { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
