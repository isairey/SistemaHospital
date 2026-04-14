using System.Collections.Generic;

namespace DanpheEMR.Services.Pharmacy.DTOs.Package
{
    public class PHRMPackage_DTO
    {
        public int PharmacyPackageId { get; set; } = 0;
        public string PackageCode { get; set; } = string.Empty;
        public string PharmacyPackageName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public List<PHRMPackageItem_DTO> PackageItems { get; set; }
    }
}
