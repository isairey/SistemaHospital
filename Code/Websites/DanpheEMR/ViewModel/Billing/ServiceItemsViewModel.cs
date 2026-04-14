using DanpheEMR.ServerModel;
using DocumentFormat.OpenXml.Office2010.ExcelAc;
using System;
using System.Collections.Generic;

namespace DanpheEMR.ViewModel.Billing
{
    public class ServiceItemsViewModel
    {
        public int ServiceDepartmentId { get; set; }
        public string ItemName { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public string IntegrationName { get; set; }
        public int IntegrationItemId { get; set; }
        public bool IsTaxApplicable { get; set; }
        public string Description { get; set; }
        public bool IsDoctorMandatory { get; set; }
        public string ItemCode { get; set; }
        public int? DisplaySeq { get; set; }
        public bool IsOT { get; set; }
        public bool IsProc { get; set; }
        public int? ServiceCategoryId { get; set; }
        public string ServiceCategoryName { get; set; }
        public bool AllowMultipleQty { get; set; }
        public string DefaultDoctorList { get; set; }
        public bool IsValidForReporting { get; set; }
        public bool IsErLabApplicable { get; set; }
        public bool IsActive { get; set; }
        public int ServiceItemId { get; set; }
        public bool IsIncentiveApplicable { get; set; }
        public decimal? Price { get; set; }
        public bool IsInsurancePackage { get; set; }
        public string OTCategory { get; set; }
        public int DepartmentId {  get; set; }
        public int? DynamicReportGroupId {  get; set; }
        public List<ReadPriceDetails_DTO> PriceDetails { get; set; }

    }
    public class ReadPriceDetails_DTO
    {
        public int PriceCategoryId { get; set; }
        public decimal Price { get; set; }
    }
}
