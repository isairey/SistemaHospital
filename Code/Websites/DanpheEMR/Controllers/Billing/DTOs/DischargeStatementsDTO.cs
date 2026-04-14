using System;

namespace DanpheEMR.Controllers.Billing.DTOs
{
    public class DischargeStatementsDTO
    {
        public int PatientId { get; set; }
        public int DischargeStatementId {get; set; }
        public int StatementNo { get; set; }
        public string PatientName { get; set; }
        public string PatientCode { get; set; }
        public DateTime StatementDate { get; set; }
        public TimeSpan StatemntTime { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string AgeSex { get; set; }
        public string PhoneNo { get; set; }
        public int PatientVisitId { get; set; }  
    }
}
