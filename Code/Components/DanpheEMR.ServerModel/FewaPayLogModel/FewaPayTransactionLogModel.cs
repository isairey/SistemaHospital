using System;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace DanpheEMR.ServerModel.FewaPayLogModel
{
    /// <summary>
    /// FewaPayTransactionLogModel is to track the transactions done through FewaPay
    /// </summary>
    public class FewaPayTransactionLogModel
    {
        /// <summary>
        /// FewaPayTransactionLogId is the Primary key of FewaPayTransactionLogModel Entity
        /// </summary>
        [Key]
        public int FewaPayTransactionLogId { get; private set; }
        /// <summary>
        /// PatientId Refers to the Patient for which transaction is being done
        /// </summary>
        public int PatientId { get; private set; }
        /// <summary>
        /// ModuleName refers to the module from where transaction is being done
        /// </summary>
        public string ModuleName { get; private set; }
        /// <summary>
        /// TransactionId created by respective Payment Service Providers after successful payment
        /// </summary>
        public string TransactionId { get; private set; }
        /// <summary>
        /// TransactionType refers to the Payment Service Provider Identifier eg: FonePay, NepalPay
        /// </summary>
        public string TransactionType { get; private set; }
        /// <summary>
        /// TransactionAmount is the total Amount that is to be paid, This amount is in Paisa, Need to convert it to Rupees if needed
        /// </summary>
        public decimal TransactionAmount { get; private set; }
        /// <summary>
        /// This holds the status of the transaction whether the transaction is successful or failed
        /// </summary>
        public bool TransactionStatus { get; private set; }
        /// <summary>
        /// ResponseMessage message returned by POS Terminal Device regarding the transaction
        /// </summary>
        public string ResponseMessage { get; private set; }
        /// <summary>
        /// TransactionResponse holds the overall JSON response sent to Billing System
        /// </summary>
        public string TransactionResponse { get; private set; }
        /// <summary>
        /// TransactionDate refers to the Date when Transaction is done
        /// </summary>
        public DateTime? TransactionDate { get; private set; }
        /// <summary>
        /// TransactionTime holds the time when Transaction is done
        /// </summary>
        public TimeSpan? TransactionTime { get; private set; }
        /// <summary>
        /// CreatedBy refers to the Employee who has initiated the transaction process
        /// </summary>
        public int CreatedBy { get; private set; }
        /// <summary>
        /// CreatedOn referes to the date & time when transaction is being logged
        /// </summary>
        public DateTime CreatedOn { get; private set; }

        public FewaPayTransactionLogModel(
            int patientId, 
            string moduleName, 
            string transactionId, 
            string transactionType, 
            decimal transactionAmount, 
            bool transactionStatus, 
            string responseMessage,
            string transactionResponse,
            string transactionDate,
            string transactionTime,
            int createdBy
            )
        {
            this.PatientId = patientId;
            this.ModuleName = moduleName;
            this.TransactionId = transactionId;
            this.TransactionType = transactionType;
            this.TransactionAmount = transactionAmount;
            this.TransactionStatus = transactionStatus;
            this.ResponseMessage = responseMessage;
            this.TransactionResponse = transactionResponse;
            this.TransactionDate = DateTime.ParseExact(transactionDate, "dd/MM/yyyy", null);
            this.TransactionTime = TimeSpan.ParseExact(transactionTime, "hh\\:mm\\:ss", CultureInfo.InvariantCulture);
            this.CreatedBy = createdBy;
            this.CreatedOn = DateTime.Now;
        }
    }
}
