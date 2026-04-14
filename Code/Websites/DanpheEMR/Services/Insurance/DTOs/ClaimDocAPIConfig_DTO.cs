namespace DanpheEMR.Services.Insurance.DTOs
{
    public class ClaimDocAPIConfig_DTO
    {
        public bool Enable { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string CheckUserAPI { get; set; }
        public string CreateClaimIdAPI { get; set; }
        public string UploadSingleFileAPI { get; set; }
        public string UploadMultipleFileAPI { get; set; }
    }
}
