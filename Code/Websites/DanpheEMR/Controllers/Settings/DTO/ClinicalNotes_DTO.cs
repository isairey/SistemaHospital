using System;

namespace DanpheEMR.Controllers.Settings.DTO
{
    public class ClinicalNote_DTO
    {
        public int ClinicalNoteMasterId { get; set; }
        public string DisplayName { get; set; }
        public string FieldName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsSystemDefault { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }

    }
}
