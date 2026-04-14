namespace DanpheEMR.Services.ClaimManagement.DTOs
{
    public class HibTransactionItemDto
    {
        public string ModuleName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string ItemCode { get; set; }
    }
}
