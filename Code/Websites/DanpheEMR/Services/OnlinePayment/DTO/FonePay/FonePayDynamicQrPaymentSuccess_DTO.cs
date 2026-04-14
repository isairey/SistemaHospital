using System.Transactions;

namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonePayDynamicQrPaymentSuccess_DTO
    {
        public string merchantId { get; set; }
        public string deviceId { get; set; }
        public TransactionStatus transactionStatus { get; set; }
        public string socketUrl { get; set; }
    }

    public class TransactionStatus
    {
        public int traceId { get; set; }
        public string remarks1 { get; set; }
        public string remarks2 { get; set; }
        public string transactionDate { get; set; }
        public string productNumber { get; set; }
        public long amount { get; set; }
        public string message { get; set; }
        public bool success { get; set; }
        public string commissionType { get; set; }
        public long commissionAmount { get; set; }
        public long totalCalculatedAmount { get; set; }
        public bool paymentSuccess { get; set; }
    }

}
