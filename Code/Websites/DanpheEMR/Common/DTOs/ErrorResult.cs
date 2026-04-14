using System.Collections.Generic;

namespace DanpheEMR.Common.DTOs
{
    public class ErrorResult
    {
        public List<string> Messages { get; set; } = new List<string>();
        public string Source { get; set; }
        public string Exception { get; set; }
        public string ErrorId { get; set; }
        public string SupportMessage { get; set; }
        public int StatusCode { get; set; }
    }
}
