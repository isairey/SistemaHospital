namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPersonnelTypeDTO
    {
        public int PersonnelTypeId { get; set; }
        public string PersonnelType { get; set; }
        public bool IsIncentiveApplicable { get; set; }
        public bool IsActive { get; set; }
    }
}
