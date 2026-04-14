using System;

namespace DanpheEMR.Services.OnlinePayment.DTO.FewaPay
{
    /// <summary>
    /// FewaPayTransactionLogDTO is to transfer data from the client to save the FewaPay Transaction logs
    /// </summary>
    public class FewaPayTransactionLogDTO
    {
        /// <summary>
        /// PatientId Refers to the Patient for which transaction is being done
        /// </summary>
        public int PatientId { get; set; }
        /// <summary>
        /// ModuleName refers to the module from where transaction is being done
        /// </summary>
        public string ModuleName { get; set; }
        /// <summary>
        /// TransactionId created by respective Payment Service Providers after successful payment
        /// </summary>
        public string TransactionId { get; set; }
        /// <summary>
        /// TransactionType refers to the Payment Service Provider Identifier eg: FonePay, NepalPay
        /// </summary>
        public string TransactionType { get; set; }
        /// <summary>
        /// TransactionAmount is the total Amount that is to be paid, This amount is in Paisa, Need to convert if needed
        /// </summary>
        public decimal TransactionAmount { get; set; }
        /// <summary>
        /// This holds the status of the transaction whether the transaction is successful or failed
        /// </summary>
        public bool TransactionStatus { get; set; }
        /// <summary>
        /// ResponseMessage message returned by POS Terminal Device regarding the transaction
        /// </summary>
        public string ResponseMessage { get; set; }
        /// <summary>
        /// TransactionResponse holds the overall JSON response sent to Billing System
        /// </summary>
        public string TransactionResponse { get; set; }
        /// <summary>
        /// TransactionDate refers to the Date when Transaction is done
        /// </summary>
        public string TransactionDate { get; set; }
        /// <summary>
        /// TransactionTime holds the time when Transaction is done
        /// </summary>
        public string TransactionTime { get; set; }
    }
}
