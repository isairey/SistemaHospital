namespace DanpheEMR.Services.Clinical_New.MedicalDiagnosis.DTOs
{
    public class PatientMedicalDiagnosisDto
    {
        public int DiagnosisId { get; set; }
        public int ICD10ID { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string DiagnosisCode { get; set; }
        public string DiagnosisCodeDescription { get; set; }
        public string DiagnosisType { get; set; }
        public bool IsCauseOfDeath { get; set; }
        public string Remarks { get; set; }
        public string ModificationHistory { get; set; }
        public bool IsActive { get; set; }
    }
}
