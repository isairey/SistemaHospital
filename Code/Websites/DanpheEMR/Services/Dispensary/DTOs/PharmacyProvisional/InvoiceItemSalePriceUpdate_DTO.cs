namespace DanpheEMR.Services.Dispensary.DTOs.PharmacyProvisional
{
    public class InvoiceItemSalePriceUpdate_DTO
    {
        public int InvoiceItemId { get; set; }
        public decimal SalePrice { get; set; }
        public int? BillServiceItemId { get; set; }
    }
}
