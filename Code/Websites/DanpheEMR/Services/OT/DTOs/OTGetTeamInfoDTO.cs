using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetTeamInfoDTO
    {
        public int TeamInfoId { get; set; }
        public int PersonnelTypeId { get; set; }
        public string PersonnelType { get; set; }
        public int EmployeeId { get; set; }
        public string FullName { get; set; }
        public int OTBookingId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}
