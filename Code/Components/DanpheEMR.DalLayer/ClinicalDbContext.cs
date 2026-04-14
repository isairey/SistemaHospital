using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DanpheEMR.ServerModel;
using System.Data.Entity;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.PharmacyModels;
using DanpheEMR.ServerModel.ClinicalModels.Diet;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.ServerModel.ClinicalModels.BloodSugarMonitoring;
using DanpheEMR.ServerModel.ClinicalModels.ConsulationRequests;
using DanpheEMR.ServerModel.ClinicalModel_New;
using System.Data.SqlClient;
using System.Data;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.Services.NewClinical;
using DanpheEMR.ServerModel.CommonModels;

namespace DanpheEMR.DalLayer
{
    public class ClinicalDbContext : DbContext
    {
        public DbSet<DischargeInformationModel> DischargeInformation { get; set; }
        public DbSet<OperationTypeModel> OperationTypes { get; set; }

        public DbSet<DischargeConditionTypeModel> DischargeConditionTypes { get; set; }
        public DbSet<DischargeTypeModel> DischargeType { get; set; }
        public DbSet<EmployeeRoleModel> EmployeeRole { get; set; }
        public DbSet<PatientVisitConsultantsModel> PatientVisitConsultants { get; set; }

        public DbSet<BillingFiscalYear> ClinicalFiscalYear { get; set; }

        public DbSet<BirthConditionModel> BabyBirthCondition { get; set; }
        public DbSet<BabyBirthRecordModel> BabyBirthRecord { get; set; }
        public DbSet<MedicationIntakeModel> MedicationIntakes { get; set; }
        public DbSet<ClinicalMedicationFrequencyStandardModel> MedicationFrequencyStandards { get; set; }
        public DbSet<BedFeature> BedFeatures { get; set; }
        public DbSet<MedicalRecordModel> MedicalRecords { get; set; }
        public DbSet<CountrySubDivisionModel> CountrySubDivisions { get; set; }
      
        public DbSet<MunicipalityModel> Municipalities { get; set; }


		public DbSet<ClinicalInformationsModel> ClinicalInformations { get; set; }
		public DbSet<ClinicalOptionRecordsModel> ClinicalOptionRecords { get; set; }
		public DbSet<ClinicalQuestionAnswersModel> ClinicalQuestionAnswers { get; set; }
		public DbSet<ClinicalAnswerOptionsModel> ClinicalAnswerOptions { get; set; }

        public DbSet<PHRMStockMaster> StockMaster { get; set; }




		public DbSet<ClinicalFieldOptionModel> ClinicalFieldOptions { get; set; }
		public DbSet<PreDevelopedComponentListModel> PreDevelopedComponentList { get; set; }
		public DbSet<QuestionaryModel> Questionary { get; set; }
		public DbSet<ClinicalQuestionOptionModel> ClinicalQuestionOptions { get; set; }

		public DbSet<ClinicalUserFieldsMapModel> ClinicalUserFields { get; set; }
		public DbSet<ClinicalHeadingFieldsSetupModel> ClinicalHeadingFieldsSetups { get; set; }
		public DbSet<ClinicalHeadingsModel> ClinicalHeadings { get; set; }
		public DbSet<VitalsModel> Vitals { get; set; }
        public DbSet<AllergyModel> Allergy { get; set; }
        public DbSet<HomeMedicationModel> HomeMedications { get; set; }
        public DbSet<InputOutputModel> InputOutput { get; set; }
        public DbSet<MedicationPrescriptionModel> MedicationPrescriptions { get; set; }

        public DbSet<ActiveMedicalProblem> ActiveMedical { get; set; }

        public DbSet<PastMedicalProblem> PastMedicals { get; set; }
        public DbSet<FamilyHistory> FamilyHistory { get; set; }
        public DbSet<SocialHistory> SocialHistory { get; set; }
        public DbSet<SurgicalHistory> SurgicalHistory { get; set; }
        public DbSet<NotesModel> Notes { get; set; }
        public DbSet<ObjectiveNoteModel> ObjectiveNotes { get; set; }
        public DbSet<SubjectiveNoteModel> SubjectiveNotes { get; set; }
        public DbSet<EmployeeModel> Employee { get; set; }
        public DbSet<VisitModel> Visit { get; set; }


        public DbSet<DiagnosisModel> cln_diagnosis { get; set; }
        public DbSet<ClinicalDiagnosisModel> ClinicalDiagnosis { get; set; }
        public DbSet<LabRequisitionModel> LabRequisitions { get; set; }
        public DbSet<LabTestModel> LabTests { get; set; }
        public DbSet<ImagingRequisitionModel> ImagingRequisitions { get; set; }
        public DbSet<ImagingReportModel> ImagingReports { get; set; }
        public DbSet<PHRMPrescriptionItemModel> PHRMPrescriptionItems { get; set; }
        public DbSet<BillItemRequisition> BillItemRequisitions { get; set; }
        public DbSet<BillServiceItemModel> BillItemPrices { get; set; }
        public DbSet<ServiceDepartmentModel> ServiceDepartments { get; set; }
        public DbSet<DepartmentModel> Departments { get; set; }
        //Clinical Eye
        public DbSet<PatientImagesModel> PatientImages { get; set; }
        public DbSet<EyeModel> ClinicalEyeMaster { get; set; }
        public DbSet<RefractionModel> Refration { get; set; }
        public DbSet<AblationProfileModel> AblationProfile { get; set; }
        public DbSet<LaserDataEntryModel> LaserData { get; set; }
        public DbSet<PreOPPachymetryModel> PreOpPachymetry { get; set; }
        public DbSet<LASIKRSTModel> LasikRST { get; set; }
        public DbSet<SMILESSettingsModel> SmileSetting { get; set; }
        public DbSet<PachymetryModel> Pachymetry { get; set; }
        public DbSet<WavefrontModel> Wavefront { get; set; }
        public DbSet<ORAModel> ORA { get; set; }
        public DbSet<SmileIncisionsModel> SmileIncision { get; set; }
        public DbSet<EyeVisuMaxsModel> VisuMax { get; set; }
        public DbSet<OperationNotesModel> OperationNotes { get; set; }
        //  Precription-Slip 
        public DbSet<PrescriptionSlipModel> ClinicalPrescriptionSlipMaster { get; set; }
        public DbSet<AcceptanceModel> Acceptance { get; set; }
        public DbSet<DilateModel> Dilate { get; set; }
        public DbSet<HistoryModel> History { get; set; }
        public DbSet<IOPModel> IOP { get; set; }
        public DbSet<PlupModel> Plup { get; set; }
        public DbSet<RetinoscopyModel> Retinoscopy { get; set; }
        public DbSet<SchrimeModel> Schrime { get; set; }
        public DbSet<TBUTModel> TBUT { get; set; }
        public DbSet<VaUnaidedModel> Vaunaided { get; set; }
        public DbSet<FinalClassModel> FinalClass { get; set; }

        public DbSet<AdviceDiagnosisModel> AdviceDiagnosis { get; set; }
        public DbSet<EyeScanModel> EyeScan { get; set; }
        public DbSet<PatientModel> Patients { get; set; }

        public DbSet<ReferralSource> ReferralSource { get; set; }
        public DbSet<PHRMItemMasterModel> PHRMItemMaster { get; set; }
        public DbSet<CfgParameterModel> CFGParameters { get; set; }

        //public DbSet<FreeNotesModel> FreeNotes { get; set; }
        public DbSet<FreeTextNoteModel> FreeText { get; set; }
        public DbSet<EmergencyNoteModel> EmergencyNote { get; set; }
        public DbSet<ProcedureNoteModel> ProcedureNote { get; set; }
        public DbSet<ProgressNoteModel> ProgressNote { get; set; }

        public DbSet<DischargeSummaryModel> DischargeSummaryNote { get; set; }
        public DbSet<DischargeSummaryMedication> DischargeSummaryMedications { get; set; }
        public DbSet<NoteTypeModel> NoteType { get; set; }
        public DbSet<TemplateNoteModel> TemplateNotes { get; set; }
        public DbSet<ICD10CodeModel> ICD10 { get; set; }

        public DbSet<PatientClinicalInfoModel> PatientClinicalInfos { get; set; }
        public DbSet<PrescriptionNotesModel> ClinicalPrescriptionNote { get; set; }
        public DbSet<BillMapPriceCategoryServiceItemModel> BillPriceCategoryServiceItems { get; set; }
        public DbSet<FinalDiagnosisModel> FinalDiagnosis { get; set; }
        public DbSet<AppointmentModel> Appointment { get; set; }
        public DbSet<DietTypeModel> DietType { get; set; }
        public DbSet<PatientDietModel> PatientDiet { get; set; }
        public DbSet<WardModel> Wards { get; set; }
        public DbSet<AdmissionModel> Admission { get; set; }
        public DbSet<PatientBedInfo> PatientBedInfos { get; set; }
        public DbSet<BedModel> Beds { get; set; }
        public DbSet<PatientSchemeMapModel> PatientMapScheme { get; set; }
        public DbSet<BillingSchemeModel> Scheme { get; set; }
        public DbSet<BloodSugarModel> BloodSugar { get; set; }
        public DbSet<ConsultationRequestModel> ConsultationRequest { get; set; }
        public DbSet<ClinicalTemplatesModel> ClinicalTemplates { get; set; }
        public DbSet<ClinicalIntakeOutputParameterModel> ClinicalIntakeOutputParameters { get; set; }
        public DbSet<ClinicalVitalsModel> VitalsNew { get; set; }
        public DbSet<ClinicalVitalsTransactionModel> VitalsTransactionNew { get; set; }
        public DbSet<TreatmentCardexPlanModel> CardexPlan { get; set; }
        public DbSet<PHRMGenericModel> PHRMGeneric { get; set; }
        public DbSet<PHRMStoreStockModel> StoreStocks { get; set; }
        public DbSet<ChiefComplainsModel> ComplainsModels { get; set; }
        public DbSet<PatientComplaintsModel> PatientComplaints { get; set; }

        public DbSet<PatientMedicationModel> PatientMedications { get; set; }
        public DbSet<ClinicalPreDefinedTemplatesModel> ClinicalPreDefinedTemplatesModel { get; set; }
        public DbSet<BillingTransactionItemModel> BillingTransactionItems { get; set; }

        public ClinicalDbContext(string conn) : base(conn)
        {
            this.Configuration.LazyLoadingEnabled = true;
            this.Configuration.ProxyCreationEnabled = false;
        }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)

        {
            modelBuilder.Entity<BillingTransactionItemModel>().ToTable("BIL_TXN_BillingTransactionItems");
            modelBuilder.Entity<DischargeInformationModel>().ToTable("CLN_TXN_DischargeInformation");
            modelBuilder.Entity<OperationTypeModel>().ToTable("MR_MST_OperationType");

            modelBuilder.Entity<DischargeTypeModel>().ToTable("ADT_DischargeType");
            modelBuilder.Entity<DischargeConditionTypeModel>().ToTable("ADT_MST_DischargeConditionType");
            modelBuilder.Entity<EmployeeRoleModel>().ToTable("EMP_EmployeeRole");
            modelBuilder.Entity<PatientVisitConsultantsModel>().ToTable("PAT_PatientVisitConsultants");
            modelBuilder.Entity<BillingFiscalYear>().ToTable("BIL_CFG_FiscalYears");
            modelBuilder.Entity<BirthConditionModel>().ToTable("ADT_MST_BabyBirthCondition");
            modelBuilder.Entity<BabyBirthRecordModel>().ToTable("ADT_BabyBirthDetails");
            modelBuilder.Entity<PatientComplaintsModel>().ToTable("CLN_TXN_ChiefComplaints");
            modelBuilder.Entity<ChiefComplainsModel>().ToTable("CLN_MST_ChiefComplain");
            modelBuilder.Entity<LabTestModel>().ToTable("LAB_LabTests");
            modelBuilder.Entity<MedicationIntakeModel>().ToTable("CLN_MST_MedicationIntakeData");
            modelBuilder.Entity<ClinicalMedicationFrequencyStandardModel>().ToTable("CLN_MST_MedicationFrequencyStandard");
            modelBuilder.Entity<MedicalRecordModel>().ToTable("MR_RecordSummary");
            modelBuilder.Entity<CountrySubDivisionModel>().ToTable("MST_CountrySubDivision");
            modelBuilder.Entity<MunicipalityModel>().ToTable("MST_Municipality");
            modelBuilder.Entity<BedFeature>().ToTable("ADT_MST_BedFeature");

			modelBuilder.Entity<ClinicalInformationsModel>().ToTable("CLN_TXN_ClinicalInformations");
			modelBuilder.Entity<ClinicalOptionRecordsModel>().ToTable("CLN_TXN_ClinicalOptionRecords");
			modelBuilder.Entity<ClinicalQuestionAnswersModel>().ToTable("CLN_TXN_ClinicalQuestionAnswers");
			modelBuilder.Entity<ClinicalAnswerOptionsModel>().ToTable("CLN_TXN_ClinicalAnswerOptions");

			modelBuilder.Entity<ClinicalFieldOptionModel>().ToTable("CLN_MST_ClinicalFieldOption");
		    modelBuilder.Entity<PreDevelopedComponentListModel>().ToTable("CLN_MST_PreDevelopedComponentList");
		    modelBuilder.Entity<QuestionaryModel>().ToTable("CLN_MST_Questionnaire");
		    modelBuilder.Entity<ClinicalQuestionOptionModel>().ToTable("CLN_MST_ClinicalQuestionOption");
            modelBuilder.Entity<ClinicalTemplatesModel>().ToTable("CLN_MST_ClinicalTemplates");

            modelBuilder.Entity<ClinicalUserFieldsMapModel>().ToTable("CLN_MAP_ClinicalUserFields");

			modelBuilder.Entity<ClinicalHeadingFieldsSetupModel>().ToTable("CLN_MST_ClinicalField");
			modelBuilder.Entity<ClinicalHeadingsModel>().ToTable("CLN_Mst_ClinicalHeading");


			modelBuilder.Entity<VitalsModel>().ToTable("CLN_PatientVitals");
            modelBuilder.Entity<AllergyModel>().ToTable("CLN_Allergies");
            modelBuilder.Entity<InputOutputModel>().ToTable("CLN_InputOutput");
            modelBuilder.Entity<HomeMedicationModel>().ToTable("CLN_HomeMedications");
            modelBuilder.Entity<MedicationPrescriptionModel>().ToTable("CLN_MedicationPrescription");

            modelBuilder.Entity<ActiveMedicalProblem>().ToTable("CLN_ActiveMedicals");
            modelBuilder.Entity<PastMedicalProblem>().ToTable("CLN_PastMedicals");

            modelBuilder.Entity<FamilyHistory>().ToTable("CLN_FamilyHistory");
            modelBuilder.Entity<SocialHistory>().ToTable("CLN_SocialHistory");
            modelBuilder.Entity<SurgicalHistory>().ToTable("CLN_SurgicalHistory");
            modelBuilder.Entity<ReferralSource>().ToTable("CLN_ReferralSource");

            modelBuilder.Entity<NotesModel>().ToTable("CLN_Notes");
            modelBuilder.Entity<ObjectiveNoteModel>().ToTable("CLN_Notes_Objective");
            modelBuilder.Entity<SubjectiveNoteModel>().ToTable("CLN_Notes_Subjective");
            modelBuilder.Entity<EmployeeModel>().ToTable("EMP_Employee");
            modelBuilder.Entity<VisitModel>().ToTable("PAT_PatientVisits");
            modelBuilder.Entity<DiagnosisModel>().ToTable("CLN_Diagnosis");
           // modelBuilder.Entity<ClinicalDiagnosisModel>().ToTable("CLN_Diagnosis");
            modelBuilder.Entity<LabRequisitionModel>().ToTable("LAB_TestRequisition");
            modelBuilder.Entity<ImagingRequisitionModel>().ToTable("RAD_PatientImagingRequisition");
            modelBuilder.Entity<ImagingReportModel>().ToTable("RAD_PatientImagingReport");
            modelBuilder.Entity<PHRMPrescriptionItemModel>().ToTable("PHRM_PrescriptionItems");
            modelBuilder.Entity<BillItemRequisition>().ToTable("BIL_BillItemRequisition");
            modelBuilder.Entity<BillServiceItemModel>().ToTable("BIL_MST_ServiceItem");
            modelBuilder.Entity<ServiceDepartmentModel>().ToTable("BIL_MST_ServiceDepartment");
            modelBuilder.Entity<PatientImagesModel>().ToTable("CLN_PAT_Images");
            modelBuilder.Entity<EyeScanModel>().ToTable("CLN_EyeScanImages");
            modelBuilder.Entity<DepartmentModel>().ToTable("MST_Department");

            //Clinical Eye Model
            modelBuilder.Entity<EyeModel>().ToTable("CLN_MST_EYE");
            modelBuilder.Entity<RefractionModel>().ToTable("CLN_EYE_Refraction");
            modelBuilder.Entity<AblationProfileModel>().ToTable("CLN_EYE_Ablation_Profile");
            modelBuilder.Entity<LaserDataEntryModel>().ToTable("CLN_EYE_Laser_DataEntry");
            modelBuilder.Entity<PreOPPachymetryModel>().ToTable("CLN_EYE_PreOP_Pachymetry");
            modelBuilder.Entity<LASIKRSTModel>().ToTable("CLN_EYE_LasikRST");
            modelBuilder.Entity<SMILESSettingsModel>().ToTable("CLN_EYE_Smile_Setting");
            modelBuilder.Entity<PachymetryModel>().ToTable("CLN_EYE_Pachymetry");
            modelBuilder.Entity<WavefrontModel>().ToTable("CLN_EYE_Wavefront");
            modelBuilder.Entity<ORAModel>().ToTable("CLN_EYE_ORA");
            modelBuilder.Entity<SmileIncisionsModel>().ToTable("CLN_EYE_Smile_Incisions");
            modelBuilder.Entity<EyeVisuMaxsModel>().ToTable("CLN_EYE_VisuMax");
            modelBuilder.Entity<OperationNotesModel>().ToTable("CLN_EYE_OperationNotes");

            //PrecsriptionSlip Model
            modelBuilder.Entity<PrescriptionSlipModel>().ToTable("CLN_MST_PrescriptionSlip");
            modelBuilder.Entity<AcceptanceModel>().ToTable("CLN_PrescriptionSlip_Acceptance");
            modelBuilder.Entity<DilateModel>().ToTable("CLN_PrescriptionSlip_Dilate");
            modelBuilder.Entity<HistoryModel>().ToTable("CLN_PrescriptionSlip_History");
            modelBuilder.Entity<TBUTModel>().ToTable("CLN_PrescriptionSlip_TBUT");
            modelBuilder.Entity<IOPModel>().ToTable("CLN_PrescriptionSlip_IOP");
            modelBuilder.Entity<PlupModel>().ToTable("CLN_PrescriptionSlip_Plup");
            modelBuilder.Entity<RetinoscopyModel>().ToTable("CLN_PrescriptionSlip_Retinoscopy");
            modelBuilder.Entity<SchrimeModel>().ToTable("CLN_PrescriptionSlip_Schrime");
            modelBuilder.Entity<VaUnaidedModel>().ToTable("CLN_PrescriptionSlip_VaUnaided");
            modelBuilder.Entity<AdviceDiagnosisModel>().ToTable("CLN_PrescriptionSlip_AdviceDiagnosis");
            modelBuilder.Entity<FinalClassModel>().ToTable("CLN_PrescriptionSlip_FinalClass");
            modelBuilder.Entity<PatientModel>().ToTable("PAT_Patient");
            modelBuilder.Entity<PHRMItemMasterModel>().ToTable("PHRM_MST_Item");

            // Template-notes
            modelBuilder.Entity<FreeTextNoteModel>().ToTable("CLN_Notes_FreeText");
            modelBuilder.Entity<ProcedureNoteModel>().ToTable("CLN_Notes_Procedure");
            modelBuilder.Entity<EmergencyNoteModel>().ToTable("CLN_Notes_Emergency");
            modelBuilder.Entity<ProgressNoteModel>().ToTable("CLN_Notes_Progress");

            modelBuilder.Entity<DischargeSummaryModel>().ToTable("ADT_DischargeSummary");
            modelBuilder.Entity<DischargeSummaryMedication>().ToTable("ADT_DischargeSummaryMedication");
            modelBuilder.Entity<NoteTypeModel>().ToTable("CLN_MST_NoteType");
            modelBuilder.Entity<TemplateNoteModel>().ToTable("CLN_Template");
            modelBuilder.Entity<ICD10CodeModel>().ToTable("MST_ICD10");
            modelBuilder.Entity<PatientClinicalInfoModel>().ToTable("CLN_KV_PatientClinical_Info");
            modelBuilder.Entity<PrescriptionNotesModel>().ToTable("CLN_Notes_PrescriptionNote");
            modelBuilder.Entity<BillMapPriceCategoryServiceItemModel>().ToTable("BIL_MAP_PriceCategoryServiceItem");
            modelBuilder.Entity<FinalDiagnosisModel>().ToTable("MR_TXN_Outpatient_FinalDiagnosis");

            modelBuilder.Entity<AppointmentModel>().ToTable("PAT_Appointment");
            modelBuilder.Entity<ConsultationRequestModel>().ToTable("CLN_ConsultationRequest");

            modelBuilder.Entity<PatientBedInfo>().ToTable("ADT_TXN_PatientBedInfo");
            modelBuilder.Entity<BedModel>().ToTable("ADT_Bed");
            modelBuilder.Entity<CfgParameterModel>().ToTable("CORE_CFG_Parameters");
            modelBuilder.Entity<WardModel>().ToTable("ADT_MST_Ward");
            modelBuilder.Entity<DietTypeModel>().ToTable("CLN_MST_DietType");
            modelBuilder.Entity<PatientDietModel>().ToTable("CLN_TXN_PatientDiet");
            modelBuilder.Entity<WardModel>().ToTable("ADT_MST_Ward");
            modelBuilder.Entity<AdmissionModel>().ToTable("ADT_PatientAdmission");
            modelBuilder.Entity<PatientBedInfo>().ToTable("ADT_TXN_PatientBedInfo");
            modelBuilder.Entity<BedModel>().ToTable("ADT_Bed");
            modelBuilder.Entity<PatientSchemeMapModel>().ToTable("PAT_MAP_PatientSchemes");
            modelBuilder.Entity<BillingSchemeModel>().ToTable("BIL_CFG_Scheme");
            modelBuilder.Entity<AdmissionModel>().ToTable("ADT_PatientAdmission");
            modelBuilder.Entity<BloodSugarModel>().ToTable("CLN_BloodSugarMonitoring");
            modelBuilder.Entity<ClinicalIntakeOutputParameterModel>().ToTable("CLN_MST_IntakeOutTakeParameter");

            modelBuilder.Entity<ClinicalVitalsModel>().ToTable("CLN_MST_Vitals");
            modelBuilder.Entity<ClinicalVitalsTransactionModel>().ToTable("CLN_TXN_Vitals");
            modelBuilder.Entity<TreatmentCardexPlanModel>().ToTable("CLN_TXN_TreatmentCardex");
            modelBuilder.Entity<PHRMGenericModel>().ToTable("PHRM_MST_Generic");
            modelBuilder.Entity<PHRMStoreStockModel>().ToTable("PHRM_TXN_StoreStock");
            modelBuilder.Entity<PHRMStockMaster>().ToTable("PHRM_MST_Stock");
            modelBuilder.Entity<PatientMedicationModel>().ToTable("CLN_TXN_Patient_Medications");
            modelBuilder.Entity<ClinicalPreDefinedTemplatesModel>().ToTable("CLN_CFG_PredefinedTemplates");
            //Vitals and visit mappings
            modelBuilder.Entity<VitalsModel>()
                        .HasRequired<VisitModel>(a => a.Visit)
                        .WithMany(a => a.Vitals)
                        .HasForeignKey(a => a.PatientVisitId);

            // Patient and Allergy mapping
            modelBuilder.Entity<AllergyModel>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.Allergies)
                    .HasForeignKey(s => s.PatientId);

            //Vitals and inputoutput mappings
            modelBuilder.Entity<InputOutputModel>()
                        .HasRequired<VisitModel>(a => a.Visit)
                        .WithMany(a => a.InputOutput)
                        .HasForeignKey(a => a.PatientVisitId);

            // Patient and MedicationPrescription
            modelBuilder.Entity<MedicationPrescriptionModel>()
                .HasRequired<PatientModel>(m => m.Patient)
                .WithMany(p => p.MedicationPrescriptions)
                .HasForeignKey(m => m.PatientId);

            // Patient and HomeMedications
            modelBuilder.Entity<HomeMedicationModel>()
                .HasRequired<PatientModel>(h => h.Patient)
                .WithMany(p => p.HomeMedication)
                .HasForeignKey(h => h.PatientId);


            // Patient and activemedical mappings
            modelBuilder.Entity<ActiveMedicalProblem>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.Problems)
                    .HasForeignKey(s => s.PatientId);

            // Patient and pastMedical list mappings
            modelBuilder.Entity<PastMedicalProblem>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.PastMedicals)
                    .HasForeignKey(s => s.PatientId);

            //Patient and FamilyHistory list mappings
            modelBuilder.Entity<FamilyHistory>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.FamilyHistory)
                    .HasForeignKey(s => s.PatientId);

            //Patient and SurgicalHistory list mappings=
            modelBuilder.Entity<SurgicalHistory>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.SurgicalHistory)
                    .HasForeignKey(s => s.PatientId);

            //Patient and SocialHistory list mappings
            modelBuilder.Entity<SocialHistory>()
                   .HasRequired<PatientModel>(a => a.Patient)
                   .WithMany(a => a.SocialHistory)
                    .HasForeignKey(s => s.PatientId);
        }

 
    }

}

