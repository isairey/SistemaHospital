using System;

namespace DanpheEMR.Controllers.Appointment.DTOs
{
    public class PatientLastVisitDetail_DTO
    {
        public int PatientVisitId { get; set; }
        public int PatientId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public int? PerformerId { get; set; }
        public string PerformerName { get; set; }
        public DateTime VisitDate{ get; set; }
        public int LastVisitDayCount { get; set; }
        public string Scheme { get; set; }
        public string MemberNo { get; set; }
    }
}
