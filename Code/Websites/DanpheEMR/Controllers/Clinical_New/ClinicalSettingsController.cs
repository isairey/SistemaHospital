using DanpheEMR.CommonTypes;
using DanpheEMR.Controllers.Clinical_New.DTO;
using DanpheEMR.Controllers.Settings.DTO;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.Services.Clinical_New;
using DanpheEMR.Services.Clinical_New.DTOs;
using DanpheEMR.Services.NewClinical;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Clinical_New
{
   
    public class ClinicalSettingsController : CommonController
    {

        private readonly MasterDbContext _masterDbContext;
        private readonly ClinicalSettingDbContext _clinicalSettingDbContext;
        private readonly IClinicalSettingService _IClinicalSettingService;
        private readonly ClinicalDbContext _clinicalDbContext;

        public ClinicalSettingsController(IClinicalSettingService iClinicalSettingService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _IClinicalSettingService = iClinicalSettingService;
            _clinicalSettingDbContext = new ClinicalSettingDbContext(connString);
            _clinicalDbContext = new ClinicalDbContext(connString);
        }

        [HttpGet]
        [Route("ClinicalFieldsOption")]

        public IActionResult GetClinicalFieldOption()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalFieldOption(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("ClinicalSharedPhrases")]
        public IActionResult GetClinicalSharedPhrases()
        {
         
            Func<object> func = () => _IClinicalSettingService.GetClinicalSharedPhrases(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ClinicalPhrases")]
        public IActionResult GetClinicalPhrases()
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.GetClinicalPhrases(currentUser, _clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("ClinicalPhrases")]
        public IActionResult ClinicalPhrases([FromBody] ClinicalPhrases_DTO clinicalPhrases_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalPhrases(currentUser, clinicalPhrases_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ClinicalPhrasesActivation")]
        public IActionResult ActivateDeactivateClinicalPhrases(int PredefinedTemplateId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalPhrases(currentUser, PredefinedTemplateId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ClinicalPhrases")]

        public IActionResult UpdateClinicalPhrases([FromBody] ClinicalPhrases_DTO clinicalPhrases_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalPhrases(currentUser, clinicalPhrases_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);

        }

        [HttpGet]
        [Route("ClinicalTemplates")]
        public IActionResult GetClinicalTemplates()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalTemplates(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("ClinicalTemplate")]
        public IActionResult ClinicalTemplates([FromBody] ClinicalTemplates_DTO clinicalTemplates_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalTemplate(currentUser, clinicalTemplates_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ClinicalTemplate")]

        public IActionResult UpdateClinicalTemplate([FromBody] ClinicalTemplates_DTO clinicalTemplates_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalTemplate(currentUser, clinicalTemplates_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);

        }

        [HttpPut]
        [Route("ClinicalTemplateActivation")]
        public IActionResult ActivateDeactivateClinicalTemplate(int templateId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalTemplate(currentUser, templateId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpGet]
        [Route("ChiefComplains")]
        public IActionResult GetChiefComplains()
        {
            Func<object> func = () => _IClinicalSettingService.GetChiefComplains(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
       
        [HttpPut]
        [Route("ChiefComplainsActivation")]
        public IActionResult ActivateDeactivateChiefComplain(int chiefComplainId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateChiefComplain(currentUser, chiefComplainId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpGet]
        [Route("ClinicalHeading")]
        public IActionResult GetClinicalHeading()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalHeading(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ClinicalParentHeadingField")]

        public IActionResult GetClinicalParentHeading()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalParentHeading(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        } 
        
        [HttpGet]
        [Route("ClinicalHeadingField")]

        public IActionResult GetClinicalHeadingFields()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalHeadingFields(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPut]
        [Route("ClinicalFieldQuestionaryActivation")]
        public IActionResult ActivateDeactivateClinicalFieldQuestionary(int questionId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalFieldQuestionary(currentUser, questionId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ClinicalFieldQuestionaryOptionActivation")]
        public IActionResult ActivateDeactivateClinicalFieldQuestionaryOption(int questionOptionId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalFieldQuestionaryOption(currentUser, questionOptionId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }


        [HttpGet]
        [Route("ClinicalHeadingFieldSetup")]

        public IActionResult GetClinicalHeadingFieldSetup()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalHeadingFieldSetup(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("IntakeOutputTypeForGrid")]
        public IActionResult GetIntakeOutputTypeForGrid()
        {
            Func<object> func = () => _IClinicalSettingService.GetIntakeOutputTypeForGrid(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("IntakeOutputType")]
        public IActionResult GetIntakeOutputType()
        {
            Func<object> func = () => _IClinicalSettingService.GetIntakeOutputType(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("IntakeTiming")]
        public IActionResult GetIntakeTiming()
        {
            Func<object> func = () => _IClinicalSettingService.GetIntakeTiming( _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        #region This handles Update section.

        [HttpPut]
        [Route("UpdateIntakeTime")]
        public IActionResult UpdateIntakeTime([FromBody] MedicationIntakeModel clinicalIntakeTime)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateIntakeTime(currentUser, clinicalIntakeTime, _clinicalDbContext);
            return InvokeHttpPutFunction(func);

          
        }
        [HttpPut]
        [Route("ChiefComplainsUpdate")]

        public IActionResult UpdateChiefComplains([FromBody] ChiefComplains_DTO chiefComplainsDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateChiefComplains(currentUser, chiefComplainsDTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);


        }

        [HttpPut]
        [Route("ClinicalFieldOptionUpdate")]

        public IActionResult UpdateClinicalFieldOption([FromBody] ClinicalFieldOption_DTO clinicalFieldOption_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalFieldOption(currentUser, clinicalFieldOption_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ClinicalHeadingActivation")]
        public IActionResult ActivateDeactivateClinicalHeading(int clinicalHeadingId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalHeading(currentUser, clinicalHeadingId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("activate-deactivate-intakeoutput-variables")]
        public IActionResult ActivateDeactivateIntakeOutputVariable(int selectedIntakeOutputDataId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateIntakeOutputVariable(currentUser, selectedIntakeOutputDataId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("activate-deactivate-intaketiming")]
        public IActionResult ActivateDeactivateIntakeTime(int selectedIntakeTimingId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateIntakeTime(currentUser, selectedIntakeTimingId, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPost]
        [Route("ClinicalHeading")]
        public IActionResult ClinicalHeading([FromBody] ClinicalHeading_DTO clinicalHeading_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalHeading(currentUser, clinicalHeading_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ClinicalHeadingUpdate")]

        public IActionResult UpdateClinicalHeading([FromBody] ClinicalHeading_DTO clinicalHeading_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalHeading(currentUser, clinicalHeading_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("ClinicalHeadingFieldActivation")]
        public IActionResult ActivateDeactivateHeadingField(int fieldId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateHeadingField(currentUser, fieldId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("UpdateIntakeOutputVariable")]
        public IActionResult UpdateIntakeOutputVariable([FromBody] ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateIntakeOutputVariable(currentUser, clinicalIntakeOutputParameterModel, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);

            /* RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
             ClinicalIntakeOutputParameterModel existingData = _clinicalDbContext.ClinicalIntakeOutputParameters.FirstOrDefault(x => x.IntakeOutputId == clinicalIntakeOutputParameterModel.IntakeOutputId);
             if (existingData != null)
             {
                 existingData.ParameterType = clinicalIntakeOutputParameterModel.ParameterType;
                 existingData.ParameterValue = clinicalIntakeOutputParameterModel.ParameterValue;
                 existingData.ParameterMainId = clinicalIntakeOutputParameterModel.ParameterMainId;
                 existingData.ModifiedBy = currentUser.EmployeeId;
                 existingData.ModifiedOn = DateTime.Now;
                 _clinicalDbContext.SaveChanges();
                 Func<object> func = () => existingData;
                 return InvokeHttpPostFunction(func);
             }
             else
             {
                 throw new Exception("Null Value is not Allowed");
             }*/
        }

        #endregion

        [HttpGet]
        [Route("ClinicalFieldsQuestionary")]

        public IActionResult GetClinicalFieldsQuestionary()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalFieldsQuestionary(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ClinicalFieldsQuestionaryOption")]

        public IActionResult GetClinicalFieldsQuestionaryOption()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalFieldsQuestionaryOption(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("ClinicalFieldOption")]
        public IActionResult ClinicalFieldOption([FromBody] ClinicalFieldOption_DTO clinicalFieldOption_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalFieldOption(currentUser, clinicalFieldOption_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpGet]
        [Route("ClinicalNote")]
        public IActionResult GetClinicalNote()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalNote(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("LabItems")]
        public IActionResult GetLabItems(int PatientId, int PatientVisitId,bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _IClinicalSettingService.GetLabItems(_clinicalSettingDbContext, PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("RequestedItems")]
        public IActionResult GetRequestedItems(int PatientId, int PatientVisitId,bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _IClinicalSettingService.GetRequestedItems(_clinicalSettingDbContext, PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("ClinicalNoteAndAssessmentPlan")]
        public IActionResult GetClinicalNoteAndAssessmentPlan(int PatientId, int PatientVisitId)
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalNoteAndAssessmentPlan(_clinicalSettingDbContext, PatientId, PatientVisitId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("RequestedImagingItems")]
        public IActionResult GetRequestedImagingItems(int PatientId, int PatientVisitId)
        {
            Func<object> func = () => _IClinicalSettingService.GetRequestedImagingItems(_clinicalSettingDbContext, PatientId, PatientVisitId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("RequestedMedicationItems")]
        public IActionResult GetRequestedMedicationItems(int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _IClinicalSettingService.GetRequestedMedicationItems(_clinicalSettingDbContext, PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("ClinicalNote")]
        public IActionResult ClinicalNote([FromBody] ClinicalNote_DTO clinicalNotedto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalNote(currentUser, clinicalNotedto, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ChiefComplain")]
        public IActionResult ChiefComplains([FromBody] ChiefComplains_DTO chiefComplainsDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostChiefComplains(currentUser, chiefComplainsDTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        //[HttpPost]
        //[Route("OrderMedicine")].
        //public IActionResult OrderMedicine([FromBody] Medication_DTO medication_DTO)
        //{
        //    RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
        //    Func<object> func = () => _IClinicalSettingService.OrderMedicine(currentUser, medication_DTO, _clinicalSettingDbContext);
        //    return InvokeHttpPostFunction(func);
        //}



        [HttpPost]
        [Route("ClinicalAssessmentAndPlan")]
        public IActionResult ClinicalAssessmentAndPlan([FromBody] List<ClinicalAssessmentAndPlan_DTO> clinicalAssessmentAndPlan_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ClinicalAssessmentAndPlan(currentUser, clinicalAssessmentAndPlan_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ClinicalHeadingFieldSetup")]
        public IActionResult ClinicalHeadingFieldSetup([FromBody] PostClinicalHeadingFieldSetup_DTO clinicalHeadingFieldSetup_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalHeadingFieldSetup(currentUser, clinicalHeadingFieldSetup_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("ClinicalFieldQuestionary")]
        public IActionResult ClinicalFieldQuestionary([FromBody] ClinicalHeadingFieldsQuestionary_DTO clinicalHeadingFieldsQuestionary_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostClinicalFieldQuestionary(currentUser, clinicalHeadingFieldsQuestionary_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
            return Ok();
        }

      

        [HttpPost]
        [Route("Medication")]
        public IActionResult SaveMedication([FromBody] List<Medication_DTO> medication_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.SaveMedication(currentUser, medication_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("BookAdmission")]
        public IActionResult SaveAdmission([FromBody] BookAdmission_DTO bookAdmission_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.SaveAdmission(currentUser, bookAdmission_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("PostIntakeOutputVariable")]
        public IActionResult PostIntakeOutputVariable([FromBody] ClinicalIntakeOutputParameterModel clinicalIntakeOutput)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostIntakeOutputVariable(currentUser, clinicalIntakeOutput, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("PostIntakeTime")]
        public IActionResult PostIntakeTime([FromBody] MedicationIntakeModel clinicalIntakeTime)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.PostIntakeTime(currentUser, clinicalIntakeTime, _clinicalDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ClinicalNote")]
        public IActionResult UpdateClinicalNote([FromBody] ClinicalNote_DTO clinicalNotedto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalNote(currentUser, clinicalNotedto, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ClinicalHeadingFieldSetup")]
        public IActionResult UpdateClinicalHeadingFieldSetup([FromBody] PutClinicalHeadingFieldSetup_DTO putClinicalHeadingFieldSetup_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalHeadingFieldSetup(currentUser, putClinicalHeadingFieldSetup_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPut]
        [Route("Medication")]
        public IActionResult UpdateMedication([FromBody] Put_Medication_DTO  medication_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateMedication(currentUser, medication_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("DeactivatePrescriptionItem")]
        public IActionResult DeactivatePrescriptionItem(int PrescriptionItemId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.DeactivatePrescriptionItem(currentUser, PrescriptionItemId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpGet]
        [Route("DoctorDeparmentAndWardInfo")]
        public IActionResult PatientCertificate(int patientId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.GetDepartmentWardDoctorAndBedInfo(currentUser, patientId, _clinicalSettingDbContext, _masterDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("BedList")]
        public IActionResult GetBedList(int WardId, int BedFeatureId)
        {
            Func<object> func = () => _IClinicalSettingService.GetBedList(_clinicalSettingDbContext, WardId, BedFeatureId);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("ReservedBedList")]
        public IActionResult GetReservedBedList()
        {
            Func<object> func = () => _IClinicalSettingService.GetReservedBedList(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("AvailableBeds")]
        public IActionResult AvailableBeds(int wardId, int bedFeatureId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.GetAvailableBeds(currentUser, wardId, bedFeatureId, _clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("Ward/BedFeatures")]
        public IActionResult BedFeatureByWardAndPriceCategoryId(int wardId, int priceCategoryId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.GetBedFeaturesByWard(currentUser, wardId, priceCategoryId, _clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("ClinicalFieldMappings")]
        public IActionResult GetClinicalFieldMappings()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalFieldMappings(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("DepartmentList")]
        public IActionResult DepartmentList()
        {
            Func<object> func = () => _IClinicalSettingService.DepartmentList(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("EmployeeList")]
        public IActionResult EmployeeList()
        {
            Func<object> func = () => _IClinicalSettingService.EmployeeList(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("ClnUserFieldList")]
        public IActionResult GetUserFields(int selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalHeadingId)
        {

            Func<object> func = () => _IClinicalSettingService.GetUserFields(_clinicalSettingDbContext, selectedEmployeeId, selectedDepartmentId, selectedClinicalHeadingId);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("PreTemplateComponentList")]
        public IActionResult GetPreTemplateComponentList()
        {

            Func<object> func = () => _IClinicalSettingService.GetPreTemplateComponentList(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("SmartPrintableTemplates")]
        public IActionResult GetSmartPrintableTemplates()
        {

            Func<object> func = () => _IClinicalSettingService.GetSmartPrintableTemplates(_clinicalSettingDbContext);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpPost]
        [Route("ClinicalFieldMappings")]
        public IActionResult SaveOrUpdateUserFieldMappings([FromBody] AddUpdateClinicalUserFieldMappings_DTO addUpdateClinicalUserFieldMappings_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.SaveOrUpdateUserFieldMappings(currentUser, addUpdateClinicalUserFieldMappings_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPut]
        [Route("ClinicalFieldOptionActivation")]
        public IActionResult ActivateDeactivateClinicalFieldOption(int clinicalOptionId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalFieldOption(currentUser, clinicalOptionId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        /// <summary>
        /// Retrieves clinical notes from the clinical setting service.
        /// </summary>
        /// <returns>Returns an IActionResult with the result of the clinical notes retrieval operation.</returns>
        [HttpGet]
        [Route("ClinicalNotes")]
        public IActionResult GetClinicalNotes()
        {
            Func<object> func = () => _IClinicalSettingService.GetClinicalNotes(_clinicalSettingDbContext);
            return InvokeHttpGetFunction(func);
        }
        /// <summary>
        /// Adds clinical master notes to the database via the clinical setting service based on the provided DTO.
        /// </summary>
        /// <param name="clinicalMasterNotes_DTO">The DTO containing clinical master notes details to be added.</param>
        /// <returns>Returns an IActionResult indicating the success or failure of the operation.</returns>
        [HttpPost]
        [Route("PostClinicalNotes")]
        public IActionResult AddClinicalMasterNotes([FromBody] ClinicalMasterNotes_DTO clinicalMasterNotes_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.AddClinicalMasterNotes(currentUser, clinicalMasterNotes_DTO, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        /// <summary>
        /// Updates existing clinical master notes in the database using the provided ClinicalMasterNotes_DTO.
        /// </summary>
        /// <param name="clinicalMasterNotes_DTO">The ClinicalMasterNotes_DTO containing updated details of clinical master notes.</param>
        /// <returns>Returns an IActionResult indicating the success or failure of the update operation.</returns>
        [HttpPut]
        [Route("PutClinicalNotes")]
        public IActionResult UpdateClinicalMasterNotes([FromBody] ClinicalMasterNotes_DTO clinicalMasterNotes_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.UpdateClinicalMasterNotes(currentUser, clinicalMasterNotes_DTO, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);


        }
        /// <summary>
        /// Retrieves a list of medical components based on the provided parameters.
        /// </summary>
        /// <param name="selectedEmployeeId">ID of the selected employee.</param>
        /// <param name="selectedDepartmentId">ID of the selected department (nullable).</param>
        /// <param name="selectedClinicalNotesMasterId">ID of the selected clinical notes master.</param>
        /// <param name="ChildHeadingId"></param>
        /// <returns>Returns an IActionResult containing the list of medical components.</returns>

        [HttpGet]
        [Route("GetMedicalComponentList")]
        public IActionResult GetMedicalComponentList(int? selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalNotesMasterId, int? childHeadingId, int? parentHeadingId)
        {

            Func<object> func = () => _IClinicalSettingService.GetMedicalComponentList(_clinicalSettingDbContext, selectedEmployeeId, selectedDepartmentId, selectedClinicalNotesMasterId, childHeadingId, parentHeadingId);
            return InvokeHttpGetFunction<object>(func);
        }
        /// <summary>
        /// Adds or updates clinical notes mappings using the provided data.
        /// </summary>
        /// <param name="clinicalMasterNotesMapping">Data transfer object containing clinical notes mapping details.</param>
        /// <returns>Returns an IActionResult indicating the result of the operation.</returns>
        [HttpPost]
        [Route("ClinicalNotesMappings")]
        public IActionResult ClinicalNotesMappings([FromBody] ClinicalMasterNotesMapping_Dto clinicalMasterNotesMapping)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ClinicalNotesMappings(currentUser, clinicalMasterNotesMapping, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        /// <summary>
        /// Retrieves a filtered list of medical components based on the provided parameters.
        /// </summary>
        /// <param name="selectedEmployeeId">The ID of the selected employee.</param>
        /// <param name="selectedDepartmentId">The ID of the selected department.</param>
        /// <param name="selectedClinicalNotesMasterId">The ID of the selected clinical notes master.</param>
        /// <param name="parentHeadingId">The ID of the parent heading.</param>
        /// <param name="childHeadingId">The optional ID of the child heading.</param>
        /// <param name="fieldId">The optional ID of the field.</param>
        /// <returns>Returns an IActionResult containing the filtered medical components.</returns>
       [HttpGet]
        [Route("GetFilteredMedicalComponentList")]
       public IActionResult GetFilteredMedicalComponentList(int? selectedEmployeeId,int? selectedDepartmentId,int selectedClinicalNotesMasterId,int parentHeadingId, int? childHeadingId,int? fieldId)
        {
          Func<object> func = () => _IClinicalSettingService.GetFilteredMedicalComponentList( _clinicalSettingDbContext,selectedEmployeeId,selectedDepartmentId,selectedClinicalNotesMasterId, parentHeadingId,childHeadingId,fieldId);
            return InvokeHttpGetFunction<object>(func);
        }
        /// <summary>
        /// Activates or deactivates clinical notes based on the provided clinical notes master ID.
        /// </summary>
        /// <param name="clinicalNotesMasterId">The ID of the clinical notes master to activate or deactivate.</param>
        /// <returns>Returns an IActionResult indicating the result of the operation.</returns>
        [HttpPut]
        [Route("ClinicalNotesActivation")]
        public IActionResult ActivateDeactivateClinicalNotes(int clinicalNotesMasterId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.ActivateDeactivateClinicalNotes(currentUser, clinicalNotesMasterId, _clinicalSettingDbContext);
            return InvokeHttpPutFunction(func);
        }
        /// <summary>
        /// Adds section mappings by invoking the service to map the provided section details.
        /// </summary>
        /// <param name="sectionMapping">The DTO containing details for the section mapping to be added.</param>
        /// <returns>Returns an IActionResult indicating the success or failure of the operation.</returns>
        [HttpPost]
        [Route("SectionMappings")]
        public IActionResult AddSectionMappings([FromBody] SectionMapping_DTO sectionMapping)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IClinicalSettingService.AddSectionMappings(currentUser, sectionMapping, _clinicalSettingDbContext);
            return InvokeHttpPostFunction(func);
        }
        /// <summary>
        /// Retrieves the clinical section mapping for a given clinical heading ID.
        /// </summary>
        /// <param name="ClinicalHeadingId">The ID of the clinical heading for which the section mapping is to be retrieved.</param>
        /// <returns>Returns an IActionResult containing the clinical section mapping details.</returns>
        [HttpGet]
        [Route("GetClinicalSectionMapping")]
        public IActionResult GetClinicalSectionMapping(int ClinicalHeadingId)
        {

            Func<object> func = () => _IClinicalSettingService.GetClinicalSectionMapping(_clinicalSettingDbContext, ClinicalHeadingId);
            return InvokeHttpGetFunction<object>(func);
        }
        /// <summary>
        /// Retrieves filtered clinical section mappings based on the provided criteria.
        /// </summary>
        /// <param name="ClinicalHeadingId">The ID of the clinical heading for which the section mapping is to be retrieved.</param>
        /// <param name="InputType">The type of input to filter the section mappings.</param>
        /// <param name="GroupName">The name of the group to filter the section mappings.</param>
        /// <returns>Returns an IActionResult containing the filtered clinical section mapping details.</returns>
        [HttpGet]
        [Route("GetFilteredClinicalSectionMapping")]
        public IActionResult GetFilteredClinicalSectionMapping(int ClinicalHeadingId, string InputType, string GroupName)
        {
            Func<object> func = () => _IClinicalSettingService.GetFilteredClinicalSectionMapping(_clinicalSettingDbContext, ClinicalHeadingId, InputType, GroupName);
            return InvokeHttpGetFunction<object>(func);
        }

    }
}