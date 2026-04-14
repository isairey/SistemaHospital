using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.PharmacyModels
{
    public class PHRMPackageItemModel
    {
        [Key]
        public int PackageItemId { get; set; }
        public int PharmacyPackageId { get; set; }
        public int ItemId { get; set; }
        public int GenericId { get; set; }
        public decimal Quantity { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public PHRMPackageModel Package {  get; set; }
    }
}
