namespace DanpheEMR.Services.OT.DTOs
{
    public class OTSurgeryDTO
    {
        public int SurgeryId { get; set; }
        public string SurgeryName { get; set; }
        public string SurgeryCode { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsSystemDefault { get; set; }
    }
}
