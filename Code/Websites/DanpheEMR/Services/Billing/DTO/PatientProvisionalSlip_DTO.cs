using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.Billing.DTO
{
    public class BillingItemList_DTO
    {
        public string PatientPolicyNo { get; set; }
        public string SchemeName { get; set; }
        public int BillingTransactionItemId { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int ServiceDepartmentId { get; set; }
        public string AssignedToDrName { get; set; }
        public string FiscalYearFormatted { get; set; }
        public string ItemName { get; set; }
        public double Price { get; set; }
        public double Quantity { get; set; }
        public double SubTotal { get; set; }
        public double TaxableAmount { get; set; }
        public double DiscountAmount { get; set; }
        public double TotalAmount { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ProvisionalReceiptNo { get; set; }
        public bool IsCoPayment { get; set; }
        public decimal CoPaymentCashAmount { get; set; }
        public decimal CoPaymentCreditAmount { get; set; }
    }

    public class PatientProvisionalSlip_DTO
    {
        public string InvoicePrintTemplate { get; set; }
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string PatientName { get; set; }
        public string ContactNo { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Age { get; set; }
        public string Gender { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string Address { get; set; }
        public string BillingUser { get; set; }
        public List<BillingItemList_DTO> ItemsList { get; set; }
        public string CountryName { get;  set; }
        public string MunicipalityName { get;  set; }
        public Int16? WardNumber { get; set; }

    }

}
