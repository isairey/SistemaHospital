namespace DanpheEMR.Services.Insurance.DTOs
{
    public class CheckUserResponse_DTO
    {
        public string status { get; set; }
        public Data data { get; set; }
    }

    public class Data
    {
        public string access_code { get; set; }
    }
}
