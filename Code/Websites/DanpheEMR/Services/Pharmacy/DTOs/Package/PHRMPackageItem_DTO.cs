using DanpheEMR.ServerModel.PharmacyModels;
using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.Pharmacy.DTOs.Package
{
    public class PHRMPackageItem_DTO
    {
        public int PackageItemId { get; set; }
        public int PharmacyPackageId { get; set; }
        public int ItemId { get; set; }
        public int GenericId { get; set; }
        public decimal Quantity { get; set; }
        public bool IsActive { get; set; }
        public string ItemCode { get; set; }
        public string ItemName { get; set; }
        public string GenericName { get; set; }
    }
}
