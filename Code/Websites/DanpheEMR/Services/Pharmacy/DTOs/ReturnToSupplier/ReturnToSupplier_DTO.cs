using DocumentFormat.OpenXml.Office2010.ExcelAc;
using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.Pharmacy.DTOs.ReturnToSupplier
{
    public class ReturnToSupplier_DTO
    {
        public int SupplierId { get; set; }
        public DateTime ReturnDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal VATAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string CreditNoteId { get; set; }
        public string Remarks { get; set; }
        public int ReturnStatus { get; set; }
        public List<ReturnToSupplierItem_DTO> ReturnToSupplierItems { get; set; }
    }
}
