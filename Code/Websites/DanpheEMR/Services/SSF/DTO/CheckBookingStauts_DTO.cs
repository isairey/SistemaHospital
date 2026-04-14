namespace DanpheEMR.Services.SSF.DTO
{
    public class CheckBookingStauts_DTO
    {
        public string resourceType { get; set; }
        public CheckBookingStatus_Payload payload { get; set; }
    }

    public class CheckBookingStatus_Payload
    {
        public string cmd_action { get; set; }
        public string chfid { get; set; }
    }
}
