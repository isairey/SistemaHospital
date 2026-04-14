using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalAssessmentAndPlan_DTO
    {
        public int ClinicalNotesId { get; set; }
        public int PatientId { get; set; }
        public int VisitId { get; set; }
        public int ClinicalNotesMasterId { get; set; }
        public string NotesValues { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; } 
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public int? VerifiedBy { get; internal set; }
        public DateTime? VerifiedOn { get; internal set; }
    }
}
