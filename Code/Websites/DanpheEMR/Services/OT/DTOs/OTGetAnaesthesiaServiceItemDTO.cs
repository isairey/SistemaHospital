using DanpheEMR.ServerModel.BillingModels;
using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetAnaesthesiaServiceItemDTO
    {
        public int AnaesthesiaId { get; set; }
        public int ServiceItemId { get; set; }
        public int ServiceDepartmentId { get; set; }
        public int IntegrationItemId { get; set; }
        public string IntegrationName { get; set; }
        public string ItemCode { get; set; }
        public string ItemName { get; set; }
        public bool IsTaxApplicable { get; set; }
        public string Description { get; set; }
        public int? DisplaySeq { get; set; }
        public bool IsDoctorMandatory { get; set; }
        public bool IsOT { get; set; }
        public bool IsProc { get; set; }
        public int? ServiceCategoryId { get; set; }
        public bool AllowMultipleQty { get; set; }
        public string DefaultDoctorList { get; set; }
        public bool IsValidForReporting { get; set; }
        public bool IsErLabApplicable { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public bool IsIncentiveApplicable { get; set; }
        public string ServiceDepartmentName { get; set; }
        //public List<BillMapPriceCategoryServiceItemModel> BilCfgItemsVsPriceCategoryMap { get; set; }
        public int AnaesthesiaTypeId { get; set; }
        public decimal Price { get; set; }
    }
}
