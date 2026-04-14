using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.Utilities;
using DanpheEMR.Services.Utilities.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Utilities
{
    public class UtilitiesController : CommonController
    {
        private readonly IUtilitiesService _IUtilitiesService;
        private readonly UtilitiesDbContext _UtilitiesDbContext;
        public UtilitiesController(IUtilitiesService iUtilitiesService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _IUtilitiesService = iUtilitiesService;
            _UtilitiesDbContext = new UtilitiesDbContext(connString);
        }

        [HttpGet]
        [Route("SchemeRefund")]
        public IActionResult GetSchemeRefund(DateTime fromDate, DateTime toDate)
        {
            Func<object> func = () => _IUtilitiesService.GetSchemeRefundTransaction(_UtilitiesDbContext, fromDate, toDate);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("SchemeRefundById")]
        public IActionResult GetSchemeRefundById(int receiptNo)
        {
            Func<object> func = () => _IUtilitiesService.GetSchemeRefundById(_UtilitiesDbContext, receiptNo);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("PatientSchemeRefunds")]
        public IActionResult GetPatientSchemeRefunds(int patientId)
        {
            Func<object> func = () => _IUtilitiesService.GetPatientSchemeRefunds(_UtilitiesDbContext, patientId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("OrganizationDepositBalance")]
        public IActionResult GetOrganizationDepositBalance(int OrganizationId)
        {
            Func<object> func = () => _IUtilitiesService.GetOrganizationDepositBalance(_UtilitiesDbContext, OrganizationId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("OrganizationDepositDetailById")]
        public IActionResult GetOrganizationDepositDetails(int DepositId)
        {
            Func<object> func = () => _IUtilitiesService.GetOrganizationDepositDetails(_UtilitiesDbContext, DepositId);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("SchemeRefund")]
        public IActionResult SaveSchemeRefund([FromBody] SchemeRefund_DTO schemeRefund)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IUtilitiesService.SaveSchemeRefundTransaction(currentUser, schemeRefund, _UtilitiesDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ChangeVisitScheme")]
        public IActionResult SaveChangedVisitScheme([FromBody] VisitSchemeChangeHistory_DTO visitSchemeChangeHistory_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IUtilitiesService.SaveVisitSchemeChange(currentUser, visitSchemeChangeHistory_DTO, _UtilitiesDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("OrganizationDeposit")]
        public ActionResult OrganizationDeposit([FromBody] OrganizationDeposit_DTO organizationDeposit_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IUtilitiesService.SaveOrganizationDeposit(currentUser, organizationDeposit_DTO, _UtilitiesDbContext);
            return InvokeHttpPostFunction<object>(func);

        }

        /// <summary>
        /// API endpoint to change the policy number for a given patient and scheme.
        /// </summary>
        /// <param name="changePolicyNumber">The DTO containing the patient ID, scheme ID, and the new policy number to be set.</param>
        /// <returns>An ActionResult representing the result of the operation.</returns>
        /// <response code="200">Returns when the policy number is successfully changed.</response>
        /// <response code="400">Returns when input validation fails.</response>
        /// <response code="404">Returns when the patient scheme mapping is not found.</response>
        /// <response code="401">Returns when there is no active session for the current user.</response>
        /// <response code="500">Returns when an unexpected error occurs during the operation.</response>
        [HttpPost]
        [Route("ChangePolicyNumber")]
        public async Task<ActionResult> ChangePolicyNumber([FromBody] ChangePolicyNumberDTO changePolicyNumber)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            if(currentUser is null)
            {
                Log.Error($"There is no session active for the current User when trying to access Change Policy Number feature");
                throw new UnauthorizedAccessException("Unauthoized Access!");
            }
            if (changePolicyNumber is null) 
            {
                Log.Error($"{nameof(changePolicyNumber)} is required to change the policy nuumber!");
                throw new InvalidOperationException($"{nameof(changePolicyNumber)} is required to change the policy nuumber!");
            }
            Func<Task<object>> func = async () => await _IUtilitiesService.ChangePolicyNumber(currentUser, changePolicyNumber, _UtilitiesDbContext);
            return await InvokeHttpPostFunctionAsync_New(func);
        }
    }
}
