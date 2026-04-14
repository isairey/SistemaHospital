using DocumentFormat.OpenXml.Drawing;

namespace DanpheEMR.Enums
{

    //Don't get confused with naming convention, we're using static class + constants instead of enums because enum gave issues while using in LINQ.
    //Also We're using strings in our database, where enum gives number values, so..
    //sud:9Aug'19

    public static class ENUM_DoctorRoles
    {
        public static readonly string Doctor = "Doctor";
        public static readonly string MO = "M.O.";
        public static readonly string SeniorMOHospitalDirector = "Senior MO/Hospital Director";
    }

    public static class ENUM_NurseRoles
    {
        public static readonly string Nurse = "Nurse";
        public static readonly string StaffNurseIncharge = "Staff Nurse  (Incharge)";
        public static readonly string StaffNurse = "Staff Nurse";
        public static readonly string SeniorStaffNurseIncharge = "Senior Staff Nurse(incharge)";
        public static readonly string NursingOfficer = "Nursing Officer";
        public static readonly string NursingOfficerIncharge = "Nurisng Officer (Incharge)";
        public static readonly string CMA = "C.M.A.";
        public static readonly string CMAIncharge = "C.M.A. (Incharge)";
        public static readonly string ANM = "A.N.M";
        public static readonly string ANMIncharge = "A.N.M. (Incharge)";

    }

    public static class ENUM_BillingStatus
    {
        public static readonly string paid = "paid";
        public static readonly string unpaid = "unpaid";
        public static readonly string provisional = "provisional";
        public static readonly string cancel = "cancel";
        public static readonly string returned = "returned";
        public static readonly string free = "free";
        public static readonly string adtCancel = "adtCancel";//this needs review on what it's impacts are.
        public static readonly string discard = "discarded"; //this is for provisional discharged patients Provisional Items if discarded
    }

    public static class ENUM_BillingType
    {
        public static readonly string inpatient = "inpatient";
        public static readonly string outpatient = "outpatient";
    }


    public static class ENUM_BillPaymentMode
    {
        public static readonly string cash = "cash";
        public static readonly string credit = "credit";
    }

    public static class ENUM_DepositTransactionType
    {
        public static readonly string Deposit = "Deposit";
        public static readonly string ReturnDeposit = "ReturnDeposit";
        public static readonly string DepositDeduct = "depositdeduct";
        public static readonly string DepositCancel = "depositcancel";
    }

    public static class ENUM_EMP_CashTransactinType
    {
        public static readonly string CollectionFromReceivable = "CollectionFromReceivable";
        public static readonly string CashDiscountGiven = "CashDiscountGiven";
        public static readonly string CashSales = "CashSales";
        public static readonly string Deposit = "Deposit";
        public static readonly string SalesReturn = "SalesReturn";
        public static readonly string ReturnDeposit = "ReturnDeposit";
        public static readonly string depositdeduct = "depositdeduct";
        public static readonly string HandoverGiven = "HandoverGiven";
        public static readonly string MaternityAllowance = "MaternityAllowance";
        public static readonly string MaternityAllowanceReturn = "MaternityAllowanceReturn";
        public static readonly string CashDiscountReceived = "CashDiscountReceived";
        public static readonly string SchemeRefund = "SchemeRefund";

    }
    public static class ENUM_InvoiceType
    {
        public static readonly string inpatientPartial = "ip-partial";
        public static readonly string inpatientDischarge = "ip-discharge";
        public static readonly string outpatient = "op-normal";
    }

    public static class ENUM_AdmissionStatus
    {
        public static readonly string discharged = "discharged";
        public static readonly string admitted = "admitted";
        public static readonly string transfer = "transfer";
    }


    public static class ENUM_VisitType
    {
        public static readonly string inpatient = "inpatient";
        public static readonly string outpatient = "outpatient";
        public static readonly string emergency = "emergency";
        public static readonly string outdoor = "outdoor"; //This is for outdoot patients(running patients) that visit hospital not for consultations but for other services
    }

    public static class ENUM_AppointmentType
    {
        public static readonly string New = "New"; //In client side, this property name is : new  (with small 'n')
        public static readonly string followup = "followup";
        public static readonly string transfer = "Transfer";
        public static readonly string referral = "Referral";
        public static readonly string revisit = "Revisit";
    }

    public static class ENUM_VisitStatus
    {
        public static readonly string initiated = "initiated";
        public static readonly string cancel = "cancel";
        public static readonly string concluded = "concluded";
        public static readonly string checkedin = "checkedin";

    }

    public static class ENUM_PriceCategory
    {
        public static readonly string Normal = "Normal";
        public static readonly string EHS = "EHS";
        public static readonly string Foreigner = "Foreigner";
        public static readonly string SAARCCitizen = "SAARCCitizen";
        public static readonly string SSF = "SSF";
    }

    public static class ENUM_LabOrderStatus
    {
        public static readonly string Active = "active";
        public static readonly string SamplePending = "sample-pending";
        public static readonly string Pending = "pending";
        public static readonly string ResultAdded = "result-added";
        public static readonly string ReportGenerated = "report-generated";
    }

    public static class ENUM_LabTemplateType
    {
        public static readonly string normal = "normal";
        public static readonly string html = "html";
        public static readonly string culture = "culture";
    }
    public static class ENUM_LabRunNumType
    {
        public static readonly string histo = "histo";
        public static readonly string cyto = "cyto";
        public static readonly string normal = "normal";
    }

    public static class ENUM_LabUrgency
    {
        public static readonly string Urgent = "urgent";
        public static readonly string Normal = "normal";
        public static readonly string STAT = "STAT";
    }

    public static class ENUM_NoteType
    {
        public static readonly string HAndP = "H&P";
        public static readonly string ProgressNote = "ProgressNote";
        public static readonly string ConsultNote = "ConsultNote";
        public static readonly string DischargeNote = "DischargeNote";
        public static readonly string EmergencyNote = "EmergencyNote";
        public static readonly string Procedure = "Procedure";
    }
    public static class ENUM_StockLocation
    {
        public static readonly int Dispensary = 1;
        public static readonly int Store = 2;
    }
    //TODO: This is incomplete. Need to identify all transactions and complete this enum.
    public static class ENUM_PHRM_StockTransactionType
    {
        public static readonly string PurchaseItem = "gr-item";
        public static readonly string PurchaseReturnedItem = "rts-item";
        public static readonly string CancelledGR = "cancel-gr-item";

        public static readonly string WriteOffItem = "write-off-item";

        public static readonly string SaleItem = "sale-item";
        public static readonly string SaleReturnedItem = "sale-returned-item";
        public static readonly string ManualSaleReturnedItem = "manual-sales-return";

        public static readonly string ProvisionalSaleItem = "provisional-sale-item";
        public static readonly string ProvisionalCancelItem = "provisional-cancel-item";
        public static readonly string ProvisionalToSale = "provisional-to-sale";
        public static readonly string PatientConsumptionCancel = "ret-pat-consumption-item";
        public static readonly string PatientConsumptionToSale = " pat-consumption-to-sale";

        public static readonly string DispatchedItem = "dispensary-dispatched-item";
        public static readonly string DispatchedItemReceivingSide = "dispatched-item";

        public static readonly string TransferItem = "transfer-item";

        public static readonly string StockManage = "stock-managed-item";

        public static readonly string DonationItem = "donated-item";
        public static readonly string CancelDonationItem = "cancelled-donated-item";

        public static readonly string SubStoreDispatchFrom = "dispatch-item-from";
        public static readonly string SubStoreDispatchTo = "dispatch-item-to";

        public static readonly string PHRMSubStoreConsumption = "consumption-items";

        public static readonly string PHRMPatientConsumption = "pat-consumption-item";

    }
    public static class ENUM_INV_StockTransactionType
    {
        public static readonly string OpeningItem = "opening-item";

        public static readonly string PurchaseItem = "goodreceipt-items";
        public static readonly string PurchaseReturnedItem = "returntovendor-items";
        public static readonly string CancelledGR = "cancel-gr-items";

        public static readonly string WriteOffItem = "writeoff-items";

        public static readonly string DispatchedItem = "dispatched-item-from";
        public static readonly string DispatchedItemReceivingSide = "dispatched-item-to";

        public static readonly string ReturnedItem = "returned-item-from";
        public static readonly string ReturnedItemReceivingSide = "returned-item-to";

        public static readonly string TransferItem = "transfer-item";

        public static readonly string ConsumptionItem = "consumption-items";
        public static readonly string StockManageItem = "stock-managed-item";
        public static readonly string FiscalYearStockManageItem = "fy-managed-item";

    }

    public static class ENUM_BillingOrderStatus
    {
        public static readonly string Active = "active";
        public static readonly string Pending = "pending";
        public static readonly string Final = "final";
    }
    public static class ENUM_StoreCategory
    {
        public static readonly string Store = "store";
        public static readonly string Dispensary = "dispensary";
        public static readonly string Substore = "substore";
        public static readonly string Pharmacy = "pharmacy";
    }
    public static class ENUM_StoreSubCategory
    {
        public static readonly string Inventory = "inventory";
        public static readonly string Pharmacy = "pharmacy";
        public static readonly string NormalDispensary = "normal";
        public static readonly string InsuranceDispensary = "insurance";
    }

    /*Manipal-RevisionNeeded*/ //DispensarySubCategory and StoreSubcategory are Confusing.. Make use of StoreSubCategory in all places where DispensarySubCategory is used.
    public static class ENUM_DispensarySubCategory
    {
        public static readonly string Normal = "normal";
        public static readonly string Insurance = "insurance";
    }
    public static class ENUM_CssdStatus
    {
        public static readonly string Pending = "pending";
        public static readonly string Finalized = "finalized";
        public static readonly string Complete = "completed";
    }
    public static class ENUM_SupplierLedgerTransaction
    {
        public static readonly string GoodsReceipt = "goods-receipt";
        public static readonly string CancelledGR = "cancel-goods-receipt";
        public static readonly string ReturnFromSupplier = "return-from-supplier";
        public static readonly string MakePayment = "payment";
    }

    public static class ENUM_InventoryRequisitionStatus
    {
        public static readonly string Withdrawn = "withdrawn";
        public static readonly string Pending = "pending";
        public static readonly string Partial = "partial";
        public static readonly string Active = "active";
        public static readonly string Complete = "complete";
        public static readonly string Cancelled = "cancelled";
    }

    public static class ENUM_InventoryPurchaseOrderStatus
    {
        public static readonly string Active = "active";
        public static readonly string Partial = "partial";
        public static readonly string Withdrawn = "withdrawn";
        public static readonly string Cancelled = "cancelled";
        public static readonly string Complete = "complete";

    }

    public static class ENUM_PharmacyRequisitionStatus
    {
        public static readonly string Withdrawn = "withdrawn";
        public static readonly string Pending = "pending";
        public static readonly string Partial = "partial";
        public static readonly string Active = "active";
        public static readonly string Complete = "complete";
        public static readonly string Cancel = "cancel";
    }

    public static class ENUM_Danphe_HTTP_ResponseStatus
    {
        public static readonly string OK = "OK";
        public static readonly string Failed = "Failed";
    }
    public static class ENUM_AssignNullValue
    {
        public static readonly string NA = "N/A";
    }

    public static class ENUM_ACC_LedgerType
    {
        public static readonly string BankReconciliationCategory = "bankreconciliationcategory";
        public static readonly string PaymentMode = "paymentmodes";
        public static readonly string InventorySubCategory = "inventorysubcategory";
        public static readonly string PharmacySupplier = "pharmacysupplier";
        public static readonly string InventoryVendor = "inventoryvendor";
        public static readonly string Consultant = "consultant";
        public static readonly string CreditOrganization = "creditorganization";
        public static readonly string BillingIncomeLedger = "billingincomeledger";
        public static readonly string InventoryOtherCharge = "INVOtherCharge";
        public static readonly string PharmacyCreditOrganization = "PHRMCreditOrganization";
        public static readonly string MedicareTypes = "MedicareMember";
        public static readonly string InventoryConsumption = "InventoryConsumption";
    }
    public static class ENUM_ACC_ConsumptionLevel
    {
        public static readonly string InventorySubCategory = "inventorysubcategory";
        public static readonly string InventorySubStore = "inventorysubstore";
    }
    public static class ENUM_ACC_VoucherCode
    {
        public static readonly string PaymentVoucher = "PMTV";
        public static readonly string ReceiptVoucher = "RV";
        public static readonly string JournalVoucher = "JV";
        public static readonly string PurchaseVoucher = "PV";
        public static readonly string SalesVoucher = "SV";
        public static readonly string ContraVoucher = "CV";
        public static readonly string CreditNote = "CN";
        public static readonly string DebitNote = "DN";
        public static readonly string ReverseVoucher = "RVS";
    }

    public static class ENUM_ACC_DefaultCostCenterName
    {
        public static readonly string Hospital = "Hospital";
    }

    public static class ENUM_ACC_TransactionType
    {
        public static readonly string ManualEntry = "ManualEntry";
    }

    public static class ENUM_SessionValues
    {
        public static readonly string CurrentHospitalId = "AccSelectedHospitalId";
    }

    public static class ENUM_StoredProcedures
    {
        public static readonly string BankReconciliationReport = "SP_ACC_BankReconcilationDetail";
        public static readonly string SubLedgerReport = "SP_ACC_RPT_SubLedgerReport";
        public static readonly string LedgerList = "SP_ACC_GetLedgerList";
        public static readonly string EmployeeLedgerList = "SP_ACC_GetAllEmployee_LedgerList";
        public static readonly string AccountingTransactionDates = "SP_ACC_GetTransactionDates";
        public static readonly string AccountClosure = "SP_ACC_AccountClosure";
        public static readonly string IncentivePaymentInfoUpdate = "SP_INCTV_PaymentInfo_Update";
    }

    public static class ENUM_HandOverStatus
    {
        public static readonly string Pending = "pending";
        public static readonly string Received = "received";
    }

    public static class ENUM_HandOverType
    {
        public static readonly string User = "User";
        public static readonly string Account = "Account";
    }

    public static class ENUM_EmpCashTransactionType
    {
        public static readonly string CashSales = "CashSales";
        public static readonly string Deposit = "Deposit";
        public static readonly string SalesReturn = "SalesReturn";
        public static readonly string ReturnDeposit = "ReturnDeposit";
        public static readonly string DepositDeduct = "depositdeduct";
        public static readonly string CashDiscountGiven = "CashDiscountGiven";
        public static readonly string CollectionFromReceivable = "CollectionFromReceivable";
        public static readonly string HandoverGiven = "HandoverGiven";
        public static readonly string MaternityAllowance = "MaternityAllowance";
        public static readonly string MaternityAllowanceReturn = "MaternityAllowanceReturn";
        public static readonly string HandoverReceived = "HandoverReceived";

    }

    public static class ENUM_SessionVariables
    {
        public static readonly string CurrentUser = "currentuser";
        public static readonly string ActiveLabType = "activeLabName";
        public static readonly string ActiveHospitalInformation = "AccSelectedHospitalInfo";
    }

    public static class ENUM_DanpheHttpResponseText
    {
        public static readonly string OK = "OK";
        public static readonly string Failed = "Failed";
    }

    //Sud/DevN: 3Feb'23
    //These are used currently in EmpCashTransaction of Billing and Pharmacy, we may extend this further in other features/controllers where module names are hardcoded
    public static class ENUM_ModuleNames
    {
        public static readonly string Billing = "Billing";
        public static readonly string Dispensary = "Dispensary";
        public static readonly string Pharmacy = "Pharmacy";
    }


    public static class ENUM_ClaimTypes
    {
        public static readonly string currentUser = "currentUser";
        public static readonly string userId = "userId";
    }

    //Sud:3Feb'23-- We have 2 enums for same purpose, so commented this one. 
    //use: ENUM_ModuleNames instead of this.
    //public static class ENUM_ModuleName
    //{
    //    public static readonly string Dispensary = "Dispensary";
    //    public static readonly string Pharmacy = "Pharmacy";
    //}

    public static class ENUM_PHRM_InvoiceItemBillStatus
    {
        public static readonly string Paid = "paid";
        public static readonly string Unpaid = "unpaid";
        public static readonly string Provisional = "provisional";
        public static readonly string ProvisionalCancel = "provisionalcancel";
        public static readonly string PatientConsumption = "patientconsumption";
    }

    public static class ENUM_PHRM_DepositTypes
    {
        public static readonly string Deposit = "Deposit";
        public static readonly string DepositReturn = "ReturnDeposit";
        public static readonly string DepositDeduct = "depositdeduct";
    }


    public static class ENUM_PHRM_EmpCashTxnTypes
    {
        public static readonly string CashSales = "CashSales";
        public static readonly string SalesReturn = "SalesReturn";
        public static readonly string DepositAdd = "Deposit";
        public static readonly string DepositDeduct = "DepositDeduct";
        //Sud/Dev:3Feb'23: Keep only one among below Two TransactionTypes (DepositReturn and ReturnDeposit)..
        public static readonly string DepositReturn = "DepositReturn";
        public static readonly string ReturnDeposit = "ReturnDeposit";
        public static readonly string CashDiscountGiven = "CashDiscountGiven";
        public static readonly string CashDiscountReceived = "CashDiscountReceived";

    }

    public static class ENUM_ClaimManagement_SettlementStatus
    {
        public static readonly string Pending = "pending";
        public static readonly string Completed = "completed";
    }

    public static class ENUM_ClaimManagement_CreditModule
    {
        public static readonly string Billing = "billing";
        public static readonly string Pharmacy = "pharmacy";
    }

    public static class ENUM_ClaimManagement_ClaimStatus
    {
        public static readonly string Initiated = "initiated";
        public static readonly string InReview = "in-review";
        public static readonly string PaymentPending = "payment-pending";
        public static readonly string PartiallyPaid = "partially-paid";
        public static readonly string Settled = "settled";
        public static readonly string Denied = "denied";
    }

    public static class ENUM_FileUpload_SystemFeatureName
    {
        public static readonly string InsuranceClaim = "InsuranceClaim";
        public static readonly string EmployeeProfile = "EmployeeProfile";
        public static readonly string PatientProfile = "PatientProfile";
        public static readonly string EmployeeSignatory = "EmployeeSignatory";
        public static readonly string ClinicalScannedImage = "ClinicalScannedImage";
        public static readonly string FixedAssetContract = "FixedAssetContract";
        public static readonly string InventoryQuotation = "InventoryQuotation";
    }

    public static class ENUM_FileUpload_ReferenceEntityType
    {
        public static readonly string InsuranceClaim = "InsuranceClaim";
    }
    public static class ENUM_ServiceBillingContext
    {
        public static readonly string Registration = "registration";
        public static readonly string Admission = "admission";
        public static readonly string OpBilling = "op-billing";
        public static readonly string IpBilling = "ip-billing";
        public static readonly string IpPharmacy = "ip-pharmacy";
        public static readonly string OpPharmacy = "op-pharmacy";
    }

    public static class ENUM_SSF_EligibilityType
    {
        public static readonly string Medical = "Medical";
        public static readonly string Accident = "Accident";
    }

    public static class ENUM_Scheme_ApiIntegrationNames
    {
        public static readonly string SSF = "SSF";
        public static readonly string Medicare = "Medicare";
        public static readonly string NGHIS = "NGHIS";
        public static readonly string ECHS = "ECHS";

    }
    public static class ENUM_PharmacyPurchaseOrderStatus
    {
        public static readonly string Pending = "pending";
        public static readonly string Active = "active";
        public static readonly string Partial = "partial";
        public static readonly string Withdrawn = "withdrawn";
        public static readonly string Cancel = "cancel";
        public static readonly string Complete = "complete";

    }

    public static class ENUM_ACC_VoucherStatus
    {
        public static readonly string Draft = "draft";
        public static readonly string InReview = "inreview";
        public static readonly string Verified = "verified";
        public static readonly string Canceled = "canceled";
    }

    public static class ENUM_IntegrationNames
    {
        public static readonly string OPD = "OPD";
        public static readonly string LAB = "LAB";
        public static readonly string Radiology = "RADIOLOGY";
        public static readonly string BedCharges = "Bed Charges";
    }
    public static class ENUM_VisitSchemeChangeAction
    {
        public static readonly string ManualUpdate = "manual-update";
        public static readonly string SystemUpdate = "system-update";
    }

    public static class ENUM_Deposit_OrganizationOrPatient
    {
        public static readonly string Organization = "organization";
        public static readonly string Patient = "patient";
    }

    public static class ENUM_SchemeName
    {
        public static readonly string General = "General";
    }
    public static class ENUM_ERStatus
    {
        public static readonly string New = "New";
        public static readonly string finalized = "finalized";
        public static readonly string triaged = "triaged";
    }

    public static class ENUM_SSF_ApiEndPoints
    {
        public static readonly string PatientDetails = "Patient/?identifier=";
        public static readonly string CoverageEligibilityRequest = "CoverageEligibilityRequest/";
        public static readonly string EmployeeList = "Employee/";
        public static readonly string Claim = "Claim/";
        public static readonly string ClaimDetail = "Claim/";
        public static readonly string BookingService = "BookingService";
        public static readonly string AddAttachment = "attachments";
    }
    //Krishna, 5thNov'23, Below used values are hardcoded values, Please do not change unless changed from SSF side, These values are provided from SSF Side.
    public static class ENUM_SSF_SchemeTypes
    {
        public static readonly string Accident = "1";
        public static readonly string Medical = "2";
    }

    public static class ENUM_OT_Booking_Status
    {
        public static readonly string Booked = "Booked";
        public static readonly string Scheduled = "Scheduled";
        public static readonly string InProgress = "InProgress";
        public static readonly string Concluded = "Concluded";
        public static readonly string Cancelled = "Cancelled";
    }
    public static class ENUM_OnlinePaymentMode
    {
        public static readonly string FonePay = "fonepay";
    }

    public static class ENUM_FonePayTransactionRequestFrom
    {
        //public static readonly string OutpatientBilling = "op-billing";
        //public static readonly string InPatientDischarge = "ip-discharge";
        //public static readonly string Appointment = "appointment";
        //public static readonly string BillingOpProvisionalClearance = "op-provisional-clearance";
        //public static readonly string BillingProvisionalDischargeClearance = "provisional-discharge-clearance";
        //public static readonly string BillingSettlement = "billing-settlement";
        //public static readonly string BillingDeposit = "billing-deposit";
        //public static readonly string PharmacySales = "pharmacy-sales";
        //public static readonly string PharmacyProvisionalClearance = "pharmacy-provisional-clearance";
        //public static readonly string PharmacySettlement = "pharmacy-settlement";
        //public static readonly string PharmacyDeposit = "pharmacy-deposit";


        public const string OutpatientBilling = "op-billing";
        public const string InPatientDischarge = "ip-discharge";
        public const string Appointment = "appointment";
        public const string BillingOpProvisionalClearance = "op-provisional-clearance";
        public const string BillingProvisionalDischargeClearance = "provisional-discharge-clearance";
        public const string BillingSettlement = "billing-settlement";
        public const string BillingDeposit = "billing-deposit";
        public const string ADT_AdmissionBilling = "admission-billing";
        public const string PharmacySales = "pharmacy-sales";
        public const string PharmacyProvisionalClearance = "pharmacy-provisional-clearance";
        public const string PharmacySettlement = "pharmacy-settlement";
        public const string PharmacyDeposit = "pharmacy-deposit";


    }

    public static class ENUM_BedOutAction
    {
        public const string Transfer = "transfer";
        public const string Discharge = "discharged";
        public const string Exchange = "exchange";
    }

    public static class ENUM_SSFSchemeTypesSubProduct
    {
        public const int MedicalExpenses_IP = 1;
        public const int MedicalExpenses_OP = 2;

    }
    public static class ENUM_HIBClaimDocResponseStatus
    {
        public static readonly string success = "success";
        public static readonly string fail = "fail";
    }
    public static class ENUM_GRVerificationStatus
    {
        public static readonly string pending = "pending";
        public static readonly string verified = "verified";
        public static readonly string active = "active";

    }

    public static class ENUM_SMSProviderNames
    {
        public static readonly string LumbiniTech = "LumbiniTech";
        public static readonly string ShivaJiTech = "ShivaJiTech";
        public static readonly string Sparrow = "Sparrow";
    }


    public static class ENUM_LabVerificationStatus
    {
        public static readonly string Pending = "Pending";
        public static readonly string PreVerified = "Pre-Verified";
    }

    public static class ENUM_EmployeeSalutation
    {
        public static readonly string Dr = "Dr";
        public static readonly string Mr = "Mr";
    }
    public static class ENUM_VitalsEyeScale
    {
        public static readonly string Scale1 = "No eye opening";
        public static readonly string Scale2 = "Eye opening to pain";
        public static readonly string Scale3 = "Eye opening to sound";
        public static readonly string Scale4 = "Eyes open spontaneously";
    }
    public static class ENUM_VitalVerbalScale

    {
        public static readonly string Scale1 = "No verbal response";
        public static readonly string Scale2 = "Incomprehensible sounds";
        public static readonly string Scale3 = "Inappropriate words";
        public static readonly string Scale4 = "Confused";
        public static readonly string Scale5 = "Orientated";
    }
    public static class ENUM_VitalsMotorScale
    {
        public static readonly string Scale1 = "No motor response";
        public static readonly string Scale2 = "Abnormal extension to pain";
        public static readonly string Scale3 = "Abnormal flexion to pain";
        public static readonly string Scale4 = "Withdrawal from pain";
        public static readonly string Scale5 = "Localizing pain";
        public static readonly string Scale6 = "Obeys commands";
    }
    public static class ENUM_BillingPackageType
    {
        public static readonly string ItemLoadPackage = "ItemLoadPackage";
        public static readonly string HealthPackage = "HealthPackage";

    }

    public static class ENUM_FHIRReourceTypes
    {
        public static readonly string Claim = "Claim";
    }
    public static class ENUM_ICDCoding
    {
        public static readonly string ICD10 = "icd_0";
        public static readonly string ICD11 = "icd_1";
    }

    public static class ENUM_VisitTypeFormattedForHIB
    {
        public static readonly string OutpatientAndInPatient = "O";
        public static readonly string Emergency = "E";
        public static readonly string Referral = "R";
    }

    public static class ENUM_HIBCareType
    {
        public static readonly string Outpatient = "O";
        public static readonly string InPatient = "I";
    }

    public static class ENUM_HIBCodingValue
    {
        public static readonly string ACSNCodingSystem = "ACSN";
        public static readonly string MRCodingSystem = "MR";
    }
    public static class ENUM_HIBValueSetIdentifierUrl
    {
        public static readonly string system = "https://hl7.org/fhir/valueset-identifier-type.html";
    }
    public static class ENUM_HIBIdentifierUseValue
    {
        public static readonly string Use = "usual";
    }

    public static class ENUM_HIBClaimCategory
    {
        public static readonly string Service = "service";
        public static readonly string Product = "product";
        public static readonly string Item = "item";
    }

    public static class ENUM_HibClaimInformationCategory
    {
        public static readonly string Explanation = "explanation";
    }
}
//public enum ENUM_LabOrderStatus_Test
//{
//    [Description("active")]
//    Active = 1,
//    [Description("pending")]
//    Pending = 2,
//    [Description("result-added")]
//    ResultAdded = 3,
//    [Description("report-generated")]
//    ReportGenerated = 4
//}
//public static class DanpheEnumExtensions
//{
//    //Below function will return Description string from Enum value or any other value.
//    //Currently Tested and Used only for ENUMS, we can extend this for other classes as well.
//    public static string GetEnumDescription<T>(this T val)
//    {
//        DescriptionAttribute[] attributes = (DescriptionAttribute[])val
//           .GetType()
//           .GetField(val.ToString())
//           .GetCustomAttributes(typeof(DescriptionAttribute), false);
//        return attributes.Length > 0 ? attributes[0].Description : string.Empty;
//    }
//}

public static class ENUM_ClinicalField_InputType
{
    public static readonly string Questionnaire = "Questionnaire";
    public static readonly string Textbox = "Textbox";
    public static readonly string SingleSelection = "Single Selection";
    public static readonly string FreeType = "Free Type";
    public static readonly string MultipleSelect = "Multiple Select";
    public static readonly string FileUpload = "File Upload";
    public static readonly string SmartTemplate = "SmartTemplate";
    public static readonly string Number = "Number";
    public static readonly string SmartPrintableForm = "SmartPrintableForm";
}

public static class ENUM_TemplateType
{
    public static readonly string Clinical = "Clinical";
    public static readonly string OT = "OT";
}

public static class ENUM_PhrasesAccessibility
{
    public static readonly string Personal = "Personal";
    public static readonly string Shared = "Shared";
}

public static class ENUM_PrescriptionOrderStatus
{
    public static readonly string Active = "active";
    public static readonly string Partial = "partial";
    public static readonly string Discarded = "discarded";
    public static readonly string Final = "final";
}

public static class ENUM_IncentiveTypes
{
    public static readonly string Performer = "performer";
    public static readonly string Prescriber = "prescriber";
    public static readonly string Referral = "referral";
}

public static class ENUM_RateLimiterAlgorithms
{
    public static readonly string FixedWindow = "FixedWindow";
    public static readonly string TokenBucket = "TokenBucket";
    public static readonly string LeakyBucket = "LeakyBucket";
    public static readonly string SlidingWindowLog = "SlidingWindowLog";
}
public static class ENUM_LabPageAction
{
    public static readonly string SampleReceive = "sample-receive";
    public static readonly string ExternalLab = "external-lab";
    public static readonly string Other = "other";
}

public static class ENUM_ClinicalSmartPrintableCodes
{
    public static readonly string FirstVitals = "VITAL_001";
    public static readonly string LastVitals = "VITAL_002";
    public static readonly string AllVitals = "VITAL_003";
}

public static class ENUM_VisitDepartmentName
{
    public static readonly string Emergency = "Emergency";
}