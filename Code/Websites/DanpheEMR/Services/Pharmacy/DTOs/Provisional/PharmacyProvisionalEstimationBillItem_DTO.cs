using DanpheEMR.ServerModel.InventoryModels.InventoryReportModel;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace DanpheEMR.Services.Pharmacy.DTOs.Provisional
{
    public class PharmacyProvisionalEstimationBillItem_DTO
    {
        public string ItemName { get; set; }
        public string GenericName { get; set; }
        public string BatchNo { get; set; }
        public double Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal SalePrice { get; set; }
        public decimal SubTotal { get; set; }
        public double VATPercentage { get; set; }
        public decimal VATAmount { get; set; }
        public double DiscountPercentage { get; set; }
        public decimal TotalAmount { get; set; }
        public string Remark { get; set; }
        public string VisitType { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public double PharmacyCoPayCashPercent { get; set; }
        public double PharmacyCoPayCreditPercent { get; set; }
        public decimal CoPaymentCashAmount { get; set; }
        public decimal CoPaymentCreditAmount { get; set; }
        public string RackNo { get; set; }
        public string ReceiptNo { get; set; }
        public string HSCode { get; set; }

        public static List<PharmacyProvisionalEstimationBillItem_DTO> MapDataTableToObjectList(DataTable data)
        {
            List<PharmacyProvisionalEstimationBillItem_DTO> retObj = new List<PharmacyProvisionalEstimationBillItem_DTO>();
            if (data != null)
            {
                string strPatData = JsonConvert.SerializeObject(data);
                List<PharmacyProvisionalEstimationBillItem_DTO> bill = JsonConvert.DeserializeObject<List<PharmacyProvisionalEstimationBillItem_DTO>>(strPatData);
                if (bill != null && bill.Count > 0)
                {
                    retObj = bill;
                }
            }
            return retObj;
        }
    }

    public class PharmacyPatientInfo_DTO
    {
        public string PatientCode { get; set; }
        public string ShortName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string CountryName { get; set; }
        public string CountrySubDivisionName { get; set; }
        public int? WardNumber { get; set; }
        public string MunicipalityName { get; set; }
        public int? ClaimCOde {  get; set; }
        public string PolicyNumber { get; set; }
        public string Address { get; set; }
        public string VisitCode { get; set; }
        public string SchemeName { get; set; }
        public string PhoneNumber { get; set; }

        public static PharmacyPatientInfo_DTO MapDataTableToSingleObject(DataTable patInfo)
        {
            PharmacyPatientInfo_DTO retObj = new PharmacyPatientInfo_DTO();
            if (patInfo != null)
            {
                string strPatData = JsonConvert.SerializeObject(patInfo);
                List<PharmacyPatientInfo_DTO> patList = JsonConvert.DeserializeObject<List<PharmacyPatientInfo_DTO>>(strPatData);
                if (patList != null && patList.Count > 0)
                {
                    retObj = patList.First();
                }
            }
            return retObj;
        }
    }

    public class PharmacyProvisionaEstimationBillInfo
    {
        public List<PharmacyProvisionalEstimationBillItem_DTO> ProvisionalEstimationBillInvoiceItems { get; set; }
        public PharmacyPatientInfo_DTO PatientInfo { get; set; }
    }
}
