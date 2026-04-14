using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTSurgeryModel
    {
        [Key]
        public int SurgeryId { get; set; }
        public string SurgeryName { get; set; }
        public string SurgeryCode { get; set; }
        public string Description { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public bool IsSystemDefault { get; set; }
    }
}
