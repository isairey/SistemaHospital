namespace DanpheEMR.Controllers.Admission.DTOs
{
    public class AddBedReservation_DTO
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int WardId { get; set; }
        public int BedFeatureId { get; set; }
        public int BedId { get; set; }
        public int? CareTakerId { get; set; }
        public string PrimaryCareTakerName { get; set; }
        public string PrimaryCareTakerContact { get; set; }
        public string SecondaryCareTakerName { get; set; }
        public string SecondaryCareTakerContact { get; set; }
    }
}
