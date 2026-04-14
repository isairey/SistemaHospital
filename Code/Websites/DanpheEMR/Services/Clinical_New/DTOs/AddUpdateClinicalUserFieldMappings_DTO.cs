using System.Collections.Generic;
using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class AddUpdateClinicalUserFieldMappings_DTO
    {
        public int? DepartmentId { get; set; }
        public int ClinicalHeadingId { get; set; }
        public List<ClinicalFieldDTO> FieldList { get; set; }
        public int? EmployeeId { get; set; }
    }
    public class ClinicalFieldDTO
    {
        public int? ClinicalUserFieldId { get; set; }
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public bool IsActive { get; set; }

    }

}
