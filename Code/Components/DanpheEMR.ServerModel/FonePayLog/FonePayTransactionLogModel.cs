using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.FonePayLog
{
    public class FonePayTransactionLogModel
    {
        [Key]
        public int FonePayTransactionId { get; set; }
        public string LogFor { get; set; }
        public int PatientId { get; private set; }
        public string TransactionFrom { get; private set; }
        public decimal TransactionAmount { get; private set; }
        public int? FonePayTraceId { get; private set; }
        public bool TransactionStatus { get; private set; }
        public string ResponseMessage { get; private set; }
        public int CreatedBy { get; private set; }
        public DateTime CreatedOn { get; private set; }

        public FonePayTransactionLogModel(string logFor, int patientId, string transactionFrom, decimal tranasctionAmount, int? fonePayTranceId, bool transctionStatus, string responseMessage, int createdBy)
        {
            if(CheckForDataValidation(logFor, patientId, transactionFrom, tranasctionAmount, fonePayTranceId, transctionStatus, createdBy))
            {
                this.LogFor = logFor;
                this.PatientId = patientId;
                this.TransactionFrom = transactionFrom;
                this.TransactionAmount = tranasctionAmount;
                this.FonePayTraceId = fonePayTranceId;
                this.TransactionStatus = transctionStatus;
                this.ResponseMessage = responseMessage;
                this.CreatedBy = createdBy;
                this.CreatedOn = DateTime.Now;
            }           
        }

        private bool CheckForDataValidation(string logfor, int patientId, string transactionFrom, decimal tranasctionAmount, int? fonePayTranceId, bool transctionStatus, int createdBy)
        {
            bool isValid = false;
            if(String.IsNullOrEmpty(logfor) || patientId == 0 || String.IsNullOrEmpty(transactionFrom) || tranasctionAmount <= 0 || createdBy == 0)
            {
                isValid = false;
            }
            else
            {
                isValid = true;
            }
            return isValid;
        }
    }
}
