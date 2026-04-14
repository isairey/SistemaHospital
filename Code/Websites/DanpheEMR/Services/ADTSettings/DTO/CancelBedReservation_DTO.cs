namespace DanpheEMR.Services.ADTSettings.DTO
{
    public class CancelBedReservation_DTO
    {
        public string Address { get; set; } 
        public string Age { get; set; } 
        public string DateOfBirth { get; set; } 
        public string BedCode { get; set; } 
        public int BedId { get; set; } 
        public int PatientId { get; set; } 
        public string PhoneNumber { get; set; } 
        public int ReservedBedInfoId { get; set; } 
        public string Gender { get; set; } 
        public string PatientCode { get; set; } 
        public string ShortName { get; set; } 
        public string WardBed { get; set; } 
        public int WardId { get; set; } 
        public string WardName { get; set; } 
        public string CancellationRemarks { get; set; } 
    }
}
