using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.Insurance;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;
using System;
using DanpheEMR.Services.Insurance.DTOs;
using static DanpheEMR.Services.Insurance.DTOs.ClaimUploadFileRequest_DTO;
using Serilog;

namespace DanpheEMR.Controllers.Insurance
{
    public class InsuranceClaimDocumentController : CommonController
    {
        private readonly IHIBClaimDocService _hibClaimDocService;
        private readonly InsuranceDbContext _insuranceDbContext;

        public InsuranceClaimDocumentController(IOptions<MyConfiguration> _config, IHIBClaimDocService hIBClaimDocService) : base(_config)
        {
            _hibClaimDocService = hIBClaimDocService;
            _insuranceDbContext = new InsuranceDbContext(connString);
        }
        [HttpPost]
        [Route("UploadSingleFile")]
        public async Task<string> UploadSingleFile([FromBody] ClaimUploadSingleFileRequest_DTO claimUploadSingleFile)
        {
            DanpheHTTPResponse<ClaimUploadFileResponse_DTO> responseData = new DanpheHTTPResponse<ClaimUploadFileResponse_DTO>();
            try
            {
                if (claimUploadSingleFile == null)
                {
                    throw new ArgumentNullException($"{nameof(claimUploadSingleFile)} is needed to check User!");
                }

                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");

                ClaimUploadFileResponse_DTO result = await _hibClaimDocService.UploadSingleFile(claimUploadSingleFile, currentUser, _insuranceDbContext);
                responseData.Results = result;
                if (result.status == ENUM_HIBClaimDocResponseStatus.success)
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.OK;
                }
                else
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message);
                responseData.ErrorMessage = ex.Message;
                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);
        }

        [HttpPost]
        [Route("UploadMultipleFile")]
        public async Task<string> UploadMultipleFile([FromBody] ClaimUploadMultipleFileRequest_DTO claimUploadMultipleFile)
        {
            DanpheHTTPResponse<ClaimUploadFileResponse_DTO> responseData = new DanpheHTTPResponse<ClaimUploadFileResponse_DTO>();
            try
            {
                if (claimUploadMultipleFile == null)
                {
                    Log.Error($"{nameof(claimUploadMultipleFile)} is needed to check User!");
                    throw new ArgumentNullException($"{nameof(claimUploadMultipleFile)} is needed to check User!");
                }

                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                ClaimUploadFileResponse_DTO result = await _hibClaimDocService.UploadMultipleFile(claimUploadMultipleFile, currentUser, _insuranceDbContext);
                responseData.Results = result;
                if (result.status == ENUM_HIBClaimDocResponseStatus.success)
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.OK;
                }
                else
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message);
                responseData.ErrorMessage = ex.Message;
                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);
        }

    }
}
