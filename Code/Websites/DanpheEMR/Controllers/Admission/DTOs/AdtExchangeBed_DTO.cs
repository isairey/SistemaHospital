namespace DanpheEMR.Controllers.Admission.DTOs
{
    public class AdtExchangeBed_DTO
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int WardId { get; set; }
        public int BedFeatureId { get; set; }
        public int CurrentBedId { get; set; }
        public int DesiredBedId { get; set; }
        public bool IsDesiredBedOccupied { get; set; }
        public bool IsDesiredBedReserved { get; set; }
        public int? BedOccupiedByPatientId { get; set; }
        public int? BedOccupiedByPatientVisitId { get; set; }
    }
}
