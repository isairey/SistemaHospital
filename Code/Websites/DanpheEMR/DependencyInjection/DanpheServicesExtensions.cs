using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels.POS.POSValidators;
using DanpheEMR.ServerModel.PharmacyModels.Validators;
using DanpheEMR.ServerModel.RadiologyModels;
using DanpheEMR.ServerModel.RadiologyModels.RadiologyValidators;
using DanpheEMR.Services;
using DanpheEMR.Services.Admission;
using DanpheEMR.Services.Admission.AdmissionMaster;
using DanpheEMR.Services.Admission.BedReservationServices;
using DanpheEMR.Services.Billing;
using DanpheEMR.Services.ClaimManagement;
using DanpheEMR.Services.Clinical_New;
using DanpheEMR.Services.Clinical_New.MedicalDiagnosis;
using DanpheEMR.Services.Dispensary;
using DanpheEMR.Services.DispensaryTransfer;
using DanpheEMR.Services.DynamicTemplates;
using DanpheEMR.Services.Emergency;
using DanpheEMR.Services.IMU;
using DanpheEMR.Services.Insurance;
using DanpheEMR.Services.Inventory.InventoryDonation;
using DanpheEMR.Services.Lab;
using DanpheEMR.Services.LIS;
using DanpheEMR.Services.MarketingReferral;
using DanpheEMR.Services.Maternity;
using DanpheEMR.Services.Medicare;
using DanpheEMR.Services.NewClinical;
using DanpheEMR.Services.OnlinePayment.FewaPay;
using DanpheEMR.Services.OnlinePayment.FonePay;
using DanpheEMR.Services.OT;
using DanpheEMR.Services.Patient;
using DanpheEMR.Services.Pharmacy.NarcoticLedger;
using DanpheEMR.Services.Pharmacy.PharmacyPO;
using DanpheEMR.Services.Pharmacy.Rack;
using DanpheEMR.Services.Pharmacy.SupplierLedger;
using DanpheEMR.Services.ProcessConfirmation;
using DanpheEMR.Services.ProvisionalDischarge;
using DanpheEMR.Services.QueueManagement;
using DanpheEMR.Services.Radiology;
using DanpheEMR.Services.SSF;
using DanpheEMR.Services.Utilities;
using DanpheEMR.Services.Vaccination;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DanpheEMR.DependencyInjection
{
    /*
        Author: Krishna, 
        Creation: 19thMay'23
        Purpose: 1. Make Startup Clean and Readable
                2. To Achieve Separation of Concerns
                3. Startup class was getting bulky, which leads to less  maintainable code.
                4. DI requires registration of services in the Startup.cs
                5. The number of registrations will increase and become cumbersome to maintain Startup.cs
    */
    public static class DanpheServicesExtensions
    {
        public static IServiceCollection AddDanpheServices(this IServiceCollection services, IConfigurationRoot configuration)
        {
            services.AddTransient<IRackService, RackService>();
            services.AddTransient<IInventoryCompanyService, InventoryCompanyService>();
            services.AddTransient<IDesignationService, DesignationService>();
            services.AddTransient<IInventoryReceiptNumberService, InventoryReceiptNumberService>();
            services.AddTransient<IInventoryGoodReceiptService, InventoryGoodReceiptService>();
            services.AddTransient<IEmailService, EmailService>();
            services.AddTransient<IFractionPercentService, FractionPercentService>();
            services.AddTransient<IFractionCalculationService, FractionCalculationService>();
            services.AddTransient<IVerificationService, VerificationService>();
            services.AddTransient<IDispensaryService, DispensaryService>();
            services.AddTransient<IDispensaryRequisitionService, DispensaryRequisitionService>();
            services.AddTransient<IMaternityService, MaternityService>();
            services.AddTransient<IDispensaryTransferService, DispensaryTransferService>();
            services.AddTransient<IActivateInventoryService, ActivateInventoryService>();
            services.AddTransient<IPharmacyPOService, PharmacyPOService>();
            services.AddTransient<IVaccinationService, VaccinationService>();
            services.AddTransient<ICssdItemService, CssdItemService>();
            services.AddTransient<ICssdReportService, CssdReportService>();
            services.AddTransient<INepaliReceiptService, NepaliReceiptService>();
            services.AddTransient<ISupplierLedgerService, SupplierLedgerService>();
            services.AddTransient<IFileUploadService, GoogleDriveFileUploadService>();
            services.AddTransient<ILISService, LISService>();
            services.AddTransient<IQueueManagementService, QueueManagementService>();
            services.AddTransient<IDonationService, DonationService>();
            services.AddTransient<IIMUService, IMUService>();
            services.AddTransient<ISSFService, SSFService>();
            services.AddTransient<IMedicareService, MedicareService>();
            services.AddTransient<IBillingMasterService, BillingMasterService>();
            services.AddTransient<IClaimManagementService, ClaimManagementService>();
            services.AddTransient<IUtilitiesService, UtilitiesService>();
            services.AddTransient<IProcessConfirmationService, ProcessConfirmationService>();
            services.AddTransient<IAdmissionMasterService, AdmissionMasterService>();
            services.AddTransient<IMarketingReferralService, MarketingReferralService>();
            services.AddTransient<IProvisionalDischargeService, ProvisionalDischargeService>();
            services.AddTransient<IDynamicTemplateService, DynamicTemplateService>();
            services.AddTransient<IOperationTheatreService, OperationTheatreService>();
            services.AddTransient<IClinicalSettingService, ClinicalSettingService>();
            services.AddTransient<IFonePayService, FonePayService>();

            services.AddTransient<IValidator<BillingTransactionModel>, BillingTransactionValidator>();
            services.AddTransient<IInsuranceService, InsuranceService>();
            services.AddTransient<IHIBClaimDocService, HIBClaimDocService>();
            services.AddTransient<IBedReservationService, BedReservationService>();
            services.AddTransient < INewClinicalService,ClinicalService>();
			services.AddScoped<IHIBClaimDocService, HIBClaimDocService>();
           
            services.AddTransient<IFewaPayService, FewaPayService>();
            services.AddTransient<IValidator<PHRMGoodsReceiptModel>, PHRMGoodReceiptValidator>();
            services.AddTransient<ILabService, LabService>();
            services.AddTransient<IPatientService, PatientService>();
            services.AddTransient<IMedicalDiagnosisService, MedicalDiagnosisService>();
            services.AddTransient<IHibLiveClaimService, HibLiveClaimService>();

            services.AddTransient<IRadiologySettingService, RadiologySettingService>();
            services.AddTransient <IValidator<TemplateStyleModel>, TemplateStyleValidator>();
            services.AddTransient<IAdmissionService, AdmissionService>();
            services.AddTransient<INarcoticLedgerService, NarcoticLedgerService>();
            services.AddTransient<IEmergencyService, EmergencyService>();
            return services;
        }
    }
}
