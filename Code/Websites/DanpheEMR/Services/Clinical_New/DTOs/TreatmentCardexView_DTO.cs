using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class TreatmentCardexView_DTO
    {
        public int CardexId { get; set; }
        public int? PrescriptionItemId { get; set; }
        public int MedicationItemId { get; set; }
        public int? ItemId { get; set; }
        public string ItemName { get; set; }
        public string GenericName { get; set; }
        public int? PrescriberId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string FrequencyAbbreviation { get; set; }
        public int Duration { get; set; }
        public string RouteOfAdministration { get; set; }
        public string MedicationSchedule { get; set; }
        public bool IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public string Doses { get; set; }
        public string CardexNote { get; set; }
        public string Status { get; set; }
        public string AlternateMedicine { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public DateTime MedicationStartDate{get; set;}
        public DateTime MedicationEndDate { get; set;}  
    }
}
