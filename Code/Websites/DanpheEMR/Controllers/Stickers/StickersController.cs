using DanpheEMR.CommonTypes;
using DanpheEMR.Controllers.Stickers.DTOs;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.CommonModels;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace DanpheEMR.Controllers
{
    [Route("api/[controller]")]
    public class StickersController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly BillingDbContext _billingDbContext;
        private readonly PatientDbContext _patientDbContext;
		DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
        public StickersController(IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _billingDbContext = new BillingDbContext(connString);
            _patientDbContext = new PatientDbContext(connString);
		}
        [HttpGet]
        [Route("GetPatientStickerDetails")]
        public string GetPatientStickerDetails(int PatientId)
        {
            DanpheHTTPResponse<PatientStickerModel> responseData = new DanpheHTTPResponse<PatientStickerModel>();
            try
            {
                PatientDbContext patDbContext = new PatientDbContext(connString);
                StickersBL stick = new StickersBL();
                var patientStickerDetails = stick.GetPatientStickerDetails(patDbContext, PatientId);

                if (patientStickerDetails != null && patientStickerDetails.Any())
                {
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                    responseData.Results = patientStickerDetails[0];
                }
            }
            catch (Exception ex)
            {
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.ErrorMessage = ex.Message;
            }
            return DanpheJSONConvert.SerializeObject(responseData);
        }

        [HttpGet]
        [Route("RegistrationStickerSettingsAndData")]
        public IActionResult RegistrationStickerSettingsAndData(int PatientVisitId)
        {
            Func<object> func = () => GetRegistrationStickerSettingsAndData(PatientVisitId);
            return InvokeHttpGetFunction(func);
        }
        private object GetRegistrationStickerSettingsAndData(int PatientVisitId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@PatientVisitId", PatientVisitId)
                    };

            DataSet dataset = DALFunctions.GetDatasetFromStoredProc("SP_VIS_GetVisitStickerSettingsAndData", paramList, _masterDbContext);
            DataTable stickersettings = dataset.Tables[0];
            DataTable stickerdata = dataset.Tables[1];
            StickerSettingsAndData_DTO settingsAndData_DTO = new StickerSettingsAndData_DTO();
            settingsAndData_DTO.StickerSettings = RegistrationStickerSettings_DTO.MapDataTableToSingleObject(stickersettings);
            settingsAndData_DTO.StickerData = VisitStickerData_DTO.MapDataTableToSingleObject(stickerdata);

            settingsAndData_DTO.StickerTemplates = GetAndFormatPrintData(settingsAndData_DTO.StickerSettings, settingsAndData_DTO.StickerData);
            return (settingsAndData_DTO);
        }


        [HttpGet]
        [Route("GetAllStickerPrintTemplates")]
        [Produces(typeof(DanpheHTTPResponse<List<PrintTemplateSettingsNewModel>>))]
        public IActionResult GetAllStickerPrintTemplates()
        {
            Func<object> func = () => GetStickerPrintTemplates();
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("SavePrintFormat")]
        public IActionResult SavePrintFormat([FromBody] AddPrintTemplate_DTO addPrintTemplate)
        {

            if (addPrintTemplate == null)
            {
                throw new ArgumentNullException($"{nameof(addPrintTemplate)} cannot be null");
            }
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddPrintTemplate(addPrintTemplate, currentUser);
            return InvokeHttpPostFunction(func);

        }


        [HttpPut]
        [Route("ActivateDeactivatePrintTemplate")]
        public IActionResult ActivateDeactivatePrintTemplate(int printTemplateId)
        {
            if (printTemplateId == 0)
            {
                throw new ArgumentNullException($"{nameof(printTemplateId)} is required");
            }
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => UpdateActiveStatusOfPrintTemplate(printTemplateId, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("UpdatePrintTemplate")]
        public IActionResult UpdatePrintTemplate([FromBody] UpdatePrintTemplateSettings_DTO printTemplateSettings)
        {
            if (printTemplateSettings is null)
            {
                throw new ArgumentNullException($"{nameof(printTemplateSettings)} cannot be null");
            }
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => UpdatePrintTemplateAndPrintFormat(printTemplateSettings, currentUser);
            return InvokeHttpPutFunction(func);
        }

        private object UpdatePrintTemplateAndPrintFormat(UpdatePrintTemplateSettings_DTO printTemplateSettings, RbacUser currentUser)
        {
            var printTemplate = _billingDbContext.PrintTemplateSettings.FirstOrDefault(p => p.PrintTemplateSettingsId == printTemplateSettings.PrintTemplateSettingsId);
            if (printTemplate is null)
            {
                throw new InvalidOperationException($"Cannot find the print template to update");
            }

            printTemplate.PrintTemplateMainFormat = printTemplateSettings.PrintTemplateMainFormat;
            printTemplate.ModifiedBy = currentUser.EmployeeId;
            printTemplate.ModifiedOn = DateTime.Now;
            _billingDbContext.Entry(printTemplate).State = EntityState.Modified;
            _billingDbContext.SaveChanges();
            return printTemplate.PrintTemplateSettingsId;

        }


        #region Below method is responsible to format the sticker print format
        private List<StickerTemplate> GetAndFormatPrintData(RegistrationStickerSettings_DTO stickerSettings, VisitStickerData_DTO stickerData)
        {
            var stickerTemplates = new List<StickerTemplate>();
            var printTemplates = _billingDbContext.PrintTemplateSettings.Where(p => p.FieldSettingsName == stickerData.FieldSettingsParamName
                                                                                    && p.VisitType == stickerData.VisitTypeFormatted
                                                                                    && p.PrintType == "reg-sticker"
                                                                                    && p.IsActive == true).ToList();
            if(printTemplates is null || printTemplates.Count == 0)
            {
                printTemplates = _billingDbContext.PrintTemplateSettings.Where(p => p.FieldSettingsName == "General"
                                                                                    && p.VisitType == stickerData.VisitTypeFormatted
                                                                                    && p.PrintType == "reg-sticker"
                                                                                    && p.IsActive == true).ToList();
            }
            if (printTemplates != null && printTemplates.Count > 0)
            {
                for (int i = 0; i < printTemplates.Count; i++)
                {
                    var printTemplate = printTemplates[i];
                    if (printTemplate != null)
                    {
                        StringBuilder stringBuilder = new StringBuilder(printTemplate.PrintTemplateMainFormat);

          
                        stringBuilder.Replace("{PatientId}", stickerData.PatientId.ToString());
                        stringBuilder.Replace("{PatientVisitId}", stickerData.PatientVisitId.ToString());
                        stringBuilder.Replace("{PatientCode}", stickerData.HospitalNumber);
                        stringBuilder.Replace("{PatientSalutation}", stickerData.PatientSalutation);
                        stringBuilder.Replace("{PatientFname}", stickerData.PatientFname);
                        stringBuilder.Replace("{PatientMname}", stickerData.PatientMName);
                        stringBuilder.Replace("{PatientLname}", stickerData.PatientLname);
                        stringBuilder.Replace("{PatientName}", stickerData.PatientName);
                        stringBuilder.Replace("{PhoneNumber}", stickerData.PatientPhoneNumber);
                        stringBuilder.Replace("{BloodGroup}", stickerData.BloodGroup);
                        stringBuilder.Replace("{IdCardNumber}", stickerData.IdCardNumber);
                        stringBuilder.Replace("{Posting}", stickerData.Posting);
                        stringBuilder.Replace("{PatientDesignation}", stickerData.PatientDesignation);
                        stringBuilder.Replace("{Gender}", stickerData.Gender);
                        stringBuilder.Replace("{Age}", stickerData.Age);
                        stringBuilder.Replace("{Dob}", stickerData.DateOfBirth);
                        stringBuilder.Replace("{CountrySubDivisionName}", stickerData.CountrySubDivisionName);
                        stringBuilder.Replace("{MunicipalityName}", stickerData.MunicipalityName);
                        stringBuilder.Replace("{WardNumber}", stickerData.WardNumber);
                        stringBuilder.Replace("{PatientFullAddress}", stickerData.PatientAddress);
                        stringBuilder.Replace("{Country}", stickerData.CountryName);
                        stringBuilder.Replace("{VisitCode}", stickerData.VisitCode);
                        stringBuilder.Replace("{DoctorName}", stickerData.PerformerName);
                        stringBuilder.Replace("{DepartmentName}", stickerData.DepartmentName);
                        stringBuilder.Replace("{VisitTypeFormatted}", stickerData.VisitTypeFormatted);
                        stringBuilder.Replace("{AppointmentType}", stickerData.AppointmentType);
                        stringBuilder.Replace("{ClaimCode}", stickerData.ClaimCode.ToString());
                        stringBuilder.Replace("{QueueNo}", stickerData.QueueNo.ToString());
                        stringBuilder.Replace("{SchemeName}", stickerData.SchemeCode);
                        stringBuilder.Replace("{RoomNo}", stickerData.RoomNo);
                        stringBuilder.Replace("{VisitDate}", DateTime.Parse(stickerData.VisitDate).ToString("MM/dd/yyyy"));
                        var nepaliDate = DanpheDateConvertor.ConvertEngToNepDate(DateTime.Parse(DateTime.Parse(stickerData.VisitDate).ToString("MM/dd/yyyy")));
                        string visitDateInNepali = nepaliDate != null ? $"{nepaliDate.Year}-{nepaliDate.Month}-{nepaliDate.Day} BS" : "";
                        stringBuilder.Replace("{VisitDateInBS}", visitDateInNepali);
                        stringBuilder.Replace("{VisitTime}", DateTime.Parse(stickerData.VisitTime).ToString("hh:mm tt"));
                        stringBuilder.Replace("{VisitDateTime}", DateTime.Parse(stickerData.VisitDateTime).ToString("MM/dd/yyyy h:mm tt"));
                        stringBuilder.Replace("{PolicyNo}", stickerData.MemberNo);
                        stringBuilder.Replace("{RegCharge}", stickerData.TicketCharge.ToString());
                        stringBuilder.Replace("{Username}", stickerData.UserName);
                        stringBuilder.Replace("{BedNumber}", stickerData.BedNumber);
                        stringBuilder.Replace("{WardName}", stickerData.WardName);
                        stringBuilder.Replace("{MaritalStatus}", stickerData.MaritalStatus);
                        stringBuilder.Replace("{EthnicGroup}", stickerData.EthnicGroup);
                        stringBuilder.Replace("{CertificationNo}", stickerData.CertificationNo);


                        stickerTemplates.Add(new StickerTemplate()
                        {
                            PrinterType = printTemplate.PrinterType,
                            PrintFormat = stringBuilder.ToString()
                        });

                    }
                }
                return stickerTemplates;
            }
            return new List<StickerTemplate>();
        }
        #endregion

        private object AddPrintTemplate(AddPrintTemplate_DTO addPrintTemplate, RbacUser currentUser)
        {
            var printTemplate = new PrintTemplateSettingsNewModel()
            {
                PrintType = addPrintTemplate.PrintType,
                VisitType = addPrintTemplate.VisitType,
                FieldSettingsName = addPrintTemplate.FieldSettingsName,
                PrinterType = addPrintTemplate.PrinterType,
                PrintTemplateMainFormat = addPrintTemplate.PrintTemplateMainFormat,
                IsActive = true,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = DateTime.Now
            };
            _billingDbContext.PrintTemplateSettings.Add(printTemplate);
            _billingDbContext.SaveChanges();

            return printTemplate.PrintTemplateSettingsId;
        }

        private object GetStickerPrintTemplates()
        {
            var printTemplates = _billingDbContext.PrintTemplateSettings.OrderBy(p => p.FieldSettingsName).ToList();
            return printTemplates;
        }

        private object UpdateActiveStatusOfPrintTemplate(int printTemplateId, RbacUser currentUser)
        {
            var printTemplate = _billingDbContext.PrintTemplateSettings.FirstOrDefault(p => p.PrintTemplateSettingsId == printTemplateId);
            if (printTemplate is null)
            {
                throw new InvalidOperationException($"Cannot find the PrintTemplate");
            }

            printTemplate.IsActive = !printTemplate.IsActive;
            printTemplate.ModifiedBy = currentUser.EmployeeId;
            printTemplate.ModifiedOn = DateTime.Now;
            _billingDbContext.Entry(printTemplate).State = EntityState.Modified;
            _billingDbContext.SaveChanges();
            return printTemplate.IsActive;
        }



		[HttpGet]
		[Route("GetPatientVisitDetails")]
		public IActionResult GetPatientVisitDetails(int PatientId)
		{
			
			Func<object> func = () => GetPatientVisitDetails(_patientDbContext, PatientId);
			return InvokeHttpGetFunction(func);
		}

        private object GetPatientVisitDetails(PatientDbContext patDbContext, int PatientId)
        {
			var visit = patDbContext.Visits
									.Where(v => v.PatientId == PatientId)
									.OrderByDescending(v => v.VisitDate)
									.FirstOrDefault();

			if (visit == null)
			{
				return null; // No visits found for this PatientId
			}

			var result = (from department in patDbContext.Department
						  where department.DepartmentId == visit.DepartmentId
						  select new
						  {
							  visit.PatientId,
							  visit.PatientVisitId,
							  visit.VisitType,
							  department.DepartmentCode
						  }).FirstOrDefault();

			return result;
		}

	}



}
