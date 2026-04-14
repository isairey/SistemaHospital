using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.OnlinePayment.DTO.FewaPay;
using DanpheEMR.Services.OnlinePayment.FewaPay;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.OnlinePayment
{
    /// <summary>
    /// FewaPayController contains the end points needed to handle FewaPay transactions
    /// </summary>
    public class FewaPayController : CommonController
    {
        private readonly FewaPayLogDbContext _fewaPayLogDbContext;
        private readonly IFewaPayService _fewaPayService;

        public FewaPayController(IOptions<MyConfiguration> _config, IFewaPayService fewaPayService) : base(_config)
        {
            _fewaPayLogDbContext = new FewaPayLogDbContext(connString);
            _fewaPayService = fewaPayService;
        }

        /// <summary>
        /// This endpoint is responsible to persist the transaction logs in our database either payment transaction is successful or failed, To do so it takes Transaction Details
        /// </summary>
        /// <param name="fewaPayTransactionLog">It is a payload that is to be sent from the client.</param>
        /// <returns>It returns DanpheHttpResponse<bool> that represents either FewaPay transaction Log is saved or not</returns>
        [HttpPost]
        [Route("SaveLogs")]
        [ProducesResponseType(typeof(DanpheHTTPResponse<bool>), StatusCodes.Status200OK)]
        public async Task<IActionResult> SaveFewaPayTransactionLogs([FromBody] FewaPayTransactionLogDTO fewaPayTransactionLog)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<Task<bool>> func = async() => await _fewaPayService.SaveFewaPayTransactionLog(fewaPayTransactionLog, _fewaPayLogDbContext, currentUser);
            return await InvokeHttpPostFunctionAsync_New(func);
        }
    }
}
