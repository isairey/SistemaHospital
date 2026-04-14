using System.Data.Entity;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.ClinicalModel_New;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.OtModels;
using DanpheEMR.ServerModel.OTModels;

namespace DanpheEMR.DalLayer
{
    public class OtDbContext : DbContext
    {
        public DbSet<ServiceDepartmentModel> ServiceDepartment { get; set; }
        public DbSet<OTBookingDetailsModel> OTBookingDetails { get; set; }
        public DbSet<OTTeamInfoModel> OTTeamInfo { get; set; }
        public DbSet<OTCheckListInfoModel> OTCheckListOld { get; set; }
        public DbSet<OTSummaryModel> OTSummary { get; set; }
        public DbSet<PatientModel> Patient { get; set; }
        public DbSet<VisitModel> Visit { get; set; }
        public DbSet<EmployeeModel> Employees { get; set; }
        public DbSet<AdminParametersModel> CoreCfgParameter { get; set; }
        public DbSet<OTMachineModel> OTMachines { get; set; }
        public DbSet<OTPersonnelTypeModel> PersonnelType { get; set; }
        public DbSet<OTAnaesthesiaTypeModel> AnaesthesiaTypes { get; set; }
        public DbSet<OTAnaesthesiaModel> Anaesthesias { get; set; }
        public DbSet<ICD10CodeModel> ICDCode { get; set; }
        public DbSet<BillServiceItemModel> BillServiceItems { get; set; }
        public DbSet<BillServiceCategoryModel> BillServiceCategories { get; set; }
        public DbSet<BillMapPriceCategoryServiceItemModel> BillItemsPriceCategoryMaps { get; set; }
        public DbSet<EmployeeRoleModel> EmployeeRoles { get; set; }
        public DbSet<DepartmentModel> Departments { get; set; }
        public DbSet<EmployeeTypeModel> EmployeeType { get; set; }
        public DbSet<OTMSTCheckListModel> OTMSTCheckList { get; set; }
        public DbSet<CheckListInputTypeModel> CheckListInputTypes { get; set; }
        public DbSet<OTCheckListModel> OTTXNCheckList { get; set; }
        public DbSet<OTSurgeryModel> OTSurgery { get; set; }
        public DbSet<OTMapSurgeryCheckListModel> OTMapSurgeryCheckList { get; set; }
        public DbSet<OTImplantDetailModel> ImplantDetail { get; set; }
        public DbSet<OTMachineDetailModel> MachineDetail { get; set; }
        public DbSet<ClinicalTemplatesModel> ClinicalTemplates { get; set; }
        public DbSet<DiagnosisModel> Diagnoses { get; set; }
        public OtDbContext(string conn) : base(conn)
        {
            this.Configuration.LazyLoadingEnabled = true;
            this.Configuration.ProxyCreationEnabled = false;
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ServiceDepartmentModel>().ToTable("BIL_MST_ServiceDepartment");
            modelBuilder.Entity<OTBookingDetailsModel>().ToTable("OT_TXN_BookingDetails");
            modelBuilder.Entity<OTTeamInfoModel>().ToTable("OT_TXN_TeamInfo");
            modelBuilder.Entity<ClinicalTemplatesModel>().ToTable("CLN_MST_ClinicalTemplates");
            modelBuilder.Entity<OTCheckListInfoModel>().ToTable("OT_TXN_CheckListInfo");
            modelBuilder.Entity<OTSummaryModel>().ToTable("OT_TXN_Summary");
            modelBuilder.Entity<PatientModel>().ToTable("PAT_Patient");
            modelBuilder.Entity<EmployeeModel>().ToTable("EMP_Employee");
            modelBuilder.Entity<VisitModel>().ToTable("PAT_PatientVisits");
            modelBuilder.Entity<AdminParametersModel>().ToTable("CORE_CFG_Parameters");
            modelBuilder.Entity<OTMachineModel>().ToTable("OT_MST_Machines");
            modelBuilder.Entity<OTPersonnelTypeModel>().ToTable("OT_MST_PersonnelType");
            modelBuilder.Entity<OTAnaesthesiaTypeModel>().ToTable("OT_MST_AnaesthesiaType");
            modelBuilder.Entity<OTAnaesthesiaModel>().ToTable("OT_Map_AnaesthesiaServiceItem");
            modelBuilder.Entity<ICD10CodeModel>().ToTable("MST_ICD10");
            modelBuilder.Entity<BillServiceItemModel>().ToTable("BIL_MST_ServiceItem");
            modelBuilder.Entity<BillServiceCategoryModel>().ToTable("BIL_MST_ServiceCategory");
            modelBuilder.Entity<BillMapPriceCategoryServiceItemModel>().ToTable("BIL_MAP_PriceCategoryServiceItem");
            modelBuilder.Entity<EmployeeRoleModel>().ToTable("EMP_EmployeeRole");
            modelBuilder.Entity<DepartmentModel>().ToTable("MST_Department");
            modelBuilder.Entity<EmployeeTypeModel>().ToTable("EMP_EmployeeType");
            modelBuilder.Entity<OTMSTCheckListModel>().ToTable("OT_MST_CheckList");
            modelBuilder.Entity<OTCheckListModel>().ToTable("OT_TXN_CheckList");
            modelBuilder.Entity<CheckListInputTypeModel>().ToTable("OT_MST_CheckList_InputTypes");
            modelBuilder.Entity<OTSurgeryModel>().ToTable("OT_MST_Surgery");
            modelBuilder.Entity<OTMapSurgeryCheckListModel>().ToTable("OT_MAP_SurgeryCheckList");
            modelBuilder.Entity<OTImplantDetailModel>().ToTable("OT_TXN_ImplantDetail");
            modelBuilder.Entity<OTMachineDetailModel>().ToTable("OT_TXN_MachineDetail");
            modelBuilder.Entity<DiagnosisModel>().ToTable("CLN_Diagnosis");
        }

    }
}
