using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.PharmacyModels
{
    public class PHRMPackageModel
    {
        [Key]
        public int PharmacyPackageId { get; set; }
        public string PackageCode { get; set; }
        public string PharmacyPackageName { get; set; }
        public string Description { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public List<PHRMPackageItemModel> PackageItems { get; set; }
    }
}
