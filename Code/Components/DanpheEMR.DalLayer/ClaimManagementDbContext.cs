using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.BillingModels.POS;
using DanpheEMR.ServerModel.ClaimManagementModels;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.InsuranceModels;
using DanpheEMR.ServerModel.PharmacyModels;
using System.Data.Entity;

namespace DanpheEMR.DalLayer
{
    public class ClaimManagementDbContext : DbContext
    {
        public ClaimManagementDbContext(string connString) : base(connString)
        {
        }

        public DbSet<CreditOrganizationModel> CreditOrganization { get; set; }
        public DbSet<BillingTransactionCreditBillStatusModel> BillingCreditBillStatus { get; set; }
        public DbSet<PHRMTransactionCreditBillStatus> PharmacyCreditBillStatus { get; set; }
        public DbSet<InsuranceClaim> InsuranceClaim { get; set; }
        public DbSet<TXNUploadedFile> TXNUploadedFile { get; set; }
        public DbSet<AdminParametersModel> CoreCfgParameter { get; set; }
        public DbSet<InsuranceClaimPayment> InsuranceClaimPayment { get; set; }
        public DbSet<BillInvoiceReturnModel> BILLInvoiceReturn { get; set; }
        public DbSet<PHRMInvoiceReturnModel> PHRMInvoiceReturn { get; set; }
        public DbSet<BillingTransactionItemModel> BillTxnItem { get; set; }
        public DbSet<BillingTransactionModel> BillTxn { get; set; }
        public DbSet<PHRMInvoiceTransactionItemsModel> PHRMInvoiceTransactionItems { get; set; }
        public DbSet<PHRMInvoiceTransactionModel> PHRMInvoiceTransaction { get; set; }
        public DbSet<BillingTransactionCreditBillItemStatusModel> BillingCreditBillItemStatus { get; set; }
        public DbSet<PHRMTransactionCreditBillItemStatusModel> PharmacyCreditBillItemStatus { get; set; }
        public DbSet<BillingSchemeModel> Schemes { get; set; }
        public DbSet<InsuranceClaimAPIResponse> insuranceClaimAPIResponses { get; set; }
        public DbSet<INS_ClaimDocResponseDetails> InsuranceClaimDocResponseDetails { get; set; }
        public DbSet<ICD10CodeModel> ICD10Codes { get; set; }
        public DbSet<EmployeeModel> EmployeeModels { get; set; }
        public DbSet<DiagnosisModel> Diagnosis { get; set; }
        public DbSet<VisitModel> PatientVisits { get; set; }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CreditOrganizationModel>().ToTable("BIL_MST_Credit_Organization");
            modelBuilder.Entity<BillingTransactionCreditBillStatusModel>().ToTable("BIL_TXN_CreditBillStatus");
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>().ToTable("PHRM_TXN_CreditBillStatus");
            modelBuilder.Entity<InsuranceClaim>().ToTable("INS_TXN_InsuranceClaim");
            modelBuilder.Entity<TXNUploadedFile>().ToTable("TXN_UploadedFile");
            modelBuilder.Entity<AdminParametersModel>().ToTable("CORE_CFG_Parameters");
            modelBuilder.Entity<InsuranceClaimPayment>().ToTable("INS_TXN_ClaimPayment");
            modelBuilder.Entity<BillInvoiceReturnModel>().ToTable("BIL_TXN_InvoiceReturn");
            modelBuilder.Entity<PHRMInvoiceReturnModel>().ToTable("PHRM_TXN_InvoiceReturn");
            modelBuilder.Entity<BillingTransactionItemModel>().ToTable("BIL_TXN_BillingTransactionItems");
            modelBuilder.Entity<BillingTransactionModel>().ToTable("BIL_TXN_BillingTransaction");
            modelBuilder.Entity<PHRMInvoiceTransactionItemsModel>().ToTable("PHRM_TXN_InvoiceItems");
            modelBuilder.Entity<PHRMInvoiceTransactionModel>().ToTable("PHRM_TXN_Invoice");
            modelBuilder.Entity<BillingTransactionCreditBillItemStatusModel>().ToTable("BIL_TXN_CreditBillItemStatus");
            modelBuilder.Entity<PHRMTransactionCreditBillItemStatusModel>().ToTable("PHRM_TXN_CreditBillItemStatus");
            modelBuilder.Entity<BillingSchemeModel>().ToTable("BIL_CFG_Scheme");
            modelBuilder.Entity<InsuranceClaimAPIResponse>().ToTable("INS_LOG_ClaimApiResponse");
            modelBuilder.Entity<INS_ClaimDocResponseDetails>().ToTable("GovIns_ClaimDocResponseDetails");
            modelBuilder.Entity<ICD10CodeModel>().ToTable("MST_ICD10");
            modelBuilder.Entity<EmployeeModel>().ToTable("Emp_Employee");  
            modelBuilder.Entity<DiagnosisModel>().ToTable("CLN_Diagnosis");  
            modelBuilder.Entity<VisitModel>().ToTable("PAT_PatientVisits");  
                

            //setting decimal datatype with precision : 16 and scale : 4
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.NetReceivableAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.NonClaimableAmount)
                .HasPrecision(16, 4);

            modelBuilder.Entity<PHRMTransactionCreditBillItemStatusModel>()
                .Property(p => p.NetTotalAmount)
                .HasPrecision(16,4);

            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.TotalBillAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.ClaimableAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.NonClaimableAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.ClaimedAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.ApprovedAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<InsuranceClaim>()
                .Property(p => p.RejectedAmount)
                .HasPrecision(16, 4);

            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.SalesTotalBillAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.ReturnTotalBillAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.CoPayReceivedAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.CoPayReturnAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.NetReceivableAmount)
                .HasPrecision(16, 4);
            modelBuilder.Entity<PHRMTransactionCreditBillStatus>()
                .Property(p => p.NonClaimableAmount)
                .HasPrecision(16, 4);
        }
    }

}
