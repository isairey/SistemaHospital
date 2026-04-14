namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class Put_Medication_DTO
    {
        public int PrescriptionItemId { get; set; }
        public string Dosage { get; set; }
        public string Strength { get; set; }
        public string FrequencyAbbreviation { get; set; }
        public int GenericId { get; set; }
        public string GenericName { get; set; }
        public int HowManyDays { get; set; }
        public bool IsPRN { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string PRNNotes { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string Remarks { get; set; }
        public string Route { get; set; }
        public string TimingOfMedicineTake { get; set; }
        public bool IsDischargeRequest { get; set; }
    }
}
