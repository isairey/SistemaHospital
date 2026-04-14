using System;

namespace DanpheEMR.Controllers.Settings.DTO
{
    public class ReportGroupDTO
    {
        public int DynamicReportGroupId { get; set; }
        public string GroupName { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
