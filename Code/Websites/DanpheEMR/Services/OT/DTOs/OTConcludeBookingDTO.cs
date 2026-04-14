using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTConcludeBookingDTO
    {
        public DateTime?  OTStartTime { get; set; }
        public DateTime? OTConcludeTime { get; set; }
        public bool IsOnScheduledTime { get; set; }
        public bool IsSeroPositive { get; set; }
        public decimal? OutTimeCharge { get; set; }
        public string ConcludeRemarks { get; set; }
    }
}
