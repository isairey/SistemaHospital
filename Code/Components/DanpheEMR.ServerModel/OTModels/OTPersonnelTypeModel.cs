using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OtModels
{
    public class OTPersonnelTypeModel
    {
        [Key]
        public int PersonnelTypeId { get; set; }
        public string PersonnelType { get; set; }
        public bool IsIncentiveApplicable { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
