namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPostImplantDetailDTO
    {
        public int ImplantDetailId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int OTBookingId { get; set; }
        public string ImplantName { get; set; }
        public int? Quantity { get; set; }
        public decimal? Charge { get; set; }
        public string Remarks { get; set; }
        public bool IsActive { get; set; }
    }
}
