using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.Clinical_New.DTOs;
using DanpheEMR.Services.NewClinical;
using DanpheEMR.Services.NewClinical.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using DanpheEMR.CommonTypes;
using DanpheEMR.ServerModel.ClinicalModels.BloodSugarMonitoring;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Office2013.Drawing.ChartStyle;

namespace DanpheEMR.Controllers.NewClinical
{

    public class NewClinicalController : CommonController
    {
        private readonly ClinicalDbContext _clinicalDbContext;
        private readonly BillingDbContext billingDbContext;
		private readonly INewClinicalService _newClinicalService;
        private readonly MasterDbContext _masterDbContext;

        public NewClinicalController(INewClinicalService iNewClinicalService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _newClinicalService = iNewClinicalService;
            _clinicalDbContext = new ClinicalDbContext(connString);
            billingDbContext = new BillingDbContext(connString);
            _masterDbContext = new MasterDbContext(connString);
        }

        [HttpPost]
        [Route("Diagnosis")]
        public IActionResult AddDiagnosis([FromBody] List<DiagnosisAdd_DTO> Diagnosis)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddDiagnosis(currentUser, _clinicalDbContext, Diagnosis);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("ICD10")]
        public async Task<IActionResult> GetICD10List()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetICD10List(_masterDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }
        [HttpGet]
        [Route("GetAllDepartments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            
            Func<Task<object>> func = async () => await _newClinicalService.GetDepartmentsListAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }


        [HttpGet]
        [Route("GetBillingDetails/{PatientId}/{PatientVisitId}")]
        public IActionResult GetBillingDetails(int PatientId, int PatientVisitId)
        {
            Func<object> func=()=> _newClinicalService.GetBillingDetails(billingDbContext, PatientId, PatientVisitId);
            return InvokeHttpGetFunction(func);
        }
		[HttpGet]
		[Route("GetClinicalHeadingSubHeadingField/{visitType}")]
		public IActionResult GetClinicalHeadingSubHeadingField(string visitType)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.GetUserWiseCLinicalField(currentUser, _clinicalDbContext, visitType);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("MedicationCardexList")]
        public IActionResult GetMedicationCardexList(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetMedicationCardexList(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("Diagnoses")]
        public IActionResult GetDiagnoses(int PatientId, int PatientVisitId, string DiagnosisType,bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetDiagnoses(_clinicalDbContext, PatientId, PatientVisitId, DiagnosisType, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("PostFormFieldData")]
        public IActionResult PostFormFieldData([FromBody] FormFieldData_DTO formFieldData)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.PostFormFieldData(currentUser, _clinicalDbContext, formFieldData);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("BloodSugar")]
        public IActionResult PostBloodSugar([FromBody] BloodSugarModel bloodSugar)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.PostBloodSugar(currentUser, _clinicalDbContext, bloodSugar);
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("TreatmentCardexPlan")]
        public IActionResult AddMedicationCardexPlan([FromBody] PostMedicationCardexPlan_DTO medicationCardexPlan)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddMedicationCardexPlan(currentUser, _clinicalDbContext, medicationCardexPlan);
            return InvokeHttpGetFunction(func);

        }


        #region Get

        [HttpGet]
        [Route("MedicationIntake")]
        public IActionResult GetMedicationIntake()
        {
            Func<object> func = () => _newClinicalService.GetMedicationIntake(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("FrequencyDisplayName")]
        public IActionResult GetFrequencyDisplayName()
        {
            Func<object> func = () => _newClinicalService.GetFrequencyDisplayName(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("DischargedPatients")]
        public IActionResult GetDischargedPatients(DateTime? FromDate, DateTime? ToDate, string HospitalNumber, int DepartmentId, string FilterStatus,int WardId)
        {
            Func<object> func = () => _newClinicalService.GetDischargedPatientsList(_clinicalDbContext, FromDate, ToDate, HospitalNumber, DepartmentId, FilterStatus, WardId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("MSTVitals")]
        public IActionResult GetMSTVitals()
        {
            Func<object> func = () => _newClinicalService.GetMSTVitals(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("Vitals")]
        public IActionResult GetVitals(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetVitals(patientId, patientVisitId, isAcrossVisitAvailability, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PatientLatestVitals")]
        public IActionResult GetPatientLatestVitals(int patientId, int patientVisitId)
        {
            Func<object> func = () => _newClinicalService.GetPatientLatestVitals(patientId, patientVisitId, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("IntakeOutput")]
        public IActionResult GetClinicalIntakeOutput(int patientVisitId,int patientId, bool isAcrossVisitAvailability, DateTime? fromDate, DateTime? toDate)
        {
            Func<object> func = () => _newClinicalService.GetClinicalIntakeOutput(patientVisitId, patientId, isAcrossVisitAvailability, fromDate, toDate, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("GetClinicalIntakeOutputParameter")]
        public IActionResult GetClinicalIntakeOutputParameter()
        {
            Func<object> func = () => _newClinicalService.GetClinicalIntakeOutputParameter(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("IntakeOutput")]
        public IActionResult AddInputOutput([FromBody] PostIntakeOutput_DTO PostInputOutputData)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddInputOutput(currentUser, PostInputOutputData, _clinicalDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpGet]
        [Route("PatientVitalsForTPRGraph")]
        public IActionResult GetPatientVitalsForTPRGraph(int patientId, int patientVisitId,bool isAcrossVisitAvailability, int noOfDays)
        {
            Func<object> func = () => _newClinicalService.GetPatientVitalsForTPRGraph(patientId, patientVisitId, isAcrossVisitAvailability, noOfDays, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("Output")]
        public IActionResult GetOutputDetailsByPatientVisitId(int patientVisitId, int patientId, bool isAcrossVisitAvailability, int noOfDays)
        {
            Func<object> func = () => _newClinicalService.GetOutputDetailsByPatientVisitId(patientVisitId, patientId, isAcrossVisitAvailability, noOfDays, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("Template")]
        public IActionResult GetTemplateByTemplateCode(string templateCode, int patientVisitId,int patientId)
        {
            Func<object> func = () => _newClinicalService.GetTemplateByTemplateCode(templateCode, patientVisitId,patientId, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        #endregion

        #region Post
        [HttpPost]
        [Route("Vitals")]
        public IActionResult SaveVitals([FromBody] List<ClinicalVitalsTransaction_DTO> vitals)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddVitals(vitals, currentUser, _clinicalDbContext);
            return InvokeHttpPostFunction(func);
        }

        #endregion

        #region Put
        #endregion




        [HttpGet]
        [Route("AppointmentApplicableDoctorsList")]

        public IActionResult GetIsAppointmentApplicableDoctors()
        {
            Func<object> func = () => _newClinicalService.GetIsAppointmentApplicableDoctorsList(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("Departments")]

        public IActionResult GetDepartments()
        {
            Func<object> func = () => _newClinicalService.GetDepartmentsList(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("AdmittedPatients")]
        public IActionResult GetAdmittedPatients(int DepartmentId, int AdmittngDoctorId,int WardId)
        {
            Func<object> func = () => _newClinicalService.GetAdmittedPatientsList(_clinicalDbContext, DepartmentId, AdmittngDoctorId, WardId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("PatientVisits")]
        public IActionResult GetPatientVisits(string HospitalNumber, bool IsHospitalNoSearch, int? DepartmentId, int? DoctorId, DateTime? FromDate, DateTime? ToDate)
        {
                Func<object> func = () => _newClinicalService.GetPatientVisitsList(_clinicalDbContext, HospitalNumber, IsHospitalNoSearch, DepartmentId, DoctorId, FromDate, ToDate);
                return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("InvestigationResults")]
        public IActionResult GetInvestigationResults(int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate, string labTestIds, bool isAcrossVisitAvailability,int? TestCount)
        {
            Func<object> func = () => _newClinicalService.GetInvestigationResults(_clinicalDbContext, patientId, patientVisitId, fromDate, toDate, labTestIds, isAcrossVisitAvailability, TestCount);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("LabTests")]

        public IActionResult GetLabTests()
        {
            Func<object> func = () => _newClinicalService.GetLabTestsList(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("GetClinicalDataByVisitId")]
        public IActionResult GetClinicalData(int patientId, int patientVisitId, int? clinicalHeadingId)
        {
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.GetPatientVisitData(currentUser, patientId, patientVisitId, clinicalHeadingId, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("BloodSugar")]
        public IActionResult GetPatientBloodSugarInfo(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetPatientBloodSugarInfo(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("RequestedImagingItems")]
        public IActionResult GetRequestedImagingItems(int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetRequestedImagingItems(_clinicalDbContext, PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("GetVitalsForNurseDailyRecord")]
        public IActionResult GetVitalsForNurseDailyRecord(int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate,bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetVitalsForNurseDailyRecord(_clinicalDbContext, patientId, patientVisitId, fromDate, toDate, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);

        }
        [HttpGet]
        [Route("GetPatientVisitsByPatientId")]
        public IActionResult GetPatientVisitsByPatientId(int patientId)
        {
            Func<object> func = () => _newClinicalService.GetPatientVisitsByPatientId(patientId, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

		[HttpPut]
		[Route("PutFieldTextBoxFreeTypeNumber")]
		public IActionResult PutFieldTextBoxFreeTypeNumber([FromBody] PutTextBoxFreeTypeNumber_DTO field)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.PutFieldTextBoxFreeTypeNumber(currentUser, _clinicalDbContext, field);
			return InvokeHttpGetFunction(func);
		}

		[HttpPost]
		[Route("DeleteFieldTextBoxFreeTypeNumber")]
		public IActionResult DeleteFieldTextBoxFreeTypeNumber([FromBody] DeleteTextBoxFreeTypeNumber_DTO field)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.DeleteFieldTextBoxFreeTypeNumber(currentUser, _clinicalDbContext, field);
			return InvokeHttpGetFunction(func);
		}



		[HttpGet]
        [Route("ConsultationRequestsByPatientVisitId")]
        public IActionResult ConsultationRequestsByPatientVisitId(int PatientId,int PatientVisitId,bool IsAcrossVisitAvailability)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.ConsultationRequestsByPatientVisitId(currentUser, _clinicalDbContext,PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("AddNewConsultationRequest")]
        public IActionResult AddNewConsultationRequest([FromBody] ConsultationRequestDTO newConsultationRequest)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddNewConsultationRequest(currentUser, _clinicalDbContext, newConsultationRequest);
            return InvokeHttpGetFunction(func);
        }
        [HttpPut]
        [Route("ResponseConsultationRequest")]
        public IActionResult ResponseConsultationRequest([FromBody] ConsultationRequestDTO responseConsultationRequest)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.ResponseConsultationRequest(currentUser, _clinicalDbContext, responseConsultationRequest);
            return InvokeHttpGetFunction(func);
        }
		[HttpPut]
		[Route("PutFieldSingleSelectMultipleSelect")]
		public IActionResult PutFieldSingleSelectMultipleSelect([FromBody] PutSingleSelectMultipleSelect_DTO field)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.PutFieldSingleSelectMultipleSelect(currentUser, _clinicalDbContext, field);
			return InvokeHttpGetFunction(func);
		}
		[HttpPut]
		[Route("DeleteFieldSingleSelectMultipleSelect")]
		public IActionResult DeleteFieldSingleSelectMultipleSelect([FromBody] List<int> options)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.DeleteFieldSingleSelectMultipleSelect(currentUser, _clinicalDbContext, options);
			return InvokeHttpGetFunction(func);
		}

		[HttpGet]
        [Route("ItemsWithTotalAvailableQuantity")]
        public IActionResult GetItemsWithTotalAvailableQuantity()
        {
            Func<object> func = () => _newClinicalService.GetItemsWithTotalAvailableQuantity(_clinicalDbContext);
            return InvokeHttpGetFunction(func);

        }  
        
        [HttpPut]
        [Route("TreatmentCardexPlan")]
        public IActionResult UpdateCurrentCardexPlan([FromBody] PutMedicationCardexPlan_DTO updatedMedicationCardex)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.UpdateMedicationCardexPlanAsync(currentUser, _clinicalDbContext, updatedMedicationCardex);
            return InvokeHttpGetFunction(func);
        }
    
        [HttpGet]
        [Route("GetChiefComplaints")]
        public IActionResult GetChiefComplaints()
        {
            Func<object> func = () => _newClinicalService.GetChiefComplaints(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("PostPatientComplaints")]
        public IActionResult AddPatientComplaints([FromBody] PatientComplaints_DTO patientComplaints)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddPatientComplaints(currentUser, _clinicalDbContext, patientComplaints);
            return InvokeHttpGetFunction(func);

        }
        [HttpGet]
        [Route("GetPatientComplaints")]

        public IActionResult GetPatientComplaints(int patientId, int patientVisitId,bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetPatientComplaints(patientId,patientVisitId,isAcrossVisitAvailability, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpPut]
        [Route("PutPatientComplaints")]

        public IActionResult UpdatePatientComplaints([FromBody] PatientComplaints_DTO patientComplaints)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.UpdatePatientComplaints(currentUser, patientComplaints, _clinicalDbContext);
            return InvokeHttpPutFunction(func);

        }
        [HttpPut]
        [Route("DeactivatePatientComplaint")]
        public IActionResult DeactivatePatientComplaint(int complaintId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.DeactivatePatientComplaint(currentUser, complaintId, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }



		[HttpPut]
		[Route("PutQFieldTextBoxFreeTypeNumber")]
		public IActionResult PutQFieldTextBoxFreeTypeNumber([FromBody] QTextBoxFreeTypeNumber_DTO field)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.PutQFieldTextBoxFreeTypeNumber(currentUser, _clinicalDbContext, field);
			return InvokeHttpGetFunction(func);
		}
		[HttpPut]
		[Route("DeleteQFieldTextBoxFreeTypeNumber")]
		public IActionResult DeleteQFieldTextBoxFreeTypeNumber([FromBody] int id)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.DeleteQFieldTextBoxFreeTypeNumber(currentUser, _clinicalDbContext, id);
			return InvokeHttpGetFunction(func);
		}
		[HttpPut]
		[Route("PutQFieldSingleSelectMultipleSelect")]
		public IActionResult PutQFieldSingleSelectMultipleSelect([FromBody] QSingleSelectMultipleSelect_DTO field)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.PutQFieldSingleSelectMultipleSelect(currentUser, _clinicalDbContext, field);
			return InvokeHttpGetFunction(func);
		}

		[HttpPut]
		[Route("DeleteQFieldSingleSelectMultipleSelect")]
		public IActionResult DeleteQFieldSingleSelectMultipleSelect([FromBody] List<int> options )
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.DeleteQFieldSingleSelectMultipleSelect(currentUser, _clinicalDbContext, options);
			return InvokeHttpGetFunction(func);
		}

		[HttpGet]
        [Route("PatientActiveMedications")]
        public IActionResult GetPatientActiveMedications(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetPatientActiveMedications(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);

        }
        [HttpPost]
        [Route("MedicationEntry")]
        public IActionResult AddMedicationEntry([FromBody] MedicationEntry_DTO medicationEntry)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddMedicationEntry(currentUser, _clinicalDbContext, medicationEntry);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("SelectedMedicationHistoryLog")]
        public IActionResult GetSelectedMedicationHistoryLogs(int cardexPlanId)
        {
            Func<object> func = () => _newClinicalService.GetSelectedMedicationHistoryLogs(_clinicalDbContext, cardexPlanId);
            return InvokeHttpGetFunction(func);

        }
        [HttpGet]
        [Route("PatientMedicationHistoryLog")]
        public IActionResult GetAllMedicationLogList(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetAllMedicationLogList(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);

        }
        [HttpGet]
        [Route("SelectedPatientItemList")]
        public IActionResult GetSelectedPatientMedicationList(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetSelectedPatientMedicationList(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);

        }
		/// <summary>
		/// Retrieves a list of birth details for a specific patient visit ID.
		/// </summary>
		/// <param name="patientId">The ID of the patient for which birth details are retrieved.</param>
		/// <param name="patientVisitId">The ID of the patient visit for which birth details are to be retrieved.</param>
		/// <param name="isAcrossVisitAvailability">To get all visit data or current visit data</param>
		/// <returns>It returns the list of baby birth deatils list based on PatientvisitId.</returns>
		[HttpGet]
        [Route("Births")]
        public IActionResult GetBirthList(int patientId, int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetBirthList(_clinicalDbContext, patientId, patientVisitId, isAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);

        }
        /// <summary>
        /// Retrieves baby details for a specific patient ID.
        /// </summary>
        /// <param name="patientId">The ID of the patient for which baby details are to be retrieved.</param>
        /// <returns>It returns the list of baby birth deatils list based on PatientId.</returns>
        [HttpGet]
        [Route("BabyDetails")]
        public IActionResult GetBabyDetailsByPatientId(int patientId)
        {
            Func<object> func = () => _newClinicalService.GetBabyDetailsByPatientId(_clinicalDbContext, patientId);
            return InvokeHttpGetFunction(func);
        }
        /// <summary>
        /// This endpoint Retrieves the list of allergies for a specified patient based on PatientId.
        /// </summary>
        /// <param name="PatientId">The ID of the patient whose allergies are to be retrieved.</param>
        /// <returns>
        /// It returns the list of patient allergies.
        /// </returns>
        [HttpGet]
        [Route("PatientAllergies")]
        public IActionResult PatientAllergies(int PatientId)
        {
            Func<object> func = () => _newClinicalService.GetPatientAllergies(_clinicalDbContext, PatientId);
            return InvokeHttpGetFunction(func);
            
        }

        /// <summary>
        /// This endpoint Adds a new patient allergy record based on the provided PatientAllergyDTO.
        /// </summary>
        /// <param name="patientAllergyDTO">The DTO containing allergy information to be added.</param>
        /// <returns>An IActionResult indicating the success or failure of the operation.</returns>
       [HttpPost]
        [Route("PostAllergy")]
        public IActionResult AddPatientAllergy([FromBody] PatientAllergyDTO patientAllergyDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddPatientAllergy(currentUser, _clinicalDbContext, patientAllergyDTO);
            return InvokeHttpGetFunction(func);
        }

        /// <summary>
        /// Updates an existing patient allergy record based on the provided PatientAllergyDTO.
        /// </summary>
        /// <param name="patientAllergyDTO">The DTO containing updated allergy information.</param>
        /// <returns>An IActionResult indicating the success or failure of the operation.</returns>
        [HttpPut]
        [Route("PutAllergy")]
        public IActionResult UpdatePatientAllergy([FromBody] PatientAllergyDTO patientAllergyDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.UpdatePatientAllergy(currentUser, patientAllergyDTO, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }
        /// <summary>
        /// Updates an existing baby birth record based on the provided BabyBirthDetails_DTO.
        /// </summary>
        /// <param name="babyBirthDetails_DTO">The DTO containing the updated birth details.</param>
        /// <returns>An IActionResult representing the HTTP response for the update operation.</returns>
        [HttpPut]
        [Route("UpdateBirthDetails")]

        public IActionResult UpdateBirthDetails([FromBody] BabyBirthDetails_DTO babyBirthDetails_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.UpdateBirthDetails(currentUser, babyBirthDetails_DTO, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }
        /// <summary>
        /// Retrieves the baby birth conditions from the database.
        /// </summary>
        /// <returns>An IActionResult representing the HTTP response containing the baby birth conditions.</returns>
        [HttpGet]
        [Route("BabyBirthCondition")]
        public IActionResult GetBabyBirthCondition()
        {
            Func<object> func = () => _newClinicalService.GetBabyBirthCondition(_clinicalDbContext);
            return InvokeHttpGetFunction(func);

        }
        /// <summary>
        /// Retrieves the list of birth certificate numbers from the database.
        /// </summary>
        /// <returns>An IActionResult representing the HTTP response containing the birth certificate numbers.</returns>
        [HttpGet]
        [Route("BirthCertificateNumbers")]
        public IActionResult GetBirthCertificateNumbers()
        {
            Func<object> func = () => _newClinicalService.GetBirthCertificateNumbers(_clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
        /// <summary>
        /// This endpoint Adds a new baby birth record based on the provided babyBirthDetails_DTOs.
        /// </summary>
        /// <param name="babyBirthDetails_DTOs">The list of BabyBirthDetails_DTO objects containing the birth details to be added.</param>
        /// <returns>An IActionResult representing the HTTP response for adding birth details.</returns>
        [HttpPost]
        [Route("PostBirthDetails")]
        public IActionResult AddBirthDetails([FromBody] List<BabyBirthDetails_DTO> babyBirthDetails_DTOs)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddBirthDetails(currentUser, _clinicalDbContext, babyBirthDetails_DTOs);
            return InvokeHttpGetFunction(func);
        }

        /// <summary>
        /// Retrieves the list of consultant doctors for a specific patient visit.
        /// Utilizes the _newClinicalService to fetch the data from the clinical database context.
        /// </summary>
        /// <param name="patientVisitId">The ID of the patient visit to fetch consultants for.</param>
        /// <returns>An IActionResult containing the result of the consultant doctors retrieval.</returns>
        [HttpGet]
        [Route("PatientVisitConsultants")]
        public IActionResult GetPatientVisitConsultants(int patientVisitId)
        {
            Func<object> func = () => _newClinicalService.GetPatientVisitConsultantDoctors(_clinicalDbContext, patientVisitId);
            return InvokeHttpGetFunction(func);
            
        }

		/// <summary>
		/// API endpoint to retrieve user-specific clinical notes from the database.
		/// Utilizes the _newClinicalService to fetch the data from the clinical database context.
		/// </summary>
		/// <returns>An IActionResult containing the result of the user-specific clinical notes retrieval.</returns>
		[HttpGet]
		[Route("GetUserWiseNotes")]
		public IActionResult GetUserWiseNotes()
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.GetUserWiseNotes(currentUser, _clinicalDbContext);
			return InvokeHttpGetFunction(func);
		}
        [HttpGet]
        [Route("DoctorSignatoriesList")]
        public async Task<IActionResult> GetDoctorSignatoriesList()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetDoctorSignatoriesListAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        [HttpGet]
        [Route("NurseSignatoriesList")]
        public async Task<IActionResult> GetNurseSignatoriesList()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetNurseSignatoriesListAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        [HttpGet]
        [Route("DischargeType")]
        public async Task <IActionResult> GetDischargeType()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetDischargeTypeAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        [HttpGet]
        [Route("DischargeConditionType")]
        public async Task<IActionResult> GetDischargeConditionType()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetDischargeConditionTypeAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        [HttpGet]
        [Route("OperationType")]
        public async Task<IActionResult> GetOperationType()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetOperationTypeAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }
        [HttpPost]
        [Route("DischargeInformation")]
        public async Task<IActionResult> AddDischargeInformation([FromBody] DischargeInformation_DTO dischargeInformation_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<Task<object>> func = async () => await _newClinicalService.AddDischargeInformationAsync(currentUser, _clinicalDbContext, dischargeInformation_DTO);
            return await InvokeHttpPostFunctionAsync(func);
        }
        [HttpGet]
        [Route("GetDischargeInformation")]
        public async Task<IActionResult> GetDischargeInformation(int patientId,int patientVisitId, bool isAcrossVisitAvailability)
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetDischargeInformationAsync(_clinicalDbContext,patientId, patientVisitId,isAcrossVisitAvailability);
            return await InvokeHttpGetFunctionAsync(func);
        }
        [HttpGet]
        [Route("GetAnaesthetist")]
        public async Task<IActionResult> GetAnaesthetist()
        {
            Func<Task<object>> func = async () => await _newClinicalService.GetAnaesthetistAsync(_clinicalDbContext);
            return await InvokeHttpGetFunctionAsync<object>(func);
        }

        [HttpPost]
        [Route("PatientFollowUpDays")]
        public IActionResult AddPatientFollowUpDays([FromBody] PatientFollowUp_DTO patientFollowUpDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.AddPatientFollowUpDays(currentUser, _clinicalDbContext, patientFollowUpDTO);
            return InvokeHttpGetFunction(func);
        }
		[HttpGet]
		[Route("PatientFollowUpDays")]
        public IActionResult GetPatientFollowUpDetails(int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability)
        {
            Func<object> func = () => _newClinicalService.GetPatientFollowUpDetails(_clinicalDbContext, PatientId, PatientVisitId, IsAcrossVisitAvailability);
            return InvokeHttpGetFunction(func);
        }


        /// <summary>
        /// Retrieves the vitals template details based on the provided template code and patient visit ID.
        /// </summary>
        /// <param name="templateCode">The template code used to identify the specific vitals template.</param>
        /// <param name="patientVisitId">The ID of the patient visit for which the vitals template details are to be retrieved.</param>
        /// <returns>Returns the vitals template details associated with the specified template code and patient visit ID.</returns>

        [HttpGet]
        [Route("VitalTemplate")]
        public IActionResult GetVitalsTemplateByTemplateCode(string templateCode, int patientVisitId)
        {
            Func<object> func = () => _newClinicalService.GetVitalsTemplateByTemplateCode(templateCode, patientVisitId, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }
		[HttpGet]
		[Route("ClinicalPhrases")]
		public async Task<IActionResult> GetClinicalPhrases()
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<Task<object>> func = async () => await _newClinicalService.GetClinicalPhrases(currentUser,_clinicalDbContext);
			return await InvokeHttpGetFunctionAsync(func);
		}
		[HttpPost]
		[Route("DeactivateDiagnosis")]
		public IActionResult DeactivateDiagnosis([FromBody] List<int> idList)
		{
			RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
			Func<object> func = () => _newClinicalService.DeactivateDiagnosis(currentUser, _clinicalDbContext, idList);
			return InvokeHttpGetFunction(func);
		}

        [HttpGet]
        [Route("ERPatientVisits")]
        public IActionResult GetERPatientVisits(int? DoctorId, DateTime? FromDate, DateTime? ToDate,String FilterBy)
        {
            Func<object> func = () => _newClinicalService.GetERPatientVisits(_clinicalDbContext, DoctorId, FromDate, ToDate, FilterBy);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("GetWardList")]
        public IActionResult GetWardList()
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.GetWardList(currentUser, _clinicalDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPut]
        [Route("BloodSugar")]
        public IActionResult UpadteBloodSugar([FromBody] BloodSugarModel bloodSugar)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.UpadteBloodSugar(currentUser, _clinicalDbContext, bloodSugar);
            return InvokeHttpGetFunction(func);
        }
        [HttpPut]
        [Route("DeactivatePatientAllergy")]
        public IActionResult DeactivatePatientAllergy(int patientId,int patientAllergyId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.DeactivatePatientAllergy(currentUser, patientId, patientAllergyId, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("IntakeOutput")]
        public IActionResult PutIntakeOutput([FromBody] PostIntakeOutput_DTO PutInputOutputData)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.PutIntakeOutput(currentUser, PutInputOutputData, _clinicalDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("DeactivatePatientIntakeOutput")]
        public IActionResult DeactivatePatientIntakeOutput(int inputOutputId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.DeactivatePatientIntakeOutput(currentUser, inputOutputId, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }


        [HttpPut]
        [Route("DeactivatePatientBloodSugar")]
        public IActionResult DeactivatePatientBloodSugar(int BloodSugarMonitoringId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.DeactivatePatientBloodSugar(currentUser, BloodSugarMonitoringId, _clinicalDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("CancelRequestedItem")]

        public IActionResult CancelRequestedItem(int PatientId, int PatientVisitId,int RequisitionId, string Type)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _newClinicalService.CancelRequestedItem(currentUser, PatientId, PatientVisitId, RequisitionId, Type, _clinicalDbContext);
            return InvokeHttpPutFunction(func);

        }
    }


}
    

