using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTAnaesthesiaTypeModel
    {
        [Key]
        public int AnaesthesiaTypeId { get; set; }
        public string AnaesthesiaType { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
