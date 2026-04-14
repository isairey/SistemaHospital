import { Component, OnInit } from '@angular/core';
import { PharmacySchemePriceCategory_DTO } from '../../../../../pharmacy/shared/dtos/pharmacy-scheme-pricecategory.dto';
import { PharmacyBLService } from '../../../../../pharmacy/shared/pharmacy.bl.service';
import { PHRMInvoiceItemsModel } from '../../../../../pharmacy/shared/phrm-invoice-items.model';
import { PHRMInvoiceModel } from '../../../../../pharmacy/shared/phrm-invoice.model';
import { PHRMStoreModel } from '../../../../../pharmacy/shared/phrm-store.model';
import { DanpheHTTPResponse } from '../../../../../shared/common-models';
import { CommonFunctions } from '../../../../../shared/common.functions';
import { MessageboxService } from '../../../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../../../shared/routefrom.service';
import { ENUM_BillPaymentMode, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../../shared/shared-enums';
import { DispensaryService } from '../../../../shared/dispensary.service';
import { InsurancePackageBillServiceItem_DTO } from '../../../../shared/DTOs/insurance-package-bill-service-item.dto';
import { InvoiceItemSalePriceUpdate_DTO } from '../dtos/invoice-item-saleprice-update.dto';
import { ProvisionalBillSharedService } from '../provisional-bills-shared.service';

@Component({
  selector: 'app-provisional-bills-update',
  templateUrl: './provisional-bills-update.component.html',
  styleUrls: ['./provisional-bills-update.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ProvisionalBillsUpdateComponent implements OnInit {
  PatientSummary = { IsLoaded: false, PatientId: 0, CreditAmount: 0, ProvisionalAmt: 0, TotalDue: 0, DepositBalance: 0, BalanceAmount: 0, GeneralCreditLimit: 0, IpCreditLimit: 0, OpCreditLimit: 0, OpBalance: 0, IpBalance: 0 };
  SelectAllItems: boolean = false;
  CurrentSale: PHRMInvoiceModel = new PHRMInvoiceModel();
  CurrentSaleItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  CurrentSaleItemsReturnOnly: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  SchemePriceCategory: PharmacySchemePriceCategory_DTO = new PharmacySchemePriceCategory_DTO();
  AllCreditItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  IsOtherProvisionalRemaining: boolean = false;
  ConfirmationTitle: string = "Confirm !";
  ConfirmationMessage: string = "Are you sure you want to Print Invoice ?";
  ConfirmationMessageForProvisionalInvoiceUpdate: string = "Are you sure you want to update provisional invoice ?";
  ConfirmationMessageForProvisionalSalePriceUpdate: string = "Are you sure you want to update Sale Price ?";
  Loading: boolean = false;
  ReturnReceiptNo: number = 0;
  FiscalYearId: number = 0;
  ShowProvisionalReturnReceipt: boolean = false;
  ShowProvisionalDetails: boolean = false;
  NewCurrentSaleItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  CurrentActiveDispensary: PHRMStoreModel;
  UpdateType: string = 'Quantity';
  InsurancePackageBillServiceItems: InsurancePackageBillServiceItem_DTO[] = [];
  ShowGoToFinalizeMessage: boolean = false;
  ReturnItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  constructor(public routeFromService: RouteFromService,
    public messageBoxService: MessageboxService,
    public pharmacyBLService: PharmacyBLService,
    private _dispensaryService: DispensaryService,
    private sharedService: ProvisionalBillSharedService
  ) {
    this.CurrentActiveDispensary = this._dispensaryService.activeDispensary;
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
    this.Loading = true;
    this.pharmacyBLService.GetPatientCreditItems(patientId, this.CurrentActiveDispensary.StoreId, PatientVisitId)
      .finally(() => this.Loading = false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.AllCreditItems = res.Results.PatientCreditItems;
          this.SchemePriceCategory = res.Results.SchemePriceCategory;
          this.CurrentSale.CoPaymentMode = this.SchemePriceCategory.DefaultPaymentMode;
          this.CurrentSale.PatientVisitId = PatientVisitId;
          this.CurrentSaleItems = this.AllCreditItems.filter(c => c.SalePrice > 0);

          this.ReturnItems = JSON.parse(JSON.stringify(this.CurrentSaleItems));

          if (!this.CurrentSaleItems.length) {
            this.ShowGoToFinalizeMessage = true;
          }
          else {
            this.ShowGoToFinalizeMessage = false;
          }

          this.CurrentSaleItems.forEach(item => {
            item.DiscountPer = item.DiscountPercentage;
            item.DispatchQty = item.Quantity;
            item.IsSelected = false;
            item.ReturnQty = 0;
            item.SubTotal = 0;
            item.DiscountPercentage = item.DiscountPer;
            item.TotalDisAmt = 0;
            item.VATAmount = 0;
            item.TotalAmount = 0;
            item.TempSalePrice = item.SalePrice;
          });
          this.AllCalculation();
        }
      });
  }

  SelectAllChkOnChange(event) {

    const checked = event.target.checked;
    this.CurrentSaleItems.forEach(item => item.IsSelected = checked);
    if (this.UpdateType === 'Quantity') {
      if (checked == true) {
        this.CurrentSaleItems.forEach((item, index) => { item.ReturnQty = item.Quantity }
        );
      }
      else {
        this.CurrentSaleItems.forEach(item => { item.ReturnQty = 0 })
      }
      this.CurrentSaleItems.forEach(item => {
        item.Quantity = item.DispatchQty - item.ReturnQty;
        let subtotal = (item.ReturnQty) * item.SalePrice;
        item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
        item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
        item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);
      });
      this.AllCalculation();
    }
    else {
      if (checked) {
        this.CurrentSaleItems.forEach(item => {
          item.SalePrice = 0;
        });
      }
      else {
        this.CurrentSaleItems.forEach(item => {
          item.SalePrice = item.TempSalePrice;
        });
      }
    }
  }

  AllCalculation(discPer?, discAmt?) {
    try {
      if (this.CurrentSaleItems.length > 0) {
        this.CurrentSale.SubTotal = 0;
        this.CurrentSale.TotalAmount = 0;
        this.CurrentSale.VATAmount = 0;
        this.CurrentSale.DiscountAmount = 0;
        this.CurrentSale.CoPaymentCashAmount = 0;
        this.CurrentSale.CoPaymentCreditAmount = 0;
        this.CurrentSale.DiscountAmount = 0;
        this.CurrentSale.DiscountPer = 0;
        this.CurrentSale.TaxableAmount = 0;



        for (let i = 0; i < this.CurrentSaleItems.length; i++) {
          if (this.CurrentSaleItems[i].IsSelected) {
            this.CurrentSale.SubTotal = CommonFunctions.parseAmount(this.CurrentSale.SubTotal + this.CurrentSaleItems[i].SubTotal, 4);
            this.CurrentSale.DiscountAmount = CommonFunctions.parseAmount(this.CurrentSale.DiscountAmount + this.CurrentSaleItems[i].TotalDisAmt, 4);
            this.CurrentSale.DiscountPer = CommonFunctions.parseAmount((this.CurrentSale.DiscountAmount / this.CurrentSale.SubTotal) * 100, 4);
            this.CurrentSale.TaxableAmount = CommonFunctions.parseAmount(this.CurrentSale.SubTotal - this.CurrentSale.DiscountAmount, 4);
            this.CurrentSale.VATAmount = CommonFunctions.parseAmount(this.CurrentSale.VATAmount + this.CurrentSaleItems[i].VATAmount, 4);
            this.CurrentSale.VATPercentage = CommonFunctions.parseAmount(this.CurrentSale.VATAmount / this.CurrentSale.TaxableAmount * 100, 4);
            this.CurrentSale.TotalAmount = CommonFunctions.parseAmount(this.CurrentSale.TotalAmount + this.CurrentSaleItems[i].TotalAmount, 4);
            if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
              this.CurrentSale.CoPaymentCashAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCashAmount + this.CurrentSaleItems[i].CoPaymentCashAmount, 4);
              this.CurrentSale.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.CurrentSale.CoPaymentCreditAmount + this.CurrentSaleItems[i].CoPaymentCreditAmount, 4);
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
          this.CurrentSaleItems.forEach(a => {
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
            this.CurrentSale.PaidAmount = CommonFunctions.parseAmount(this.CurrentSale.ReceivedAmount, 4);
          }
        }

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
      this.routeFromService.RouteFrom = null;
      this.messageBoxService.showMessage("error", ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  ItemRowValueChanged(index) {
    try {
      let item = this.CurrentSaleItems[index];

      if (item.ReturnQty > 0) {
        item.IsSelected = true;
      }
      else {
        item.IsSelected = false;
        item.ReturnQty = 0;
      }
      let subtotal = item.ReturnQty * item.SalePrice;
      item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);



      if (this.CurrentSaleItems[index].DiscountPercentage > 0 && this.CurrentSaleItems[index].TotalDisAmt == 0) {
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
      }
      if (this.CurrentSaleItems[index].DiscountPercentage == 0 && this.CurrentSaleItems[index].TotalDisAmt > 0) {
        item.DiscountPercentage = CommonFunctions.parseAmount((item.TotalDisAmt / item.SubTotal) * 100, 4);
      }

      if (this.CurrentSaleItems[index].DiscountPercentage == 0 && this.CurrentSaleItems[index].TotalDisAmt == 0) {
        item.TotalDisAmt = 0;
        item.DiscountPercentage = 0;
      }
      if (this.CurrentSaleItems[index].DiscountPercentage > 0 && this.CurrentSaleItems[index].TotalDisAmt > 0) {
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
    if (this.AllCreditItems.length <= indx) {
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
    this.CurrentSaleItems[index].DiscountPercentage = discountPercent;
    this.CurrentSaleItems[index].TotalDisAmt = discountAmount;
  }
  OnQuantityChange(index) {
    this.CurrentSaleItems[index].TotalDisAmt = 0;
    if (this.CurrentSaleItems[index].ReturnQty > 0) {
      this.CurrentSaleItems[index].IsSelected = true;
    }
    else {
      this.CurrentSaleItems[index].IsSelected = false;
    }
    this.ItemRowValueChanged(index);
  }

  setFocusById(id: string, waitingTimeInms = 0) {
    var Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        nextEl.select();
        clearTimeout(Timer);
      }
    }, waitingTimeInms);
  }

  SelectItemCheckOnChange(index) {
    this.SelectAllItems = this.CurrentSaleItems.every(item => item.IsSelected == true);
    if (this.UpdateType === 'Quantity') {
      if (this.CurrentSaleItems[index].IsSelected == true) {
        this.CurrentSaleItems[index].ReturnQty = this.CurrentSaleItems[index].Quantity;
      }
      else {
        this.CurrentSaleItems[index].ReturnQty = 0;
      }
      this.ItemRowValueChanged(index);
    }
    else {
      if (this.CurrentSaleItems[index].IsSelected == true) {
        this.CurrentSaleItems[index].SalePrice = 0;
      }
      else {
        this.CurrentSaleItems[index].SalePrice = this.CurrentSaleItems[index].TempSalePrice;
      }
    }

  }

  OnMainDiscountPercentChange() {
    this.CurrentSaleItems.forEach(itm => {
      itm.DiscountPercentage = this.CurrentSale.DiscountPer;
      itm.TotalDisAmt = CommonFunctions.parseAmount((itm.SubTotal * itm.DiscountPercentage) / 100, 4);
      itm.TotalAmount = itm.SubTotal - itm.TotalDisAmt + itm.VATAmount;
    })
    this.AllCalculation(this.CurrentSale.DiscountPer, 0)
  }
  OnMainDiscountAmountChange() {
    if (this.CurrentSale.DiscountAmount > 0) {
      this.CurrentSale.DiscountPer = CommonFunctions.parseAmount((this.CurrentSale.DiscountAmount / this.CurrentSale.SubTotal) * 100, 4);
      this.CurrentSaleItems.forEach(itm => {
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

  handleCancel() {
    this.Loading = false;
  }

  Cancel() {
    if (confirm("All the Items will be Cancelled and Cannot be Revert Back !!! Are You Sure to Cancel these Provisional items?")) {
      try {
        this.ReturnItems.forEach(item => {
          item.DispatchQty = item.Quantity;
        });
        this.Loading = true;
        this.pharmacyBLService.CancelCreditBill(this.ReturnItems)
          .finally(() => this.Loading = false)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results != null) {
              this.ReturnReceiptNo = res.Results.ReturnReceiptNo;
              this.FiscalYearId = res.Results.FiscalYearId;
              this.ShowProvisionalReturnReceipt = true;
              this.ShowProvisionalDetails = false;
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Provisional Cancelled Successfully.']);
            }
            else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to cancel provisional. <br>' + res.ErrorMessage]);
            }
          },
            err => {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to cancel provisional.<br>' + err]);
            });
      }
      catch (exception) {
        this.ShowCatchErrMessage(exception);
      }
    }
  }
  Update(): void {
    try {
      let check: boolean = true;
      if (check) {
        this.NewCurrentSaleItems = this.CurrentSaleItems.filter(a => a.ReturnQty > 0);
        if (this.NewCurrentSaleItems.some(a => a.ReturnQty < 0)) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Quantity should not be negative.']);
          return;
        }
        if (this.NewCurrentSaleItems.some(a => a.DispatchQty < a.ReturnQty)) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['ReturnQty should be less than or equals to DispatchQty.']);
          return;
        }
        if (this.NewCurrentSaleItems.some(a => a.DiscountPercentage < 0 || a.DiscountPercentage > 100)) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount % must between [0-100%]']);
          return;
        }
        if (this.NewCurrentSaleItems.some(a => a.TotalDisAmt < 0)) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount Amount% should not be negative.']);
          return;
        }

        let isInvalid: boolean = this.CurrentSaleItems.some(item => !Number.isInteger(item.ReturnQty))
        if (isInvalid) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Please verify ReturnQty should not be in decimal.']);
          return;
        }

        this.NewCurrentSaleItems.forEach(a => a.StoreId == this.CurrentActiveDispensary.StoreId);
        if (this.NewCurrentSaleItems.length <= 0 || this.NewCurrentSaleItems == undefined) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Return Quantity should be greater than ZERO.']);
          return;
        }
        this.Loading = true;
        this.pharmacyBLService.updateInvoiceForCreditItems(this.NewCurrentSaleItems).finally(() => {
          this.Loading = false;
        }).subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.ReturnReceiptNo = res.Results.ReturnReceiptNo;
              this.FiscalYearId = res.Results.FiscalYearId;
              this.ShowProvisionalDetails = false;
              this.ShowProvisionalReturnReceipt = true;
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Provisional Returned Successfully.']);
            }
            else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to show receipt.' + res.ErrorMessage]);
            }

          }
          else if (res.Status === ENUM_MessageBox_Status.Failed) {
            this.messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, ['Failed to update provisional bill. <br>' + res.ErrorMessage]);
          }
        },
          err => {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
          });

      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
      this.Loading = false;
    }
  }

  BillServiceItemFormatter(data: any): string {
    let html = `${data["ItemName"]}`;
    return html;
  }
  AssignSelectedServiceItem(index: number, row: any) {
    if (typeof (row.BillServiceItem) === 'object') {
      this.CurrentSaleItems[index].BillServiceItemId = row.BillServiceItem.ServiceItemId;
    }
    else {
      this.CurrentSaleItems[index].BillServiceItemId = null;
    }
  }
  /**
   * This method update the sale price of invoice items.
   */
  UpdateSalePrice() {
    const currentSaleItem = this.CurrentSaleItems.filter(a => a.IsSelected);
    if (!currentSaleItem.length) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select item(s) to update sale price.']);
      return;
    }
    const tempSalesItemToUpdateSalePrice = currentSaleItem.filter(a => a.IsPharmacySalePriceEditable && a.SalePrice != a.PreviousSalePrice);
    if (!tempSalesItemToUpdateSalePrice.length) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['The sale price for the item(s) has not been modified to be update.']);
      return;
    }
    if (tempSalesItemToUpdateSalePrice.some(item => !item.BillServiceItemId)) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Package is required to update the sale price.']);
      return;
    }
    const InvoiceItemsSalePriceList: InvoiceItemSalePriceUpdate_DTO[] = tempSalesItemToUpdateSalePrice.map(a => {
      return {
        InvoiceItemId: a.InvoiceItemId,
        SalePrice: a.SalePrice,
        BillServiceItemId: a.BillServiceItemId
      };
    });

    this.pharmacyBLService.UpdateInvoiceItemsSalePrice(InvoiceItemsSalePriceList).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Sale price updated successfully.']);
        this.sharedService.emitButtonClick();
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to update sale price. <br>' + res.ErrorMessage]);
      }
    },
      err => {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to update sale price. <br>' + err.message]);
      });
  }

  OnPopUpClose() {
    this.ShowProvisionalReturnReceipt = false;
    this.sharedService.emitButtonClick();
  }

  Back() {
    this.sharedService.emitButtonClick();
  }

  public hotkeys(event) {
    if (event.keyCode === 27) {
      this.OnPopUpClose();
      this.ShowProvisionalDetails = false;

    }
  }

  OnQuickFilterChanged($event) {
    if ($event && $event.target.value) {
      let filterValue = $event.target.value.trim().toLowerCase();

      this.CurrentSaleItems.filter(item => {
        if (item.ItemName.trim().toLowerCase().startsWith(filterValue)) {
          item.HideRow = false;
        }
        else {
          item.HideRow = true;
        }
      });
    }
    else {
      this.CurrentSaleItems.forEach(item => {
        item.HideRow = false;
      });
    }
  }

}

