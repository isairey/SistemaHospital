namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonePayGetStatusSuccessResponse
    {
        public string prn { get; set; }
        public string merchantCode { get; set; }
        public string paymentStatus { get; set; }
        public string requestedAmount { get; set; }
        public string totalTransactionAmount { get; set; }
    }
}
