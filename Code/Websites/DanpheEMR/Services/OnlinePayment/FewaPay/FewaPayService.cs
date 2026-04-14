using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.FewaPayLogModel;
using DanpheEMR.Services.OnlinePayment.DTO.FewaPay;
using Serilog;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Services.OnlinePayment.FewaPay
{
    /// <summary>
    /// FewaPayService is only responsible to handle FewaPay related actions, No Other implementations are allowed in this service class
    /// </summary>
    public class FewaPayService : IFewaPayService
    {
        /// <summary>
        /// It is responsible to Save the transaction logs of FewaPay transactions.
        /// </summary>
        /// <param name="fewaPayTransactionLog">Is is the transaction log payload sent from the client.</param>
        /// <param name="fewaPayLogDbContext">It is the DB Context needed to access the database.</param>
        /// <param name="currentUser">It is the current logged in User.</param>
        /// <returns>It returns a boolean value that represents either log is successfully saved or not.</returns>
        public async Task<bool> SaveFewaPayTransactionLog(FewaPayTransactionLogDTO fewaPayTransactionLog, FewaPayLogDbContext fewaPayLogDbContext, RbacUser currentUser)
        {
            var isSuccessfullySaved = false;
            try
            {
                if(fewaPayTransactionLog is null)
                {
                    throw new InvalidOperationException($"{nameof(fewaPayTransactionLog)} cannot be null to log transactions!");
                }

                var fewaPayTransaction = new FewaPayTransactionLogModel(
                    fewaPayTransactionLog.PatientId,
                    fewaPayTransactionLog.ModuleName,
                    fewaPayTransactionLog.TransactionId,
                    fewaPayTransactionLog.TransactionType,
                    fewaPayTransactionLog.TransactionAmount,
                    fewaPayTransactionLog.TransactionStatus,
                    fewaPayTransactionLog.ResponseMessage,
                    fewaPayTransactionLog.TransactionResponse,
                    fewaPayTransactionLog.TransactionDate,
                    fewaPayTransactionLog.TransactionTime,
                    currentUser.EmployeeId
                    );

                fewaPayLogDbContext.FewaPayTransactionLogs.Add(fewaPayTransaction);
                await fewaPayLogDbContext.SaveChangesAsync();
                isSuccessfullySaved = true;
            }
            catch (InvalidOperationException ex)
            {
                Log.ForContext("UserId", currentUser.EmployeeId).Error($"Transaction log cannot be saved as the log details is null, with exception details, {ex.Message}");
            }
            catch (Exception ex)
            {
                Log.ForContext("UserId", currentUser.EmployeeId).Error($"Transaction log cannot be saved with exception details, {ex.Message}");
            }
            return isSuccessfullySaved;
        }
    }
}
