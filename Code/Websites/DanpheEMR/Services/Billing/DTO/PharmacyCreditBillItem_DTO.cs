using DanpheEMR.ServerModel.BillingModels;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.Services.Billing.DTO
{
    public class PharmacyCreditBillItem_DTO
    {
        public int PatientId { get; set; }
        public DateTime BillDate { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public decimal SalePrice { get; set; }
        public string ItemCode { get; set; }
        public decimal Quantity { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal VATAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string BatchAndExpiry { get; set; }
        public string BatchNo { get; set; }
        public string ExpiryDate { get; set; }

        public static List<PharmacyCreditBillItem_DTO> MapDataTableToObjectList(DataTable dtInvoiceItem)
        {
            List<PharmacyCreditBillItem_DTO> retListObj = new List<PharmacyCreditBillItem_DTO>();
            if (dtInvoiceItem != null)
            {
                string strInvItms = JsonConvert.SerializeObject(dtInvoiceItem);
                retListObj = JsonConvert.DeserializeObject<List<PharmacyCreditBillItem_DTO>>(strInvItms);
            }
            return retListObj;
        }
    }
}
