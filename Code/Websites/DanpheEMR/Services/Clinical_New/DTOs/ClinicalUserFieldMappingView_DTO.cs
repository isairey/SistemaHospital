using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalUserFieldMappingView_DTO
    {
        public int? ClinicalUserFieldId { get; set; }
        public string DepartmentName { get; set; }
        public string ClinicalHeadingName { get; set; }
        public string ParentHeadingName { get; set; }
        public int ClinicalHeadingId { get; set; }
        public string EmployeeName { get; set; }
        public bool IsActive { get; set; }
        public int? DepartmentId { get; set; }
        public int? EmployeeId { get; set; }
        public int? ParentHeadingId { get; set; }
        public DateTime CreatedOn { get; set; }
    }
}
