using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.Services.OnlinePayment.DTO.FonePay;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace DanpheEMR.Services.OnlinePayment.FonePay
{
    public interface IFonePayService
    {
        //Task<dynamic> GenerateQR(FonepayDynamicQrRequest_DTO fonepayDynamicQrRequest, dynamic invoiceObj, dynamic dbContext, RbacUser currentUser, string connString, bool realTimeRemoteSyncEnabled, bool RealTimeSSFClaimBooking, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor);
        Task<dynamic> GenerateQR(FonePayTransactionEssentials_DTO fonePayTransaction, dynamic dbContext, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor);
        Task<dynamic> GetStatus(string prn, string dataValidation);
    }
}
