using DanpheEMR.Controllers.Clinical_New.DTO;
using DanpheEMR.Controllers.Settings.DTO;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.Services.Clinical_New.DTOs;
using DanpheEMR.Services.NewClinical;
using System.Collections.Generic;

namespace DanpheEMR.Services.Clinical_New
{
    public interface IClinicalSettingService
    {
        object GetClinicalFieldOption(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalFieldsQuestionaryOption(ClinicalSettingDbContext clinicalSettingDbContext);

        object GetClinicalFieldsQuestionary(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalHeading(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalParentHeading(ClinicalSettingDbContext clinicalSettingDbContext);  
        object GetClinicalHeadingFields(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalHeadingFieldSetup(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetChiefComplains(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalNote(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetLabItems(ClinicalSettingDbContext clinicalSettingDbContext,int PatientId,int PatientVisitId, bool IsAcrossVisitAvailability);
        object GetRequestedItems(ClinicalSettingDbContext clinicalSettingDbContext,int PatientId,int PatientVisitId, bool IsAcrossVisitAvailability);
        object GetClinicalNoteAndAssessmentPlan(ClinicalSettingDbContext clinicalSettingDbContext,int PatientId,int PatientVisitId);
        object GetRequestedImagingItems(ClinicalSettingDbContext clinicalSettingDbContext,int PatientId,int PatientVisitId);
        object GetRequestedMedicationItems(ClinicalSettingDbContext clinicalSettingDbContext,int PatientId, int PatientVisitId, bool IsAcrossVisitAvailability);
        object PostClinicalNote(RbacUser currentUser, ClinicalNote_DTO clinicalNotedto, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostChiefComplains(RbacUser currentUser, ChiefComplains_DTO chiefComplainsDTO, ClinicalSettingDbContext clinicalSettingDbContext);

        //object OrderMedicine(RbacUser currentUser, Medication_DTO medication_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object ClinicalAssessmentAndPlan(RbacUser currentUser, List<ClinicalAssessmentAndPlan_DTO> clinicalAssessmentAndPlan_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object SaveMedication(RbacUser currentUser, List<Medication_DTO> medication_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object SaveAdmission(RbacUser currentUser, BookAdmission_DTO bookAdmission_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateClinicalNote(RbacUser currentUser, ClinicalNote_DTO clinicalNotedto, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetDepartmentWardDoctorAndBedInfo(RbacUser currentUser, int patientId, ClinicalSettingDbContext clinicalSettingDbContext, MasterDbContext _masterDbContext);
        object GetBedList( ClinicalSettingDbContext clinicalSettingDbContext, int WardId, int BedFeatureId);
        object GetReservedBedList( ClinicalSettingDbContext clinicalSettingDbContext);
        object GetAvailableBeds(RbacUser currentUser, int wardId,int bedFeatureId, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetBedFeaturesByWard(RbacUser currentUser, int wardId,int priceCategoryId, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalHeadingFieldSetup(RbacUser currentUser, PostClinicalHeadingFieldSetup_DTO clinicalHeadingFieldSetup_DTO, ClinicalSettingDbContext _clinicalSettingDbContext);
        object UpdateClinicalHeadingFieldSetup(RbacUser currentUser, PutClinicalHeadingFieldSetup_DTO putClinicalHeadingFieldSetup_DTO, ClinicalSettingDbContext _clinicalSettingDbContext);
        object ActivateDeactivateChiefComplain(RbacUser currentUser, int chiefComplainId, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateChiefComplains(RbacUser currentUser, ChiefComplains_DTO chiefComplainsDTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalFieldMappings(ClinicalSettingDbContext clinicalSettingDbContext);
        object SaveOrUpdateUserFieldMappings(RbacUser currentUser, AddUpdateClinicalUserFieldMappings_DTO addUpdateClinicalUserFieldMappings_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object DepartmentList(ClinicalSettingDbContext clinicalSettingDbContext);
        object EmployeeList(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetUserFields(ClinicalSettingDbContext clinicalSettingDbContext, int selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalHeadingId);
        object GetClinicalSharedPhrases(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalPhrases(RbacUser currentUser, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalPhrases(RbacUser currentUser, ClinicalPhrases_DTO clinicalPhrases_DTO, ClinicalSettingDbContext _clinicalSettingDbContext);
        object UpdateClinicalPhrases(RbacUser currentUser, ClinicalPhrases_DTO clinicalPhrases_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateClinicalPhrases(RbacUser currentUser, int PredefinedTemplateId, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalTemplates(ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalTemplate(RbacUser currentUser, ClinicalTemplates_DTO clinicalTemplates_DTO, ClinicalSettingDbContext _clinicalSettingDbContext);
        object UpdateClinicalTemplate(RbacUser currentUser, ClinicalTemplates_DTO clinicalTemplates_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateClinicalTemplate(RbacUser currentUser, int templateId, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateHeadingField(RbacUser currentUser, int fieldId, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalFieldQuestionary(RbacUser currentUser, ClinicalHeadingFieldsQuestionary_DTO clinicalHeadingFieldsQuestionary_DTO, ClinicalSettingDbContext _clinicalSettingDbContext);
        object ActivateDeactivateClinicalFieldQuestionary(RbacUser currentUser, int questionId, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateClinicalFieldQuestionaryOption(RbacUser currentUser, int questionOptionId, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateIntakeOutputVariable(RbacUser currentUser, int selectedIntakeOutputDataId, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetIntakeOutputTypeForGrid(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetIntakeOutputType(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetIntakeTiming(ClinicalDbContext _clinicalDbContext);
        object ActivateDeactivateIntakeTime(RbacUser currentUser, int selectedIntakeTimingId, ClinicalDbContext _clinicalDbContext);
        object PostIntakeTime(RbacUser currentUser, MedicationIntakeModel clinicalIntakeTime, ClinicalDbContext _clinicalDbContext);
        object UpdateIntakeTime(RbacUser currentUser, MedicationIntakeModel clinicalIntakeTime, ClinicalDbContext _clinicalDbContext);
        object PostIntakeOutputVariable(RbacUser currentUser, ClinicalIntakeOutputParameterModel clinicalIntakeOutput, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateIntakeOutputVariable(RbacUser currentUser, ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalFieldOption(RbacUser currentUser, ClinicalFieldOption_DTO clinicalFieldOption_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateClinicalFieldOption(RbacUser currentUser, ClinicalFieldOption_DTO clinicalFieldOption_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateClinicalFieldOption(RbacUser currentUser, int clinicalOptionId, ClinicalSettingDbContext clinicalSettingDbContext);
        object PostClinicalHeading(RbacUser currentUser, ClinicalHeading_DTO clinicalHeading_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateClinicalHeading(RbacUser currentUser, ClinicalHeading_DTO clinicalHeading_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object ActivateDeactivateClinicalHeading(RbacUser currentUser, int clinicalHeadingId, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetPreTemplateComponentList(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetSmartPrintableTemplates(ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalNotes(ClinicalSettingDbContext clinicalSettingDbContext);
        object AddClinicalMasterNotes(RbacUser currentUser, ClinicalMasterNotes_DTO clinicalMasterNotes_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object UpdateClinicalMasterNotes(RbacUser currentUser, ClinicalMasterNotes_DTO clinicalMasterNotes_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetMedicalComponentList(ClinicalSettingDbContext clinicalSettingDbContext, int? selectedEmployeeId, int? selectedDepartmentId, int selectedClinicalNotesMasterId, int? childHeadingId, int? parentHeadingId);
        object ClinicalNotesMappings(RbacUser currentUser, ClinicalMasterNotesMapping_Dto clinicalMasterNotesMapping, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetFilteredMedicalComponentList(ClinicalSettingDbContext clinicalSettingDbContext,int? selectedEmployeeId,int? selectedDepartmentId,int selectedClinicalNotesMasterId,int parentHeadingId,int? childHeadingId, int? fieldId);
        object ActivateDeactivateClinicalNotes(RbacUser currentUser, int clinicalNotesMasterId, ClinicalSettingDbContext clinicalSettingDbContext);
        object AddSectionMappings(RbacUser currentUser, SectionMapping_DTO sectionMapping, ClinicalSettingDbContext clinicalSettingDbContext);
        object GetClinicalSectionMapping(ClinicalSettingDbContext clinicalSettingDbContext,int ClinicalHeadingId);
        object GetFilteredClinicalSectionMapping(ClinicalSettingDbContext clinicalSettingDbContext, int ClinicalHeadingId, string InputType, string GroupName);
        object UpdateMedication(RbacUser currentUser, Put_Medication_DTO medication_DTO, ClinicalSettingDbContext clinicalSettingDbContext);
        object DeactivatePrescriptionItem(RbacUser currentUser, int prescriptionItemId, ClinicalSettingDbContext clinicalSettingDbContext);
    }
}     
       

