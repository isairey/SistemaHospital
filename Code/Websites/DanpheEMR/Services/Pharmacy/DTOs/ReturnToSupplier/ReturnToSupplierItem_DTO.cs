using System;

namespace DanpheEMR.Services.Pharmacy.DTOs.ReturnToSupplier
{
    public class ReturnToSupplierItem_DTO
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string BatchNo { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal Quantity { get; set; }
        public decimal ReturnCostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public decimal ReturnRate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal DiscountedAmount { get; set; }
        public decimal VATPercentage { get; set; }
        public decimal VATAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
