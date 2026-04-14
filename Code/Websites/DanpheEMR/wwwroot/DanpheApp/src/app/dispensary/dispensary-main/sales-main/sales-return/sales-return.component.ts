import { ChangeDetectorRef, Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { BillingFiscalYear } from '../../../../billing/shared/billing-fiscalyear.model';
import { BillingBLService } from '../../../../billing/shared/billing.bl.service';
import { CoreBLService } from '../../../../core/shared/core.bl.service';
import { CoreService } from '../../../../core/shared/core.service';
import { PatientService } from '../../../../patients/shared/patient.service';
import { PharmacyReceiptModel } from '../../../../pharmacy/shared/pharmacy-receipt.model';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import { PharmacyService } from '../../../../pharmacy/shared/pharmacy.service';
import { PHRMInvoiceItemsModel } from '../../../../pharmacy/shared/phrm-invoice-items.model';
import { PHRMInvoiceReturnItemsModel } from '../../../../pharmacy/shared/phrm-invoice-return-items.model';
import { PHRMInvoiceReturnModel } from '../../../../pharmacy/shared/phrm-invoice-return.model ';
import { PHRMStoreModel } from '../../../../pharmacy/shared/phrm-store.model';
import { SecurityService } from '../../../../security/shared/security.service';
import { BillingScheme_DTO } from '../../../../settings-new/billing/shared/dto/billing-scheme.dto';
import { PriceCategory } from '../../../../settings-new/shared/price.category.model';
import { SettingsBLService } from '../../../../settings-new/shared/settings.bl.service';
import { GeneralFieldLabels } from '../../../../shared/DTOs/general-field-label.dto';
import { NepaliCalendarService } from '../../../../shared/calendar/np/nepali-calendar.service';
import { CallbackService } from '../../../../shared/callback.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { CommonFunctions } from '../../../../shared/common.functions';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../../shared/routefrom.service';
import { ENUM_BillPaymentMode, ENUM_DanpheHTTPResponses, ENUM_Dispensary_ReturnInvoiceBy, ENUM_MessageBox_Status, ENUM_PriceCategory, ENUM_ServiceBillingContext, ENUM_VisitType } from '../../../../shared/shared-enums';
import { DispensaryService } from '../../../shared/dispensary.service';
import { InvoiceDetailToBeReturn } from './model/invoice-detail-tobe-return.model';
import { InvoiceItemDetailToBeReturn } from './model/invoice-item-detail-tobe-return.model';

@Component({
  selector: 'app-sales-return',
  templateUrl: './sales-return.component.html',
  styleUrls: ['./sales-return.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class SalesReturnComponent implements OnInit {
  public currentCounter: number = null;
  public currentCounterName: string = null;
  public allFiscalYrs: Array<BillingFiscalYear> = [];
  public selFiscYrId: number = 3;
  public userName: any;
  public returnAmount: number = 0;
  public selectDeselectAll: boolean = false;
  public loading: boolean = false;
  public showReturnInvoicePage: boolean = false;
  public invoicePrintId: number = null;
  public showSaleItemsPopup: boolean = false;
  public pharmacyReceipt: PharmacyReceiptModel = new PharmacyReceiptModel();
  public patient: any;
  public textMessage: string = null;
  public IsItemLevelDiscountEnable: boolean;
  public isMainDiscountAvailable: boolean;
  public isItemLevelVATApplicable: boolean;
  public isMainVATApplicable: boolean;
  public invoiceHeader = new InvoiceHederModel();
  public saleReturnModelList: Array<PHRMInvoiceReturnItemsModel> = new Array<PHRMInvoiceReturnItemsModel>();
  public saleReturnModelListPost: Array<PHRMInvoiceReturnItemsModel> = new Array<PHRMInvoiceReturnItemsModel>();
  public salesReturn: PHRMInvoiceReturnModel = new PHRMInvoiceReturnModel();
  public saleReturn: PHRMInvoiceReturnItemsModel = new PHRMInvoiceReturnItemsModel();
  IsCurrentDispensaryInsurance: boolean;
  selectedDispensary: PHRMStoreModel;
  public filteredMembershipList: Array<BillingScheme_DTO> = [];
  public selectedCommunityName: string = "";

  storeId: number = 0;
  public nepaliDate: NepaliCalendarService;
  public disableSearchBtn: boolean = false;
  enableEnterReturnDiscount: boolean = false;
  NetReturnedAmount: number = 0;
  DiscountReturnAmount: number = 0;
  totalReturnAmt: number;
  discountMoreThanReturnAmount: boolean = false;
  invoiceItems: any[] = [];
  showNetAmount: boolean = false;
  PriceCategoryId: number = null;
  CoPaymentCashPercent: number = 0;
  CoPaymentCreditPercent: number = 0;
  IsCoPayment: boolean = false;

  PaymentMode: string = ENUM_BillPaymentMode.cash;
  fromDate: string = null;
  toDate: string = null;
  dispensaryList: Array<Store> = new Array<Store>();
  HospitalNo: string = null;
  PatientDetail: PatientModel = new PatientModel();
  InvoiceDataToBeReturn: InvoiceDetailToBeReturn = new InvoiceDetailToBeReturn();
  PriceCategoryInfo: PriceCategory = new PriceCategory();
  enabledPriceCategories: Array<PriceCategory> = new Array<PriceCategory>();
  selectedPriceCategory: PriceCategory = null;
  ReturnBy: string = ENUM_Dispensary_ReturnInvoiceBy.BillNumber;//default is bill number
  SchemeId: number = null;
  InvoiceReturnId: number = 0;
  public selMembershipId: number = 0;
  public membershipList: Array<BillingScheme_DTO> = new Array<BillingScheme_DTO>();
  public schemeData: BillingScheme_DTO = new BillingScheme_DTO();
  public SchemeName: string = "";
  SalesReturnConfig: { ReturnByInvoiceNo: false; ReturnByHospitalNo: false; };
  InvoiceReturnIds: string[] = [];
  IsAnonymousPatient: boolean = false;
  public GeneralFieldLabel = new GeneralFieldLabels();


  constructor(private _dispensaryService: DispensaryService, public nepaliCalendarServ: NepaliCalendarService,
    public billingBLService: BillingBLService,
    public pharmacyBLService: PharmacyBLService,
    public changeDetectorRef: ChangeDetectorRef,
    public router: Router,
    public securityService: SecurityService,
    public messageboxService: MessageboxService,
    public patientService: PatientService,
    public routeFromService: RouteFromService,
    public pharmacyService: PharmacyService,
    public callBackService: CallbackService,
    public coreService: CoreService,
    private renderer: Renderer2,
    public coreBLService: CoreBLService,
    public settingsBLService: SettingsBLService
  ) {
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();


    try {
      this.currentCounter = this.securityService.getPHRMLoggedInCounter().CounterId;
      this.currentCounterName = this.securityService.getPHRMLoggedInCounter().CounterName;
      this.IsCurrentDispensaryInsurance = this._dispensaryService.isInsuranceDispensarySelected;
      this.selectedDispensary = this._dispensaryService.activeDispensary;
      this.GetAllFiscalYrs();
      this.SetCurrentFiscalYear();
      this.checkSalesCustomization();
      this.GetActiveDispensarylist();
      this.GetPriceCategories();
      this.LoadPharmacySchemesList();
      this.GetSalesReturnConfigurationParameter();
      if (this.currentCounter < 1) {
        this.callBackService.CallbackRoute = '/Dispensary/Sale/New';
        this.router.navigate(['/Dispensary/ActivateCounter']);
      }


    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  ngOnInit() {
    this.storeId = this.selectedDispensary.StoreId;
    if (this.ReturnBy === ENUM_Dispensary_ReturnInvoiceBy.BillNumber) {
      this.coreService.FocusInputById("txtInvoicePrintId");
    }
  }


  // ngAfterViewInit() {
  //   setTimeout(() => {

  //     var elem = this.renderer.selectRootElement('#invoiceId');

  //     this.renderer.listen(elem, "focus", () => { console.log('focus') });

  //     this.renderer.listen(elem, "blur", () => { console.log('blur') });

  //     elem.focus();

  //   }, 1000);
  // }
  GetAllFiscalYrs() {
    this.pharmacyBLService.GetAllFiscalYears()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.allFiscalYrs = res.Results;
        }
      });
  }
  //show or hide item level discount
  //check the Sales Page Customization ie enable or disable Vat and Discount;
  checkSalesCustomization() {
    let salesParameterString = this.coreService.Parameters.find(p => p.ParameterName === "SalesFormCustomization" && p.ParameterGroupName === "Pharmacy");
    if (salesParameterString != null) {
      let SalesParameter = JSON.parse(salesParameterString.ParameterValue);
      this.isItemLevelVATApplicable = (SalesParameter.EnableItemLevelVAT === true);
      this.isMainVATApplicable = (SalesParameter.EnableMainVAT === true);
      //this.IsItemLevelDiscountEnable = (SalesParameter.EnableItemLevelDiscount === true);
      //this.isMainDiscountAvailable = (SalesParameter.EnableMainDiscount === true);

    }
  }
  //Search and get Invoice Details from server by InvoiceId
  //Get Invoide Items details by Invoice Id for return items from customer
  SearchInvoice(fiscYrId) {
    try {
      if (this.invoicePrintId && fiscYrId) {
        this.disableSearchBtn = true;
        this.pharmacyBLService.GetReturnFromCustomerModelDataByInvoiceId(this.invoicePrintId, fiscYrId, this.storeId)
          .finally(() => this.disableSearchBtn = false)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.saleReturnModelList = [];
              this.pharmacyReceipt.InvoiceItems = [];//sanjit/rajib: reset the invoice header to prevent duplication of item.
              this.returnAmount = 0;//sud: 15Mar'19--Reset returnamount -- bugId: #155 Pharmacy
              this.invoiceHeader = res.Results.invoiceHeader;
              this.SetPriceCategoryWithCoPaymentDetails(res);

              const isSSFClaimApplicable = res.Results.invoiceHeader && res.Results.invoiceHeader.ClaimCode && res.Results.patient && res.Results.patient.PatientId;
              if (isSSFClaimApplicable) {
                this.checkIfInvoiceIsClaimedForSSF(res);
              }
              else {
                this.handleNormalInvoiceReturnScenario(res);
              }
            }
            else {
              this.resetInvoiceReturnForm();
            }
          });
      } else {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, ["Please enter InvoiceNo and Fiscal Year"]);
        this.Cancel();
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  private resetInvoiceReturnForm() {
    this.invoiceHeader = new InvoiceHederModel();
    this.saleReturnModelList = null;
    this.saleReturnModelListPost = null;
    this.showReturnInvoicePage = false;
    this.patient = null;
    this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, ["No sale for entered InvoiceNo. in selected Dispensary."]);
  }

  private checkIfInvoiceIsClaimedForSSF(res: DanpheHTTPResponse) {
    this.pharmacyBLService.IsClaimed(res.Results.invoiceHeader.ClaimCode, res.Results.patient.PatientId)
      .subscribe((response: DanpheHTTPResponse) => {
        if (response.Status === ENUM_DanpheHTTPResponses.OK && response.Results === true) {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ["This invoice is already claimed"]);
          this.disableSearchBtn = false;
        }
        else {
          // case when invoice is not claimed.
          this.handleNormalInvoiceReturnScenario(res);
        }
      });
  }

  private handleNormalInvoiceReturnScenario(res: DanpheHTTPResponse) {
    this.CheckIfReturnValid();
    res.Results.invoiceItems.forEach(itm => {
      let itemObj = new PHRMInvoiceReturnItemsModel();
      this.saleReturnModelList.push(Object.assign(itemObj, itm)); //Object.assign match and assign only values
    });
    this.salesReturn.InvoiceReturnItems = this.saleReturnModelList;
    this.salesReturn.PaymentMode = res.Results.invoiceHeader.PaymentMode;
    this.salesReturn.VisitType = res.Results.invoiceHeader.VisitType;
    if (this.salesReturn.InvoiceReturnItems.length === 0) {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ["This invoice is already returned"]);
    }
    else {
      for (let i = 0; i < this.saleReturnModelList.length; i++) {
        this.setInvoiceReturnDetailsToReturn(i, res);
      }
    }
    this.invoiceHeader = res.Results.invoiceHeader;
    this.invoiceHeader.InvoiceDate = moment(res.Results.invoiceHeader.InvoiceDate).format('ll');
    this.patient = res.Results.patient;
    this.showReturnInvoicePage = true;
    this.showManualReturnForm = false;
    this.coreService.FocusInputById("ReturnedQty0");

    if (this.salesReturn.InvoiceReturnItems.length === 0) {
      this.showReturnInvoicePage = false;
    }
  }

  private setInvoiceReturnDetailsToReturn(i: number, res: DanpheHTTPResponse) {
    this.returnAmount = CommonFunctions.parseAmount(this.returnAmount + this.saleReturnModelList[i].TotalAmount, 4);
    let invoiceItems = new PHRMInvoiceItemsModel();
    invoiceItems.ItemId = this.saleReturnModelList[i].ItemId;
    invoiceItems.BatchNo = this.saleReturnModelList[i].BatchNo;
    invoiceItems.ItemName = this.saleReturnModelList[i].ItemName;
    invoiceItems.Quantity = (this.saleReturnModelList[i].Quantity - this.saleReturnModelList[i].ReturnedQty);
    invoiceItems.ExpiryDate = moment(this.saleReturnModelList[i].ExpiryDate).format('ll');
    invoiceItems.Price = this.saleReturnModelList[i].Price;
    invoiceItems.SalePrice = this.saleReturnModelList[i].SalePrice;
    invoiceItems.TotalAmount = this.saleReturnModelList[i].TotalAmount;
    invoiceItems.SubTotal = this.saleReturnModelList[i].SubTotal;
    invoiceItems.DiscountPercentage = this.saleReturnModelList[i].DiscountPercentage;
    invoiceItems.DiscountAmount = this.saleReturnModelList[i].DiscountAmount;
    invoiceItems.ReturnQty = this.saleReturnModelList[i].ReturnedQty;
    invoiceItems.CreditNoteId = res.Results.invoiceItems[i].CreditNoteId;
    this.salesReturn.InvoiceReturnItems[i].AvailableQty = (res.Results.invoiceItems[i].Quantity - res.Results.invoiceItems[i].ReturnedQty);
    let availableQuantity = this.salesReturn.InvoiceReturnItems[i].AvailableQty;
    this.salesReturn.InvoiceReturnItems[i].Quantity = availableQuantity;
    this.salesReturn.InvoiceReturnItems[i].PreviouslyReturnedQty = this.saleReturnModelList[i].ReturnedQty;
    this.salesReturn.InvoiceReturnItems[i].ReturnedQty = 0;
    this.salesReturn.CounterId = this.currentCounter;
    this.salesReturn.PatientId = res.Results.patient.PatientId;
    this.salesReturn.InvoiceId = res.Results.invoiceHeader.InvoiceId;
    this.salesReturn.Tender = res.Results.invoiceHeader.Tender;
    this.salesReturn.SubTotal = res.Results.invoiceHeader.SubTotal;
    this.salesReturn.Change = res.Results.invoiceHeader.Change;
    this.salesReturn.FiscalYearId = res.Results.invoiceHeader.FiscalYearId;
    this.salesReturn.DiscountPercentage = res.Results.invoiceHeader.DiscountPercentage;
    this.salesReturn.TotalAmount = res.Results.invoiceHeader.TotalAmount;
    if (res.Results.invoiceHeader.SettlementId != null) {
      this.salesReturn.SettlementId = this.invoiceHeader.SettlementId;
    }
    this.pharmacyReceipt.InvoiceItems.push(invoiceItems);
  }

  private SetPriceCategoryWithCoPaymentDetails(res): void {
    let schemeDetails = res.Results.schemeDetails;
    if (schemeDetails != null) {
      this.PriceCategoryId = schemeDetails.DefaultPriceCategoryId;

      this.IsItemLevelDiscountEnable = schemeDetails.IsDiscountApplicable;
      this.isMainDiscountAvailable = schemeDetails.IsDiscountApplicable;

      this.SchemeId = schemeDetails.SchemeId;
      if (schemeDetails.IsPharmacyCoPayment) {
        this.IsCoPayment = schemeDetails.IsPharmacyCoPayment;
        this.CoPaymentCashPercent = schemeDetails.PharmacyCoPayCashPercent;
        this.CoPaymentCreditPercent = schemeDetails.PharmacyCoPayCreditPercent;
      }
    }
  }

  public EnterReturnAmountChange(event: any) {
    if (event) {
      if (event.target.checked) {
        this.enableEnterReturnDiscount = true;
        this.NetReturnedAmount = 0;
        this.DiscountReturnAmount = 0;
        this.CalculationForPHRMReturnFromCustomer();
      } else {
        this.enableEnterReturnDiscount = false;
        this.NetReturnedAmount = 0;
        this.DiscountReturnAmount = 0;
        this.CalculationForPHRMReturnFromCustomer();
      }


    }

  }

  private CheckIfReturnValid() {
    try {
      if (this.IsCurrentDispensaryInsurance && !this.invoiceHeader.ClaimCode) {
        throw new Error("Cannot return it from this dispensary.");
      }
    }
    catch (ex) { this.ShowCatchErrMessage(ex); }
  }

  ReturnReceiptItems(returnData) {
    this.pharmacyReceipt.Patient.ShortName = this.invoiceHeader.PatientName;
    this.pharmacyReceipt.Patient.PatientCode = this.patient.PatientCode;
    this.pharmacyReceipt.Patient.Address = this.patient.Address;
    this.pharmacyReceipt.Patient.DateOfBirth = this.patient.DateOfBirth;
    this.pharmacyReceipt.Patient.Gender = this.patient.Gender;
    this.pharmacyReceipt.Patient.PhoneNumber = this.patient.PhoneNumber;
    this.pharmacyReceipt.Patient.PANNumber = this.patient.PANNumber;
    this.pharmacyReceipt.Patient.PatientId = this.patient.PatientId;
    this.pharmacyReceipt.TotalAmount = returnData.TotalAmount;
    this.pharmacyReceipt.Patient.CountrySubDivisionName = this.patient.CountrySubDivisionName;
    this.pharmacyReceipt.PaymentMode = returnData.PaymentMode;
    this.pharmacyReceipt.ReceiptDate = this.invoiceHeader.InvoiceDate;
    this.pharmacyReceipt.localReceiptDate = this.nepaliCalendarServ.ConvertEngToNepDateString(this.pharmacyReceipt.ReceiptDate);
    this.pharmacyReceipt.BillingUser = this.userName;
    this.pharmacyReceipt.Tender = returnData.Tender;
    this.pharmacyReceipt.Change = returnData.Change;
    this.pharmacyReceipt.DiscountAmount = returnData.DiscountAmount;
    this.pharmacyReceipt.VATAmount = returnData.VATAmount;
    this.pharmacyReceipt.VATPercentage = returnData.VATPercentage;
    this.pharmacyReceipt.TaxableAmount = returnData.TaxableAmount;
    this.pharmacyReceipt.NonTaxableAmount = returnData.NonTaxableAmount;
    this.pharmacyReceipt.SubTotal = returnData.SubTotal;
    this.pharmacyReceipt.CurrentFinYear = (this.invoiceHeader.FiscalYear).toString();
    this.pharmacyReceipt.ReceiptPrintNo = this.invoiceHeader.ReceiptPrintNo;
    this.pharmacyReceipt.Remarks = returnData.Remarks;
    this.pharmacyReceipt.IsReturned = true;
    this.pharmacyReceipt.ReceiptDate = returnData.CreatedOn;
    this.pharmacyReceipt.CRNNo = returnData.CreditNoteId;
    this.pharmacyReceipt.InvoiceItems = returnData.InvoiceReturnItems;
    this.pharmacyReceipt.InvoiceItems = this.pharmacyReceipt.InvoiceItems.filter(a => a.ReturnedQty > 0);
    this.pharmacyReceipt.ClaimCode = this.invoiceHeader.ClaimCode;
    this.pharmacyReceipt.Patient.NSHINumber = this.invoiceHeader.NSHINo;
    this.pharmacyReceipt.PrintCount = 0;
    this.pharmacyReceipt.StoreId = returnData.StoreId;
    this.pharmacyReceipt.CashAmount = returnData.ReturnCashAmount;
    this.pharmacyReceipt.CreditAmount = returnData.ReturnCreditAmount;
    this.pharmacyReceipt.PolicyNo = returnData.PolicyNo;
    // this.pharmacyReceipt.CRNNo = ;
  }
  //Return Items from customer Invoice post to  database
  SaveReturnFromCustomer(): void {
    try {
      let isValidReturnDate: boolean;
      let param = this.coreService.Parameters.find(p => p.ParameterName === "RestrictReturnDays" && p.ParameterGroupName === "Pharmacy");
      const paramValue = JSON.parse(param.ParameterValue);
      if (!this.invoiceHeader.VisitType) {
        this.invoiceHeader.VisitType = "outpatient";
      }
      if (this.invoiceHeader.VisitType === "inpatient") {
        if (moment().diff(moment(this.invoiceHeader.InvoiceDate), 'days') <= paramValue.IPVisit) {
          isValidReturnDate = true;
        }
      }
      if (this.invoiceHeader.VisitType === "outpatient" || this.invoiceHeader.VisitType === "emergency") {
        if (moment().diff(moment(this.invoiceHeader.InvoiceDate), 'days') <= paramValue.OPVisit) {
          isValidReturnDate = true;
        }
      }
      if (isValidReturnDate) {
        let formValidity: boolean = true;
        let errorMessages: string[] = [];
        this.salesReturn.CounterId = this.currentCounter;
        this.salesReturn.StoreId = this._dispensaryService.activeDispensary.StoreId;
        this.salesReturn.ClaimCode = this.invoiceHeader.ClaimCode;
        this.salesReturn.OrganizationId = this.invoiceHeader.OrganizationId;
        for (var j = 0; j < this.salesReturn.InvoiceReturnItems.length; j++) {
          //return only selected items so validation also check only on selected items
          this.salesReturn.InvoiceReturnItems[j].CounterId = this.currentCounter;
          this.salesReturn.InvoiceReturnItems[j].StoreId = this._dispensaryService.activeDispensary.StoreId;
          if (this.salesReturn.InvoiceReturnItems[j].ReturnedQty > this.salesReturn.InvoiceReturnItems[j].Quantity) {
            formValidity = false;
            errorMessages.push(`Returned Quantity is greater than Sold Quantity for Item ${this.salesReturn.InvoiceReturnItems[j].ItemName}.`);
          }
          let isReturnedItemListEmpty = this.saleReturnModelList.some(a => a.ReturnedQty > 0) === false;
          if (isReturnedItemListEmpty === true) {
            errorMessages.push("No items to return.");
            formValidity = false;
          }
          if (this.salesReturn.InvoiceReturnItems[j].IsReturn && this.salesReturn.InvoiceReturnItems[j].checked) {
            for (var i in this.salesReturn.InvoiceReturnItems[j].InvoiceItemsReturnValidator.controls) {
              this.salesReturn.InvoiceReturnItems[j].InvoiceItemsReturnValidator.controls[i].markAsDirty();
              this.salesReturn.InvoiceReturnItems[j].InvoiceItemsReturnValidator.controls['Quantity'].disable();
              this.salesReturn.InvoiceReturnItems[j].InvoiceItemsReturnValidator.controls[i].updateValueAndValidity();
            }
          }
        }
        if (this.saleReturn.IsReturn) {
          for (var i in this.saleReturn.InvoiceItemsReturnValidator.controls) {
            this.saleReturn.InvoiceItemsReturnValidator.controls[i].markAsDirty();
            this.saleReturn.InvoiceItemsReturnValidator.controls[i].updateValueAndValidity();
          }
          if (this.saleReturn.IsValidCheck(undefined, undefined)) {
            formValidity = false;
          }

          if (this.salesReturn.Remarks.trim() === "") {
            formValidity = false;
            errorMessages.push("Remarks is mandatory.");
            this.SetFocusById('Remark');
          }
        }
        if (this.invoiceHeader.InvoiceBillStatus === 'unpaid') {
          this.salesReturn.PaymentMode = 'credit';
        }
        else {
          this.salesReturn.PaymentMode = 'cash';
        }
        this.salesReturn.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
        this.userName = this.securityService.GetLoggedInUser().UserName;
        this.salesReturn.VisitType = this.invoiceHeader.VisitType;

        if (formValidity) {
          this.loading = true;
          this.saleReturnModelListPost = new Array<PHRMInvoiceReturnItemsModel>();
          //filter out all uncheked items and items with returned qty less than 1 into a new obj and send it to the server.
          var saleReturnObjForServer: PHRMInvoiceReturnModel = new PHRMInvoiceReturnModel();
          Object.assign(saleReturnObjForServer, this.salesReturn);
          saleReturnObjForServer.InvoiceReturnItems = saleReturnObjForServer.InvoiceReturnItems.filter(a => a.ReturnedQty > 0);
          saleReturnObjForServer.CashDiscount = this.DiscountReturnAmount ? this.DiscountReturnAmount : 0;
          saleReturnObjForServer.IsCoPayment = this.IsCoPayment;
          saleReturnObjForServer.SchemeId = this.SchemeId;
          saleReturnObjForServer.CreatedOn = moment().format('YYYY-MM-DD');
          this.pharmacyBLService.PostReturnFromCustomerData(saleReturnObjForServer)
            .finally(() => this.loading = false)
            .subscribe((res: DanpheHTTPResponse) => {
              if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.CallBackPostReturnInvoice(res);
              }
              else if (res.Status === ENUM_DanpheHTTPResponses.Failed) {
                this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
              }
            },
              err => {
                this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
              });
        }
        else {
          if (errorMessages.length > 0)
            this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, errorMessages);
        }
      }
      else {
        if (this.invoiceHeader.VisitType === "inpatient") {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, [`The bill can not be returned after ${paramValue.IPVisit} days of invoice date`]);
        }
        if (this.invoiceHeader.VisitType === "outpatient") {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, [`The bill can not be returned after ${paramValue.OPVisit} days of invoice date`]);
        }
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  Close() {
    this.showSaleItemsPopup = false;
    this.InvoiceReturnId = 0;
  }

  CreateCopyForResale() {
    try {
      if (this.patient) {
        this.patientService.setGlobal(this.patient);
        let returnItems = this.pharmacyService.CreateNewGlobalReturnSaleTransaction();
        returnItems = Object.assign(returnItems, this.saleReturnModelList);
        this.routeFromService.RouteFrom = "returnedBill";
        this.router.navigate(['/Dispensary/Sale/New']);
      } else {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['please select patient or items.']);
      }

    } catch (ex) {
      this.ShowCatchErrMessage(ex);
    }
  }
  //call this function after post successfully
  CallBackPostReturnInvoice(res) {
    try {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Success, ["Returned successfully."]);
        this.InvoiceReturnId = res.Results;
        this.showSaleItemsPopup = true;
        this.Cancel();
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }


  ValueChage(index) {
    if (this.salesReturn.InvoiceReturnItems[index].ReturnedQty === 0) {
      this.salesReturn.InvoiceReturnItems[index].checked = false;
    }
    else {
      this.salesReturn.InvoiceReturnItems[index].checked = true;
    }
    this.ChangeListByItem(index);
    //this.salesReturn.InvoiceReturnItems[index].AvailableQty = this.salesReturn.InvoiceReturnItems[index].Quantity - this.salesReturn.InvoiceReturnItems[index].ReturnedQty;
  }
  CalculationForPHRMReturnFromCustomerItem(row: PHRMInvoiceReturnItemsModel, index) {
    if (this.salesReturn.InvoiceReturnItems[index].Price != null && (this.salesReturn.InvoiceReturnItems[index].ReturnedQty <= this.salesReturn.InvoiceReturnItems[index].Quantity)) {
      let discountDecimalConversion = this.salesReturn.InvoiceReturnItems[index].DiscountPercentage / 100;
      let vatDecimalConversion = this.salesReturn.InvoiceReturnItems[index].VATPercentage / 100;
      this.salesReturn.InvoiceReturnItems[index].SubTotal = CommonFunctions.parseAmount((this.salesReturn.InvoiceReturnItems[index].SalePrice * (row.ReturnedQty)), 4);

      this.salesReturn.InvoiceReturnItems[index].DiscountAmount = CommonFunctions.parseAmount(discountDecimalConversion * this.salesReturn.InvoiceReturnItems[index].SubTotal, 4);
      this.salesReturn.InvoiceReturnItems[index].TaxableAmount = CommonFunctions.parseAmount(this.salesReturn.InvoiceReturnItems[index].SubTotal - this.salesReturn.InvoiceReturnItems[index].DiscountAmount, 4);
      this.salesReturn.InvoiceReturnItems[index].VATAmount = CommonFunctions.parseAmount(vatDecimalConversion * this.salesReturn.InvoiceReturnItems[index].TaxableAmount, 4);
      this.salesReturn.InvoiceReturnItems[index].TotalAmount = CommonFunctions.parseAmount(this.salesReturn.InvoiceReturnItems[index].SubTotal - this.salesReturn.InvoiceReturnItems[index].DiscountAmount + this.salesReturn.InvoiceReturnItems[index].VATAmount, 4);
      this.CalculationForPHRMReturnFromCustomer();
      //this.SetFocusById(`Remark`);
    }

  }


  ///Function For Calculation Of all Return from customer Toatl calculation
  CalculationForPHRMReturnFromCustomer() {
    let STotal: number = 0;
    let DisAmount: number = 0;
    let TAmount: number = 0;
    let VATAmount: number = 0;
    var DiscountAmount: number;
    let TaxableAmount: number = 0;
    var itmdis: any;
    this.NetReturnedAmount = 0;


    for (let i = 0; i < this.salesReturn.InvoiceReturnItems.length; i++) {
      if (this.salesReturn.InvoiceReturnItems[i].SubTotal != null && this.salesReturn.InvoiceReturnItems[i].TotalAmount != null) {
        STotal = STotal + this.salesReturn.InvoiceReturnItems[i].SubTotal;
        this.salesReturn.SubTotal = CommonFunctions.parseAmount(STotal, 4);
        DisAmount = DisAmount + this.salesReturn.InvoiceReturnItems[i].DiscountAmount;
        this.salesReturn.DiscountAmount = CommonFunctions.parseAmount(DisAmount, 4);
        VATAmount = VATAmount + this.salesReturn.InvoiceReturnItems[i].VATAmount;
        this.salesReturn.VATAmount = CommonFunctions.parseAmount(VATAmount, 4);
      }

      if (this.salesReturn.InvoiceReturnItems[i].ReturnedQty > 0) {
        if (this.invoiceHeader && this.invoiceHeader.SettlementId) {
          if (this.invoiceHeader.CashDiscount >= this.DiscountReturnAmount && this.returnAmount > this.DiscountReturnAmount) {
            this.NetReturnedAmount = Number((this.returnAmount - this.DiscountReturnAmount).toFixed(4));
            this.discountMoreThanReturnAmount = false;
          } else {
            this.discountMoreThanReturnAmount = true;
            this.NetReturnedAmount = 0;
          }
        }
      }

    }
    this.salesReturn.DiscountAmount = CommonFunctions.parseAmount(this.salesReturn.DiscountAmount, 4);
    this.salesReturn.VATAmount = CommonFunctions.parseAmount(this.salesReturn.VATAmount, 4);
    this.salesReturn.VATPercentage = (this.salesReturn.VATAmount) === 0 ? 0 : (this.salesReturn.VATAmount * 100) / (this.salesReturn.SubTotal - this.salesReturn.DiscountAmount),
      this.salesReturn.TaxableAmount = this.salesReturn.VATAmount > 0 ? (this.salesReturn.SubTotal - this.salesReturn.DiscountAmount) : 0,
      this.salesReturn.NonTaxableAmount = this.salesReturn.VATAmount <= 0 ? (this.salesReturn.SubTotal - this.salesReturn.DiscountAmount) : 0,
      this.salesReturn.TotalAmount = this.salesReturn.SubTotal - this.salesReturn.DiscountAmount + this.salesReturn.VATAmount;
    //ramesh: Adjustment removed as LPH requirement. And it is causing mismatch in Report Sales Return Amount part.
    // this.salesReturn.Adjustment =CommonFunctions.parseFinalAmount(this.salesReturn.TotalAmount) - this.salesReturn.TotalAmount;
    // this.salesReturn.Adjustment = CommonFunctions.parseAmount(this.salesReturn.Adjustment);
    this.salesReturn.TotalAmount = CommonFunctions.parseAmount(this.salesReturn.TotalAmount, 4);
    this.salesReturn.Tender = this.salesReturn.TotalAmount;
    this.salesReturn.Change = CommonFunctions.parseAmount(this.salesReturn.Tender - this.salesReturn.TotalAmount, 4);
    this.returnAmount = this.salesReturn.TotalAmount;
    if (this.PriceCategoryId != null && this.IsCoPayment) {
      if (this.IsCoPayment) {
        this.salesReturn.ReturnCashAmount = CommonFunctions.parseAmount((this.salesReturn.TotalAmount * this.CoPaymentCashPercent) / 100, 4);
        this.salesReturn.ReturnCreditAmount = CommonFunctions.parseAmount(this.salesReturn.TotalAmount - this.salesReturn.ReturnCashAmount, 4);
      }
    }
    else {
      if (this.salesReturn.PaymentMode === ENUM_BillPaymentMode.credit && !this.salesReturn.SettlementId) {
        this.salesReturn.ReturnCreditAmount = this.returnAmount;
      }
      else {
        this.salesReturn.ReturnCashAmount = this.returnAmount;
      }
    }
    if (this.SchemeId != null && this.IsCoPayment) {
      if (this.IsCoPayment) {
        this.salesReturn.ReturnCashAmount = CommonFunctions.parseAmount((this.salesReturn.TotalAmount * this.CoPaymentCashPercent) / 100);
        this.salesReturn.ReturnCreditAmount = CommonFunctions.parseAmount(this.salesReturn.TotalAmount - this.salesReturn.ReturnCashAmount);
      }
    }
    else {
      if (this.salesReturn.PaymentMode === ENUM_BillPaymentMode.credit && !this.salesReturn.SettlementId) {
        this.salesReturn.ReturnCreditAmount = this.returnAmount;
      }
      else {
        this.salesReturn.ReturnCashAmount = this.returnAmount;
      }
    }
    this.salesReturn.PaidAmount = this.salesReturn.ReturnCashAmount;
  }

  //cancel button code is here
  Cancel() {
    try {
      this.showReturnInvoicePage = false;
      this.selectDeselectAll = false;
      this.textMessage = null;
      this.invoicePrintId = 0;
      this.salesReturn.Remarks = null;
      this.PriceCategoryId = null;
      this.SchemeId = null;
      this.IsCoPayment = false;
      this.ClearField();
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  ShowNetAmount() {
    this.showNetAmount = true;
  }


  ChangeListByItem(i) {
    let index = i;
    if (this.salesReturn.InvoiceReturnItems[index].checked === true) {
      if (!this.salesReturn.InvoiceReturnItems[index].ReturnedQty) {
        this.salesReturn.InvoiceReturnItems[index].ReturnedQty = this.salesReturn.InvoiceReturnItems[index].Quantity;
      }
    }
    else {
      this.salesReturn.InvoiceReturnItems[index].ReturnedQty = 0;
      this.salesReturn.InvoiceReturnItems[index].InvoiceItemsReturnValidator.get('ReturnedQty').clearValidators();
      this.salesReturn.InvoiceReturnItems[index].InvoiceItemsReturnValidator.get('ReturnedQty').updateValueAndValidity();
    }

    let isAllInvoiceChecked = this.salesReturn.InvoiceReturnItems.every(item => item.checked);
    if (isAllInvoiceChecked) {
      this.salesReturn.Checked = isAllInvoiceChecked;
    }
    else {
      this.salesReturn.Checked = false;
    }
    this.CalculationForPHRMReturnFromCustomerItem(this.salesReturn.InvoiceReturnItems[index], index);
  }

  allItems(event) {
    const checked = event.target.checked;
    this.salesReturn.InvoiceReturnItems.forEach(item => item.checked = checked);
    if (checked === true) {
      this.salesReturn.InvoiceReturnItems.forEach(item => { item.ReturnedQty = item.Quantity; });
    }
    else {
      this.salesReturn.InvoiceReturnItems.forEach(item => { item.ReturnedQty = 0; });
    }
    this.salesReturn.InvoiceReturnItems.forEach((item, index) => {
      this.CalculationForPHRMReturnFromCustomerItem(item, index);
    });
  }
  SetCurrentFiscalYear() {
    //We may do this in client side itself since we already have list of all fiscal years with us. [Part of optimization.]

    this.billingBLService.GetCurrentFiscalYear()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          let fiscYr: BillingFiscalYear = res.Results;
          if (fiscYr) {
            this.selFiscYrId = fiscYr.FiscalYearId;
          }
        }
      });
  }
  //check and get count of selected Items
  GetSelectedItemCount(): number {
    try {
      //Return number of count
      let no = this.saleReturnModelList.filter(itm => itm.IsReturn === true).length;
      this.textMessage = (no <= 0) ? "Select item for return" : "";
      return no;

    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  //This function only for show catch messages
  ShowCatchErrMessage(exception) {
    try {
      if (exception) {
        let ex: Error = exception;
        console.log("Error Messsage =>  " + ex.message);
        console.log("Stack Details =>   " + ex.stack);
      }
    } catch (exception) {
      let ex: Error = exception;
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  SetFocusById(id: string) {
    var Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        clearTimeout(Timer);
      }
    }, 100);
  }
  FindNextFocusElementByIndex(index) {
    let indx = index + 1;
    if (this.saleReturnModelList.length <= indx) {
      window.setTimeout(function () {
        document.getElementById('Remark').focus();
      }, 0);
    }
    else {
      window.setTimeout(function () {
        document.getElementById('ReturnedQty' + indx).focus();
      }, 0);
    }
  }
  //this function is hotkeys when pressed by user
  public hotkeys(event) {
    if (this.showManualReturnForm === false) {//For ESC key => close the pop up
      if (event.keyCode === 27) {
        this.Close();
      }
      if (event.altKey) {
        switch (event.keyCode) {
          case 18: {// => ALT+P comes here
            if (this.ReturnBy === 'billno')
              this.SaveReturnFromCustomer();
            if (this.ReturnBy === 'hospitalno')
              this.SaveMultipleInvoiceItemReturnFromCustomer();
            break;
          }
          default:
            break;
        }
      }
    }
  }

  // Manual Return Functionalities
  showManualReturnForm: boolean = false;
  performManualReturn() {
    this.showReturnInvoicePage = false;
    this.showManualReturnForm = true;
  }
  closeManualReturn() {
    this.showManualReturnForm = false;
  }
  OnDateRangeChange($event): void {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;
    }
  }
  GetActiveDispensarylist(): void {
    this._dispensaryService.GetAllDispensaryList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.dispensaryList = JSON.parse(JSON.stringify(res.Results));
        }
      });
  }
  DispensaryListFormatter(data: any): string {
    return data["Name"];
  }
  OnDispensaryChange(): void {
    if (this.selectedDispensary.StoreId !== null || 0) {
      this.storeId = this.selectedDispensary.StoreId;
      this.ClearField();
    }
    else {
      this.storeId = null;
    }
  }

  GetInvoiceDetailsToReturnByHospitalNo(): void {
    if (!this.storeId || !this.HospitalNo) {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`Fill all the mandator fields.`]);
      return;
    }

    this.pharmacyBLService.GetReturnFromCustomerModelDataByHospitalNo(this.HospitalNo, this.PaymentMode, this.fromDate, this.toDate, this.storeId, this.SchemeId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.PatientDetail = res.Results.PatientInfo;
        this.schemeData = res.Results.schemeDetails[0];
        let invoiceItems = res.Results.InvoiceItems;

        if (this.PatientDetail && this.PatientDetail.PatientId === -1) {
          this.IsAnonymousPatient = true;
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`Anonymous Patient is not allowed to return by Hospital No`]);
          this.ClearField();
          return;
        }
        else {

          this.IsAnonymousPatient = false;
        }

        if (!invoiceItems.length) {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Items Found To Return with PaymentMode: ${this.PaymentMode}, Dispensary: ${this.selectedDispensary.Name}, Scheme: ${this.SchemeId ? this.SchemeName : ENUM_PriceCategory.General} within this date range.`]);
          this.ClearField();
          return;
        }
        let settledInvoices = invoiceItems.filter(i => i.SettlementId);
        if (settledInvoices.length) {
          let invoiceNumbers = settledInvoices.map(i => i.InvoiceNo).join(',');
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`InvoiceNo : PH-${invoiceNumbers} is settled. Please return this invoice by InvoiceNo`]);
          return;
        }
        this.InvoiceDataToBeReturn.IsCoPayment = this.schemeData.IsCoPayment;
        this.InvoiceDataToBeReturn.InvoiceId = invoiceItems[0].InvoiceId;
        this.InvoiceDataToBeReturn.InvoiceReturnItems = invoiceItems;
        this.InvoiceDataToBeReturn.OrganizationId = invoiceItems[0].OrganizationId;
        this.InvoiceDataToBeReturn.VisitType = invoiceItems[0].VisitType;
        this.InvoiceDataToBeReturn.InvoiceReturnItems.forEach(invoiceItem => {
          invoiceItem.AvailableQty = invoiceItem.SoldQty - invoiceItem.PreviouslyReturnedQty;
        });
      }
      else {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Items Found To Return with PaymentMode: ${this.PaymentMode}, Dispensary: ${this.selectedDispensary.Name}, PriceCategory: ${this.PriceCategoryId ? this.selectedPriceCategory.PriceCategoryName : ENUM_PriceCategory.Normal} within this date range.`]);
        this.ClearField();
      }
    },
      err => {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`Failed to get data ex: ${err}`]);
        this.ClearField();
      });

  }

  CalculationForPHRMReturnFromCustomerItemByHospitalNo(index: number): void {
    const item = this.InvoiceDataToBeReturn.InvoiceReturnItems[index];
    const { DiscountPercentage, VATPercentage, SalePrice, ReturnedQty } = item;
    const discountFactor = DiscountPercentage / 100;
    const vatFactor = VATPercentage / 100;

    if (item.SalePrice && item.ReturnedQty && item.ReturnedQty <= item.Quantity) {
      item.SubTotal = CommonFunctions.parseAmount(SalePrice * ReturnedQty, 4);
      item.DiscountAmount = CommonFunctions.parseAmount(discountFactor * item.SubTotal, 4);
      item.TaxableAmount = CommonFunctions.parseAmount(item.SubTotal - item.DiscountAmount, 4);
      item.VATAmount = CommonFunctions.parseAmount(vatFactor * item.TaxableAmount, 4);
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.DiscountAmount + item.VATAmount, 4);

      if (item && item.IsCoPayment && this.schemeData.CoPaymentCashPercent) {
        item.ReturnCashAmount = CommonFunctions.parseAmount(item.TotalAmount * this.schemeData.CoPaymentCashPercent / 100, 4);
        item.ReturnCreditAmount = CommonFunctions.parseAmount(item.TotalAmount - item.ReturnCashAmount, 4);
      }
      else {
        if (this.PaymentMode === ENUM_BillPaymentMode.credit && !this.salesReturn.SettlementId) {
          item.ReturnCreditAmount = item.TotalAmount;
        }
        else {
          item.ReturnCashAmount = item.TotalAmount;
        }
      }
    }
    else {
      item.SubTotal = 0;
      item.DiscountAmount = 0;
      item.TaxableAmount = 0;
      item.VATAmount = 0;
      item.TotalAmount = 0;
      item.ReturnCashAmount = 0;
    }
    this.CalculationForPHRMReturnFromCustomerByHospitalNo();
  }
  CalculationForPHRMReturnFromCustomerByHospitalNo(): void {
    let STotal: number = 0;
    let DisAmount: number = 0;
    let VATAmount: number = 0;
    let ReturnCashAmount = 0;
    let ReturnCreditAmount = 0;
    this.NetReturnedAmount = 0;

    for (let i = 0; i < this.InvoiceDataToBeReturn.InvoiceReturnItems.length; i++) {
      if (this.InvoiceDataToBeReturn.InvoiceReturnItems[i].SubTotal != null && this.InvoiceDataToBeReturn.InvoiceReturnItems[i].TotalAmount != null) {
        STotal = STotal + this.InvoiceDataToBeReturn.InvoiceReturnItems[i].SubTotal;
        this.InvoiceDataToBeReturn.SubTotal = CommonFunctions.parseAmount(STotal, 4);

        DisAmount = DisAmount + this.InvoiceDataToBeReturn.InvoiceReturnItems[i].DiscountAmount;
        this.InvoiceDataToBeReturn.DiscountAmount = CommonFunctions.parseAmount(DisAmount, 4);

        VATAmount = VATAmount + this.InvoiceDataToBeReturn.InvoiceReturnItems[i].VATAmount;
        this.InvoiceDataToBeReturn.VATAmount = CommonFunctions.parseAmount(VATAmount, 4);

        ReturnCashAmount = ReturnCashAmount + this.InvoiceDataToBeReturn.InvoiceReturnItems[i].ReturnCashAmount;
        this.InvoiceDataToBeReturn.ReturnCashAmount = CommonFunctions.parseAmount(ReturnCashAmount, 4);

        ReturnCreditAmount = ReturnCreditAmount + this.InvoiceDataToBeReturn.InvoiceReturnItems[i].ReturnCreditAmount;
        this.InvoiceDataToBeReturn.ReturnCreditAmount = CommonFunctions.parseAmount(ReturnCreditAmount, 4)
      }

      if (this.InvoiceDataToBeReturn.InvoiceReturnItems[i].ReturnedQty > 0) {
        if (this.invoiceHeader && this.invoiceHeader.SettlementId) {
          if (this.invoiceHeader.CashDiscount >= this.DiscountReturnAmount && this.returnAmount > this.DiscountReturnAmount) {
            this.NetReturnedAmount = Number((this.returnAmount - this.DiscountReturnAmount).toFixed(4));
            this.discountMoreThanReturnAmount = false;
          } else {
            this.discountMoreThanReturnAmount = true;
            this.NetReturnedAmount = 0;
          }
        }
      }

    }
    this.InvoiceDataToBeReturn.DiscountAmount = CommonFunctions.parseAmount(this.InvoiceDataToBeReturn.DiscountAmount, 4);
    this.InvoiceDataToBeReturn.VATAmount = CommonFunctions.parseAmount(this.InvoiceDataToBeReturn.VATAmount, 4);
    this.InvoiceDataToBeReturn.VATPercentage = (this.InvoiceDataToBeReturn.VATAmount) === 0 ? 0 : (this.InvoiceDataToBeReturn.VATAmount * 100) / (this.InvoiceDataToBeReturn.SubTotal - this.InvoiceDataToBeReturn.DiscountAmount);
    this.InvoiceDataToBeReturn.TaxableAmount = this.InvoiceDataToBeReturn.VATAmount > 0 ? (this.InvoiceDataToBeReturn.SubTotal - this.InvoiceDataToBeReturn.DiscountAmount) : 0;
    this.InvoiceDataToBeReturn.NonTaxableAmount = this.InvoiceDataToBeReturn.VATAmount <= 0 ? (this.InvoiceDataToBeReturn.SubTotal - this.InvoiceDataToBeReturn.DiscountAmount) : 0;
    this.InvoiceDataToBeReturn.TotalAmount = this.InvoiceDataToBeReturn.SubTotal - this.InvoiceDataToBeReturn.DiscountAmount + this.InvoiceDataToBeReturn.VATAmount;
    this.InvoiceDataToBeReturn.TotalAmount = CommonFunctions.parseAmount(this.InvoiceDataToBeReturn.TotalAmount, 4);
    this.returnAmount = this.InvoiceDataToBeReturn.ReturnCashAmount;
    this.InvoiceDataToBeReturn.PaidAmount = this.InvoiceDataToBeReturn.TotalAmount;
    this.InvoiceDataToBeReturn.Tender = this.InvoiceDataToBeReturn.TotalAmount;
    this.InvoiceDataToBeReturn.Change = CommonFunctions.parseAmount(this.InvoiceDataToBeReturn.Tender - this.InvoiceDataToBeReturn.TotalAmount, 4);
  }

  onValueChange(index): void {
    const item = this.InvoiceDataToBeReturn.InvoiceReturnItems[index];
    item.Checked = item.ReturnedQty !== 0 && item.ReturnedQty !== null;
    this.ChangeListByItemUsingHospitalNo(index);
    this.CheckIfAllItemIsChecked();
  }

  AllItems(event): void {
    const checked = event.target.checked;
    this.InvoiceDataToBeReturn.InvoiceReturnItems.forEach(item => item.Checked = checked);
    if (checked === true) {
      this.InvoiceDataToBeReturn.InvoiceReturnItems.forEach((item, i) => {
        item.ReturnedQty = item.Quantity;
        this.CalculationForPHRMReturnFromCustomerItemByHospitalNo(i);
      });
    }
    else {
      this.InvoiceDataToBeReturn.InvoiceReturnItems.forEach((item, i) => {
        item.ReturnedQty = 0;
        this.CalculationForPHRMReturnFromCustomerItemByHospitalNo(i);
      });
    }
  }

  ChangeListByItemUsingHospitalNo(index: number): void {
    if (this.InvoiceDataToBeReturn.InvoiceReturnItems[index].Checked === false) {
      this.InvoiceDataToBeReturn.InvoiceReturnItems[index].ReturnedQty = 0;
    }
    else {
      if (!this.InvoiceDataToBeReturn.InvoiceReturnItems[index].ReturnedQty) {
        this.InvoiceDataToBeReturn.InvoiceReturnItems[index].ReturnedQty = this.InvoiceDataToBeReturn.InvoiceReturnItems[index].AvailableQty;
      }
    }
    this.CheckIfAllItemIsChecked();
    this.CalculationForPHRMReturnFromCustomerItemByHospitalNo(index);
  }

  CheckIfAllItemIsChecked(): void {
    if (this.InvoiceDataToBeReturn.InvoiceReturnItems.every(i => i.ReturnedQty > 0)) {
      this.InvoiceDataToBeReturn.Checked = true;
    } else {
      this.InvoiceDataToBeReturn.Checked = false;
    }
  }

  SaveMultipleInvoiceItemReturnFromCustomer(): void {
    const { InvoiceDataToBeReturn, PaymentMode, schemeData, PatientDetail, messageboxService } = this;
    InvoiceDataToBeReturn.CounterId = this.currentCounter;
    InvoiceDataToBeReturn.StoreId = this.storeId;
    InvoiceDataToBeReturn.FiscalYearId = InvoiceDataToBeReturn.InvoiceReturnItems[0].FiscalYearId;
    InvoiceDataToBeReturn.PaymentMode = PaymentMode;
    InvoiceDataToBeReturn.SchemeId = schemeData.SchemeId;
    InvoiceDataToBeReturn.IsCoPayment = schemeData.IsCoPayment;
    InvoiceDataToBeReturn.PatientId = PatientDetail.PatientId;
    // InvoiceDataToBeReturn.VisitType = PatientDetail.VisitType;

    InvoiceDataToBeReturn.InvoiceReturnItems.forEach(itm => {
      itm.PatientId = PatientDetail.PatientId;
      itm.SchemeId = schemeData.SchemeId;
      itm.IsCoPayment = schemeData.IsCoPayment;
    });

    const filteredInvoiceReturnItems = InvoiceDataToBeReturn.InvoiceReturnItems.filter(itm => itm.ReturnedQty > 0);
    if (!filteredInvoiceReturnItems.length) {
      messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Item Found to Return']);
      return;
    }
    const hasReturnedQtyGreaterThanAllowed = filteredInvoiceReturnItems.some(item => item.ReturnedQty > item.SoldQty + item.PreviouslyReturnedQty);
    if (hasReturnedQtyGreaterThanAllowed) {
      messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['Return Quantity should not be greater than SoldQuantity']);
      return;
    }
    if (!InvoiceDataToBeReturn.Remarks) {
      messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['Remarks is mandatory']);
      return;
    }
    InvoiceDataToBeReturn.InvoiceReturnItems = filteredInvoiceReturnItems;

    let param = this.coreService.Parameters.find(p => p.ParameterName === "RestrictReturnDays" && p.ParameterGroupName === "Pharmacy");
    const paramValue = JSON.parse(param.ParameterValue);

    let InvalidItems = [];
    InvoiceDataToBeReturn.InvoiceReturnItems.forEach((i, index) => {
      if (i.Checked) {
        const visitType = this.PatientDetail.VisitType;
        if (visitType === ENUM_VisitType.inpatient) {
          if (moment().diff(moment(i.CreatedOn), 'days') > paramValue.IPVisit) {
            InvalidItems.push(`S.N:${index + 1} ` + i.ItemName);
          }
        }
        else {
          if (moment().diff(moment(i.CreatedOn), 'days') > paramValue.OPVisit) {
            InvalidItems.push(`S.N:${index + 1} ` + i.ItemName);
          }
        }
      }
    }
    );
    if (InvalidItems.length) {
      if (this.PatientDetail.VisitType === ENUM_VisitType.inpatient) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`Items with name: <br>  <b>${InvalidItems.join('<br>')}</b><br> not allowed to return after ${paramValue.IPVisit} days of invoice date.`, `Unchecked these items to return invoice`]);
      }
      if (this.PatientDetail.VisitType === ENUM_VisitType.outpatient || this.PatientDetail.VisitType === ENUM_VisitType.emergency) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [`Items with name: <br> <b>${InvalidItems.join('<br>')}</b> <br> not allowed to return after ${paramValue.OPVisit} days of invoice date.`, `Unchecked these items to return invoice`]);
      }
      return;
    }

    // Step 1: Group by InvoiceId
    // const groupedData: { [key: number]: InvoiceItemDetailToBeReturn[] } = this.InvoiceDataToBeReturn.InvoiceReturnItems.reduce((acc, item) => {
    //   if (!acc[item.InvoiceId]) {
    //     acc[item.InvoiceId] = [];
    //   }
    //   acc[item.InvoiceId].push(item);
    //   return acc;
    // }, {} as { [key: number]: InvoiceItemDetailToBeReturn[] });


    // const groupedData: { [key: string]: InvoiceItemDetailToBeReturn[] } = 
    // this.InvoiceDataToBeReturn.InvoiceReturnItems.reduce((acc, item) => {
    //   const groupKey = `${item.InvoiceId}-${item.VisitType}`;
    //   if (!acc[groupKey]) {
    //     acc[groupKey] = [];
    //   }
    //   acc[groupKey].push(item);
    //   return acc;
    // }, {} as { [key: string]: InvoiceItemDetailToBeReturn[] });


    const groupedData: { [invoiceIdVisitType: string]: InvoiceItemDetailToBeReturn[] } =
      this.InvoiceDataToBeReturn.InvoiceReturnItems.reduce((acc, item) => {
        const groupKey = `${item.InvoiceId}_${item.VisitType}`;
        (acc[groupKey] = acc[groupKey] || []).push(item);
        return acc;
      }, {} as { [invoiceIdVisitType: string]: InvoiceItemDetailToBeReturn[] });


    console.log(groupedData);

    // Step 2: Create SalesReturnInfo and SalesReturnItems structure

    let salesReturnInvoices = new Array<InvoiceDetailToBeReturn>();

    // Object.keys(groupedData).map(invoiceId => {
    //   let salesReturnInvoice = new InvoiceDetailToBeReturn();
    //   const items = groupedData[Number(invoiceId)];
    //   salesReturnInvoice.CounterId = this.currentCounter;
    //   salesReturnInvoice.StoreId = this.storeId;
    //   salesReturnInvoice.FiscalYearId = this.InvoiceDataToBeReturn.InvoiceReturnItems[0].FiscalYearId;
    //   salesReturnInvoice.OrganizationId = this.InvoiceDataToBeReturn.OrganizationId;
    //   salesReturnInvoice.PaymentMode = PaymentMode;
    //   salesReturnInvoice.SchemeId = schemeData.SchemeId;
    //   salesReturnInvoice.IsCoPayment = schemeData.IsCoPayment;
    //   salesReturnInvoice.PatientId = PatientDetail.PatientId;
    //   // salesReturnInvoice.VisitType = PatientDetail.VisitType;
    //   salesReturnInvoice.SettlementId = this.invoiceHeader.SettlementId;
    //   salesReturnInvoice.InvoiceId = Number(invoiceId);
    //   salesReturnInvoice.Remarks = this.InvoiceDataToBeReturn.Remarks;
    //   salesReturnInvoice.OrganizationId = this.InvoiceDataToBeReturn.OrganizationId;
    //   if (items && items.length) {
    //     items.forEach(item => {
    //       salesReturnInvoice.InvoiceReturnItems.push(Object.assign(new InvoiceItemDetailToBeReturn(), item));
    //       salesReturnInvoice.PriceCategoryId = item.PriceCategoryId;
    //       salesReturnInvoice.ClaimCode = item.ClaimCode;
    //     });
    //   }

    //   salesReturnInvoices.push(salesReturnInvoice);
    // });

    Object.keys(groupedData).map(groupKey => {
      let salesReturnInvoice = new InvoiceDetailToBeReturn();

      // Extract InvoiceId and VisitType from the composite key
      const [invoiceId, visitType] = groupKey.split('_');

      const items = groupedData[groupKey];
      salesReturnInvoice.CounterId = this.currentCounter;
      salesReturnInvoice.StoreId = this.storeId;
      salesReturnInvoice.FiscalYearId = this.InvoiceDataToBeReturn.InvoiceReturnItems[0].FiscalYearId;
      salesReturnInvoice.OrganizationId = this.InvoiceDataToBeReturn.OrganizationId;
      salesReturnInvoice.PaymentMode = PaymentMode;
      salesReturnInvoice.SchemeId = schemeData.SchemeId;
      salesReturnInvoice.IsCoPayment = schemeData.IsCoPayment;
      salesReturnInvoice.PatientId = PatientDetail.PatientId;
      salesReturnInvoice.VisitType = visitType; // Set VisitType
      salesReturnInvoice.SettlementId = this.invoiceHeader.SettlementId;
      salesReturnInvoice.InvoiceId = Number(invoiceId);
      salesReturnInvoice.Remarks = this.InvoiceDataToBeReturn.Remarks;
      salesReturnInvoice.OrganizationId = this.InvoiceDataToBeReturn.OrganizationId;

      if (items && items.length) {
        items.forEach(item => {
          salesReturnInvoice.InvoiceReturnItems.push(Object.assign(new InvoiceItemDetailToBeReturn(), item));
          salesReturnInvoice.PriceCategoryId = item.PriceCategoryId;
          salesReturnInvoice.ClaimCode = item.ClaimCode;
        });
      }

      salesReturnInvoices.push(salesReturnInvoice);
    });


    console.log(salesReturnInvoices);
    salesReturnInvoices.forEach(invoice => {
      let subtotal = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.SubTotal, 0);
      invoice.SubTotal = CommonFunctions.parseAmount(subtotal, 4);

      let discountAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.DiscountAmount, 0);
      invoice.DiscountAmount = CommonFunctions.parseAmount(discountAmount, 4);

      let discountPercentage = invoice.DiscountAmount / invoice.SubTotal * 100;
      invoice.DiscountPercentage = CommonFunctions.parseAmount(discountPercentage, 4);

      let vatAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.VATAmount, 0);
      invoice.VATAmount = CommonFunctions.parseAmount(vatAmount, 4);

      let vatPercentage = invoice.VATAmount / (invoice.SubTotal - invoice.DiscountAmount) * 100;
      invoice.VATPercentage = CommonFunctions.parseAmount(vatPercentage, 4);

      let taxableAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.TaxableAmount, 0);
      invoice.TaxableAmount = CommonFunctions.parseAmount(taxableAmount, 4);

      invoice.NonTaxableAmount = CommonFunctions.parseAmount(invoice.DiscountAmount, 4);

      let returnCashAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.ReturnCashAmount, 0);
      let returnCreditAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.ReturnCreditAmount, 0);

      invoice.ReturnCashAmount = CommonFunctions.parseAmount(returnCashAmount, 4);
      invoice.ReturnCreditAmount = CommonFunctions.parseAmount(returnCreditAmount, 4);

      invoice.TotalAmount = CommonFunctions.parseAmount(invoice.SubTotal - invoice.DiscountAmount + invoice.VATAmount, 4);

      let paidAmount = invoice.InvoiceReturnItems.reduce((acc, item) => acc + item.TotalAmount, 0);
      invoice.PaidAmount = CommonFunctions.parseAmount(paidAmount, 4);
      invoice.Tender = invoice.PaidAmount;
      invoice.Change = invoice.Tender - invoice.PaidAmount;
    })


    this.loading = true;
    this.pharmacyBLService.PostMultipleInvoiceItemReturnFromCustomer(salesReturnInvoices)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Success, ['Return Successfully']);
          this.ClearField();
          this.HospitalNo = null;
          this.selectedDispensary = new PHRMStoreModel();
          if (res.Results && res.Results.length) {
            this.InvoiceReturnIds = res.Results;
          }
          else {
            this.InvoiceReturnId = res.Results;
          }
          this.showSaleItemsPopup = true;
        }
        else {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed To Return Invoice. <br>' + res.ErrorMessage]);
        }
      },
        err => {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed To Return Invoice. <br>' + err]);
        });
  }

  ClearField(): void {
    this.InvoiceDataToBeReturn = new InvoiceDetailToBeReturn();
    this.PatientDetail = new PatientModel();
    this.salesReturn = new PHRMInvoiceReturnModel();
    this.InvoiceDataToBeReturn = new InvoiceDetailToBeReturn();
    this.showManualReturnForm = false;
  }
  onReturnByChange(): void {
    this.PaymentMode = (this.ReturnBy === ENUM_Dispensary_ReturnInvoiceBy.HospitalNumber) ? 'cash' : null;
    this.ClearField();
  }
  OnPriceCategoryChange(event: PriceCategory): void {
    if (event != null) {
      this.PriceCategoryId = event.PriceCategoryId;
      this.ClearField();
    }
  }
  OnPaymentModeChange(): void {
    this.ClearField();
  }

  public GetPriceCategories(): void {
    this.coreBLService.GetPriceCategories().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        let allPriceCategories = res.Results;
        this.enabledPriceCategories = allPriceCategories.filter(pc => pc.IsActive === true);
      }
    });
  }

  PriceCategoryListFormatter(data: PriceCategory): string {
    let html = data["PriceCategoryName"];
    return html;
  }
  public LoadPharmacySchemesList() {
    this.settingsBLService.GetBillingSchemesDtoList(ENUM_ServiceBillingContext.OpPharmacy)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.membershipList = res.Results;
          if (this.membershipList) {
            this.membershipList.forEach(mem => {
              mem.MembershipDisplayName = mem.SchemeName;
            });
          }
          if (this.selMembershipId) {
            let selMembership: BillingScheme_DTO = this.membershipList.find(a => a.SchemeId == this.selMembershipId);
            if (selMembership) {
              this.selectedCommunityName = selMembership.CommunityName;
            }
          }
          else {
            let defaultMembership = this.membershipList.find(a => a.SchemeName.toLowerCase() == "general");
            if (defaultMembership) {
              this.selMembershipId = defaultMembership.SchemeId;
              this.selectedCommunityName = defaultMembership.CommunityName;
            }
          }
          this.filteredMembershipList = this.membershipList;
          this.MembershipTypeChange();
        }
        else {
          alert("Failed!" + res.ErrorMessage);
        }
      });
  }
  MembershipTypeChange() {
    if (this.selMembershipId && this.filteredMembershipList && this.filteredMembershipList.length > 0) {
      const selectedSchemeObj = this.filteredMembershipList.find(a => a.SchemeId === +this.selMembershipId);
      this.selMembershipId = selectedSchemeObj.SchemeId;
      this.SchemeId = this.selMembershipId;
      this.SchemeName = selectedSchemeObj.SchemeName;
      if (this.filteredMembershipList.length == 1) {
        this.selMembershipId = this.filteredMembershipList[0].SchemeId;
        this.SchemeId = this.selMembershipId;
      }
    }
  }

  GetSalesReturnConfigurationParameter() {
    let salesReturnConfigParameter = this.coreService.Parameters.find(p => p.ParameterName === "SalesReturnConfig" && p.ParameterGroupName === "Pharmacy");
    if (salesReturnConfigParameter) {
      this.SalesReturnConfig = JSON.parse(salesReturnConfigParameter.ParameterValue);
      if (this.SalesReturnConfig && this.SalesReturnConfig.ReturnByHospitalNo) {
        this.ReturnBy = this.SalesReturnConfig.ReturnByInvoiceNo ? ENUM_Dispensary_ReturnInvoiceBy.BillNumber : ENUM_Dispensary_ReturnInvoiceBy.HospitalNumber;
      }
      else {
        this.ReturnBy = ENUM_Dispensary_ReturnInvoiceBy.BillNumber;
      }
    }
  }
}

export class InvoiceHederModel {

  public InvoiceId: number = 0;
  public InvoiceDate: string = "";
  public PatientName: string = "";
  public PatientType: string = "";
  public CreditAmount: string = "";
  public VisitType: string = "";
  public InvoiceBillStatus: string = "";
  public InvoiceTotalMoney: string = "";
  public Tender: number = 0;
  public Change: number = 0;
  public DiscountAmount: number = 0;
  public BillingUser: string = "";
  public IsReturn: boolean = false;
  public SubTotal: number = 0;
  public FiscalYear: number = 0;
  public ReceiptPrintNo: number = 0;
  public Remarks: string = "";
  public CreditNoteId: number;//for view
  public ClaimCode: number;//sud:1-oct'21: Changed datatype from String to Number in all places
  public NSHINo: string;

  public SettlementId: number = null;
  public CashDiscount: number = 0;
  public OrganizationId: number = null;
  InsuranceBalance: number = 0;
}

class Store {
  StoreId: number;
  Name: string;
}

class PatientModel {
  PatientId: number;
  PatientName: string;
  PatientType: string;
  HospitalNo: string;
  VisitType: string;
}
