namespace DanpheEMR.Services.OT.DTOs
{
    public class GetOTAnaesthesiaServiceItemList
    {
        public int ServiceItemId { get; set; }
        public string ItemName { get; set; }
        public int AnaesthesiaId { get; set; }
        public string AnaesthesiaType { get; set; }
        public int AnaesthesiaTypeId { get; set; }
        public bool IsActive { get; set; }
    }
}
