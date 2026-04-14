using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PatientFollowUp_DTO
    {
        public int FollowUpDays { get; set; }
        public string FollowUpRemarks { get; set; }
        public int PatientVisitId {  get; set; }
    }
}
