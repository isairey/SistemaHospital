using DanpheEMR.Core.Configuration;
using DanpheEMR.Core;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.Insurance;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Net.Http;
using System.Data.Entity.Migrations.Model;
using static DanpheEMR.Services.Insurance.HIBApiResponses;
using System;
using System.Linq;
using System.Net.Http.Headers;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.Enums;
using Org.BouncyCastle.Asn1.Ocsp;
using System.Data;

namespace DanpheEMR.Controllers.Insurance
{
    public class HIBController : CommonController
    {
        private readonly InsuranceDbContext _govInsuranceDbContext;
        private readonly CoreDbContext _coreDbContext;
        private readonly IInsuranceService _IInsuranceService;
        public HIBController(IOptions<MyConfiguration> _config, IInsuranceService iInsuranceService) : base(_config)
        {
            _govInsuranceDbContext = new InsuranceDbContext(connString);
            _coreDbContext = new CoreDbContext(connString);
            _IInsuranceService = iInsuranceService;
        }

        #region API's to fetch data from Health Insurance Board(HIB) API

        [HttpGet]
        [Route("GetInsurancePatientDetailsAndEligibility")]
        public async Task<IActionResult> GetInsurancePatientData(string nSHINumber)
        {
            Func<Task<GetPatientDetailsAndEligibilityApiResponse>> func = () => _IInsuranceService.GetPatientDetails(nSHINumber, _coreDbContext, _govInsuranceDbContext);
            return await InvokeHttpGetFunctionAsync(func);

        }
        [HttpGet]
        [Route("CheckEligibility")]
        public async Task<IActionResult> CheckEligibility(string nSHINumber)
        {
            Func<Task<GetEligibilityApiResponse>> func = () => _IInsuranceService.CheckEligibility(nSHINumber, _coreDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }
        [HttpGet]
        [Route("GetNHSIPatientLocally")]
        public async Task<IActionResult> GetSSFPatientDetailLocally(int patientId, int schemeId)
        {
            Func<Task<PatientSchemeMapModel>> func = () => _IInsuranceService.GetNHSIPatientDetailLocally(_govInsuranceDbContext, patientId, schemeId);
            return await InvokeHttpGetFunctionAsync(func);
        }

        [HttpGet]
        [Route("ClaimableInvoicesDetailInfo")]
        public IActionResult GetClaimableInvoicesDetailInfo(string phrmInvoiceIds, string billingInvoiceIds)
        {

            Func<object> func = () => GetClaimableInvoiceData(phrmInvoiceIds, billingInvoiceIds);
            return InvokeHttpGetFunction<object>(func);
        }
        private object GetClaimableInvoiceData(string phrmInvoiceIds, string billingInvoiceIds)
        {
            DataSet claimableInvoicesDetailInfo = _IInsuranceService.GetClaimableInvoicesDetailInfo(phrmInvoiceIds, billingInvoiceIds, _govInsuranceDbContext);

            var invoiceInfos = new
            {
                BillingInvoices = claimableInvoicesDetailInfo.Tables[0],
                BillingInvoiceItems = claimableInvoicesDetailInfo.Tables[1],

                PharmacyInvoices = claimableInvoicesDetailInfo.Tables[2],
                PharmacyInvoiceItems = claimableInvoicesDetailInfo.Tables[3]
            };
            return invoiceInfos;
        }
        [HttpGet]
        [Route("CheckIfClaimSubmitted")]
        public IActionResult GetClaimableInvoicesDetailInfo(long claimCode)
        {

            Func<object> func = () => _IInsuranceService.CheckIfClaimSubmitted(claimCode, _govInsuranceDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("DoctorListWithNMCNo")]
        public IActionResult GetDoctorsWithNMCNo()
        {
            Func<object> func = () => _IInsuranceService.DoctorsListWithNMCNo(_govInsuranceDbContext);
            return InvokeHttpGetFunction<object>(func);

        }

        /// <summary>
        /// This methods fetch all the insurance capping information of a particular insuree.
        /// </summary>
        /// <param name="NSHINumber"></param>
        /// <returns>Returns capping validation information.</returns>
        [HttpGet]
        [Route("CappingInfo")]
        public async Task<IActionResult> GetCappingInfo(string NSHINumber)
        {
            Func<Task<object>> func = async () =>await _IInsuranceService.GetCappingResponseByCHFID(NSHINumber, _coreDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        #endregion
    }
}
