using System;

using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.NewClinical.DTOs;
using DanpheEMR.ServerModel;
using DanpheEMR.Services.Clinical_New.DTOs;
using System.Collections.Generic;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.ClinicalModels.BloodSugarMonitoring;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical
{
    public interface INewClinicalService
    {
        Task<object> GetICD10List(MasterDbContext _masterDbContext);
        object GetDischargedPatientsList(ClinicalDbContext _clinicalDbContext,DateTime? FromDate,DateTime? ToDate, string HospitalNumber, int DepartmentId, string FilterStatus,int WardId);
        object GetUserWiseCLinicalField(RbacUser currentUser, ClinicalDbContext clinicalDbContext, string visitType);

        object PostFormFieldData(RbacUser currentUser, ClinicalDbContext clinicalDbContext, FormFieldData_DTO formFieldData);

        object AddInputOutput(RbacUser currentUser, PostIntakeOutput_DTO PostInputOutputData, ClinicalDbContext clinicalDbContext);
        List<IntakeOutputView_DTO> GetClinicalIntakeOutput(int patientVisitId, int patientId, bool isAcrossVisitAvailability, DateTime? fromDate, DateTime? toDate, ClinicalDbContext _clinicalDbContext); 
        List<ClinicalIntakeOutputParameterModel> GetClinicalIntakeOutputParameter(ClinicalDbContext clinicalDbContext);
        object GetIsAppointmentApplicableDoctorsList(ClinicalDbContext clinicalDbContext);
        object GetDepartmentsList(ClinicalDbContext clinicalDbContext);
        object GetAdmittedPatientsList(ClinicalDbContext clinicalDbContext, int departmentId, int admittngDoctorId,int wardId);
      
        #region Get
        object GetMSTVitals(ClinicalDbContext _clinicalDbContext);
        object GetVitals(int patientId, int patientVisitId,bool isAcrossVisitAvailability, ClinicalDbContext _clinicalDbContext);
        object GetPatientLatestVitals(int patientId, int patientVisitId, ClinicalDbContext _clinicalDbContext);
        object GetPatientVisitData(RbacUser currentUser, int patientId, int VisitId,int? clinicalHeadingId, ClinicalDbContext _clinicalDbContext);
        object GetPatientBloodSugarInfo(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);
        object GetPatientVitalsForTPRGraph(int patientId, int patientVisitId,bool isAcrossVisitAvailability, int noOfDays,  ClinicalDbContext _clinicalDbContext);
        object GetOutputDetailsByPatientVisitId(int patientVisitId, int patientId, bool isAcrossVisitAvailability, int noOfDays,  ClinicalDbContext _clinicalDbContext);
        object GetTemplateByTemplateCode(string templateCode, int patientVisitId,int patientId, ClinicalDbContext _clinicalDbContext);
        #endregion

        #region Post
        object AddVitals(List<ClinicalVitalsTransaction_DTO> vitals, RbacUser currentUser, ClinicalDbContext _clinicalDbContext);
        object PostBloodSugar(RbacUser currentUser, ClinicalDbContext clinicalDbContext, BloodSugarModel bloodSugar);
        object AddDiagnosis(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<DiagnosisAdd_DTO> Diagnosis);
        #endregion

        #region Put
        #endregion

        object GetPatientVisitsList(ClinicalDbContext clinicalDbContext,string HospitalNumber,Boolean IsHospitalNoSearch, int? DepartmentId,int? DoctorId,DateTime? FromDate,DateTime? ToDate);
        object GetFrequencyDisplayName(ClinicalDbContext _clinicalDbContext);
        object GetMedicationIntake(ClinicalDbContext _clinicalDbContext);
        object GetInvestigationResults(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate,string labTestIds, bool isAcrossVisitAvailability, int? TestCount);
        object GetLabTestsList(ClinicalDbContext _clinicalDbContext);
        object GetRequestedImagingItems(ClinicalDbContext _clinicalDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability);
        object GetBillingDetails(BillingDbContext billingDbContext, int PatientId, int PatientVisitId);
        Task<object> GetDepartmentsListAsync(ClinicalDbContext _clinicalDbContext);
		object GetVitalsForNurseDailyRecord(ClinicalDbContext _clinicalDbContext, int patientId, int patientVisitId, DateTime? fromDate, DateTime? toDate, bool isAcrossVisitAvailability);
        object ConsultationRequestsByPatientVisitId(RbacUser currentUser, ClinicalDbContext clinicalDbContext, int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability);
        object AddNewConsultationRequest(RbacUser currentUser, ClinicalDbContext clinicalDbContext, ConsultationRequestDTO newConsultationRequest);
        object ResponseConsultationRequest(RbacUser currentUser, ClinicalDbContext clinicalDbContext, ConsultationRequestDTO responseConsultationRequest);
        object AddMedicationCardexPlan(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PostMedicationCardexPlan_DTO medicationCardexPlan);
        object GetMedicationCardexList(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);
        object GetDiagnoses(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, string DiagnosisType, bool IsAcrossVisitAvailability);
        object GetPatientVisitsByPatientId(int patientId, ClinicalDbContext _clinicalDbContext);
        object PutFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PutTextBoxFreeTypeNumber_DTO field);
		object DeleteFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, DeleteTextBoxFreeTypeNumber_DTO field);

		object PutFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PutSingleSelectMultipleSelect_DTO field);
		object DeleteFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> options);
		object GetItemsWithTotalAvailableQuantity(ClinicalDbContext clinicalDbContext);
        Task <object> UpdateMedicationCardexPlanAsync(RbacUser currentUser, ClinicalDbContext clinicalDbContext,PutMedicationCardexPlan_DTO medicationCardexPlan);
        object GetChiefComplaints(ClinicalDbContext clinicalDbContext);
        object AddPatientComplaints(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PatientComplaints_DTO patientComplaints);
        object GetPatientComplaints(int patientId, int patientVisitId, bool isAcrossVisitAvailability, ClinicalDbContext clinicalDbContext);
        object UpdatePatientComplaints(RbacUser currentUser, PatientComplaints_DTO patientComplaints, ClinicalDbContext clinicalDbContext);
        object DeactivatePatientComplaint(RbacUser currentUser, int complaintId, ClinicalDbContext clinicalDbContext);
        object PutQFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, QTextBoxFreeTypeNumber_DTO field);
		object DeleteQFieldTextBoxFreeTypeNumber(RbacUser currentUser, ClinicalDbContext clinicalDbContext, int id);
		object PutQFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, QSingleSelectMultipleSelect_DTO field);
		object DeleteQFieldSingleSelectMultipleSelect(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> options);
		object GetPatientActiveMedications(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);
        object AddMedicationEntry(RbacUser currentUser, ClinicalDbContext clinicalDbContext, MedicationEntry_DTO medicationEntry);
        object GetSelectedMedicationHistoryLogs(ClinicalDbContext clinicalDbContext, int cardexPlanId);
        object GetAllMedicationLogList(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);
        object GetSelectedPatientMedicationList(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);
        /// <summary>
        /// Retrieves a list of patient allergies from the database based on the clinicalDbContext, PatientID.
        /// </summary>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <param name="PatientId">The ID of the patient whose allergies are to be retrieved.</param>
        /// <returns>It returns list of allergy records associated with the specified patient.</returns>
        object GetPatientAllergies(ClinicalDbContext clinicalDbContext, int PatientId);
        /// <summary>
        /// Adds a new patient allergy record to the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is adding the patient allergy.</param>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <param name="patientAllergyDTO">The DTO (Data Transfer Object) containing information about the patient allergy to be added.</param>
        /// <returns>An object indicating the success or failure of the operation.</returns>
        object AddPatientAllergy(RbacUser currentUser, ClinicalDbContext clinicalDbContext, PatientAllergyDTO patientAllergyDTO);
        /// <summary>
        /// Updates a patient allergy record in the database.
        /// </summary>
        /// <param name="currentUser">The user currently logged in who is updating the patient allergy.</param>
        /// <param name="patientAllergyDTO">The DTO (Data Transfer Object) containing updated allergy information.</param>
        /// <param name="clinicalDbContext">The database context for clinical operations, used to interact with patient allergy data.</param>
        /// <returns>An object indicating the success or failure of the operation.</returns>
        object UpdatePatientAllergy(RbacUser currentUser, PatientAllergyDTO patientAllergyDTO, ClinicalDbContext clinicalDbContext);
        object AddPatientFollowUpDays(RbacUser currentUser, ClinicalDbContext _clinicalDbContext, PatientFollowUp_DTO patientFollowUpDTO);

        object GetPatientFollowUpDetails(ClinicalDbContext clinicalDbContext, int patientId, int patientVisitId, bool isAcrossVisitAvailability);

        object GetBirthList(ClinicalDbContext clinicalDbContext, int PatientId, int patientVisitId, bool isAcrossVisitAvailability);
        object GetBabyDetailsByPatientId(ClinicalDbContext clinicalDbContext, int patientId);
        object UpdateBirthDetails(RbacUser currentUser, BabyBirthDetails_DTO babyBirthDetails_DTO, ClinicalDbContext clinicalDbContext);
        object GetBabyBirthCondition(ClinicalDbContext clinicalDbContext);
        object GetBirthCertificateNumbers(ClinicalDbContext clinicalDbContext);
        object AddBirthDetails(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<BabyBirthDetails_DTO> babyBirthDetails_DTOs);
        object GetUserWiseNotes(RbacUser currentUser, ClinicalDbContext _clinicalDbContext);

        object GetPatientVisitConsultantDoctors(ClinicalDbContext clinicalDbContext, int patientVisitId);
        Task<object> GetDoctorSignatoriesListAsync(ClinicalDbContext clinicalDbContext);
        Task<object> GetNurseSignatoriesListAsync(ClinicalDbContext clinicalDbContext);
        Task<object> GetDischargeTypeAsync(ClinicalDbContext clinicalDbContext);
        Task<object> GetDischargeConditionTypeAsync(ClinicalDbContext clinicalDbContext);
        Task<object> GetOperationTypeAsync(ClinicalDbContext clinicalDbContext);
        Task<object> AddDischargeInformationAsync(RbacUser currentUser, ClinicalDbContext clinicalDbContext, DischargeInformation_DTO dischargeInformation_DTO);
        Task <object> GetDischargeInformationAsync(ClinicalDbContext clinicalDbContext, int patientId, int PatientVisitId, bool isAcrossVisitAvailability);
        Task<object> GetAnaesthetistAsync(ClinicalDbContext clinicalDbContext);
        object GetVitalsTemplateByTemplateCode(string templateCode, int patientVisitId, ClinicalDbContext _clinicalDbContext);
        Task<object> GetClinicalPhrases(RbacUser currentUser, ClinicalDbContext _clinicalDbContext);

		object DeactivateDiagnosis(RbacUser currentUser, ClinicalDbContext clinicalDbContext, List<int> idList);
        object GetERPatientVisits(ClinicalDbContext clinicalDbContext, int? DoctorId, DateTime? FromDate, DateTime? ToDate,String FilterBy);
        object GetWardList(RbacUser currentUser, ClinicalDbContext _clinicalDbContext);

        object PutIntakeOutput(RbacUser currentUser, PostIntakeOutput_DTO PostInputOutputData, ClinicalDbContext clinicalDbContext);
        object DeactivatePatientIntakeOutput(RbacUser currentUser, int inputOutputId, ClinicalDbContext clinicalDbContext);

        object UpadteBloodSugar(RbacUser currentUser, ClinicalDbContext clinicalDbContext, BloodSugarModel bloodSugar);

        object DeactivatePatientBloodSugar(RbacUser currentUser, int BloodSugarMonitoringId, ClinicalDbContext clinicalDbContext);
        object DeactivatePatientAllergy(RbacUser currentUser, int patientId,int patientAllergyId, ClinicalDbContext clinicalDbContext);
        object CancelRequestedItem(RbacUser currentUser, int PatientId, int PatientVisitId, int RequisitionId, string Type, ClinicalDbContext clinicalDbContext);

    }
}
