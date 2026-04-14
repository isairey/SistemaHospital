namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class DiagnosisAdd_DTO

    {
        public int DiagnosisId { get; set; }
        public int ICDId { get; set; }
        public string DiagnosisCode { get; set; }
        public string DiagnosisCodeDescription { get; set; }
        public string DiagnosisType { get; set; }
        public bool IsCauseOfDeath { get; set; }
        public string Remarks { get; set; }
        public string ModificationHistory { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
    }
}
