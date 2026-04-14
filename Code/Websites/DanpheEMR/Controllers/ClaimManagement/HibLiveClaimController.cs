using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.ClaimManagement;
using DanpheEMR.Services.ClaimManagement.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.ClaimManagement
{
    public class HibLiveClaimController : CommonController
    {
        private readonly IHibLiveClaimService _hibLiveClaimService;
        private readonly ClaimManagementDbContext _claimManagementgDbContext;
        private readonly BillingDbContext _billingDbContext;
        private readonly PharmacyDbContext _phamacyDbContext;
        private readonly InsuranceDbContext _insuranceDbContext;
        private readonly ILogger<HibLiveClaimController> _logger;

        public HibLiveClaimController(IOptions<MyConfiguration> _config, IHibLiveClaimService hibLiveClaimService, ILogger<HibLiveClaimController> logger) : base(_config)
        {
            _hibLiveClaimService = hibLiveClaimService;
            _claimManagementgDbContext = new ClaimManagementDbContext(connString);
            _billingDbContext = new BillingDbContext(connString);
            _phamacyDbContext = new PharmacyDbContext(connString);
            _insuranceDbContext = new InsuranceDbContext(connString);
            _logger = logger;
        }

        [HttpPost]
        [Route("SubmitHibLiveClaim")]
        public async Task<ActionResult> SubmitHibLiveClaim([FromBody] HibLiveClaimDTO hibLiveClaim)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            try
            {
                if (hibLiveClaim is null)
                {
                    Log.Error($"{nameof(HibLiveClaimDTO)} cannot be null to submit live claim");
                    throw new ArgumentNullException($"{nameof(HibLiveClaimDTO)} cannot be null to submit live claim");
                }

                _logger.LogInformation($"Live Claim is initiated for invoice: {hibLiveClaim.InvoiceId} of {hibLiveClaim.ModuleName} module at {DateTime.Now}");
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var result = await _hibLiveClaimService.SubmitHibLiveClaim(currentUser, hibLiveClaim, _claimManagementgDbContext, _insuranceDbContext, _billingDbContext, _phamacyDbContext);
                if(result != null && result.Status == true)
                {
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                    responseData.Results = result.Message;
                }
                else
                {
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                    responseData.Results = result;
                    responseData.ErrorMessage = result.Message;
                }
                return Ok(DanpheJSONConvert.DeserializeObject(DanpheJSONConvert.SerializeObject(responseData, true)));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Could not submit HIB Live Claim, Exception Details: {ex.Message}");

                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = null;
                responseData.ErrorMessage = $"Could not submit HIB Live Claim, Exception Details: {ex.Message}";
                return BadRequest(responseData);
            }
        }
    }
}
