import { Component, HostListener, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../../../core/shared/core.service';
import { PharmacySchemePriceCategory_DTO } from '../../../../../pharmacy/shared/dtos/pharmacy-scheme-pricecategory.dto';
import { PHRMEmployeeCashTransaction } from '../../../../../pharmacy/shared/pharmacy-employee-cash-transaction';
import { PharmacyBLService } from '../../../../../pharmacy/shared/pharmacy.bl.service';
import { PHRMInvoiceItemsModel } from '../../../../../pharmacy/shared/phrm-invoice-items.model';
import { PHRMInvoiceModel } from '../../../../../pharmacy/shared/phrm-invoice.model';
import { PHRMPatient } from '../../../../../pharmacy/shared/phrm-patient.model';
import { PHRMStoreModel } from '../../../../../pharmacy/shared/phrm-store.model';
import { SecurityService } from '../../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../../shared/common-models';
import { CommonFunctions } from '../../../../../shared/common.functions';
import { FewaPayService } from '../../../../../shared/fewa-pay/helpers/fewa-pay.service';
import { MessageboxService } from '../../../../../shared/messagebox/messagebox.service';
import { ENUM_BillingStatus, ENUM_BillPaymentMode, ENUM_DanpheHTTPResponses, ENUM_FewaPayMessageTypes, ENUM_FewaPayTransactionFrom, ENUM_MessageBox_Status, ENUM_POS_ResponseStatus } from '../../../../../shared/shared-enums';
import { DispensaryService } from '../../../../shared/dispensary.service';
import { InsurancePackageBillServiceItem_DTO } from '../../../../shared/DTOs/insurance-package-bill-service-item.dto';
import { PatientVisitWiseProvisionalBillsInfo_DTO } from '../dtos/patient-visit-wise-provisional-bills-info.dto';
import { ProvisionalBillSharedService } from '../provisional-bills-shared.service';

@Component({
  selector: 'app-provisional-bills-finalize',
  templateUrl: './provisional-bills-finalize.component.html',
  styleUrls: ['./provisional-bills-finalize.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ProvisionalBillsFinalizeComponent implements OnInit {
  ProvisionalItemsForFinalize: PHRMInvoiceItemsModel[] = [];
  CurrentSale: PHRMInvoiceModel = new PHRMInvoiceModel();
  SchemePriceCategory: PharmacySchemePriceCategory_DTO = new PharmacySchemePriceCategory_DTO();
  SelectAllItems: boolean = false;
  public patSummary = { IsLoaded: false, PatientId: 0, CreditAmount: 0, ProvisionalAmt: 0, TotalDue: 0, DepositBalance: 0, BalanceAmount: 0, GeneralCreditLimit: 0, IpCreditLimit: 0, OpCreditLimit: 0, OpBalance: 0, IpBalance: 0 };
  CurrentActiveDispensary: PHRMStoreModel;
  ClearPaymentDetail: boolean = false;
  InvoiceId: number = 0;
  ShowSaleInvoice: boolean = false;
  NewCurrentSaleItems: PHRMInvoiceItemsModel[];
  loadingScreen: boolean = false;
  Loading: boolean = false;
  public CurrentPatient: PHRMPatient = new PHRMPatient();
  CurrentCounter: number = 0;
  NewDepositBalance: number = 0;
  DepositDeductAmount: number = 0;
  IsReturnDepositChecked: boolean = false;
  DepositRefundAmount: number = 0;
  ShowDepositReturnCheckbox: boolean = false;
  DisablePaymentModeDropDown: boolean = false;
  IsPendingSettlements: boolean = false;
  DeductDeposit: boolean = false;
  CheckDeductFromDeposit: boolean = false;
  MstPaymentModes: any[] = [];
  PHRMEmployeeCashTransaction: PHRMEmployeeCashTransaction = new PHRMEmployeeCashTransaction();
  IsOtherProvisionalRemaining: boolean = false;
  ConfirmationTitle: string = "Confirm !";
  ConfirmationMessage: string = "Are you sure you want to Print Invoice ?";
  InsurancePackageBillServiceItems: InsurancePackageBillServiceItem_DTO[] = [];
  PatientVisitWiseProvisionalBillsInfo: PatientVisitWiseProvisionalBillsInfo_DTO[] = [];


  constructor(private provisionalService: ProvisionalBillSharedService,
    public messageBoxService: MessageboxService,
    private _dispensaryService: DispensaryService,
    public pharmacyBLService: PharmacyBLService,
    private _fewaPayService: FewaPayService,
    public securityService: SecurityService,
    public coreService: CoreService

  ) {
    this.MstPaymentModes = this.coreService.masterPaymentModes;
    this.CurrentActiveDispensary = this._dispensaryService.activeDispensary;
    this.CurrentCounter = this.securityService.getPHRMLoggedInCounter().CounterId;
    this.InsurancePackageBillServiceItems = this._dispensaryService.InsurancePackageBillServiceItems;
  }

  ngOnInit() {
    let patientId = this._dispensaryService.PatientId;
    let patientVisitId = this._dispensaryService.PatientVisitId;
    if (patientId && patientVisitId) {
      this.GetPatientProvisionalItems(patientId, patientVisitId)
    }
  }

  /**
 * Get the patient provisional items information for update.
 * @param patientId 
 * @param PatientVisitId 
 */
  GetPatientProvisionalItems(patientId: number, PatientVisitId?: number) {
    this.pharmacyBLService.GetPatientCreditItems(patientId, this.CurrentActiveDispensary.StoreId, PatientVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ProvisionalItemsForFinalize = res.Results.PatientCreditItems;
          this.SchemePriceCategory = res.Results.SchemePriceCategory;
          this.CurrentSale.CoPaymentMode = this.SchemePriceCategory.DefaultPaymentMode;
          this.CurrentSale.PatientVisitId = PatientVisitId;
          this.LoadPatientInvoiceSummary(patientId, this.SchemePriceCategory.SchemeId, PatientVisitId)

          this.ProvisionalItemsForFinalize.forEach(item => {
            item.DiscountPer = item.DiscountPercentage;
            item.DispatchQty = item.Quantity;
            item.IsSelected = true;
            let serviceItem = this.InsurancePackageBillServiceItems.find(si => si.ServiceItemId === item.BillServiceItemId);
            item.BillServiceItemName = serviceItem ? serviceItem.ItemName : '';
          });
          this.SelectAllItems = true;

          this.AllCalculation();
        }
      });
  }

  SelectAllCheckBoxOnChange(event) {
    const checked = event.target.checked;
    this.ProvisionalItemsForFinalize.forEach(item => item.IsSelected = checked);
    this.ProvisionalItemsForFinalize.forEach(item => {
      let subtotal = (item.Quantity) * item.SalePrice;
      item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);
      item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
      item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);

    });
    this.AllCalculation();

  }

  AllCalculation(discPer?, discAmt?) {
    try {
      this.CurrentSale.SubTotal = 0;
      this.CurrentSale.TotalAmount = 0;
      this.CurrentSale.VATAmount = 0;
      this.CurrentSale.DiscountAmount = 0;
      this.CurrentSale.CoPaymentCashAmount = 0;
      this.CurrentSale.CoPaymentCreditAmount = 0;
      this.CurrentSale.DiscountAmount = 0;
      this.CurrentSale.DiscountPer = 0;
      this.CurrentSale.TaxableAmount = 0;
      this.CurrentSale.ReceivedAmount = 0;
      this.CurrentSale.CoPaymentCashAmount = 0;
      this.CurrentSale.CoPaymentCreditAmount = 0;
      this.CurrentSale.PaidAmount = 0;
      this.CurrentSale.Tender = 0;
      this.CurrentSale.Change = 0;
      const provisionalFinalizeItems = this.ProvisionalItemsForFinalize.filter(item => item.IsSelected);
      if (provisionalFinalizeItems && provisionalFinalizeItems.length) {
        for (let i = 0; i < provisionalFinalizeItems.length; i++) {
          if (provisionalFinalizeItems[i].IsSelected) {
            provisionalFinalizeItems[i].SubTotal = provisionalFinalizeItems[i].SalePrice * provisionalFinalizeItems[i].DispatchQty;

            this.CurrentSale.SubTotal = CommonFunctions.parseAmount(this.CurrentSale.SubTotal + provisionalFinalizeItems[i].SubTotal, 4);

            provisionalFinalizeItems[i].TotalDisAmt = provisionalFinalizeItems[i].SubTotal * (provisionalFinalizeItems[i].DiscountPercentage) / 100;

            this.CurrentSale.DiscountAmount = CommonFunctions.parseAmount(this.CurrentSale.DiscountAmount + provisionalFinalizeItems[i].TotalDisAmt, 4);

            this.CurrentSale.DiscountPer = CommonFunctions.parseAmount((this.CurrentSale.DiscountAmount / this.CurrentSale.SubTotal) * 100, 4);

            this.CurrentSale.TaxableAmount = CommonFunctions.parseAmount(this.CurrentSale.SubTotal - this.CurrentSale.DiscountAmount, 4);

            provisionalFinalizeItems[i].VATAmount = CommonFunctions.parseAmount((provisionalFinalizeItems[i].SubTotal - provisionalFinalizeItems[i].TotalDisAmt) * provisionalFinalizeItems[i].VATPercentage / 100, 4);

            this.CurrentSale.VATPercentage = CommonFunctions.parseAmount(this.CurrentSale.VATAmount / this.CurrentSale.TaxableAmount * 100, 4);

            provisionalFinalizeItems[i].TotalAmount = provisionalFinalizeItems[i].SubTotal - provisionalFinalizeItems[i].TotalDisAmt + provisionalFinalizeItems[i].VATAmount;
            this.CurrentSale.TotalAmount = CommonFunctions.parseAmount(this.CurrentSale.TotalAmount + this.ProvisionalItemsForFinalize[i].TotalAmount, 4);

            if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
              provisionalFinalizeItems[i].CoPaymentCashAmount = provisionalFinalizeItems[i].TotalAmount * (provisionalFinalizeItems[i].CoPaymentCashPercent / 100);
              provisionalFinalizeItems[i].CoPaymentCreditAmount = provisionalFinalizeItems[i].TotalAmount - provisionalFinalizeItems[i].CoPaymentCashAmount;
              this.CurrentSale.CoPaymentCashAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCashAmount + provisionalFinalizeItems[i].CoPaymentCashAmount, 4);
              this.CurrentSale.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCreditAmount + provisionalFinalizeItems[i].CoPaymentCreditAmount, 4);
            }
          }
        }

        //for bulk discount calculation and conversion of percentage into amount and vice versa
        if (discPer == 0 && discAmt > 0) {
          this.CurrentSale.TotalAmount = this.CurrentSale.SubTotal - discAmt;
          this.CurrentSale.DiscountAmount = discAmt;
          discPer = (discAmt / this.CurrentSale.SubTotal) * 100;
          this.CurrentSale.DiscountPer = CommonFunctions.parseAmount(discPer, 4);
        }
        if (discPer > 0 && discAmt == 0) {
          discAmt = CommonFunctions.parseAmount(this.CurrentSale.SubTotal * (discPer) / 100, 4)
          this.CurrentSale.TotalAmount = this.CurrentSale.SubTotal - discAmt;
          this.CurrentSale.DiscountAmount = discAmt;
          this.CurrentSale.DiscountPer = discPer;
        }
        if (discPer == 0 && discAmt == 0) {
          this.CurrentSale.SubTotal = this.CurrentSale.SubTotal;
          this.CurrentSale.TotalAmount = this.CurrentSale.TotalAmount;
          this.CurrentSale.DiscountAmount = discAmt;
          this.CurrentSale.DiscountPer = discPer;
        }
        if (discPer >= 0 && discAmt >= 0) {
          this.ProvisionalItemsForFinalize.forEach(a => {
            a.DiscountPercentage = this.CurrentSale.DiscountPer;
            a.TotalDisAmt = 0;
            a.VATAmount = 0;
            this.updateCalculationsForSalesItemOnDiscountPercentageChange(a);
          });
        }
        this.CurrentSale.TotalAmount = CommonFunctions.parseAmount(this.CurrentSale.SubTotal - this.CurrentSale.DiscountAmount + this.CurrentSale.VATAmount, 4);

        this.CurrentSale.SubTotal = CommonFunctions.parseAmount(this.CurrentSale.SubTotal, 4);
        this.CurrentSale.DiscountAmount = CommonFunctions.parseAmount(this.CurrentSale.DiscountAmount, 4);
        this.CurrentSale.DiscountPer = CommonFunctions.parseAmount(this.CurrentSale.DiscountPer, 4);
        this.CurrentSale.VATAmount = CommonFunctions.parseAmount(this.CurrentSale.VATAmount, 4);
        this.CurrentSale.TotalAmount = CommonFunctions.parseAmount(this.CurrentSale.TotalAmount, 4);

        this.CurrentSale.CoPaymentCashAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCashAmount, 4);
        this.CurrentSale.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCreditAmount, 4);

        if (this.SchemePriceCategory.IsCoPayment) {
          if (this.CurrentSale.CoPaymentMode === ENUM_BillPaymentMode.credit) {
            this.CurrentSale.ReceivedAmount = this.CurrentSale.CoPaymentCashAmount;
            this.CurrentSale.CreditAmount = this.CurrentSale.CoPaymentCreditAmount;
          }
        }
        else {
          if (this.CurrentSale.PaymentMode === ENUM_BillPaymentMode.credit) {
            this.CurrentSale.CreditAmount = this.CurrentSale.TotalAmount;
            this.CurrentSale.ReceivedAmount = 0;
            this.CurrentSale.PaidAmount = 0;
          }
          else {
            this.CurrentSale.ReceivedAmount = this.CurrentSale.TotalAmount;
            this.CurrentSale.CreditAmount = 0;
          }
        }
        this.CurrentSale.PaidAmount = CommonFunctions.parseAmount(this.CurrentSale.ReceivedAmount, 4);


        this.CurrentSale.Tender = CommonFunctions.parseAmount(this.CurrentSale.PaidAmount, 4);
        this.CurrentSale.Change = CommonFunctions.parseAmount(this.CurrentSale.Tender - this.CurrentSale.ReceivedAmount, 4);

        this.ChangeTenderAmount();
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  updateCalculationsForSalesItemOnDiscountPercentageChange(currSaleItems: PHRMInvoiceItemsModel) {
    let itemQty = currSaleItems.Quantity;
    let itemMRP = currSaleItems.SalePrice;
    let subtotal = currSaleItems.SubTotal ? currSaleItems.SubTotal : 0;
    let disPer = currSaleItems.DiscountPercentage ? currSaleItems.DiscountPercentage : 0;
    let disAmt = currSaleItems.TotalDisAmt ? currSaleItems.TotalDisAmt : 0;
    let vatPer = currSaleItems.VATPercentage ? currSaleItems.VATPercentage : 0;
    let vatAmt = currSaleItems.VATAmount ? currSaleItems.VATAmount : 0;
    let coPayCashAmt = currSaleItems.CoPaymentCashAmount ? currSaleItems.CoPaymentCashAmount : 0;
    let coPayCreditAmt = currSaleItems.CoPaymentCreditAmount ? currSaleItems.CoPaymentCreditAmount : 0;

    subtotal = itemQty * itemMRP;
    if (disPer > 0) {
      disAmt = (subtotal * disPer) / 100;
    }
    let taxAbleAmt = subtotal - disAmt;
    if (vatPer > 0) {
      vatAmt = (taxAbleAmt * vatPer) / 100;
    }
    let totalAmount = subtotal - disAmt + vatAmt;

    currSaleItems.SubTotal = subtotal;
    currSaleItems.DiscountPercentage = disPer;
    currSaleItems.TotalDisAmt = CommonFunctions.parseAmount(disAmt, 4);
    currSaleItems.VATPercentage = CommonFunctions.parseAmount(vatPer, 4);
    currSaleItems.VATAmount = CommonFunctions.parseAmount(vatAmt, 4);
    currSaleItems.TotalAmount = CommonFunctions.parseAmount(totalAmount, 4);
    currSaleItems.CoPaymentCashAmount = CommonFunctions.parseAmount(coPayCashAmt, 4);
    currSaleItems.CoPaymentCreditAmount = CommonFunctions.parseAmount(coPayCreditAmt, 4);
  }

  ChangeTenderAmount() {
    this.CurrentSale.Change = CommonFunctions.parseAmount(this.CurrentSale.Tender - this.CurrentSale.PaidAmount, 4);
  }

  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this.messageBoxService.showMessage("error", ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  ItemRowValueChanged(index) {
    try {
      let item = this.ProvisionalItemsForFinalize[index];
      let subtotal = item.DispatchQty * item.SalePrice;
      item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);



      if (this.ProvisionalItemsForFinalize[index].DiscountPercentage > 0 && this.ProvisionalItemsForFinalize[index].TotalDisAmt == 0) {
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
      }
      if (this.ProvisionalItemsForFinalize[index].DiscountPercentage == 0 && this.ProvisionalItemsForFinalize[index].TotalDisAmt > 0) {
        item.DiscountPercentage = CommonFunctions.parseAmount((item.TotalDisAmt / item.SubTotal) * 100, 4);
      }

      if (this.ProvisionalItemsForFinalize[index].DiscountPercentage == 0 && this.ProvisionalItemsForFinalize[index].TotalDisAmt == 0) {
        item.TotalDisAmt = 0;
        item.DiscountPercentage = 0;
      }
      if (this.ProvisionalItemsForFinalize[index].DiscountPercentage > 0 && this.ProvisionalItemsForFinalize[index].TotalDisAmt > 0) {
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * item.DiscountPercentage / 100, 4);
      }

      item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);

      if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
        item.CoPaymentCashAmount = CommonFunctions.parseAmount(item.TotalAmount * item.CoPaymentCashPercent / 100, 4);
        item.CoPaymentCreditAmount = CommonFunctions.parseAmount(item.TotalAmount - item.CoPaymentCashAmount, 4);
      }
      this.AllCalculation();
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  FindNextFocusElementByIndex(index) {
    let indx = index + 1;
    if (this.ProvisionalItemsForFinalize.length <= indx) {
      window.setTimeout(function () {
        document.getElementById('btnUpdate').focus();
      }, 0);
    }
    else {
      window.setTimeout(function () {
        document.getElementById('ReturnQty' + indx).focus();
      }, 0);
    }
  }

  OnDiscountChange(index, discountPercent, discountAmount) {
    if (discountPercent == null) {
      discountPercent = 0;
    }
    if (discountAmount == null) {
      discountAmount = 0;
    }
    this.ProvisionalItemsForFinalize[index].DiscountPercentage = discountPercent;
    this.ProvisionalItemsForFinalize[index].TotalDisAmt = discountAmount;
  }

  SetFocusById(id: string, waitingTimeInms = 0) {
    var Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        nextEl.select();
        clearTimeout(Timer);
      }
    }, waitingTimeInms);
  }
  SelectItemCheckBoxOnChange(index) {
    this.SelectAllItems = this.ProvisionalItemsForFinalize.every(item => item.IsSelected == true);
    this.ItemRowValueChanged(index);
  }
  OnMainDiscountPercentChange() {
    this.ProvisionalItemsForFinalize.forEach(itm => {
      itm.DiscountPercentage = this.CurrentSale.DiscountPer;
      itm.TotalDisAmt = CommonFunctions.parseAmount((itm.SubTotal * itm.DiscountPercentage) / 100, 4);
      itm.TotalAmount = itm.SubTotal - itm.TotalDisAmt + itm.VATAmount;
    })
    this.AllCalculation(this.CurrentSale.DiscountPer, 0)
  }

  OnMainDiscountAmountChange() {
    if (this.CurrentSale.DiscountAmount > 0) {
      this.CurrentSale.DiscountPer = CommonFunctions.parseAmount((this.CurrentSale.DiscountAmount / this.CurrentSale.SubTotal) * 100, 4);
      this.ProvisionalItemsForFinalize.forEach(itm => {
        itm.DiscountPercentage = this.CurrentSale.DiscountPer;
        itm.TotalDisAmt = itm.SubTotal * itm.DiscountPercentage;
        itm.TotalAmount = itm.SubTotal - itm.TotalDisAmt + itm.VATAmount;
      });
      this.AllCalculation(this.CurrentSale.DiscountPer, 0)

    }
    else {
      this.CurrentSale.DiscountAmount = 0;
      this.CurrentSale.DiscountPer = 0;
      this.AllCalculation(this.CurrentSale.DiscountPer, this.CurrentSale.DiscountAmount)
    }

  }
  PaymentModeChanges($event: any) {

    this.CurrentSale.PaymentMode = $event.PaymentMode.toLowerCase();
    this.CurrentSale.PaymentDetails = $event.PaymentDetails;
    this.CurrentSale.IsRemarksMandatory = $event.IsRemarksMandatory;
    this.OnPaymentModeChange();
    if (this.CurrentSale.PaymentMode.toLowerCase() == "credit") {
      this.ShowDepositReturnCheckbox = false;
    }
    else {
      if (this.CurrentSale.PaymentMode.toLowerCase() == "cash") {
        this.DepositDeductAmount = 0;
        this.DepositRefundAmount = 0;
      }

      this.ShowDepositReturnCheckbox = true;
    }

  }
  OnPaymentModeChange() {
    if (this.CurrentSale.PaymentMode.toLowerCase() == "credit") {
      this.CurrentSale.PaidAmount = 0;
      this.CurrentSale.CreditAmount = this.CurrentSale.TotalAmount;
      // this.CurrentSale.ReceivedAmount = 0;
      this.CurrentSale.BilStatus = "unpaid";
      this.CurrentSale.CreateOn = moment().format("YYYY-MM-DD HH:mm:ss");
      this.CurrentSale.CounterId = this.securityService.getLoggedInCounter().CounterId;
      this.CurrentSale.Tender = 0;
      this.CurrentSale.Change = 0;
      if (this.CurrentSale.InvoiceItems) {
        this.CurrentSale.InvoiceItems.forEach(txnItm => {
          txnItm.BilItemStatus = ENUM_BillingStatus.unpaid;
          txnItm.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        });
      }
      this.DeductDeposit = false;
      this.DepositDeductCheckBoxChanged();
    }
    else {
      if (!this.SchemePriceCategory.IsCoPayment) {
        this.CurrentSale.OrganizationId = null;
        this.CurrentSale.CreditOrganizationName = null;
      }
      this.CurrentSale.PaidAmount = this.CurrentSale.Tender - this.CurrentSale.Change;
      this.CurrentSale.BilStatus = "paid";
      this.CurrentSale.CreateOn = moment().format("YYYY-MM-DD HH:mm:ss");//default paiddate.
      this.CurrentSale.CounterId = this.securityService.getLoggedInCounter().CounterId;//sud:29May'18
      if (this.TempEmployeeCashTransaction && !this.TempEmployeeCashTransaction.length && !this.DeductDeposit) {
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.CurrentSale.PaymentMode.toLocaleLowerCase());
        let empCashTxnObj = new PHRMEmployeeCashTransaction();
        empCashTxnObj.InAmount = this.CurrentSale.TotalAmount;
        empCashTxnObj.OutAmount = 0;
        empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
        empCashTxnObj.ModuleName = "Pharmacy";
        this.TempEmployeeCashTransaction.push(empCashTxnObj);
      }
      if (this.TempEmployeeCashTransaction && !this.TempEmployeeCashTransaction.length && this.DeductDeposit) {
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.CurrentSale.PaymentMode.toLocaleLowerCase());
        let empCashTxnObj = new PHRMEmployeeCashTransaction();
        empCashTxnObj.InAmount = this.CurrentSale.DepositUsed;
        empCashTxnObj.OutAmount = 0;
        empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
        empCashTxnObj.ModuleName = "Pharmacy";
        this.TempEmployeeCashTransaction.push(empCashTxnObj);

        if ((this.CurrentSale.TotalAmount - this.CurrentSale.DepositUsed) > 0) {
          let empCashTxnObj = new PHRMEmployeeCashTransaction();
          let obj = this.MstPaymentModes[0];
          empCashTxnObj.InAmount = this.CurrentSale.TotalAmount - this.CurrentSale.DepositUsed;
          empCashTxnObj.OutAmount = 0;
          empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
          empCashTxnObj.ModuleName = "Pharmacy";
          this.TempEmployeeCashTransaction.push(empCashTxnObj);
        }
      }
      if (this.CurrentSale.InvoiceItems) {
        this.CurrentSale.InvoiceItems.forEach(txnItm => {
          txnItm.BilItemStatus = ENUM_BillingStatus.paid;
          txnItm.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        });
      }
      this.CurrentSale.PHRMEmployeeCashTransactions = this.TempEmployeeCashTransaction;
    }
  }
  CreditOrganizationChanges($event: any) {
    this.CurrentSale.OrganizationId = $event.OrganizationId;
    this.CurrentSale.CreditOrganizationName = $event.OrganizationName;
  }
  public TempEmployeeCashTransaction: Array<PHRMEmployeeCashTransaction> = new Array<PHRMEmployeeCashTransaction>();

  MultiplePaymentCallBack($event: any) {
    if ($event && $event.MultiPaymentDetail.length) {
      this.TempEmployeeCashTransaction = new Array<PHRMEmployeeCashTransaction>();
      if ((this.PHRMEmployeeCashTransaction != null || this.PHRMEmployeeCashTransaction != undefined) && this.PHRMEmployeeCashTransaction.PaymentModeSubCategoryId > 0) {
        this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
        this.TempEmployeeCashTransaction.push(this.PHRMEmployeeCashTransaction);
      } else {
        this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
      }
      var isDepositUsed = this.TempEmployeeCashTransaction.find(a => a.PaymentSubCategoryName.toLocaleLowerCase() === 'deposit');
      if (isDepositUsed) {
        this.DeductDeposit = true;
        this.CalculateDepositBalance();
      }
      else {
        this.DepositRefundAmount = 0;
        this.NewDepositBalance = 0;
        this.DepositDeductAmount = 0;

      }
    }
    this.CurrentSale.PaymentDetails = $event.PaymentDetail;
    this.CurrentSale.PHRMEmployeeCashTransactions = $event.MultiPaymentDetail;
  }

  //Change the Checkbox value and call Calculation logic from here.
  DepositDeductCheckBoxChanged() {
    this.CheckDeductFromDeposit = true;
    this.CalculateDepositBalance();
  }

  CalculateDepositBalance() {
    if (this.DeductDeposit) {
      if (this.patSummary.DepositBalance > 0) {
        this.NewDepositBalance = this.patSummary.DepositBalance - this.CurrentSale.PaidAmount;
        this.NewDepositBalance = CommonFunctions.parseAmount(this.NewDepositBalance, 4);
        if (this.NewDepositBalance >= 0) {
          this.DepositDeductAmount = this.CurrentSale.PaidAmount;
          this.CurrentSale.Tender = this.CurrentSale.PaidAmount;
          this.CurrentSale.Change = 0;
          this.DepositRefundAmount = this.patSummary.DepositBalance - this.CurrentSale.ReceivedAmount;
        }
        else {
          this.CurrentSale.Tender = -(this.NewDepositBalance);//Tender is set to positive value of newDepositBalance.
          this.DepositDeductAmount = this.patSummary.DepositBalance;//all deposit has been returned.
          this.NewDepositBalance = 0;//reset newDepositBalance since it's all Used NOW.
          this.CurrentSale.Change = 0;//Reset Change since we've reset Tender above.
        }
      }
      else {
        this.messageBoxService.showMessage("Failed", ["Deposit balance is zero, Please add deposit to use this feature."]);
        this.DeductDeposit = !this.DeductDeposit;
      }
    }
    else {
      //reset all required properties..
      this.CurrentSale.Tender = this.CurrentSale.ReceivedAmount;
      this.NewDepositBalance = this.patSummary.DepositBalance;
      this.DepositDeductAmount = 0;
      this.CurrentSale.Change = 0;
    }
  }
  CheckReturnDepositCheckbox($event) {
    if ($event && this.IsReturnDepositChecked && this.patSummary.CreditAmount > 0) {
      this.IsPendingSettlements = true;
    }
  }
  handleCancel() {
    this.Loading = false;
  }

  PrintReceipt(): void {
    try {
      //this.currSale.OrganizationId = this.SchemePriceCategory.DefaultCreditOrganizationId;

      this.NewCurrentSaleItems = this.ProvisionalItemsForFinalize.filter(a => a.IsSelected == true);
      if (this.NewCurrentSaleItems.some(a => a.DiscountPercentage < 0 || a.DiscountPercentage > 100)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount % must between [0-100%]']);
        return;
      }
      if (this.NewCurrentSaleItems.some(a => a.TotalDisAmt < 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount Amount% should not be negative.']);
        return;
      }

      if (this.CurrentSale.PaymentMode !== ENUM_BillPaymentMode.credit) {
        this.CurrentSale.PaymentMode = ENUM_BillPaymentMode.cash
      }
      else {
        this.CurrentSale.PaymentMode = ENUM_BillPaymentMode.credit;
      }

      if (this.CurrentSale.PaymentMode === ENUM_BillPaymentMode.credit && this.CurrentSale.OrganizationId == null) {
        return this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Credit Organization is mandatory.']);
      }

      this.CurrentSale.PatientId = this.ProvisionalItemsForFinalize[0].PatientId;
      this.CurrentSale.CounterId = this.CurrentCounter;
      this.CurrentSale.InvoiceItems = this.ProvisionalItemsForFinalize;
      this.CurrentSale.PrescriberId = this.ProvisionalItemsForFinalize[0].PrescriberId;
      this.CurrentSale.VisitType = this.ProvisionalItemsForFinalize[0].VisitType;
      this.CurrentSale.DepositDeductAmount = this.DepositDeductAmount;
      this.CurrentSale.DepositBalance = this.NewDepositBalance;
      this.CurrentSale.DepositAmount = this.DepositDeductAmount;
      this.CurrentSale.StoreId = this.CurrentActiveDispensary.StoreId;
      this.CurrentSale.SchemeId = this.SchemePriceCategory.SchemeId;
      this.CurrentSale.IsCoPayment = this.SchemePriceCategory.IsCoPayment;
      this.CurrentSale.ClaimCode = this.ProvisionalItemsForFinalize[0].ClaimCode;
      this.CurrentSale.PaymentMode = this.CurrentSale.IsCoPayment ? this.CurrentSale.CoPaymentMode : this.CurrentSale.PaymentMode;
      if (this.IsReturnDepositChecked) {
        if (this.CurrentSale.PaymentMode.toLowerCase() === "cash" && this.DepositRefundAmount == 0) {
          this.DepositRefundAmount = this.patSummary.DepositBalance;
        }
        if (this.DepositRefundAmount > 0) {
          this.CurrentSale.DepositReturnAmount = this.DepositRefundAmount;
        }
      }
      this.Loading = true;
      this.CurrentSale.InvoiceItems = this.NewCurrentSaleItems;

      this.HandlePaymentTransaction();

    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  /**This method is responsible to check whether FewaPay is applicable or not if not proceed with normal workflow else wait for the message sent by FewaPay Browser extension and decide after message is received*/
  private HandlePaymentTransaction() {
    if (this._fewaPayService.IsFewaPayApplicable(this.CurrentSale.PaymentDetails)) {
      this.loadingScreen = true;
      const transactionReqString = this._fewaPayService.CreateFewaPayTransactionRequest(this.CurrentSale.PaymentDetails, this.CurrentSale.TotalAmount, this.CurrentSale.Remark);

      if (transactionReqString) {
        window.postMessage({
          type: ENUM_FewaPayMessageTypes.PaymentInfoRequest,
          data: transactionReqString,
        }, "*");
        console.log('Transaction Request is posted from Danphe.');
      } else {
        this.loadingScreen = false;
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Transaction Request cannot be created due to missing mandatory data like paymentDetails, totalAmount and remarks`]);
      }

    } else {
      this.ClearProvisionalItems();
    }
  }


  private ClearProvisionalItems() {
    this.pharmacyBLService.AddInvoiceForCreditItems(this.CurrentSale).finally(() => this.Loading = false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.InvoiceId = res.Results;
          this.ShowSaleInvoice = true;
          this.ClearPaymentDetail = true;
          this.CurrentSale = new PHRMInvoiceModel();
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save invoice. <br>' + res.ErrorMessage]);
        }
      },
        err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save invoice. <br>' + err.message]);
        });
  }

  OnInvoicePopUpClose() {
    this.ShowSaleInvoice = false;
    this.provisionalService.emitButtonClick();
  }

  Close() {
    this.CurrentSale = new PHRMInvoiceModel();
    this.ProvisionalItemsForFinalize = new Array<PHRMInvoiceItemsModel>();
    this.provisionalService.emitButtonClick();
  }

  Back() {
    this.provisionalService.emitButtonClick();
  }

  public hotkeys(event) {
    if (event.keyCode === 27) {  //For ESC key => close the pop up
      this.OnInvoicePopUpClose();
    }
  }

  LoadPatientInvoiceSummary(patientId: number, SchemeId?: number, PatientVisitId?: number) {
    if (patientId > 0) {
      this.pharmacyBLService.GetPatientSummary(patientId, SchemeId, PatientVisitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.patSummary = res.Results;
            this.patSummary.CreditAmount = CommonFunctions.parseAmount(this.patSummary.CreditAmount);
            this.patSummary.ProvisionalAmt = CommonFunctions.parseAmount(this.patSummary.ProvisionalAmt);
            this.patSummary.BalanceAmount = CommonFunctions.parseAmount(this.patSummary.BalanceAmount);
            this.patSummary.DepositBalance = CommonFunctions.parseAmount(this.patSummary.DepositBalance);
            this.patSummary.TotalDue = CommonFunctions.parseAmount(this.patSummary.TotalDue);
            this.patSummary.IpCreditLimit = CommonFunctions.parseAmount(this.patSummary.IpCreditLimit);
            this.patSummary.OpCreditLimit = CommonFunctions.parseAmount(this.patSummary.OpCreditLimit);
            this.patSummary.IsLoaded = true;
            this.CheckIfOtherProvisionalAreAvailable();
          }
          else {
            this.messageBoxService.showMessage("Select Patient", [res.ErrorMessage]);
          }
        });
    }
  }

  CheckIfOtherProvisionalAreAvailable() {
    this.IsOtherProvisionalRemaining = false;
    const provisionalBills = this.PatientVisitWiseProvisionalBillsInfo.filter(b => b.PatientCode === this._dispensaryService.PatientCode);
    if (provisionalBills && provisionalBills.length > 1) {
      this.IsOtherProvisionalRemaining = true;
    }
    else {
      this.IsOtherProvisionalRemaining = false;

    }
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    const result = this._fewaPayService.HandleEventsFromFewaPayBrowserExtension(event);
    if (result) {
      if (result.resultCode === ENUM_POS_ResponseStatus.Success) { //! Krishna, 10thDec'23 "000" is success status code sent from POS device.
        // console.log(result);
        const transactionId = 'verifyTransId' in result && result.verifyTransId;
        if (transactionId) {
          this.CurrentSale.PaymentDetails = `${this.CurrentSale.PaymentDetails}; TransactionId: ${transactionId}`;
        }
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.CurrentSale.PatientId, ENUM_FewaPayTransactionFrom.DispensaryProvisionalClearance);
        this.ClearProvisionalItems();
      } else {
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.CurrentSale.PatientId, ENUM_FewaPayTransactionFrom.DispensaryProvisionalClearance);
        this.loadingScreen = false;
        this.Loading = false;
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`${result.message}`]);
      }
      return;
    }
  }
  OnQuickFilterChanged($event) {
    if ($event && $event.target.value) {
      let filterValue = $event.target.value.trim().toLowerCase();

      this.ProvisionalItemsForFinalize.filter(item => {
        if (item.ItemName.trim().toLowerCase().startsWith(filterValue)) {
          item.HideRow = false;
        }
        else {
          item.HideRow = true;
        }
      });
    }
    else {
      this.ProvisionalItemsForFinalize.forEach(item => {
        item.HideRow = false;
      });
    }
  }


}
