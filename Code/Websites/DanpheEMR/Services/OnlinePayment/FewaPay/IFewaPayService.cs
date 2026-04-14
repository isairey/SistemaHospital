using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.OnlinePayment.DTO.FewaPay;
using System.Threading.Tasks;

namespace DanpheEMR.Services.OnlinePayment.FewaPay
{
    public interface IFewaPayService
    {
        /// <summary>
        /// It is responsible to Save the transaction logs of FewaPay transactions.
        /// </summary>
        /// <param name="fewaPayTransactionLog">It is the transaction log payload sent from the client.</param>
        /// <param name="fewaPayLogDbContext">It is the Instance of DB Context to access database.</param>
        /// <param name="currentUser">It is current logged in user.</param>
        /// <returns>It returns the boolean value either log is saved or not.</returns>
        Task<bool> SaveFewaPayTransactionLog(FewaPayTransactionLogDTO fewaPayTransactionLog, FewaPayLogDbContext fewaPayLogDbContext, RbacUser currentUser);
    }
}
