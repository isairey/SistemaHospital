using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PutMedicationCardexPlan_DTO
    {
        public int CardexId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int? PrescriptionItemId { get; set; }
        public string BrandName { get; set; }
        public string CardexNote { get; set; }
        public string Doses { get; set; }
        public int Duration { get; set; }
        public string Frequency { get; set; }
        public string GenericId { get; set; }
        public string Intake { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string MedicationSchedule { get; set; }
        public bool IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public int? PrescriberId { get; set; }
        public string Prescriber { get; set; }
        public string Remarks { get; set; }
        public string Route { get; set; }
        public bool UseAlternateMedicine { get; set; }
        public string AlternateMedicine { get; set; }
        public string Status { get; set; }
        public DateTime MedicationStartDate { get; set; }
        public DateTime MedicationEndDate { get; set; }

    }
}
