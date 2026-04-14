using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalHeadingsModel
    {
        [Key]
        public int ClinicalHeadingId { get; set; }
        public string ClinicalHeadingName { get; set; }
        public int? ParentId { get; set; }
        public string Code { get; set; }
        public string DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }

    }
}
