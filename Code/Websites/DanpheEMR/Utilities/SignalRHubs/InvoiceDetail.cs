namespace DanpheEMR.Utilities.SignalRHubs
{
    public class InvoiceDetail
    {
        public int InvoiceId { get; set; }
        public int FiscalYearId { get; set; }
        public int InvoiceNo { get; set; }
        public bool PaymentStatus { get; set; }
        public int DischargeStatementId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
    }
}
