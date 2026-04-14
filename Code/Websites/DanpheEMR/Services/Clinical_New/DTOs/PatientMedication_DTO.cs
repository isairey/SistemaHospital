using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PatientMedication_DTO
    {
        public int CardexId { get; set; }
        public int MedicationItemId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int? PrescriberId { get;set; }
        public string FrequencyAbbreviation { get; set; }
        public int Duration { get; set; }
        public string RouteOfAdministration { get; set; }
        public string MedicationSchedule { get; set; }
        public bool IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public string Doses { get; set; }
        public string Strength { get; set; }
        public string CardexNote { get; set; }
        public string Status { get; set; }
        public string GenericName { get; set; }
        public string ItemName { get; set; }
        public int ItemId { get; set; }
        public string AlternativeItemName { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? PatientMedicationId { get; set; }
        public DateTime? MedicationTakenDate { get; set; }
        public TimeSpan? MedicationTakenTime { get; set; }
        public string Comment { get; set; }
        public int? MedicationCreatedBy { get; set; }
        public DateTime? MedicationCreatedOn { get; set; }
        public DateTime MedicationStartDate  { get; set; }
        public DateTime MedicationEndDate  { get; set; }


    }
}
