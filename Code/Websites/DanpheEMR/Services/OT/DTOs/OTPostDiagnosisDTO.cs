namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPostDiagnosisDTO
    {
        public int DiagnosisId { get; set; }
        public int ICDId { get; set; }
        public string DiagnosisCode { get; set; }
        public string DiagnosisCodeDescription { get; set; }
        public string DiagnosisType { get; set; }
        public bool IsCauseOfDeath { get; set; }
        public string Remarks { get; set; }
        public string ModificationHistory { get; set; }
    }
}
