using System.Collections.Generic;

namespace DanpheEMR.Services.Insurance.DTOs
{
    public class ClaimUploadFileRequest_DTO
    {
        public class ClaimUploadSingleFileRequest_DTO
        {
            public int PatientId { get; set; }
            public string claim_id { get; set; }
            public string name { get; set; }
            public string access_code { get; set; }
            public string file { get; set; }
        }

        public class ClaimUploadMultipleFileRequest_DTO
        {
            public int PatientId { get; set; }
            public string claim_id { get; set; }
            public string name { get; set; }
            public string access_code { get; set; }
            public List<string> file { get; set; }
        }
    }
}
