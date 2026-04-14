using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalHeading_DTO
    {
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
