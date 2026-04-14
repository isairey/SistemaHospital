using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTAnaesthesiaModel
    {
        [Key]
        public int AnaesthesiaId { get; set; }
        public int ServiceItemId { get; set; }
        public int AnaesthesiaTypeId { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
