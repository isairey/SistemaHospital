using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ReadMedicalComponent_DTO
    {
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public int? ClinicalHeadingId { get; set; }
        public int? ParentHeadingId { get; set; }
        public int? ClinicalMapComponentId { get; set; }
        public int DisplaySequence { get; set; }
        public bool IsActive { get; set; }
        public string InputType { get; set; }
    }
}
