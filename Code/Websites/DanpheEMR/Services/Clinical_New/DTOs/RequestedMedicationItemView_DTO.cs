using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class RequestedMedicationItemView_DTO
    {
        public int PrescriptionItemId { get; set; }
        public int PrescriptionId { get; set; }
        public int PatientId { get; set; }
        public int? PatientVisitId { get; set; }
        public int? PrescriberId { get; set; }
        public int? ItemId { get; set; }
        public decimal Quantity { get; set; }
        public int? Frequency { get; set; }
        public DateTime? StartingDate { get; set; }
        public int? HowManyDays { get; set; }
        public string FrequencyAbbreviation { get; set; }
        public string TimingOfMedicineTake { get; set; }
        public bool IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public string Notes { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string OrderStatus { get; set; }
        public string Dosage { get; set; }
        public string Strength { get; set; }
        public int? GenericId { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? DiagnosisId { get; set; }
        public string Route { get; set; }
        public string ItemName { get; set; }
        public string GenericName { get; set; }
        public int? PerformerId { get; set; }
        public bool IsDischargeRequest { get; set; }
        public bool IsAddedToPlan { get; set; }
    }
}
