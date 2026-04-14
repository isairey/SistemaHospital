using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.Clinical_New.MedicalDiagnosis;
using DanpheEMR.Services.Clinical_New.MedicalDiagnosis.DTOs;
using DanpheEMR.Utilities;
using DocumentFormat.OpenXml.Office2010.ExcelAc;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Crypto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Clinical
{
    public class ClinicalDiagnosisController : CommonController
    {
        private readonly IMedicalDiagnosisService _medicalDiagnosisService;
        private readonly ILogger<ClinicalDiagnosisController> _logger;
        private readonly ClinicalDbContext _clinicalDbContext;

        public ClinicalDiagnosisController(IOptions<MyConfiguration> _config, IMedicalDiagnosisService medicalDiagnosisService, ILogger<ClinicalDiagnosisController> logger) : base(_config)
        {
            _medicalDiagnosisService = medicalDiagnosisService;
            _logger = logger;
            _clinicalDbContext = new ClinicalDbContext(connString);
        }

        [HttpGet]
        [Route("PatientMedicalDiagnosis")]
        public async Task<ActionResult> GetPatientMedicalDiagnosis(int patientId, int patientVisitId)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            try
            {
                var diagnosis = await _medicalDiagnosisService.GetPatientMedicalDiagnosis(patientId, patientVisitId, _clinicalDbContext);
                if (diagnosis == null) 
                {
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                    responseData.Results = null;
                    responseData.ErrorMessage = "";
                }
                responseData.Results = diagnosis;
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                return Ok(responseData);
            }
            catch(InvalidOperationException ex)
            {
                _logger.LogError($"Invalild Operation Exception caught while reading Medical Diagnosis, Exception Details: {ex.ToString()}");
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = null;
                responseData.ErrorMessage = $"Invalild Operation Exception caught while reading Medical Diagnosis, Exception Details: {ex.ToString()}";
                return BadRequest(responseData);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception caught while reading Medical Diagnosis, Exception Details: {ex.ToString()}");
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = null;
                responseData.ErrorMessage = $"Exception Caught while reading Medical Diagnosis, Exception Details: {ex.ToString()}";
                return BadRequest(responseData);
            }
        }

        [HttpPost]
        [Route("SavePatientDiagnosis")]
        public async Task<ActionResult> SavePatientDiagnosis([FromBody] List<PatientMedicalDiagnosisDto> patientMedicalDiagnoses)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();

            try
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var response = await _medicalDiagnosisService.SavePatientMedicalDiagnosis(patientMedicalDiagnoses,currentUser, _clinicalDbContext);
                responseData.Results = response;
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                return Ok(DanpheJSONConvert.DeserializeObject(DanpheJSONConvert.SerializeObject(responseData, true)));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError($"Invalild Operation Exception caught while saving Medical Diagnosis, Exception Details: {ex.ToString()}");
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = null;
                responseData.ErrorMessage = $"Invalild Operation Exception caught while saving Medical Diagnosis, Exception Details: {ex.ToString()}";
                return BadRequest(responseData);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception caught while saving Medical Diagnosis, Exception Details: {ex.ToString()}");
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = null;
                responseData.ErrorMessage = $"Exception Caught while saving Medical Diagnosis, Exception Details: {ex.ToString()}";
                return BadRequest(responseData);
            }
        }
    }
}
