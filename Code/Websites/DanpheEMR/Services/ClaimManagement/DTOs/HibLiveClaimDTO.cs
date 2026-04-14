using System.Collections.Generic;

namespace DanpheEMR.Services.ClaimManagement.DTOs
{
    public class HibLiveClaimDTO
    {
        public int InvoiceId { get; set; }
        public string ModuleName { get; set; }
        public List<string> Explanation { get; set; }
        public string ClaimDoc { get; set; }
        public string InvoiceFrom { get; set; }
    }
}
