using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.LabModels;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.DalLayer
{
    public class ClinicalSettingDbContext : DbContext
    {
        public ClinicalSettingDbContext(string connString) : base(connString)
        {
        }
        public DbSet<SectionMappingModel> SectionMappings { get; set; }
        public DbSet<ClinicalMasterNotesMapping> ClinicalMasterNotesMappings { get; set; }
        public DbSet<ClinicalMasterNotesModel> ClinicalMasterNotes { get; set; }
        public DbSet<LabTestJSONComponentModel> LabTestComponents { get; set; }
        public DbSet<LabTestModel> LabTests { get; set; }
        public DbSet<LabTestCategoryModel> LabTestCategory { get; set; }

        public DbSet<ClinicalFieldOptionModel> ClinicalFieldOptions { get; set; }
        public DbSet<ClinicalFieldsQuestionaryOptionModel> ClinicalFieldsQuestionaryOptions { get; set; }
        public DbSet<ClinicalHeadingFieldsQuestionaryModel> ClinicalFieldsQuestionaries { get; set; }
        public DbSet<ClinicalHeadingsModel> ClinicalHeadings { get; set; }
        public DbSet<ChiefComplainsModel> ChiefComplains { get; set; }
        public DbSet<ClinicalNoteModel> ClinicalNotes { get; set; }
        public DbSet<PHRMPrescriptionItemModel> PHRMPrescriptionItem { get; set; }
        public DbSet<LabRequisitionModel> Requisitions { get; set; }
        public DbSet<LabTestComponentResult> TestComponentResults { get; set; }
        public DbSet<PatientModel> Patient { get; set; }
        public DbSet<PHRMItemMasterModel> PHRMItemMaster { get; set; }
        public DbSet<PHRMGenericModel> PHRMGeneric { get; set; }
        public DbSet<PHRMPrescriptionModel> PHRMPrescription { get; set; }
        public DbSet<ImagingRequisitionModel> RadiologyImagingRequisitions { get; set; }
        public DbSet<BillingTransactionItemModel> BillingTransactionItems { get; set; }
        public DbSet<ClinicalAssessmentAndPlanModel> ClinicalAssessmentAndPlan { get; set; }
        public DbSet<ServiceDepartmentModel> ServiceDepartment { get; set; }
        public DbSet<DepartmentModel> Department { get; set; }
        public DbSet<WardModel> Wards { get; set; }
        public DbSet<EmployeeModel> Employees { get; set; }
        public DbSet<ADTBedReservation> BedReservation { get; set; }
        public DbSet<CfgParameterModel> CFGParameters { get; set; }
        public DbSet<BedModel> Beds { get; set; }
        public DbSet<BedFeaturesMap> BedFeaturesMaps { get; set; }
        public DbSet<BedFeature> BedFeatures { get; set; }
        public DbSet<BillServiceItemModel> BillServiceItems { get; set; }
        public DbSet<BillMapPriceCategoryServiceItemModel> BillPriceCategoryServiceItems { get; set; }
        public DbSet<AdmissionModel> Admissions { get; set; }
        public DbSet<ClinicalHeadingFieldsSetupModel> ClinicalHeadingFieldsSetups { get; set; }
        public DbSet<ClnicalUserFieldMappingModel> ClnicalUserFieldMApping { get; set; }
        public DbSet<ClinicalIntakeOutputParameterModel> ClinicalIntakeOutputParameters { get; set; }
        public DbSet<ClinicalTemplatesModel> ClinicalTemplates{ get; set; }
        public DbSet<PreDevelopedComponentListModel> PreDevelopedComponentList { get; set; }
        public DbSet<VisitModel> Visits { get; set; }
        public DbSet<ClinicalPreDefinedTemplatesModel> ClinicalPreDefinedTemplates { get; set; }
        public DbSet<TreatmentCardexPlanModel> CardexPlan {  get; set; }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SectionMappingModel>().ToTable("CLN_Map_ClinicalDocumentAndFieldMapping");
            modelBuilder.Entity<ClinicalMasterNotesMapping>().ToTable("CLN_CFG_ClinicalNoteMapWithComponent");
            modelBuilder.Entity<ClinicalMasterNotesModel>().ToTable("CLN_MST_ClinicalNotesMaster");
            modelBuilder.Entity<ClinicalFieldOptionModel>().ToTable("CLN_MST_ClinicalFieldOption");
            modelBuilder.Entity<ClinicalTemplatesModel>().ToTable("CLN_MST_ClinicalTemplates");           
            modelBuilder.Entity<ClinicalFieldsQuestionaryOptionModel>().ToTable("CLN_MST_ClinicalQuestionOption");
            modelBuilder.Entity<ClinicalHeadingFieldsQuestionaryModel>().ToTable("CLN_MST_Questionnaire");
            modelBuilder.Entity<ClinicalHeadingsModel>().ToTable("CLN_Mst_ClinicalHeading");
            modelBuilder.Entity<ChiefComplainsModel>().ToTable("CLN_MST_ChiefComplain");
            modelBuilder.Entity<ClinicalNoteModel>().ToTable("CLN_MST_ClinicalNotes");
            modelBuilder.Entity<ClinicalAssessmentAndPlanModel>().ToTable("CLN_Txn_ClinicalNotes");
            modelBuilder.Entity<LabRequisitionModel>().ToTable("LAB_TestRequisition");
            modelBuilder.Entity<LabTestComponentResult>().ToTable("LAB_TXN_TestComponentResult");
            modelBuilder.Entity<PatientModel>().ToTable("PAT_Patient");
            modelBuilder.Entity<PHRMPrescriptionItemModel>().ToTable("PHRM_PrescriptionItems");
            modelBuilder.Entity<PHRMItemMasterModel>().ToTable("PHRM_MST_Item");
            modelBuilder.Entity<PHRMGenericModel>().ToTable("PHRM_MST_Generic");
            modelBuilder.Entity<PHRMPrescriptionModel>().ToTable("PHRM_Prescription");
            modelBuilder.Entity<ImagingRequisitionModel>().ToTable("RAD_PatientImagingRequisition");
            modelBuilder.Entity<BillingTransactionItemModel>().ToTable("BIL_TXN_BillingTransactionItems");
            modelBuilder.Entity<ServiceDepartmentModel>().ToTable("BIL_MST_ServiceDepartment");
            modelBuilder.Entity<DepartmentModel>().ToTable("MST_Department");
            modelBuilder.Entity<WardModel>().ToTable("ADT_MST_Ward");
            modelBuilder.Entity<EmployeeModel>().ToTable("EMP_Employee");
            modelBuilder.Entity<CfgParameterModel>().ToTable("CORE_CFG_Parameters");
            modelBuilder.Entity<ADTBedReservation>().ToTable("ADT_BedReservation");
            modelBuilder.Entity<BedModel>().ToTable("ADT_Bed");
            modelBuilder.Entity<BedFeaturesMap>().ToTable("ADT_MAP_BedFeaturesMap");
            modelBuilder.Entity<PatientModel>().ToTable("PAT_Patient");
            modelBuilder.Entity<BedFeature>().ToTable("ADT_MST_BedFeature");
            modelBuilder.Entity<BillServiceItemModel>().ToTable("BIL_MST_ServiceItem");
            modelBuilder.Entity<BillMapPriceCategoryServiceItemModel>().ToTable("BIL_MAP_PriceCategoryServiceItem");
            modelBuilder.Entity<AdmissionModel>().ToTable("ADT_PatientAdmission");
            modelBuilder.Entity<ClinicalHeadingFieldsSetupModel>().ToTable("CLN_MST_ClinicalField");
            modelBuilder.Entity<ClnicalUserFieldMappingModel>().ToTable("CLN_MAP_ClinicalUserFields");
            modelBuilder.Entity<ClinicalIntakeOutputParameterModel>().ToTable("CLN_MST_IntakeOutTakeParameter");
            modelBuilder.Entity<PreDevelopedComponentListModel>().ToTable("CLN_MST_PreDevelopedComponentList");
            modelBuilder.Entity<LabTestJSONComponentModel>().ToTable("Lab_MST_Components");
            modelBuilder.Entity<LabTestModel>().ToTable("LAB_LabTests");
            modelBuilder.Entity<LabTestCategoryModel>().ToTable("LAB_TestCategory");
            modelBuilder.Entity<VisitModel>().ToTable("PAT_PatientVisits");
            modelBuilder.Entity<ClinicalPreDefinedTemplatesModel>().ToTable("CLN_CFG_PredefinedTemplates");
            modelBuilder.Entity<TreatmentCardexPlanModel>().ToTable("CLN_TXN_TreatmentCardex");
        }
    }
}
