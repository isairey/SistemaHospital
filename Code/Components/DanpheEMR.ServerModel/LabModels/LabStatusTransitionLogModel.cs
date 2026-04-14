using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.LabModels
{
    public class LabStatusTransitionLogModel
    {
        [Key]
        public int LabStatusTransitionLogId { get; set; }
        public Int64? RequisitionId { get; set; }
        public int? LabReportId { get; set; }
        public string PreviousStatus { get; set; }
        public string CurrentStatus { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
