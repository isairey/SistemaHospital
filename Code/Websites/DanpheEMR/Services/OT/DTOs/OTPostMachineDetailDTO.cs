namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPostMachineDetailDTO
    {
        public int MachineDetailId { get; set; }
        public int OTMachineId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int OTBookingId { get; set; }
        public decimal Charge { get; set; }
        public bool IsActive { get; set; }
    }
}