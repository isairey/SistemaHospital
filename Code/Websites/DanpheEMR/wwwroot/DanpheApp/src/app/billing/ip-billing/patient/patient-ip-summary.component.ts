import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment/moment';
import { Subject, Subscription } from "rxjs";
import { CurrentVisitContextVM } from '../../../appointments/shared/current-visit-context.model';
import { MedicareMemberVsMedicareBalanceVM } from '../../../appointments/shared/medicare-model';
import { CoreService } from "../../../core/shared/core.service";
import { Patient } from '../../../patients/shared/patient.model';
import { PatientService } from '../../../patients/shared/patient.service';
import { PatientsBLService } from "../../../patients/shared/patients.bl.service";
import { SecurityService } from '../../../security/shared/security.service';
import { BillingScheme_DTO } from '../../../settings-new/billing/shared/dto/billing-scheme.dto';
import { CreditOrganization } from '../../../settings-new/shared/creditOrganization.model';
import { PriceCategory } from '../../../settings-new/shared/price.category.model';
import { CancelStatusHoldingModel, DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { DLService } from '../../../shared/dl.service';
import { FewaPayService } from '../../../shared/fewa-pay/helpers/fewa-pay.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../shared/routefrom.service';
import { ENUM_AdditionalServiceItemGroups, ENUM_BillPaymentMode, ENUM_BillingStatus, ENUM_CancellationService, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_FewaPayMessageTypes, ENUM_FewaPayTransactionFrom, ENUM_InvoiceType, ENUM_MembershipTypeName, ENUM_MessageBox_Status, ENUM_OrderStatus, ENUM_POS_ResponseStatus, ENUM_PaymentModeSubCategory, ENUM_Scheme_ApiIntegrationNames, ENUM_ServiceBillingContext } from '../../../shared/shared-enums';
import { BillInsuranceService } from '../../shared/bill-insurance.service';
import { BillingDeposit } from '../../shared/billing-deposit.model';
import { BillingInvoiceBlService } from '../../shared/billing-invoice.bl.service';
import { BillingMasterBlService } from '../../shared/billing-master.bl.service';
import { BillingTransactionItem } from '../../shared/billing-transaction-item.model';
import { BillingTransaction, EmployeeCashTransaction, IPBillTxnVM } from '../../shared/billing-transaction.model';
import { BillingBLService } from '../../shared/billing.bl.service';
import { BillingService } from '../../shared/billing.service';
import { InvoiceDetail } from '../../shared/dto/invoice-detail.dto';
import { SchemePriceCategory_DTO } from '../../shared/dto/scheme-pricecategory.dto';
import { IpBillingDiscountModel } from '../../shared/ip-bill-discount.model';
import { PatientScheme } from '../../shared/patient-map-scheme';
import { BedDetailVM, BedDurationTxnDetailsVM, DischargeDetailBillingVM } from '../shared/discharge-bill.view.models';
import { AdditionalBedReservationObject_DTO } from '../shared/dto/additional-bed-reservation-object.dto';
import { AdditionalBedReservation_DTO } from '../shared/dto/additional-bed-reservation.dto';
import { ProvisionalDischarge_DTO } from '../shared/dto/provisional-discharge.dto';
import { PharmacyPendingBillItemsViewModel } from '../shared/pharmacy-pending-bill-item-view.model';

@Component({
  selector: 'pat-ip-bill-summary',
  templateUrl: "./patient-ip-summary.html",
  styleUrls: ['./patient-ip-summary.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class PatientIpSummaryComponent {

  @Output("on-summary-closed")
  public onClose = new EventEmitter<object>();

  @Input("patientId")
  public patientId: number = 0;

  @Input("ipVisitId")
  public ipVisitId: number = 0;

  public patAllPendingItems: Array<BillingTransactionItem> = [];
  public patAllCancelledItems: Array<BillingTransactionItem> = [];

  public allItemslist = []; //Yubraj 30th July '19 //All Billing Lists

  public admissionInfo: any = null;
  public billingTransaction: BillingTransaction;
  public showIpBillRequest: boolean = false;
  public showDischargeBill: boolean = false;
  public showEstimationBill: boolean = false;

  public showUpdatePricePopup: boolean = false;
  public billType: string;
  public dischargeDetail: DischargeDetailBillingVM = new DischargeDetailBillingVM();
  //Is updated once the billing transaction is post during discharge patient.
  //public billingTxnId: number;
  public billStatus: string;
  public adtItems: BillingTransactionItem;
  public hasPreviousCredit: boolean = false;
  public showCreditBillAlert: boolean = false;
  public showCancelAdmissionAlert: boolean = false;
  public validDischargeDate: boolean = true;
  public checkouttimeparameter: string;
  public exchangeRate: number = 0;
  public selectedCreditOrganization: CreditOrganization;
  public IsCheckoutParameter: boolean = false;
  //create a new model to assign global variables and bind to html

  public ShowDynamicQr: boolean = false;
  public DynamicQrMessage: string = "";
  public model = {
    PharmacyProvisionalAmount: 0,
    SubTotal: 0,
    DiscountAmount: 0,
    DiscountPercent: 0,
    TaxAmount: 0,
    NetTotal: 0,
    DepositAdded: 0,
    DepositReturned: 0,
    DepositBalance: 0,
    TotalAmount: 0,
    TotalAmountInUSD: 0,
    ToBePaid: 0,
    ToBeRefund: 0,
    PayType: "cash",
    Tender: 0,
    Change: 0,
    PaymentDetails: null,
    Remarks: null,
    OrganizationId: null,
    OrganizationName: null,
    IsItemDiscountEnabled: false,
    ReceivedAmount: 0,
    CoPaymentCreditAmount: 0,
    CoPayment_PaymentMode: ENUM_BillPaymentMode.credit,
    IsMedicarePatientBilling: false,
    IsCoPayment: false,
    PharmacyTotal: 0,
    GrandTotal: 0,
    OtherCurrencyDetail: null,
  };
  public patientInfo: Patient;
  public showDischargePopUpBox: boolean = false;
  public showEditItemsPopup: boolean = false;
  public doctorsList: Array<any> = [];
  // public UsersList: Array<any> = [];//to view who has added that particular item.//sud: 30Apr'20-- not needed anymore. Use EmpList if required..
  public selItemForEdit: BillingTransactionItem = new BillingTransactionItem();

  public showDepositPopUp: boolean = false;
  public bedDetails: Array<BedDetailVM> = [];
  public bedDurationDetails: Array<BedDurationTxnDetailsVM>;
  public totalAdmittedDays: number = 0;
  public estimatedDischargeDate: string;

  public estimatedDiscountPercent: number = 0;
  public estimatedDiscountAmount: number = 0;

  // public CreditOrganizationMandatory: boolean = false;

  public loading: boolean = false; //yub 27th Nov '18 :: Avoiding double click whild loading

  public isAllItemsSelected: boolean = true;  //yubraj: 28th Nov '18
  /*    public groupDiscountPercent: number = 0;*/  //yubraj: 28th Nov '18
  public discountGroupItems: Array<BillingTransactionItem> = [];
  public updatedItems: Array<BillingTransactionItem> = [];
  public showGroupDiscountPopUp: boolean = false; //yubraj: 28th Nov '18

  public hasZeroItemPrice: boolean = false;
  public itemsToModify: Array<BillingTransactionItem> = [];
  public creditOrganizationsList: Array<CreditOrganization> = new Array<CreditOrganization>(); //yubraj:22nd April 2019 Credit Organization
  public discountApplicable: boolean = false; //Yubraj 30th July

  public IPBillItemGridCol: Array<any> = null;
  public CancelledServicesGridCol: Array<any> = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();


  public OrderStatusSettingB4Discharge: any = null;
  public allowDischarge: boolean = true;
  public ShowOrderStatusInfo: boolean = false;
  public billingDischargeRule: CancelStatusHoldingModel = new CancelStatusHoldingModel();
  public OrderStatusRestrictedItems: Array<BillingTransactionItem> = [];


  //Anish: 14 Aug, 2020 added for conditional cancellation based upon the OrdreStatus
  public overallCancellationRule: any;
  public billingCancellationRule: CancelStatusHoldingModel = new CancelStatusHoldingModel();
  public isCancelRuleEnabled: boolean;

  public cancellationNumber: number = 0;

  public DiscountSchemeId: number = 0;
  public MembershipTypeName: string = null;
  public membershipSchemeParam = { ShowCommunity: false, IsMandatory: true };
  public deposit: BillingDeposit = new BillingDeposit();
  public showDepositReceipt: boolean = false;
  public ShowMembershipSelect: boolean = false;
  public InvalidDiscount: boolean = false;
  public CreditTotal: number = 0;
  public intervalId: any;
  public currMembershipDiscountPercent: number = 0;
  public isGroupDiscountApplied: boolean = false;
  public ipBillingDiscountModel: IpBillingDiscountModel = new IpBillingDiscountModel();
  public ItemLevelDiscountSettings = { "ItemLevelDiscount": false };
  public enableItemLevelDiscount: boolean = false;
  public PharmacyPendingAmount = {
    ProvisionalAmount: 0,
    CreditAmount: 0,
  }
  PaymentPages: any[];

  TempEmployeeCashTransaction: Array<EmployeeCashTransaction> = new Array<EmployeeCashTransaction>();
  MstPaymentModes: any;
  public EnableDiscountAmountField: boolean = false; // krishna, 27th,March'22 , to enable discount amount field..

  public PatientSchemeMap: PatientScheme = new PatientScheme();
  public selectedPriceCategoryObj: PriceCategory = new PriceCategory();
  public PriceCategoryServiceItems: Array<any> = new Array<any>();

  public IsMedicareMemberEligibleForBilling: boolean = false; //* Krishna, 8th-Jan'23, This variable handles the billing eligibility of Medicare Members only.
  public IsMedicarePatientBilling: boolean = false; //* Krishna, 8th-Jan'23, This variable handles the the medicare Billing.

  public medicareMemberVsBalanceVm = new MedicareMemberVsMedicareBalanceVM(); //* Krishna, 8th-Jan'23

  public amountToBeUsedInCalculationOfTenderAndChangeOnly: number = 0; //* Krishna, 9th-Jan'23

  public totalAmountToPassToPaymentModeInfo: number = 0;
  public ECHSMembershipTypeName: string = ENUM_MembershipTypeName.ECHS;
  public SSFMembershipTypeName: string = ENUM_MembershipTypeName.SSF;
  public allPriceCategories: Array<any> = [];
  public isPriceCatogoryLoaded: boolean = false;
  public priceCategory: string = "Normal";
  public PriceCategoryId: number = null;
  public PriceCategorySelectedToChangePrice: PriceCategory = new PriceCategory();
  public SchemePriceCategoryObj: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public SchemePriceCategoryFromVisit: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public SchemePriceCategoryFromVisitTemp: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public SchemePriceCategory: SchemePriceCategory_DTO = new SchemePriceCategory_DTO();
  public DisablePaymentModeDropDown: boolean = false;
  public DisableInvoiceDiscountPercent: boolean = false;
  public DisableInvoiceDiscountAmount: boolean = true;
  public pharmacyPendingBillItems: PharmacyPendingBillItemsViewModel[] = [];
  public IPPharmacyBillItemGridCol: { headerName: string; field: string; width: number; }[];
  public PharmacyTotal: number = 0;
  public DischargeStatementId: number = 0;
  public PatientId: number = 0;
  public PatientVisitId: number = 0;
  public UseDeposit: boolean = true;
  public PatientPendingBillItemsSubscription = new Subscription();
  public PatientPendingBillItemSubject = new Subject();
  CancelledItemDetails: any;
  schemeId: any;
  visitType: any;
  ProvReceiptNo: any;
  ProvFiscalYrId: any;

  public DisplayDeductDepositCheckbox: boolean = true;

  public EnableShowOtherCurrency: boolean = false;
  public ShowOtherCurrency: boolean = false;
  public DisplayOtherCurrencyDetail: boolean = false;
  public OtherCurrencyDetail: OtherCurrencyDetail;
  public ShowAllowProvisionalDischargeCheckbox: boolean = false;
  public AllowProvisionalDischarge: boolean = false;
  public ShowProvisionalDischargeConfirmation: boolean = false;
  public IsProvisionalDischarge: boolean = false;
  public loadingScreen: boolean = false;
  public SettlePharmacyCredits: boolean = false;
  public ConsultantDoctors: string = "";

  public CreditLimitToDisplay: number = 0
  ShowCaretakerContact: boolean = false;
  AdditionalBedReservations = new Array<AdditionalBedReservation_DTO>();
  AdditionalBedReservationsObjectList = new Array<AdditionalBedReservationObject_DTO>();
  ShowAdditionalBedReservationsPopUp: boolean = false;
  public ipBillingTxnVM: IPBillTxnVM = new IPBillTxnVM();
  public currPatVisitContext: CurrentVisitContextVM = new CurrentVisitContextVM();
  public PolicyNo: string;
  public BillingPreviousProvisional = {
    PatientId: 0,
    BillingProvisionalAmount: 0
  };

  constructor(
    private _dlService: DLService,
    public patientService: PatientService,
    private _changeDetector: ChangeDetectorRef,
    private _billingService: BillingService,
    private _billingBLService: BillingBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _patientBLService: PatientsBLService,
    private _router: Router,
    private _securityService: SecurityService,
    private _routeFromService: RouteFromService,
    private _billingInvoiceBlService: BillingInvoiceBlService,
    private _billingMasterBlService: BillingMasterBlService,
    private _fewaPayService: FewaPayService,
    private billInsuranceService: BillInsuranceService

  ) {
    this.SetAutoBedAndAutoBillItemParameters();//sud:07Oct'20--to make common place for this param.
    this.GetParameterToShowHideCaretakerContact();
    // this.allItemslist = this.billingService.allBillItemsPriceList;//sud:30Apr'20--code optimization
    this.allEmployeeList = this._billingService.AllEmpListForBilling; //sud:30Apr'20--code optimization
    this.creditOrganizationsList = this._billingService.AllCreditOrganizationsList;//sud:30Apr'20--code optimization



    this.SetDoctorsList();//sud:2May'20--code optimization
    //this.setCheckOutParameter();
    this.LoadMembershipSettings();
    //this.LoadItemPriceByPriceCategory();

    // this.CreditOrganizationMandatory = this.CoreService.LoadCreditOrganizationMandatory();//pratik: 26feb'20 --Credit Organization compulsoryor not while Payment Mode is credit

    this.IPBillItemGridCol = GridColumnSettings.IPBillItemGridCol;
    this.CancelledServicesGridCol = GridColumnSettings.CancelledServicesGridCol;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn', true));

    this.IPPharmacyBillItemGridCol = GridColumnSettings.IPPharmacyBillItemGridCol;

    this.overallCancellationRule = this.coreService.GetIpBillCancellationRule();
    if (this.overallCancellationRule && this.overallCancellationRule.Enable) {
      this.isCancelRuleEnabled = this.overallCancellationRule.Enable;
      this.billingCancellationRule.labStatus = this.overallCancellationRule.LabItemsInBilling;
      this.billingCancellationRule.radiologyStatus = this.overallCancellationRule.ImagingItemsInBilling;
    }
    this.LoadItemLevelSettngs();

    // this.LoadAdditionalServiceItems();
    this.InitializeSubscription();
    this.GetParameterToShowHideOtherCurrencyOption();
    this.GetParameterToEnableDisableProvisionalDischarge();
    this.ReadParameterToSettlePharmacyCredits();

  }

  GetParameterToShowHideCaretakerContact(): void {
    const params = this.coreService.Parameters.find(a => a.ParameterGroupName === "Billing" && a.ParameterName === "IPBillingCaretakerContactDisplay");
    if (params) {
      this.ShowCaretakerContact = params.ParameterValue === "true" ? true : false;;
    } else {
      this.ShowCaretakerContact = false;
    }
  }
  ReadParameterToSettlePharmacyCredits() {
    const params = this.coreService.Parameters.find(a => a.ParameterGroupName === "Billing" && a.ParameterName === "SettlePharamcyCreditFromBilling");
    if (params) {
      this.SettlePharmacyCredits = JSON.parse(params.ParameterValue);
    } else {
      this.SettlePharmacyCredits = false;
    }
  }

  InitializeSubscription() {
    this.PatientPendingBillItemsSubscription = this.PatientPendingBillItemSubject.subscribe(res => {
      if (res) {
        this.FilterItemsAndAssignCoPayAndDiscountInfo();
      }
    });
  }

  GetParameterToShowHideOtherCurrencyOption(): void {
    const params = this.coreService.Parameters.find(a => a.ParameterGroupName === "Billing" && a.ParameterName === "ShowOtherCurrency");
    if (params) {
      this.EnableShowOtherCurrency = params.ParameterValue === "true" ? true : false;
    } else {
      this.EnableShowOtherCurrency = false;
    }
  }
  GetParameterToEnableDisableProvisionalDischarge(): void {
    const params = this.coreService.Parameters.find(p => p.ParameterGroupName === "Billing" && p.ParameterName === "EnableProvisionalDischarge");
    if (params) {
      this.ShowAllowProvisionalDischargeCheckbox = JSON.parse(params.ParameterValue);
    }
  }

  //this is the expected format of the autobed parameter..
  public autoBedBillParam = { DoAutoAddBillingItems: false, DoAutoAddBedItem: false, ItemList: [] };

  SetAutoBedAndAutoBillItemParameters() {
    var param = this.coreService.Parameters.find(p => p.ParameterGroupName == "ADT" && p.ParameterName == "AutoAddBillingItems");
    if (param && param.ParameterValue) {
      this.autoBedBillParam = JSON.parse(param.ParameterValue);
    }
  }

  public LoadMembershipSettings() {
    var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "MembershipSchemeSettings");
    if (currParam && currParam.ParameterValue) {
      this.membershipSchemeParam = JSON.parse(currParam.ParameterValue);
    }
  }

  //This is to get the ItemLevelDiscount settings //Krishna,20JAN'22..
  public LoadItemLevelSettngs() {
    let currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "IPBillingDiscountSettings");
    if (currParam && currParam.ParameterValue) {
      this.ItemLevelDiscountSettings = JSON.parse(currParam.ParameterValue);
    }
  }

  public ItemLevelCheckBoxChanged($event: any) {
    $event ? this.enableItemLevelDiscount = true : this.enableItemLevelDiscount = false;
    if (this.SchemePriceCategory.IsDiscountApplicable && this.SchemePriceCategory.IsDiscountEditable) {
      if (this.enableItemLevelDiscount && this.EnableDiscountAmountField) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = true;
      } else if (this.enableItemLevelDiscount) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = true;
      } else if (this.EnableDiscountAmountField) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = false;
      } else {
        this.DisableInvoiceDiscountPercent = false;
        this.DisableInvoiceDiscountAmount = true;
      }
    }
    this.model.DiscountPercent = this.SchemePriceCategory.DiscountPercent; //this.currMembershipDiscountPercent; //!Krishna,2ndApril'23, Keeping DiscountPercent from Scheme as it was like that earlier, Need to check its impact as well
    this.InvoiceDiscountOnChange();
  }

  EnableDiscountAmount() {
    if (this.SchemePriceCategory.IsDiscountApplicable && this.SchemePriceCategory.IsDiscountEditable) {
      if (this.EnableDiscountAmountField && this.enableItemLevelDiscount) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = true;
      } else if (this.EnableDiscountAmountField) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = false;
      } else if (this.enableItemLevelDiscount) {
        this.DisableInvoiceDiscountPercent = true;
        this.DisableInvoiceDiscountAmount = true;
      } else {
        this.DisableInvoiceDiscountPercent = false;
        this.DisableInvoiceDiscountAmount = true;
      }
    }
  }
  //Krishna, 19thJAN'22, This saves the Discount Scheme and Discount percent When Scheme is changed
  public SaveDiscountState() {
    this.ipBillingDiscountModel.PatientVisitId = this.ipVisitId;
    this.ipBillingDiscountModel.ProvisionalDiscPercent = this.model.DiscountPercent;
    this._billingBLService.UpdateDiscount(this.ipBillingDiscountModel).subscribe(
      res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
          //this.getPatientDetails(); //!Krishna, 2ndApril'23, Commented for now, Need to check its impact and why it called here.
          console.log(res.Results);
        } else {
          console.log(res.ErrorMessage);

        }
      }
    );

  }

  OnMembershipChanged($event: BillingScheme_DTO) {
    if ($event) {
      this.DiscountSchemeId = $event.SchemeId;
      this.isGroupDiscountApplied = false;
      this.currMembershipDiscountPercent = $event.DiscountPercent;
      this.model.DiscountPercent = $event.DiscountPercent;
      this.model.DiscountAmount = (this.model.DiscountPercent * this.model.SubTotal) / 100;
      this.model.TotalAmount = this.model.SubTotal - this.model.DiscountAmount;

      this.MembershipTypeName = $event.SchemeName;
      if (this.MembershipTypeName && this.MembershipTypeName.toLowerCase() !== 'general') {
        this.model.Remarks = $event.SchemeName;
      }
      else {
        this.model.Remarks = null;
      }
      this.ipBillingDiscountModel.DiscountSchemeId = $event.SchemeId;

      this.SaveDiscountState();
      //this.InvoiceDiscountOnChange();

      if (this.patientInfo && this.patientInfo.Admissions && this.patientInfo.Admissions[0].IsItemDiscountEnabled && this.patientInfo.Admissions[0].DiscountSchemeId == $event.SchemeId) {
        this.CalculationForAll();
      } else {
        this.InvoiceDiscountOnChange();
      }
    }
    else {
      // this.model.MembershipTypeId = null;
      this.model.DiscountPercent = 0;
      this.model.Remarks = null;
    }

    // if (this.SchemePriceCategory.IsCoPayment && $event) {
    //   //this.LoadItemPriceByPriceCategory();

    //   if (this.selectedPriceCategoryObj.PriceCategoryName.toLowerCase() === ENUM_PriceCategory.Medicare.toLowerCase()) {

    //     this.GetMedicareMemberDetail(this.patientId);

    //   }
    // }
  }

  // //* This method is responsible to fetch the MedicareMemberDetail
  // GetMedicareMemberDetail(patientId: number): void {
  //   this.billingBLService.GetMedicareMemberDetail(patientId).subscribe((res: DanpheHTTPResponse) => {
  //     if (res.Status === ENUM_DanpheHTTPResponses.OK) {
  //       const medicareMemberDetail = res.Results;
  //       if (medicareMemberDetail && medicareMemberDetail.MedicareMemberId) {
  //         this.IsMedicarePatientBilling = true;
  //         this.model.IsMedicarePatientBilling = this.IsMedicarePatientBilling;
  //         this.medicareMemberVsBalanceVm = medicareMemberDetail;
  //         this.CheckEligibilityOfMedicareMember(medicareMemberDetail);
  //       }
  //     }
  //   }, err => {
  //     this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Could not fetch medicare member detail"]);
  //   });
  // }

  //* This method is responsible to check whether the medicare member is eligible for Billing or not, Krishna 8th-Jan'23
  CheckEligibilityOfMedicareMember(medicareMemberDetail: MedicareMemberVsMedicareBalanceVM): void {
    if (!medicareMemberDetail || !medicareMemberDetail.MedicareMemberId) {
      return;
    }
    const IsIpLimitExceed = medicareMemberDetail.IsIpLimitExceeded;
    if (IsIpLimitExceed) {
      const IpBalance = medicareMemberDetail.IpBalance;
      if (IpBalance > 0) {
        this.IsMedicareMemberEligibleForBilling = IpBalance > 0 ? true : false;
        !this.IsMedicareMemberEligibleForBilling && this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Patient is not eligible for Billing in this Price Category"]);
      } else {
        this.IsMedicareMemberEligibleForBilling = true;
      }
    }
  }

  CheckMedicarePatientBillingValidations(): boolean {
    let isValid = false;
    if (this.IsMedicareMemberEligibleForBilling) {
      isValid = true;
    }
    if (this.medicareMemberVsBalanceVm.IpBalance >= this.model.CoPaymentCreditAmount) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid;
  }

  LoadPriceCategoryServiceItems() {
    if (this.SchemePriceCategory.SchemeId && this.SchemePriceCategory.PriceCategoryId) {
      this._billingMasterBlService.GetServiceItems(ENUM_ServiceBillingContext.IpBilling, this.SchemePriceCategory.SchemeId, this.SchemePriceCategory.PriceCategoryId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.PriceCategoryServiceItems = res.Results;
            this.allItemslist = this.PriceCategoryServiceItems;
            this._billingMasterBlService.ServiceItemsForIp = res.Results;
            this.FilterItemsAndAssignCoPayAndDiscountInfo();
            // this.CalculationForAll();
            // this.CoreService.loading = false;
          }
        },
          err => {
            console.log(err);
          });
    }
  }

  FilterItemsAndAssignCoPayAndDiscountInfo(): void {
    if (this.patAllPendingItems && this.patAllPendingItems.length) {
      this.patAllPendingItems.forEach((a) => {
        let matchedData = this.PriceCategoryServiceItems.find(b => b.ServiceItemId === a.ServiceItemId && b.PriceCategoryId === a.PriceCategoryId);
        if (matchedData && a.DiscountSchemeId === this.SchemePriceCategory.SchemeId && a.PriceCategoryId === this.SchemePriceCategory.PriceCategoryId) {
          a.ItemCode = matchedData.ItemLegalCode;
          //a.Price = matchedData.Price;
          a.DiscountApplicable = matchedData.IsDiscountApplicable;
          //a.DiscountPercent = matchedData.DiscountPercent;
          a.IsCoPayment = matchedData.IsCoPayment;
          a.CoPaymentCashPercent = matchedData.CoPayCashPercent;
          a.CoPaymentCreditPercent = matchedData.CoPayCreditPercent;
        }
      });
    }
    this.CalculationForAll();
    this.coreService.loading = false;
  }

  ngOnInit() {
    if (this.patientId && this.ipVisitId) {
      this.bedDurationDetails = [];
      this.getPatientDetails();
      this.GetPatientCurrentPatientSchemeMap(this.patientId, this.ipVisitId);
      this.GetVisitContext(this.patientId, this.ipVisitId);
      this.GetDetailForInpatientsCancelledItems(this.patientId, this.ipVisitId);
      this.GetPatientVisitConsultants(this.ipVisitId);

      this.coreService.loading = true;
      // if (this.autoBedBillParam.DoAutoAddBedItem) {
      //   this.UpdateBedDuration();
      // }
      // else {
      //   this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
      // }
      this.UpdateBedDuration();

      this.CheckCreditBill(this.patientId);
      this.GetAdditionalBedReservations(this.patientId, this.ipVisitId)
      // this.GetPharmacyProvisionalBalance();
      this.GetPharmacyPendingAmount();
      this.LoadBillingPreviousProvisionalAmount(this.patientId, this.ipVisitId);
      this.dischargeDetail.DischargeDate = moment().format('YYYY-MM-DDTHH:mm:ss');

      this.OrderStatusSettingB4Discharge = this.coreService.GetIpBillOrderStatusSettingB4Discharge();
      if (this.OrderStatusSettingB4Discharge) {
        this.billingDischargeRule.labStatus = this.OrderStatusSettingB4Discharge.RestrictOnLabStatusArr;
        this.billingDischargeRule.radiologyStatus = this.OrderStatusSettingB4Discharge.RestrictOnRadiologyStatusArr;
      }
      this.MstPaymentModes = this.coreService.masterPaymentModes;
      this.PaymentPages = this.coreService.paymentPages;
    }
  }
  GetPatientVisitConsultants(ipVisitId: number) {
    if (ipVisitId) {
      this._billingBLService.GetPatientVisitConsultants(ipVisitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            const consultants = res.Results;
            if (consultants) {
              const nonPrimaryConsultants = consultants.filter(c => c.IsPrimaryConsultant === false);
              this.ConsultantDoctors = (nonPrimaryConsultants && nonPrimaryConsultants.length > 0) ? nonPrimaryConsultants.map(nc => nc.ConsultantName).join(", ") : undefined;
            }
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Cannot load the consultants ${res.ErrorMessage}`]);
          }
        },
          err => {
            console.log(err.ErrorMessage);
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load consultants."]);
          });
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.PatientPendingBillItemsSubscription.unsubscribe();
  }

  GetPatientCurrentPatientSchemeMap(patientId: number, patientVisitId: number) {
    this._patientBLService.GetPatientCurrentSchemeMap(patientId, patientVisitId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.PatientSchemeMap = res.Results;
          this.PolicyNo = res.Results.PolicyNo;
        }
      },
      err => {
        console.log(err);
      });
  }

  getPatientDetails() {
    this._patientBLService.GetPatientById(this.patientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
          this.patientInfo = res.Results;
          this.patientService.globalPatient = res.Results;

          if (this.patientInfo.SchemeId && this.patientInfo.PriceCategoryId) {
            this.SchemePriceCategoryFromVisit.SchemeId = this.patientInfo.SchemeId;
            this.SchemePriceCategoryFromVisit.PriceCategoryId = this.patientInfo.PriceCategoryId;
            this.LoadAdditionalServiceItems(this.SchemePriceCategoryFromVisit.PriceCategoryId);
          }
          if (res.Results.DiscountSchemeId) {
            this.DiscountSchemeId = res.Results.DiscountSchemeId;

            if (res.Results.IsItemDiscountEnabled && this.SchemePriceCategory.IsDiscountEditable) {
              this.enableItemLevelDiscount = true;
              this.ipBillingDiscountModel.IsItemDiscountEnabled = true;
            } else {
              this.enableItemLevelDiscount = false;
              this.ipBillingDiscountModel.IsItemDiscountEnabled = false;
            }
          }
        }
      });
  }


  LoadPatientBillingSummary(patientId: number, patientVisitId: number) {
    this._dlService.Read("/api/IpBilling/InpatientPendingBillItems?patientId=" + this.patientId + "&ipVisitId=" + this.ipVisitId)
      .map(res => res)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
          this.admissionInfo = res.Results.AdmissionInfo;
          //console.log(this.admissionInfo)
          this.admissionInfo.AdmittedOn = this.admissionInfo.AdmittedOn;
          this.admissionInfo.DischargedOn = moment(this.admissionInfo.DischargedOn).format('YYYY-MM-DDTHH:mm:ss');
          this.patAllPendingItems = res.Results.PendingBillItems;
          const patientsPendingItems = _.cloneDeep(res.Results.PendingBillItems);
          this.billInsuranceService.SetPatientAllPendingItems(patientsPendingItems);
          this.patAllPendingItems.map(a => a.ProvisionalReceiptNoFormatted = ENUM_CancellationService.PR + "/" + a.ProvisionalReceiptNo)

          //! Krishna, Allow Pharmacy Credit Settlement from Billing Only when it is allowed from Settings
          this.ReadParameterToSettlePharmacyCredits();
          if (this.SettlePharmacyCredits) {
            this.pharmacyPendingBillItems = res.Results.PharmacyPendingBillsItems;
            this.PharmacyTotal = res.Results.PharmacyTotalAmount;
          }

          //this.LoadPriceCategoryServiceItems();
          this.PatientPendingBillItemSubject.next(this.patAllPendingItems);

          this.UpdateEmployeeObjects_OfBilTxnItems_ForGrid(this.patAllPendingItems);
          this.GetVisitContext(this.PatientId, this.PatientVisitId)

          this.bedDetails = res.Results.AdmissionInfo.BedDetails;

          //sud: 11May'21--to recalculate deposit amounts
          if (this.admissionInfo) {
            this.model.DepositBalance = ((this.admissionInfo.DepositAdded || 0) - (this.admissionInfo.DepositReturned || 0));
            //this.model.DepositAdded = CommonFunctions.parseAmount(admInfo.DepositAdded);
            //this.model.DepositReturned = CommonFunctions.parseAmount(admInfo.DepositReturned);
            this.DiscountSchemeId = this.admissionInfo.MembershipTypeId;
          }
          //this.model.DepositBalance = CommonFunctions.parseAmount((this.model.DepositAdded || 0) - (this.model.DepositReturned || 0));

          let creditOrgList = _.cloneDeep(this.creditOrganizationsList);
          let defaultOrg = creditOrgList.find(a => a.OrganizationId === this.SchemePriceCategory.DefaultCreditOrganizationId);
          if (defaultOrg) {
            this.selectedCreditOrganization = defaultOrg;
          }
          if (this.SchemePriceCategory && this.SchemePriceCategory.IsDiscountApplicable) {
            this.model.DiscountPercent = this.SchemePriceCategory.DiscountPercent;
            this.InvoiceDiscountOnChange();
          } else {
            //this.CalculationForAll();
          }
          //this.calculateAdmittedDays();
          //this.CalculationForAll();
          this.HasZeroPriceItems();

          this.CalculateTotalDays();
          this.ShowMembershipSelect = true;
          // this.CoreService.loading = false;
        }
        else {

          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [" Unable to get bill summary."]);
          console.log(res.ErrorMessage);
          this.coreService.loading = false;
        }
      });
  }
  //Hom 17 Jan'19
  HasZeroPriceItems(): boolean {
    this.patAllPendingItems.forEach(a => {
      var pendingItems = this.allItemslist.find(b => a.ServiceItemId == b.ServiceItemId && a.ServiceDepartmentId == b.ServiceDepartmentId);
      if (pendingItems) {
        a.IsDoctorMandatory = pendingItems.IsDoctorMandatory;
        a.IsZeroPriceAllowed = pendingItems.IsZeroPriceAllowed;
      }
    });

    var items = this.patAllPendingItems.filter(a => (a.Price == 0 && !a.IsZeroPriceAllowed) || (a.IsDoctorMandatory == true && !a.PerformerId));
    if (items && items.length) {
      this.UpdateItems(items);
      //this.msgBoxServ.showMessage("Warning!", ["Some of the items has price 0. Please update."]);
      let messArr = [];
      if (items.find(a => a.Price == 0 && !a.IsZeroPriceAllowed)) {
        messArr.push("Some of the items has price 0. Please update.");
      }
      if (items.find(a => a.IsDoctorMandatory == true && !a.PerformerId)) {
        messArr.push("Assigned Doctor is mandatory in some of items. Please update.");
      }

      this._messageBoxService.showMessage("Warning!", messArr);
      return true;
    }
  }

  CheckCreditBill(patientId: number) {
    this.hasPreviousCredit = false;
    this.showCreditBillAlert = false;
    this._dlService.Read("/api/Billing/CheckCreditBill?patientId=" + this.patientId)
      .map(res => res)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.hasPreviousCredit = res.Results;
          if (this.hasPreviousCredit) {
            this.LoadCreditInformationOfPatient(patientId);
          }
        }
      });
  }

  LoadCreditInformationOfPatient(patientId: number) {
    this._dlService.Read("/api/Billing/PatientCreditInfo?patientId=" + this.patientId)
      .map(res => res)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.CreditTotal = res.Results;
        }
      });
  }

  GetPharmacyProvisionalBalance() {
    this._dlService.Read("/api/GetPatCrDetail/" + this.patientId + "/null/null/null")
      .map(res => res)
      .subscribe(res => {
        if (res) {
          this.model.PharmacyProvisionalAmount = res.TotalAmount;
        }
      });
  }


  GetPharmacyPendingAmount() {
    this._billingBLService.GetPharmacyPendingAmount(this.patientId, this.ipVisitId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          let PharmacyPendingAmounts = res.Results;
          if (PharmacyPendingAmounts) {
            this.PharmacyPendingAmount.ProvisionalAmount = PharmacyPendingAmounts.ProvisionalAmt;
            this.PharmacyPendingAmount.CreditAmount = PharmacyPendingAmounts.CreditAmount;
          }
        }
      },
      err => {
        console.log(err.ErrorMessage);
      })
  }


  BackToPatientListGrid() {
    this.onClose.emit();
    this.patientService.CreateNewGlobal();
  }

  ClosePatientSummary(showConfirmAlert = true) {
    if (showConfirmAlert) {
      //we need to be sure if the user wants to close the window.
      let sure = window.confirm("are you sure you want to Cancel ?");
      if (sure) {
        this.onClose.emit({ CloseWindow: true });
      }
    }
    else {
      this.onClose.emit({ CloseWindow: true });
    }

  }

  CloseGroupDiscountPopup($event) {
    this.showGroupDiscountPopUp = false;
    //all the items gets return in above event from groupdiscount component.
    //so reassign to pending items, and then do calculation for all..
    if ($event) {
      this.patAllPendingItems = $event;
      this.isGroupDiscountApplied = true;
      //reassign createdby and updated by objects..
      this.UpdateEmployeeObjects_OfBilTxnItems_ForGrid(this.patAllPendingItems);
      this.CalculationForAll();
      this.patAllPendingItems = this.patAllPendingItems.slice();//to refresh the array. needed for grid.
    }

  }

  ConfirmDischarge() {
    if (this.model.Tender < this.model.ToBePaid && this.model.PayType.toLowerCase() !== ENUM_BillPaymentMode.credit.toLowerCase() && this.UseDeposit && this.model.DepositBalance > 0) {
      this._messageBoxService.showMessage("failed", ["Tender must be greater or equal to Cash amount"]);
      return;
    }

    var currDate = moment().format('YYYY-MM-DD HH:mm');
    var disDate = moment(this.dischargeDetail.DischargeDate).format('YYYY-MM-DD HH:mm');
    var AdmissionDate = moment(this.admissionInfo.AdmittedOn).format('YYYY-MM-DD HH:mm');
    if ((moment(currDate).isBefore(disDate))) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage("notice", ["Invalid can't enter future date"]);
      return;
    }
    if ((moment(disDate).isBefore(AdmissionDate))) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage("Notice", ["Invalid can't discharge patient before admission date."]);
      return;
    }

    //! Krishna, 18thMay'23, Check if credit limit is exceeded for CreditLimited Schemes.

    if (this.PatientSchemeMap && (this.SchemePriceCategory.IsCreditLimited || this.SchemePriceCategory.IsGeneralCreditLimited) && (this.SchemePriceCategory.IsCreditLimited && !this.CheckCreditLimits())) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Credit Amount cannot exceed Credit limit."]);
      return;
    }

    if (this.patAllPendingItems && this.patAllPendingItems.length === 0 && this.PharmacyTotal === 0) {
      let sure = window.confirm("You're going to discharge a patient without billing, Are your Sure you want to proceed ?");
      if (sure) {
        this.PostBillAndDischargePatient();
        return;
      } else {
        return;
      }
    }

    if ((this.patAllPendingItems && this.patAllPendingItems.length) || (this.PharmacyTotal > 0)) {//&& this.model.Tender >= this.model.ToBePaid
      if (!this.validDischargeDate) {
        return;
      }

      this.allowDischarge = this.CheckDischargeRule();
      if (!this.allowDischarge) {
        this.ShowOrderStatusInfo = true;
      }
      else {
        this.ShowOrderStatusInfo = false;
      }

      if (this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase() && !this.model.OrganizationId || this.model.OrganizationId === 0) {
        this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed.toLowerCase(), ["Credit Organization is mandatory for credit bill"]);
        return;
      }
      else if ((this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase() || this.model.DiscountPercent > 0) && !this.model.Remarks) {
        this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed.toLowerCase(), [" Remarks is mandatory."]);
        return;
      }
      else {
        let sure = true;
        if (this.model.PayType === ENUM_BillPaymentMode.credit)
          sure = window.confirm("Are you sure to discharge this patient on CREDIT?");
        if (sure) {
          this.showCreditBillAlert = this.hasPreviousCredit;

          if (this.ShowOrderStatusInfo && !this.allowDischarge) {
            this.showDischargePopUpBox = false;
          }
          else {
            this.showDischargePopUpBox = true;
          }
        }
      }
    }

    else {
      this.showCancelAdmissionAlert = true;
    }

    if (this.model.PayType.toLowerCase() != ENUM_BillPaymentMode.credit.toLowerCase() && !this.SchemePriceCategory.IsCoPayment) {
      this.model.OrganizationId = null;
    }

  }
  //to check whether pharmacy charge is cleared or not : 2019/1/25
  PostBillAndDischargePatientPharmacyCharge() {
    // this.PostBillAndDischargePatient();
    this.HandleInvoiceRequest();
  }

  PostBillAndDischargePatient() {
    if (this.HasZeroPriceItems()) {
      return;
    }
    let currDate = moment().format('YYYY-MM-DD HH:mm');
    let disDate = moment(this.dischargeDetail.DischargeDate).format('YYYY-MM-DD HH:mm');
    let AdmissionDate = moment(this.admissionInfo.AdmittedOn).format('YYYY-MM-DD HH:mm');
    if ((moment(currDate).isBefore(disDate))) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage("notice", ["Invalid can't enter future date"]);
      return;
    }
    if ((moment(disDate).isBefore(AdmissionDate))) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage("notice", ["Invalid can't discharge patient before admission date."]);
      return;
    }

    this.loading = true;
    this.dischargeDetail.PatientVisitId = this.ipVisitId;
    this.showDischargePopUpBox = false;
    this.loadingScreen = false;
    this.billType = "invoice";
    this.billStatus = "";

    this.HandlePaymentTransaction();

  }

  /**This method is responsible to check whether FewaPay is applicable or not if not proceed with normal workflow else wait for the message sent by FewaPay Browser extension and decide after message is received*/
  private HandlePaymentTransaction() {
    if (this._fewaPayService.IsFewaPayApplicable(this.model.PaymentDetails)) {
      this.loadingScreen = true;
      const transactionReqString = this._fewaPayService.CreateFewaPayTransactionRequest(this.model.PaymentDetails, this.totalAmountToPassToPaymentModeInfo, this.model.Remarks);
      if (transactionReqString) {
        window.postMessage({
          type: ENUM_FewaPayMessageTypes.PaymentInfoRequest,
          data: transactionReqString,
        }, "*");
        console.log('Transaction Request is posted from Danphe.');
      } else {
        this.loadingScreen = false;
        this.loading = false;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Transaction Request cannot be created due to missing mandatory data like paymentDetails, totalAmount and remarks`]);
      }

    } else {
      this.PostBillingTransaction();
    }
  }

  ProceedDischargeWithZeroItems() {
    let currDate = moment().format('YYYY-MM-DD');
    let disDate = moment(this.dischargeDetail.DischargeDate).format('YYYY-MM-DD');
    if ((moment(currDate) < moment(disDate))) {
      this._messageBoxService.showMessage("notice", ["Invalid can't enter future date"]);
      return;
    }

    if (this.dischargeDetail && this.dischargeDetail.Remarks) {
      this.loading = true;
      let data = {
        "PatientVisitId": this.ipVisitId,
        "PatientId": this.patientId,
        "DischargeDate": this.dischargeDetail.DischargeDate,
        "CounterId": this._securityService.getLoggedInCounter().CounterId,
        "DepositBalance": this.model.DepositBalance,
        "DischargeRemarks": this.dischargeDetail.Remarks,
        "DiscountSchemeId": this.DiscountSchemeId,
        "DischargeFrom": "billing"
      };
      this._billingBLService.DischargePatientWithZeroItem(data)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.showCancelAdmissionAlert = false;
            if ((res.Results.DepositId > 0)) {
              this.deposit = res.Results;
              this.deposit.PatientName = this.patientService.getGlobal().ShortName;
              this.deposit.PatientCode = this.patientService.getGlobal().PatientCode;
              this.deposit.Address = this.patientService.getGlobal().Address;
              this.deposit.PhoneNumber = this.patientService.getGlobal().PhoneNumber;
              this.showDepositReceipt = true;
            } else {
              this.BackToPatientListGrid();
            }
            this.loading = false;
            this._messageBoxService.showMessage("success", ["Patient discharge successfully."]);
          }
          else {
            this._messageBoxService.showMessage("failed", ["Patient discharge failed."]);
            console.log(res.ErrorMessage);
            this.loading = false;
          }
        });
    } else {
      this._messageBoxService.showMessage("failed", ["Discharge Remarks is mandatory."]);
      this.loading = false;
    }
  }

  CloseDepositReceipt($event?: any) {
    this.BackToPatientListGrid();
  }

  CloseZeroItemBillingPopUp() {
    this.showCancelAdmissionAlert = false;
    this.loading = false;
    this.dischargeDetail.Remarks = null;
  }

  CloseRecieptView() {
    this.showDischargeBill = false;
    this.showEstimationBill = false;
    if (this.IsProvisionalDischarge) {
      this._router.navigate(['/Billing/SearchPatient']);
    }
    if (this.billType === "invoice") {
      this.ClosePatientSummary(false);
    }
  }

  NewItemBtn_Click() {
    this.showIpBillRequest = false;
    this._changeDetector.detectChanges();
    this.showIpBillRequest = true;
  }

  CloseNewItemAdd($event) {
    if ($event && $event.newItems) {

      $event.newItems.forEach(billItem => {
        this.patAllPendingItems.push(billItem);
      });

      //reassign CreatedByObj and ModifiedByObj of pending items. it's needed in grid.
      this.UpdateEmployeeObjects_OfBilTxnItems_ForGrid(this.patAllPendingItems);

      this.patAllPendingItems = this.patAllPendingItems.slice();
    }

    this.patAllPendingItems.forEach(itm => {
      itm.ProvisionalReceiptNoFormatted = `PR/${itm.ProvisionalReceiptNo}`;
      if (itm.DiscountPercent === 0 && !this.enableItemLevelDiscount) {
        // if (itm.DiscountApplicable) {
        if ((itm.DiscountPercent === 0 || this.InvoiceLevelDiscountChanged)) {
          itm.DiscountPercent = (this.SchemePriceCategory.IsDiscountApplicable && this.model.DiscountPercent) ? this.model.DiscountPercent : 0;
        } else {
          this.InvoiceLevelDiscountChanged = false;
        }
        // }
        //itm.DiscountPercent = this.currMembershipDiscountPercent;
        //itm.DiscountPercentAgg = this.model.DiscountPercent ? this.model.DiscountPercent : 0;
        itm.DiscountAmount = (itm.SubTotal * itm.DiscountPercent) / 100;
        itm.DiscountSchemeId = this.DiscountSchemeId;
      }
    });
    // this.FilterItemsAndAssignCoPayAndDiscountInfo();
    this.CalculationForAll();
    this.coreService.loading = false;
    //this.CalculationForAll();
    this.showIpBillRequest = false;
    this.patAllPendingItems = this.patAllPendingItems.slice();
    this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
  }

  AddDepositBtn_Click() {
    this.patientService.globalPatient.PatientId = this.patientId;
    this.showDepositPopUp = true;
  }
  //Hom 17 Jan'19
  UpdateItems(items: Array<BillingTransactionItem> = null) {
    if (items) {
      this.updatedItems = items.map(a => Object.assign({}, a));
    }
    else {
      this.updatedItems = this.patAllPendingItems.map(a => Object.assign({}, a));
    }
    this.updatedItems = this.updatedItems.sort((itemA: BillingTransactionItem, itemB: BillingTransactionItem) => {
      if (itemA.Price > itemB.Price) return 1;
      if (itemA.Price < itemB.Price) return -1;
    });

    this.updatedItems.forEach(item => {
      item.IsSelected = false
      const itm = this.PriceCategoryServiceItems.find(a => a.ServiceItemId === item.ServiceItemId);
      if (itm) {
        item.IsPriceChangeAllowed = itm.IsPriceChangeAllowed;
        item.IsZeroPriceAllowed = itm.IsZeroPriceAllowed;
      }
    });
    this.showUpdatePricePopup = true;
  }

  //yubraj: 28th Nov '18
  GroupDiscountBtn_Click() {
    // this.groupDiscountPercent = null;
    // this.discountGroupItems = this.patAllPendingItems.map(a => Object.assign({}, a));
    // this.discountGroupItems.forEach(item => item.IsSelected = true);
    this.showGroupDiscountPopUp = true;
  }

  CalculationForAll() {

    let admInfo = this.admissionInfo;
    let itemsInfo = this.patAllPendingItems;
    let pharmacyItemsInfo = this.pharmacyPendingBillItems;
    let discountPercent = this.patAllPendingItems[0] ? this.patAllPendingItems[0].DiscountPercent : 0;
    let subTotal: number = 0;
    let totAmount: number = 0;
    let discAmt: number = 0;
    if (itemsInfo && itemsInfo.length > 0 || (pharmacyItemsInfo && pharmacyItemsInfo.length > 0)) {
      itemsInfo.forEach(itm => {
        itm.DiscountAmount = this._billingInvoiceBlService.CalculateAmountFromPercentage(itm.DiscountPercent, itm.SubTotal);
        itm.TotalAmount = itm.SubTotal - itm.DiscountAmount;


        subTotal += (itm.SubTotal ? itm.SubTotal : 0);
        totAmount += (itm.TotalAmount ? itm.TotalAmount : 0);
        discAmt += (itm.DiscountAmount ? itm.DiscountAmount : 0);


        itm.TaxableAmount = itm.IsTaxApplicable ? (itm.SubTotal - itm.DiscountAmount) : 0;
        itm.NonTaxableAmount = itm.IsTaxApplicable ? 0 : (itm.SubTotal - itm.DiscountAmount);
      });
      let overallSubTot = itemsInfo.reduce(function (acc, itm) { return acc + itm.SubTotal; }, 0);
      let overallDiscAmt = itemsInfo.reduce(function (acc, itm) { return acc + itm.DiscountAmount; }, 0);
      discountPercent = CommonFunctions.parseAmount(this._billingInvoiceBlService.CalculatePercentage(overallDiscAmt, overallSubTot), 3); //CommonFunctions.parseAmount(overallDiscAmt * 100 / overallSubTot, 3);
      //let pharmacyTotal = this.PharmacyTotal;
      this.model.DiscountPercent = discountPercent;
      this.estimatedDiscountPercent = this.model.DiscountPercent;
      this.model.SubTotal = subTotal; //CommonFunctions.parseAmount();
      this.model.TotalAmount = totAmount; //CommonFunctions.parseAmount();
      this.model.PharmacyTotal = this.PharmacyTotal;
      this.model.GrandTotal = this.model.TotalAmount + this.model.PharmacyTotal

      if (this.UseDeposit) {
        if (this.model.DepositBalance >= this.model.GrandTotal) {
          this.model.ToBePaid = 0;
        } else {
          this.model.ToBePaid = this.model.GrandTotal - this.model.DepositBalance;
        }
      }

      if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {

        //!Krishna, 2ndApril'23, this is needed to be calculated here again, as Discount may Change which can change TotalAmount
        this.patAllPendingItems.forEach(ele => {
          if (ele.IsCoPayment) {
            ele.CoPaymentCashAmount = this._billingInvoiceBlService.CalculateAmountFromPercentage(ele.CoPaymentCashPercent, ele.TotalAmount);
            ele.CoPaymentCreditAmount = this._billingInvoiceBlService.CalculateAmountFromPercentage(ele.CoPaymentCreditPercent, ele.TotalAmount);
          } else {
            ele.CoPaymentCashAmount = 0;
            ele.CoPaymentCreditAmount = 0;
          }
        });
        this.model.ReceivedAmount = this.patAllPendingItems.reduce((acc, itm) => acc + itm.CoPaymentCashAmount, 0);
        this.model.ReceivedAmount = CommonFunctions.parseAmount(this.model.ReceivedAmount, 3);

        //* Incase of Deposit
        if (this.UseDeposit) {
          if (this.model.DepositBalance > 0) {
            if (this.model.DepositBalance >= this.model.ReceivedAmount) {
              this.model.ToBeRefund = this.model.DepositBalance - this.model.ReceivedAmount;
              this.model.Tender = 0;
              this.model.Change = 0;
              this.model.ToBePaid = 0;
              this.model.CoPaymentCreditAmount = this.model.TotalAmount - this.model.ReceivedAmount;
              this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
            } else {
              this.model.ToBeRefund = 0;
              this.model.Tender = this.model.ReceivedAmount - this.model.DepositBalance;
              this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
              this.model.Change = 0;
              this.model.ToBePaid = this.model.ReceivedAmount - this.model.DepositBalance;
              this.model.CoPaymentCreditAmount = this.model.TotalAmount - this.model.ReceivedAmount;
              this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
            }
          } else {
            this.model.CoPaymentCreditAmount = this.model.TotalAmount - this.model.ReceivedAmount;
            this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
            this.model.Tender = this.model.ReceivedAmount;
            this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
            this.model.ToBeRefund = 0;
            this.model.ToBePaid = this.model.ReceivedAmount;
            this.model.Change = 0;
          }
        } else {
          this.model.CoPaymentCreditAmount = this.model.TotalAmount - this.model.ReceivedAmount;
          this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
          this.model.Tender = this.model.ReceivedAmount;
          this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
          this.model.ToBeRefund = 0;
          this.model.ToBePaid = this.model.ReceivedAmount;
          this.model.Change = 0;
        }
      } else {
        this.model.CoPaymentCreditAmount = this.model.TotalAmount - this.model.ReceivedAmount;
        this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
        this.model.Tender = this.model.ReceivedAmount;
        this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
        this.model.ToBeRefund = 0;
        this.model.ToBePaid = this.model.ReceivedAmount;
        this.model.Change = 0;
      }

      if (this.SchemePriceCategory && !this.SchemePriceCategory.IsCoPayment && this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase()) {
        this.model.CoPaymentCreditAmount = 0;
        this.model.ReceivedAmount = 0;
        this.model.ToBePaid = 0;
        this.model.Change = 0;
        this.model.ToBeRefund = 0;
      }

      if (this.SchemePriceCategory && !this.SchemePriceCategory.IsCoPayment && this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.cash.toLowerCase()) {
        this.model.CoPaymentCreditAmount = 0;
        this.model.ReceivedAmount = 0;
        this.model.ToBeRefund = 0;

        //* Incase of Deposit
        if (this.UseDeposit) {
          if (this.model.DepositBalance > 0) {
            if (this.model.DepositBalance >= this.model.TotalAmount) {
              this.model.ToBeRefund = this.model.DepositBalance - this.model.GrandTotal;
              this.model.ReceivedAmount = this.model.TotalAmount;
              this.model.ToBePaid = 0;
              this.model.Tender = 0;
              this.model.Change = 0;
            } else {
              this.model.ToBeRefund = 0;
              this.model.ToBePaid = this.model.GrandTotal - this.model.DepositBalance;
              this.model.ReceivedAmount = this.model.ToBePaid;
              this.model.Tender = this.model.ToBePaid;
              this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
              this.model.Change = 0;
            }
          } else {
            this.model.ToBePaid = this.model.GrandTotal;
            this.model.ReceivedAmount = this.model.ToBePaid;
            this.model.Tender = this.model.GrandTotal;
            this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
            this.model.ToBeRefund = 0;
            this.model.Change = 0;
          }
        } else {
          this.model.ToBePaid = this.SettlePharmacyCredits == true ? this.model.GrandTotal : this.model.TotalAmount;
          this.model.ReceivedAmount = this.model.ToBePaid;
          this.model.Tender = this.SettlePharmacyCredits == true ? this.model.GrandTotal : this.model.TotalAmount;
          this.amountToBeUsedInCalculationOfTenderAndChangeOnly = this.model.Tender;
          this.model.ToBeRefund = 0;
          this.model.Change = 0;
        }
      }

      this.model.ToBeRefund = CommonFunctions.parseAmount(this.model.ToBeRefund, 3);
      this.model.Tender = CommonFunctions.parseAmount(this.model.Tender, 3);
      this.model.DiscountAmount = CommonFunctions.parseAmount(discAmt, 3);
      this.model.ReceivedAmount = CommonFunctions.parseAmount(this.model.ReceivedAmount, 3);
      this.model.GrandTotal = CommonFunctions.parseAmount(this.model.GrandTotal, 3);
      this.model.ToBePaid = CommonFunctions.parseAmount(this.model.ToBePaid, 3);

      this.estimatedDiscountAmount = this.model.DiscountAmount;

    }
    else {
      this.model.DiscountPercent = 0;
      this.model.SubTotal = 0;
      this.model.TotalAmount = 0;
      this.model.ReceivedAmount = 0;
      this.model.CoPaymentCreditAmount = 0;
      this.model.DiscountAmount = 0;
      this.model.GrandTotal = 0;
      this.model.ToBePaid = 0;
      this.model.ToBeRefund = this.model.DepositBalance;
    }

    //*Krishna, 9thFeb'23 Below Logic is to Pass Amount to PaymentModeInfo Component for further calculations
    if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
      this.totalAmountToPassToPaymentModeInfo = this.model.ReceivedAmount;
    } else {
      this.totalAmountToPassToPaymentModeInfo = this.model.TotalAmount;
    }


    this.patAllPendingItems = this.patAllPendingItems.slice();
  }


  CallBackDepositAdd($event = null) {
    if ($event) {
      this.model.DepositBalance = $event.depositBalance;
      //this.admissionInfo.DepositAdded = $event.depositBalance;
      this.DisplayDeductDepositCheckbox = true;
      this.UseDeposit = true;
      this.CalculationForAll();
    }
  }
  CloseDepositPopUp() {
    this.showIpBillRequest = false;
    this.showDepositPopUp = false;
  }

  ShowDepositPopUp() {
    //this.showIpBillingWarningBox = false;
    this.showDepositPopUp = true;
  }


  //this will be called when Item's edit window is closed.
  CloseItemEditWindow($event) {
    this.showEditItemsPopup = false;
    if ($event.EventName === "update" && $event.updatedItem) {
      this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
    }
    else {
      let index = this.patAllPendingItems.findIndex(a => a.BillingTransactionItemId == this.selItemForEdit.BillingTransactionItemId);
      if ($event.EventName == "update" && $event.updatedItem) {
        //reassign modifiedByObj and CreatedByObj values. wrap in array since the function accepts array of txnitems.
        this.UpdateEmployeeObjects_OfBilTxnItems_ForGrid([$event.updatedItem]);

        //replace the item in array by current one from updated..
        this.patAllPendingItems[index] = $event.updatedItem;
      }
      else if ($event.EventName == "cancelled") {
        this.showEditItemsPopup = false; // for close edit popup window
        this.patAllPendingItems.splice(index, 1);
        this.allowDischarge = this.CheckDischargeRule();//sud:15Oct'20-EMR-2638

        this.GetDetailForInpatientsCancelledItems(this.patientId, this.ipVisitId);
      }
      //this.LoadItemPriceByPriceCategory();
      // this.FilterItemsAndAssignCoPayAndDiscountInfo();
      this.patAllPendingItems = this.patAllPendingItems.slice();
      //this.CalculationForAll();
      this.CalculationForAll();
      this.coreService.loading = false;
    }
  }

  SetDoctorsList() {
    //sud:2May'20: reuse global variables for doctors list..
    this.doctorsList = this._billingService.GetDoctorsListForBilling();
    let Obj = new Object();
    Obj["EmployeeId"] = null;
    Obj["FullName"] = "SELF";
    this.doctorsList.push(Obj);
  }


  //Yubraj : 20th Dec '18
  UpdateProcedure() {
    this.loading = true;

    var admissionPatId = this.admissionInfo.AdmissionPatientId;
    var ProcedureType = this.admissionInfo.ProcedureType;
    if (ProcedureType) {

      this._billingBLService.UpdateProcedure(admissionPatId, ProcedureType)
        .subscribe(
          res => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
              this._messageBoxService.showMessage("success", ["Procedure Type Updated Successfully."]);
              this.loading = false;
            }
            else {
              this._messageBoxService.showMessage("failed", [res.ErrorMessage]);
              this.loading = false;
            }
          });
    }
    else {
      this._messageBoxService.showMessage("failed", ["Please enter Procedure Description."]);
      this.loading = false;
    }
  }


  ShowEstimationBill() {

    this.billType = "estimation";
    this.billStatus = "provisional";
    this.showEstimationBill = true;
  }





  //if autoAddBedItems is true then only we should update the bedquantity. else don't call the api (blservice)
  UpdateBedDuration() {

    // let AutoAddBedItemsStr = this.CoreService.Parameters.find(p => p.ParameterGroupName == "ADT" && p.ParameterName == "AutoAddBillingItems").ParameterValue;
    // let AutoAddBedItems = JSON.parse(AutoAddBedItemsStr);

    //if (this.autoBedBillParam.DoAutoAddBedItem) {
    // this.billingBLService.UpdateBedDurationBillTxn(this.bedDurationDetails)
    this._billingBLService.UpdateBedDurationBillTxn(this.ipVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          console.log("ADT Bill Items Quantity updated.");
          this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
        }
        else {
          console.log("Failed to update bed transaction detail.");
          console.log(res.ErrorMessage);
          this.coreService.loading = false;
        }
      });
    //}
  }

  PostBillingTransaction() {
    this.MapBillingTransaction();
    this.ipBillingTxnVM.billingTransactionModel = this.billingTransaction;
    this.ipBillingTxnVM.billingTransactionModel.SchemeId = this.DiscountSchemeId;//sud:29Mar'23--For New BillingStructure.
    this.dischargeDetail.ProcedureType = this.admissionInfo.ProcedureType;
    this.dischargeDetail.PatientId = this.patientId;
    this.dischargeDetail.DiscountSchemeId = this.DiscountSchemeId;
    this.dischargeDetail.BillingTransactionId = 0;
    this.ipBillingTxnVM.dischargeDetailVM = this.dischargeDetail;
    this.ipBillingTxnVM.billingTransactionModel.ReceivedAmount = this.model.ReceivedAmount;
    if (this.SchemePriceCategory.IsCoPayment) {
      this.ipBillingTxnVM.billingTransactionModel.PaymentMode = this.model.CoPayment_PaymentMode;
      this.ipBillingTxnVM.billingTransactionModel.IsCoPayment = this.SchemePriceCategory.IsCoPayment;
    }

    if (this.ipBillingTxnVM.billingTransactionModel.PaymentMode.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase() && (!this.ipBillingTxnVM.billingTransactionModel.OrganizationId || this.ipBillingTxnVM.billingTransactionModel.OrganizationId === 0)) {
      this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed.toLowerCase(), ["Credit Organization is mandatory for credit"]);
      this.loading = false;
      return;
    }

    this._billingBLService.PostIpBillTransactionAndDischarge(this.ipBillingTxnVM, this.pharmacyPendingBillItems, this.PharmacyTotal)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (this.model.PaymentDetails && this.model.PaymentDetails.toLowerCase().includes(ENUM_PaymentModeSubCategory.FonePay) && this.coreService.EnableFewaPay === false && this.coreService.EnableDirectFonePay) {
            // if (res.Results !== null && res.Results.Result !== null && res.Results.Result.Result) {
            if (res.Results !== null) {
              this.DynamicQrMessage = res.Results.qrMessage;
              this.ShowDynamicQr = true;
            }
          } else {
            this.DischargeStatementId = res.Results.DischargeStatementId;
            this.PatientId = res.Results.PatientId;
            this.PatientVisitId = res.Results.PatientVisitId;
            this.showDischargeBill = true;
            this.loading = false;
          }
        }
        else {
          this._messageBoxService.showMessage("failed", [res.ErrorMessage]);
          //this.msgBoxServ.showMessage("failed", ["Unable to complete billing transaction."]);
          this.BackToPatientListGrid();//redirect to ipbilling list if failed.
          console.log(res.ErrorMessage);
          this.loading = false;
        }
      });
    this.loadingScreen = false;
  }

  CancelDischarge() {
    this.showDischargePopUpBox = false;
    this.dischargeDetail.Remarks = "";
    this.loading = false;
  }


  //sud:18May'21--To display Invoice from here
  public bil_InvoiceNo: number = 0;
  public bil_FiscalYrId: number = 0;
  public bil_BilTxnId: number = null;

  DischargePatient(invoiceNo: number, fiscYrId: number) {
    this.dischargeDetail.BillStatus = this.billingTransaction.BillStatus;
    this.dischargeDetail.BillingTransactionId = this.bil_BilTxnId;//sud:15Sept'21--replaced old variable with new to keep similarity with other pages
    this.dischargeDetail.DiscountSchemeId = this.DiscountSchemeId;
    this.dischargeDetail.PatientId = this.patientId;
    this.dischargeDetail.ProcedureType = this.admissionInfo.ProcedureType;
    this._billingBLService.DischargePatient(this.dischargeDetail)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.bil_InvoiceNo = invoiceNo;
          this.bil_FiscalYrId = fiscYrId;
          this.showDischargeBill = true;
          this.loading = false;
        }
        else {
          this._messageBoxService.showMessage("failed", ["BILLING TRANSACTION completed but DISCHARGE PATIENT failed."]);
          console.log(res.ErrorMessage);
          this.loading = false;
        }
      });
  }


  MapBillingTransaction() {
    this.patAllPendingItems.forEach(a => {
      a.DiscountSchemeId = this.DiscountSchemeId;
    });

    this.billingTransaction = new BillingTransaction;

    if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
      this.billingTransaction.PaymentMode = ENUM_BillPaymentMode.credit;
      this.model.PayType = ENUM_BillPaymentMode.credit;
    }
    this.billingTransaction.BillingTransactionItems = this.patAllPendingItems;
    this.billingTransaction.PatientId = this.patientId;
    this.billingTransaction.PatientVisitId = this.ipVisitId;
    this.billingTransaction.PatientMapPriceCategoryId = this.PatientSchemeMap ? this.PatientSchemeMap.PatientSchemeId : null;
    this.billingTransaction.ClaimCode = this.PatientSchemeMap ? this.PatientSchemeMap.LatestClaimCode : null;
    this.billingTransaction.MemberNo = this.PatientSchemeMap ? this.PatientSchemeMap.PolicyNo : null;
    this.billingTransaction.PaymentMode = this.model.PayType.toLowerCase() == 'others' ? 'cash' : this.model.PayType.toLowerCase();
    this.billingTransaction.PaymentDetails = this.model.PaymentDetails;
    this.billingTransaction.BillStatus = this.model.PayType.toLocaleLowerCase() != "credit" ? "paid" : "unpaid";
    this.billingTransaction.Remarks = this.model.Remarks;
    this.billingTransaction.SubTotal = this.model.SubTotal;
    this.billingTransaction.OtherCurrencyDetail = this.model.OtherCurrencyDetail;
    //for exchange rate
    if (this.exchangeRate == 0) {
      this.billingTransaction.ExchangeRate = null;
    } else {
      this.billingTransaction.ExchangeRate = this.exchangeRate;
    }

    this.billingTransaction.DiscountAmount = this.model.DiscountAmount;
    this.billingTransaction.TotalAmount = this.model.TotalAmount;
    this.billingTransaction.OrganizationId = this.model.OrganizationId;
    if (this.model.OrganizationId) {
      let org = this.creditOrganizationsList.find(a => a.OrganizationId == this.model.OrganizationId);
      this.selectedCreditOrganization = org;
      this.billingTransaction.OrganizationName = org.OrganizationName;
    }

    if (this.model.DiscountPercent)
      this.billingTransaction.DiscountPercent = this.model.DiscountPercent;
    else
      if (this.model.SubTotal > 0) {
        this.billingTransaction.DiscountPercent = (this.billingTransaction.DiscountAmount * 100) / (this.model.SubTotal);// CommonFunctions.parseAmount();
      }

    this.billingTransaction.TaxId = this._billingService.taxId;
    // this.billingTransaction.PaidAmount = this.billingTransaction.BillStatus == "paid" ? this.model.ToBePaid : 0;
    this.billingTransaction.PaidAmount = this.billingTransaction.BillStatus === ENUM_BillingStatus.paid ? this.model.ReceivedAmount : 0; //Krishna, 31,Aug'22, to handle Co-Payment
    this.billingTransaction.Tender = this.model.Tender;
    this.billingTransaction.Change = this.model.Change;



    //sud:11May'21--To Recalculate Deposit amounts..
    this.billingTransaction.DepositAvailable = this.model.DepositBalance;

    if (this.billingTransaction.PaymentMode !== ENUM_BillPaymentMode.credit) {
      if (this.UseDeposit) {
        //if tobepaid is more than zero that means all deposit available will be used, else only totalamount will be deducted from deposit.
        this.billingTransaction.DepositUsed = (this.model.ToBePaid > 0) ? this.billingTransaction.DepositAvailable : this.model.TotalAmount;
        //if to be paid is more than zero, than all deposit will already be used, so DepositReturnAmount will be Zero. Else calculate the amount (Avaliable-Used)
        this.billingTransaction.DepositReturnAmount = (this.model.ToBePaid > 0) ? 0 : (this.billingTransaction.DepositAvailable - this.billingTransaction.DepositUsed);
        this.billingTransaction.DepositBalance = 0;//From IpBilling we settle all amounts using ReturnDeposit.
      } else {
        this.billingTransaction.DepositUsed = 0;
        this.billingTransaction.DepositReturnAmount = this.billingTransaction.DepositAvailable > 0 ? this.billingTransaction.DepositAvailable : 0;
        this.billingTransaction.DepositBalance = 0;
      }

      if (this.model.PayType.toLocaleLowerCase() != "others")
        this.MapEmpCashTransactions();
      this.billingTransaction.EmployeeCashTransaction = this.TempEmployeeCashTransaction;
    }
    else {
      if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment && this.billingTransaction.PaymentMode === ENUM_BillPaymentMode.credit) {
        if (this.UseDeposit) {
          this.billingTransaction.DepositUsed = (this.model.ToBePaid > 0) ? this.billingTransaction.DepositAvailable : this.model.ReceivedAmount;
          this.billingTransaction.DepositReturnAmount = (this.model.ToBePaid > 0) ? 0 : (this.billingTransaction.DepositAvailable - this.billingTransaction.DepositUsed);
          this.billingTransaction.DepositBalance = 0;
        } else {
          this.billingTransaction.DepositUsed = 0;
          this.billingTransaction.DepositReturnAmount = this.billingTransaction.DepositAvailable > 0 ? this.billingTransaction.DepositAvailable : 0;
          this.billingTransaction.DepositBalance = 0;
        }
      } else {
        this.billingTransaction.DepositUsed = 0;
        this.billingTransaction.DepositReturnAmount = 0;
        this.billingTransaction.DepositBalance = this.model.DepositBalance;
      }
      if (this.model.PayType.toLocaleLowerCase() != "others") {
        this.MapEmpCashTransactions();
      }

      this.billingTransaction.EmployeeCashTransaction = this.TempEmployeeCashTransaction;
    }

    this.billingTransaction.PaidCounterId = this.billingTransaction.BillStatus == "paid" ? this._securityService.getLoggedInCounter().CounterId : null;
    this.billingTransaction.CounterId = this._securityService.getLoggedInCounter().CounterId;

    this.patAllPendingItems.forEach(item => {
      if (item.IsTaxApplicable) {
        this.billingTransaction.TaxableAmount += item.TaxableAmount;
      }
      else {
        this.billingTransaction.NonTaxableAmount += item.NonTaxableAmount;
      }
      item.DiscountSchemeId = this.DiscountSchemeId;
      item.PaidCounterId = this.billingTransaction.PaidCounterId;
      this.billingTransaction.TotalQuantity += item.Quantity;
      this.billingTransaction.BillStatus = this.billingTransaction.BillStatus;
    });

    this.billingTransaction.TransactionType = "inpatient";
    this.billingTransaction.InvoiceType = ENUM_InvoiceType.inpatientDischarge;
    this.model.DiscountPercent = 0;

    if (this.SchemePriceCategory.IsCoPayment) {
      this.billingTransaction.PaymentMode = ENUM_BillPaymentMode.credit;
      this.billingTransaction.CoPaymentCreditAmount = this.model.CoPaymentCreditAmount;
      this.billingTransaction.IsMedicarePatientBilling = this.model.IsMedicarePatientBilling;
    }
  }



  //start: Sud-7Oct'20--For AutoAdd bed items cases
  public totalDays: number = 0;//this is used just to show the total days in frontend.

  public CalculateTotalDays() {
    this.totalDays = moment(this.dischargeDetail.DischargeDate).diff(this.admissionInfo.AdmittedOn, "day");
    if (this.totalDays === 0) {
      this.totalDays = 1;
    }
    //this.totalDays = moment(this.dischargeDetail.DischargeDate).date() -   moment(this.admissionInfo.AdmittedOn).date();
    var currDate = moment().format('YYYY-MM-DD HH:mm');
    var disDate = moment(this.dischargeDetail.DischargeDate).format('YYYY-MM-DD  HH:mm');
    var AdmissionDate = moment(this.admissionInfo.AdmittedOn).format('YYYY-MM-DD  HH:mm');

    if ((moment(currDate).isBefore(disDate)) || (moment(disDate).isBefore(AdmissionDate))) {
      this.validDischargeDate = false;
    }
    else {
      this.validDischargeDate = true;
    }
  }

  //end: Sud-7Oct'20--For AutoAdd bed items cases



  //Hom 17 Jan '19
  CloseUpdatePricePopup($event) {
    if ($event && $event.modifiedItems) {
      let updatedItems = $event.modifiedItems;


      if (updatedItems && updatedItems.length > 0) {

        //if bed charge is modified then we need to call the server again.. else we can update the items locally..
        //below hardcode of bedcharge should be removed...
        // let isBedChargeUpdated = updatedItems.find(itm => itm.ServiceDepartmentName == "Bed Charges" || itm.ServiceDepartmentName == "Bed Charge") != null;

        // if (isBedChargeUpdated) {
        this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
      }
      else {
        //replace the main list i.e: patallpendingitems with updated items at correct index.
        updatedItems.forEach(itm => {
          let index = this.patAllPendingItems.findIndex(a => a.BillingTransactionItemId == itm.BillingTransactionItemId);
          this.patAllPendingItems[index] = itm;

        });
      }
      // }

      //reassign createdby and modifiedby emp objects for the items. it's needed for grid
      this.UpdateEmployeeObjects_OfBilTxnItems_ForGrid(this.patAllPendingItems);

      this.patAllPendingItems = this.patAllPendingItems.slice();
    }
    this.showUpdatePricePopup = false;
    // this.FilterItemsAndAssignCoPayAndDiscountInfo();
    this.CalculationForAll();
    this.coreService.loading = false;
    // this.CalculationForAll();
  }
  //1st August:  Dinesh Adding tender and change field
  ChangeTenderAmount() {

    if (this.model.Tender) {
      this.model.Change = CommonFunctions.parseAmount(this.model.Tender - this.amountToBeUsedInCalculationOfTenderAndChangeOnly, 3);
    }
    else {
      this.model.Change = 0;
    }
  }



  IPBillItemGridActions($event) {
    switch ($event.Action) {
      case "edit": {
        this.selItemForEdit = $event.Data;
        //Yubraj 30th July -- Disable discount TextBox in case of DiscableApplicable is false
        let serviceItemId = this.selItemForEdit.ServiceItemId;
        let itmName = this.selItemForEdit.ItemName;
        let selItemDetails = this.allItemslist.find(a => a.ServiceItemId == serviceItemId)
        if (selItemDetails) {
          this.discountApplicable = selItemDetails.DiscountApplicable;
          this.selItemForEdit.IsDoctorMandatory = selItemDetails.IsDoctorMandatory;
        }


        //Anish: 14 Aug, 2020
        this.selItemForEdit.AllowCancellation = true;

        if (this.isCancelRuleEnabled && this.selItemForEdit.ItemIntegrationName && this.selItemForEdit.BillingTransactionItemId > 0) {
          if ((this.selItemForEdit.ItemIntegrationName.toLowerCase() == 'lab' && !this.billingCancellationRule.labStatus.includes(this.selItemForEdit.OrderStatus))
            || (this.selItemForEdit.ItemIntegrationName.toLowerCase() == 'radiology' && !this.billingCancellationRule.radiologyStatus.includes(this.selItemForEdit.OrderStatus))) {
            this.selItemForEdit.AllowCancellation = false;
          }
        }


        // Check if the item was requested under a different price category
        const selItemPriceCategoryId = this.selItemForEdit.PriceCategoryId;
        const visitPriceCategoryId = this.SchemePriceCategoryFromVisit.PriceCategoryId;
        const selItemPriceCategory = this.selItemForEdit.PriceCategory;
        const SchemePriceCategoryID = this.SchemePriceCategoryObj.PriceCategoryId

        if (selItemPriceCategoryId && visitPriceCategoryId && SchemePriceCategoryID) {
          if (selItemPriceCategoryId !== visitPriceCategoryId && selItemPriceCategoryId !== SchemePriceCategoryID) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`This item was requested under the ${selItemPriceCategory} price category. Please change the price category to update.`]);
            return;
          } else if (selItemPriceCategoryId === visitPriceCategoryId && selItemPriceCategoryId !== SchemePriceCategoryID) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`This item was requested under the ${selItemPriceCategory} price category. Please change the price category to update.`]);
            return;
          }
        }

        //anjana/7-oct-2020: EMR:2708
        let currItmMaster = this.allItemslist.find(itm => itm.ServiceDepartmentId == this.selItemForEdit.ServiceDepartmentId && itm.ItemId == this.selItemForEdit.ItemId);
        if (currItmMaster) {
          this.selItemForEdit.IsTaxApplicable = currItmMaster.TaxApplicable;
        }
        const item = this.PriceCategoryServiceItems.find(a => a.ServiceItemId === this.selItemForEdit.ServiceItemId);
        this.selItemForEdit.IsPriceChangeAllowed = item.IsPriceChangeAllowed;
        this.selItemForEdit.IsZeroPriceAllowed = item.IsZeroPriceAllowed;

        this.showEditItemsPopup = true;
      }
      default:
        break;
    }
  }


  //start: sud:30Apr'20--CodeOptimization
  // LoadAllBillItems() {
  //   this.allItemslist = this.billingService.allBillItemsPriceList;
  // }

  public allEmployeeList = [];
  // LoadAllEmployees() {
  //   this.allEmployeeList = this.billingService.AllEmpListForBilling;
  // }

  //Grid needs object of employee to display in AddedBy and ModifiedBy field.
  //this function can be used from InitialLoading, Edit(Single)-callback, Edit(Bulk)-callback, GroupDiscount-callback
  UpdateEmployeeObjects_OfBilTxnItems_ForGrid(txnItemsToUpdate: Array<BillingTransactionItem>) {
    if (txnItemsToUpdate && txnItemsToUpdate.length > 0) {
      txnItemsToUpdate.forEach(itm => {
        var createdByEmpObj = this.allEmployeeList.find(x => x.EmployeeId == itm.CreatedBy);
        itm.CreatedByObj = createdByEmpObj;

        if (itm.ModifiedBy) {
          var modifiedByEmpObj = this.allEmployeeList.find(x => x.EmployeeId == itm.ModifiedBy);
          itm.ModifiedByObj = modifiedByEmpObj;
        }
      });
    }
  }

  public showPartialPaymentPopup: boolean = false;
  public ItemForPartialPayment: Array<BillingTransactionItem> = [];

  //end: sud:30Apr'20--CodeOptimization

  public SelectItemForPartialPayment() {
    this.ItemForPartialPayment = this.patAllPendingItems.map(a => Object.assign({}, a));
    this.ItemForPartialPayment.forEach(item => item.IsSelected = false);
    this.showPartialPaymentPopup = true;
  }


  public ClosePartialPaymentPopup($event) {
    console.log($event);
    this.showPartialPaymentPopup = false;
  }


  //returns true if discharge rule is valid, else return false.
  CheckDischargeRule(): boolean {
    this.OrderStatusRestrictedItems = [];
    if (this.OrderStatusSettingB4Discharge && this.OrderStatusSettingB4Discharge.Check) {
      this.OrderStatusRestrictedItems = [];
      this.patAllPendingItems.forEach(a => {
        if (a.SrvDeptIntegrationName && this.OrderStatusSettingB4Discharge.Check && a.RequisitionId > 0)
          if ((a.SrvDeptIntegrationName.toLowerCase() == 'lab' && this.billingDischargeRule.labStatus.includes(a.OrderStatus))
            || (a.SrvDeptIntegrationName.toLowerCase() == 'radiology' && this.billingDischargeRule.radiologyStatus.includes(a.OrderStatus))) {
            this.OrderStatusRestrictedItems.push(a);
          }
          else if (a.OrderStatus != ENUM_OrderStatus.Final) {
            this._messageBoxService.showMessage("Warning", ["Final Report of " + a.ItemName + " is not added for this Patients"]);
          }
      });

      if (this.OrderStatusRestrictedItems && this.OrderStatusRestrictedItems.length) {
        return false;
      }
      else {
        return true;
      }
    }
    else {
      return true;
    }
  }

  CloseOrderStatusInfoPopup() {
    this.ShowOrderStatusInfo = false;
  }

  CloseDischargePopUp($event) {
    if ($event) {
      if (this.IsProvisionalDischarge) {
        this._router.navigate(['/Billing/SearchPatient']);
      } else {
        this.CloseRecieptView();
      }
    }
  }

  public InvoiceLevelDiscountChanged: boolean = false;
  //Pratik:18April'21--This logic was changed for LPH, Please make it parameterized and handle if required for other hospitals after merging.
  InvoiceDiscountOnChange() {
    if (this.model.DiscountPercent <= 100 && this.model.DiscountPercent >= 0) {
      this.estimatedDiscountPercent = this.model.DiscountPercent;//sud:11May'21--to be passed into estimated bill
      //this.LoadPatientBillingSummary(this.patientId, this.ipVisitId);
      if (this.patAllPendingItems && this.patAllPendingItems.length > 0) {
        this.patAllPendingItems.forEach(itm => {
          //!Krishna, 2ndApril'23, Need to add logic to add Discount on all items or Only DiscountApplicable Items, for now all the items are being updated with the Scheme Discount
          //if (itm.DiscountApplicable) {
          if ((itm.DiscountPercent === 0 || this.InvoiceLevelDiscountChanged)) {
            itm.DiscountPercent = (this.SchemePriceCategory.IsDiscountApplicable && this.model.DiscountPercent) ? this.model.DiscountPercent : 0;
          } else {
            this.InvoiceLevelDiscountChanged = false;
          }
          //}
          itm.DiscountAmount = this._billingInvoiceBlService.CalculateAmountFromPercentage(itm.DiscountPercent, itm.SubTotal);
          itm.DiscountSchemeId = this.SchemePriceCategory.SchemeId;
        });
        this.loading = false;
        this.InvalidDiscount = false;
        this.patAllPendingItems = this.patAllPendingItems.slice();
        this.CalculationForAll();
      }
    } else {
      this.InvalidDiscount = true;
      this.loading = true;
    }

  }

  //Anjana: 17 June, 2021: Close deposit button on click of escape key
  hotkeys(event) {
    // 27 is escape button.
    if (event.keyCode === 27) {
      if (this.showDepositPopUp) {
        this.CloseDepositPopUp();
      }
      else if (this.ShowAdditionalBedReservationsPopUp) {
        this.CloseAdditionalBedReservationsPopUp();
      }
      else if (this.showDischargePopUpBox) {
        this.CloseDischargeConfirmPopUp();
      }
      else if (this.showCreditBillAlert) {
        this.showCreditBillAlert = false;
      }
      else if (this.showDepositReceipt) {
        this.CloseDepositReceipt();
      }
      else if (this.showEstimationBill || this.showDischargeBill) {
        this.CloseRecieptView();
      }
    }
    //78 is ALT + N
    if (event.altKey === true && event.keyCode == 78) {
      this.showIpBillRequest = true;
    }
  }

  AfterDischargePrint(data) {
    if (data.Close == "close") {
      this.showDischargeBill = false;
    }
  }

  GoToSettlement() {
    if (this.CreditTotal > 0) {
      this._routeFromService._routefrom = "/Billing/InpatBilling";
      this._routeFromService.routeData = { Action: 'ShowSettlement', PatientId: this.patientId };
      this._router.navigate(['/Billing/Settlements/BillSettlements']);
    }


  }

  // PaymentModeChanges($event:any){
  //   this.model.PayType = $event.PaymentMode;
  //   this.model.PaymentDetails = $event.PaymentDetails;
  // }
  MultiplePaymentCallBack($event) {
    if ($event && $event.MultiPaymentDetail && this.model.PayType.toLocaleLowerCase() == 'others') {
      this.TempEmployeeCashTransaction = new Array<EmployeeCashTransaction>();
      this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
    } else if (this.selectedPriceCategoryObj && this.selectedPriceCategoryObj.IsCoPayment) {
      this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
    } else {
      this.TempEmployeeCashTransaction = [];
    }
    this.model.PaymentDetails = $event.PaymentDetail;
  }


  PaymentModeChanges($event) {
    // this.model.PayType = $event.PaymentMode.toLocaleLowerCase();
    // this.model.PaymentDetails = $event.PaymentDetails;
    // if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment === false && this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase()) {
    //   this.model.CoPaymentCreditAmount = 0;
    //   //this.model.ReceivedAmount = 0;
    // }

    this.model.PayType = $event.PaymentMode.toLocaleLowerCase();
    if (this.model.PayType === ENUM_BillPaymentMode.cash && this.model.DepositBalance) {
      this.DisplayDeductDepositCheckbox = true;
      // this.UseDeposit = true;
    }
    else {
      this.DisplayDeductDepositCheckbox = false;
      // this.UseDeposit = false;
    }
    this.CalculationForAll();
    this.model.PaymentDetails = $event.PaymentDetails;
    if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment === false && this.model.PayType.toLowerCase() === ENUM_BillPaymentMode.credit.toLowerCase()) {
      this.model.CoPaymentCreditAmount = 0;
      //this.model.ReceivedAmount = 0;
      this.UseDeposit = false;
      this.DisplayDeductDepositCheckbox = false;
      this.model.Tender = 0;
    }

  }
  MapEmpCashTransactions() {
    let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.model.PayType.toLocaleLowerCase());
    let depObj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === "deposit");

    if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment === false) {
      if (this.model.DepositBalance > 0 && this.UseDeposit) {
        if (this.model.DepositBalance <= this.model.TotalAmount) {
          let empCashTxnObj = new EmployeeCashTransaction();
          empCashTxnObj.InAmount = this.model.DepositBalance;
          empCashTxnObj.OutAmount = 0;
          empCashTxnObj.PaymentModeSubCategoryId = depObj.PaymentSubCategoryId;
          empCashTxnObj.ModuleName = "Billing";
          empCashTxnObj.Remarks = "paid from deposit";
          this.TempEmployeeCashTransaction.push(empCashTxnObj);
          let empCashTxnObj2 = new EmployeeCashTransaction();
          empCashTxnObj2.InAmount = this.model.ToBePaid;
          empCashTxnObj2.OutAmount = 0;
          empCashTxnObj2.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
          empCashTxnObj2.ModuleName = "Billing";
          this.TempEmployeeCashTransaction.push(empCashTxnObj2);
        }
        else {
          if (this.model.TotalAmount > 0) {
            let empCashTxnObj2 = new EmployeeCashTransaction();
            empCashTxnObj2.InAmount = this.model.TotalAmount;
            empCashTxnObj2.OutAmount = 0;
            empCashTxnObj2.PaymentModeSubCategoryId = depObj.PaymentSubCategoryId;
            empCashTxnObj2.ModuleName = "Billing";
            empCashTxnObj2.Remarks = "paid from deposit";
            this.TempEmployeeCashTransaction.push(empCashTxnObj2);
          }
        }
      }
      else {
        if (this.model.TotalAmount >= 0) {
          let empCashTxnObj3 = new EmployeeCashTransaction();
          empCashTxnObj3.InAmount = this.model.TotalAmount;
          empCashTxnObj3.OutAmount = 0;
          empCashTxnObj3.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
          empCashTxnObj3.ModuleName = "Billing";
          this.TempEmployeeCashTransaction.push(empCashTxnObj3);
        }
      }
    } else {
      let cashPaymentMode = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === 'cash');
      this.TempEmployeeCashTransaction = new Array<EmployeeCashTransaction>();
      if (this.model.DepositBalance > 0 && this.UseDeposit) {
        if (this.model.DepositBalance <= this.model.ReceivedAmount) {
          let empCashTxnObj = new EmployeeCashTransaction();
          empCashTxnObj.InAmount = this.model.DepositBalance;
          empCashTxnObj.OutAmount = 0;
          empCashTxnObj.PaymentModeSubCategoryId = depObj.PaymentSubCategoryId;
          empCashTxnObj.ModuleName = "Billing";
          empCashTxnObj.Remarks = "paid from deposit";
          this.TempEmployeeCashTransaction.push(empCashTxnObj);
          let empCashTxnObj2 = new EmployeeCashTransaction();
          empCashTxnObj2.InAmount = this.model.ToBePaid;
          empCashTxnObj2.OutAmount = 0;
          empCashTxnObj2.PaymentModeSubCategoryId = cashPaymentMode.PaymentSubCategoryId;
          empCashTxnObj2.ModuleName = "Billing";
          this.TempEmployeeCashTransaction.push(empCashTxnObj2);
        }
        else {
          if (this.model.ReceivedAmount > 0) {
            let empCashTxnObj2 = new EmployeeCashTransaction();
            empCashTxnObj2.InAmount = this.model.ReceivedAmount;
            empCashTxnObj2.OutAmount = 0;
            empCashTxnObj2.PaymentModeSubCategoryId = depObj.PaymentSubCategoryId;
            empCashTxnObj2.ModuleName = "Billing";
            empCashTxnObj2.Remarks = "paid from deposit";
            this.TempEmployeeCashTransaction.push(empCashTxnObj2);
          }
        }
      }
      else {
        if (this.model.ReceivedAmount >= 0) {
          let empCashTxnObj3 = new EmployeeCashTransaction();
          empCashTxnObj3.InAmount = this.model.ReceivedAmount;
          empCashTxnObj3.OutAmount = 0;
          empCashTxnObj3.PaymentModeSubCategoryId = cashPaymentMode.PaymentSubCategoryId;
          empCashTxnObj3.ModuleName = "Billing";
          this.TempEmployeeCashTransaction.push(empCashTxnObj3);
        }
      }
    }

  }
  CreditOrganizationChanges($event: any) {
    this.model.OrganizationId = $event.OrganizationId;
    this.model.OrganizationName = $event.OrganizationName;
  }


  ReCalculateDiscounts() {
    if (this.model.DiscountAmount <= this.model.SubTotal && this.model.DiscountAmount >= 0) {
      let discountAmount = this.model.DiscountAmount;
      this.model.DiscountPercent = this._billingInvoiceBlService.CalculatePercentage(this.model.DiscountAmount, this.model.SubTotal);//(this.model.DiscountAmount * 100) / this.model.SubTotal;
      this.estimatedDiscountPercent = this.model.DiscountPercent;

      //Need to re-calculate aggregatediscounts of each item and Invoice amounts when Invoice Discount is changed.
      this.patAllPendingItems.forEach(itm => {
        //!Krishna, 21stJuly'23, Need to add Item Level Discount condition if needed later.
        //if (itm.DiscountApplicable) {
        itm.DiscountPercent = this.model.DiscountPercent ? this.model.DiscountPercent : 0;
        //}
        itm.DiscountSchemeId = this.DiscountSchemeId;
      });
      this.loading = false;
      this.InvalidDiscount = false;
      this.CalculationForAll();
      this.SaveDiscountState();
    } else {
      this.InvalidDiscount = true;
      this.loading = true;
    }
  }


  // * This handle the calculation of Invoice Amounts when Cash Field in Changed from the UI i.e. ReceivedAmount is changed...
  ReceivedAmountChange() {
    if (this.checkValidationForReceivedAmount()) {
      this.model.CoPaymentCreditAmount = this.model.ToBePaid - this.model.ReceivedAmount;
      this.model.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.model.CoPaymentCreditAmount, 3);
      this.model.Tender = this.model.ReceivedAmount;
    }
  }

  checkValidationForReceivedAmount() {
    let isValidAmount = true;
    let ReceivedAmount = this.model.ReceivedAmount;
    if (ReceivedAmount < 0) {
      isValidAmount = false;
      this._messageBoxService.showMessage("Error", ["Cash cannot be less than 0!"]);
    }
    if (ReceivedAmount > this.model.ToBePaid) {
      isValidAmount = false;
      this._messageBoxService.showMessage("Error", ["Cash cannot be more than TotalAmount!"]);
    }
    // if (this.SchemePriceCategory.IsCoPayment) {
    //   let CoPaymentCashAmount = (this.SchemePriceCategory.Copayment_CashPercent / 100) * this.model.ToBePaid;
    //   if (ReceivedAmount < CoPaymentCashAmount) {
    //     isValidAmount = false;
    //     this.msgBoxServ.showMessage("Error", ["Cash cannot be less than CoPaymentCash Amount!"]);
    //   }
    // }
    return isValidAmount;
  }
  public old_priceCategoryId: number = 0;
  OnSchemePriceCategoryChanged(schemePriceObj: SchemePriceCategory_DTO): void {
    if (schemePriceObj && schemePriceObj.SchemeId) {
      this.SchemePriceCategory = schemePriceObj;
      this.SchemePriceCategoryObj.SchemeId = this.SchemePriceCategory.SchemeId;
      this.SchemePriceCategoryObj.PriceCategoryId = this.SchemePriceCategory.PriceCategoryId;
      if (this.billingTransaction && this.billingTransaction.BillingTransactionItems && this.billingTransaction.BillingTransactionItems.length) {
        this.billingTransaction.SchemeId = this.SchemePriceCategory.SchemeId;
        this.billingTransaction.BillingTransactionItems.forEach(item => {
          item.DiscountSchemeId = this.SchemePriceCategory.SchemeId;
          item.PriceCategoryId = this.SchemePriceCategory.PriceCategoryId;
        });
      }

      //! Manage Credit Limits to be displayed in the UI
      if (this.SchemePriceCategory && (this.SchemePriceCategory.IsCreditLimited || this.SchemePriceCategory.IsGeneralCreditLimited)) {
        if (this.SchemePriceCategory.IsGeneralCreditLimited) {
          this.CreditLimitToDisplay = this.PatientSchemeMap.GeneralCreditLimit;
        } else {
          this.CreditLimitToDisplay = this.PatientSchemeMap.IpCreditLimit;
        }
      } else {
        console.log('Scheme PriceCategory is not loaded Or Scheme is not Credit Limited');
      }
      if (this.SchemePriceCategory.IsCreditOnlyScheme && !this.SchemePriceCategory.IsCoPayment) {
        this.DisablePaymentModeDropDown = true;
      } else {
        this.DisablePaymentModeDropDown = false;
      }
      if (this.SchemePriceCategory.IsDiscountApplicable) {
        this.model.DiscountPercent = this.SchemePriceCategory.DiscountPercent;
      } else {
        this.model.DiscountPercent = 0;
      }
      this.DisableInvoiceDiscountPercent = (this.SchemePriceCategory.IsDiscountApplicable && this.SchemePriceCategory.IsDiscountEditable) ? false : true;
      this.ipBillingDiscountModel.DiscountSchemeId = this.SchemePriceCategory.SchemeId;
      this.SaveDiscountState();

      this.InvoiceDiscountOnChange();
      if (this.SchemePriceCategory.PriceCategoryId !== this.old_priceCategoryId) {
        this.old_priceCategoryId = this.SchemePriceCategory.PriceCategoryId;
        this.LoadPriceCategoryServiceItems();
        this.LoadAdditionalServiceItems(this.SchemePriceCategory.PriceCategoryId);
      }
    }
  }

  CheckCreditLimits(): boolean {
    let isValid = false;
    let creditLimit = 0;
    let totalBillAmount = this.model.TotalAmount;
    if (this.SchemePriceCategory.IsGeneralCreditLimited) {
      creditLimit = this.PatientSchemeMap.GeneralCreditLimit;
    }
    if (this.SchemePriceCategory.IsCreditLimited) {
      if (this.SchemePriceCategory.SchemeApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.SSF) {
        creditLimit = this.PatientSchemeMap.IpCreditLimit + this.PatientSchemeMap.OpCreditLimit;//!Krishna,18thMay'23, This is because SSF allows to use OpCreditLimit if TotalAmount is exceeding IipCreditLimit.
      } else {
        creditLimit = this.PatientSchemeMap.IpCreditLimit;
      }
    }
    if (creditLimit >= totalBillAmount) {
      isValid = true;
    }
    return isValid;
  }

  LoadAdditionalServiceItems(priceCategoryId: number): void {
    this._billingMasterBlService.GetAdditionalServiceItems(ENUM_AdditionalServiceItemGroups.Anaesthesia, priceCategoryId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this._billingMasterBlService.AdditionalServiceItems = res.Results;
        }
      }, err => {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Could not load Additional ServiceItems"]);
      })
  }
  GetDetailForInpatientsCancelledItems(patientId: number, patientVisitId: number): void {
    this._billingBLService.GetDetailForIpCancellationItems(patientId, patientVisitId).subscribe(
      res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.CancelledItemDetails = res.Results;
          this.CancelledItemDetails.map(a => a.CancellationReceiptNo = ENUM_CancellationService.PRC + "/" + a.CancellationReceiptNo)
          this.CancelledItemDetails.map(a => a.ReferenceProvisionalReceiptNo = ENUM_CancellationService.PR + "/" + a.ReferenceProvisionalReceiptNo)
          this.patAllCancelledItems = this.CancelledItemDetails;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Could not fetch Cancelled Items"]);
          console.log(res.ErrorMessage);
        }
      }
    )
  }

  ShowOtherCurrencyCheckBoxChanged(): void {
    if (this.ShowOtherCurrency) {
      this.DisplayOtherCurrencyDetail = true;
    } else {
      this.DisplayOtherCurrencyDetail = false;
      this.model.OtherCurrencyDetail = null;
    }
  }
  OtherCurrencyCalculationCallback($event): void {
    if ($event && $event.ExchangeRate > 0) {
      this.OtherCurrencyDetail = $event;
    } else {
      this.OtherCurrencyDetail = null;
    }
    this.model.OtherCurrencyDetail = JSON.stringify(this.OtherCurrencyDetail);
  }

  ConfirmProvisionalDischarge(): void {
    const disDate = moment(this.dischargeDetail.DischargeDate).format('YYYY-MM-DD HH:mm');
    const AdmissionDate = moment(this.admissionInfo.AdmittedOn).format('YYYY-MM-DD HH:mm');

    if (moment(disDate).isBefore(AdmissionDate)) {
      this.validDischargeDate = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Invalid! Can't discharge the patient before the admission date."]);
      return;
    }
    if (this.AllowProvisionalDischarge) {
      this.ShowProvisionalDischargeConfirmation = true;
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Provisional Discharge is not Allowed!`])
    }
  }

  PostProvisionalDischarge(): void {
    const provisionalDischarge = this.PrepareProvisionalDischargeObject();
    if (provisionalDischarge) {
      if (!provisionalDischarge.PatientId) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Patient is not set to Provisional Discharge Object`]);
        return;
      }
      if (!provisionalDischarge.PatientVisitId) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Patient Visit is not set to Provisional Discharge Object`]);
        return;
      }
      if (!provisionalDischarge.DiscountSchemeId) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Discount Scheme is not set to Provisional Discharge Object`]);
        return;
      }

      this.loading = true;
      this._billingBLService.PostProvisionalDischarge(provisionalDischarge).finally(() => this.loading = false).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [res.Results]);
          this.ShowProvisionalDischargeConfirmation = false;
          this.IsProvisionalDischarge = true;
          this.showEstimationBill = true;
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      }, err => {
        console.log(err);
      });
    } else {
      console.log(`Provisional Discharge object is not formatted Correctly!`);
    }
  }

  PrepareProvisionalDischargeObject(): ProvisionalDischarge_DTO {
    let provisionalDischarge = new ProvisionalDischarge_DTO();
    provisionalDischarge.DischargeDate = this.dischargeDetail.DischargeDate;
    provisionalDischarge.PatientId = this.patientId;
    provisionalDischarge.PatientVisitId = this.ipVisitId;
    provisionalDischarge.ProcedureType = this.admissionInfo.ProcedureType;
    provisionalDischarge.Remarks = this.dischargeDetail.Remarks;
    provisionalDischarge.DiscountSchemeId = this.DiscountSchemeId;

    return provisionalDischarge;
  }

  private HandleInvoiceRequest() {
    this.loadingScreen = true;
    this.PostBillAndDischargePatient();
  }
  OnDynamicQrCallback($event: InvoiceDetail): void {
    this.ShowDynamicQr = false;
    if ($event && $event.paymentStatus) {
      this.DischargeStatementId = $event.dischargeStatementId;
      this.PatientId = $event.patientId;
      this.PatientVisitId = $event.patientVisitId;
      this.showDischargeBill = true;
    } else {
      this.loading = false;
    }
  }

  /**Below HostListener is responsible to catch the responses from FewaPay Browser Extension */
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    const result = this._fewaPayService.HandleEventsFromFewaPayBrowserExtension(event);
    if (result) {
      if (result.resultCode === ENUM_POS_ResponseStatus.Success) { //! Krishna, 10thDec'23 "000" is success status code sent from POS device.
        const transactionId = 'verifyTransId' in result && result.verifyTransId;
        if (transactionId) {
          this.model.PaymentDetails = `${this.model.PaymentDetails}; TransactionId: ${transactionId}`;
        }
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.patientId, ENUM_FewaPayTransactionFrom.IpBilling);
        this.PostBillingTransaction();
      } else {
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.patientId, ENUM_FewaPayTransactionFrom.IpBilling);
        this.loading = false;
        this.loadingScreen = false;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`${result.message}`]);
      }
      return;
    }
  }

  CloseDischargeConfirmPopUp() {
    this.showDischargePopUpBox = false;
    this.loadingScreen = false;
  }

  OnAllowProvisionalDischargeCheckboxChanged() {
    if (this.AllowProvisionalDischarge) {
      this.DisableInvoiceDiscountPercent = true;
      this.DisableInvoiceDiscountAmount = true;
    } else {
      this.DisableInvoiceDiscountPercent = false;
      this.DisableInvoiceDiscountAmount = true;
    }
  }

  OnAdditionalBedReservationClick(): void {
    this.ShowAdditionalBedReservationsPopUp = true;
  }

  GetAdditionalBedReservations(patientId: number, patientVisitId: number): void {
    this._billingBLService.GetAdditionalBedReservations(patientId, patientVisitId)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.AdditionalBedReservations = res.Results;
            this.AdditionalBedReservationsObjectList = new Array<AdditionalBedReservationObject_DTO>();
            this.AdditionalBedReservations.forEach(element => {
              let addBedRes = new AdditionalBedReservationObject_DTO();
              addBedRes.CreatedOn = element.CreatedOn;
              addBedRes.WardName = element.WardName;
              addBedRes.BedFeatureName = element.BedFeatureName;
              addBedRes.BedNumber = element.BedNumber;
              addBedRes.Status = element.IsActive ? "active" : "cancelled";
              if (element.CareTakerInformation) {
                let careTakerInformation = JSON.parse(element.CareTakerInformation);
                if (careTakerInformation) {
                  addBedRes.PrimaryCareTakerId = careTakerInformation.PrimaryCareTakerId;
                  addBedRes.PrimaryCareTakerName = careTakerInformation.PrimaryCareTakerName;
                  addBedRes.PrimaryCareTakerContact = careTakerInformation.PrimaryCareTakerContact;
                  addBedRes.SecondaryCareTakerName = careTakerInformation.SecondaryCareTakerName;
                  addBedRes.SecondaryCareTakerContact = careTakerInformation.SecondaryCareTakerContact;
                }
              }
              if (!element.IsActive) {
                if (element.CompletedOn) {
                  addBedRes.CompletedOn = element.CompletedOn;
                }
                else {
                  addBedRes.CompletedOn = "";
                }
              }
              else {
                addBedRes.CompletedOn = "";
              }
              this.AdditionalBedReservationsObjectList.push(addBedRes)
            });
          }
          else {
            console.info(`Patient doesn't have additional bed reservations.`);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  CloseAdditionalBedReservationsPopUp(): void {
    this.ShowAdditionalBedReservationsPopUp = false;
    this.AdditionalBedReservations = new Array<AdditionalBedReservation_DTO>();
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.showDischargePopUpBox = false;
    this.CloseRecieptView();

  }

  GetVisitContext(patientId: number, visitId: number) {
    if (patientId && visitId) {
      this._billingBLService.GetPatientCurrentVisitContext(patientId, visitId)
        .subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.currPatVisitContext = res.Results;
            if (this.SchemePriceCategory && this.SchemePriceCategory.SchemeApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.NGHIS && this.SchemePriceCategory.UseCappingAPI) {
              this.billInsuranceService.GetInsuranceCappingInformation(this.currPatVisitContext.MemberNo);
            }
            this.billInsuranceService.SetPatientVisitContext(this.currPatVisitContext)
          }
          else {
            console.log(ENUM_DanpheHTTPResponses.Failed, ["Problem! Cannot get the Current Visit Context ! "]);
          }
        },
          err => { console.log(err.ErrorMessage); });
    }
  }
  LoadBillingPreviousProvisionalAmount(patientId: number, ipVisitId: number): void {
    this._billingBLService.GetBillingPreviousProvisionalAmount(patientId, ipVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.BillingPreviousProvisional = res.Results;
        }
      }, err => {
        console.log(err.ErrorMessage);
      });
  }
}
