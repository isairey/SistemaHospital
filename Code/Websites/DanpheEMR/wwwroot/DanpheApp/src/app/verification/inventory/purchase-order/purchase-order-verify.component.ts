import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { VerificationService } from "../../shared/verification.service";
import { Router } from "@angular/router";
import { RouteFromService } from "../../../shared/routefrom.service";
import { CoreService } from "../../../core/shared/core.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { VerificationBLService } from "../../shared/verification.bl.service";
import { SecurityService } from "../../../security/shared/security.service";
import { VerificationActor } from '../requisition-details/inventory-requisition-details.component';
import { PurchaseOrder } from '../../../inventory/shared/purchase-order.model';
import { PurchaseOrderItems } from '../../../inventory/shared/purchase-order-items.model';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { DanpheHTTPResponse } from '../../../shared/common-models';

import { GeneralFieldLabels } from '../../../shared/DTOs/general-field-label.dto';
@Component({
  templateUrl: './purchase-order-verify.html'
})
export class PurchaseOrderVerifyComponent implements OnInit, OnDestroy {

  public PurchaseOrder: PurchaseOrder;
  public PurchaseOrderVM: InventoryPurchaseOrderVM;
  public VerificationRemarks: string = "";
  public isVerificationAllowed: boolean = false;
  public loading: boolean = false;
  public headerDetail: { header1, header2, header3, header4, hospitalName; address; email; PANno; tel; DDA };
  public nextVerifiersPermission: string = "";
  public CopyOfOrderedItemsQuantity: Array<{ OrderedItemId; Quantity; StandardRate }> = [];
  public CopyOfOrderedItemsStandardRate: Array<{ OrderedItemId; StandardRate; }> = [];
  public CopyOfOrderedItemsPOItemSpecification: Array<{ OrderedItemId; POItemSpecification; }> = [];
  showQuotationRatesPopUp: boolean = false;
    PoUplodadedViewFiles: boolean = false;
    public GeneralFieldLabel = new GeneralFieldLabels();
  constructor(
    public verificationService: VerificationService,
    public verificationBLService: VerificationBLService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public messageBoxService: MessageboxService,
    public router: Router,
    public routeFromService: RouteFromService,
    public changeDetector: ChangeDetectorRef
  ) { this.GetInventoryBillingHeaderParameter(); 
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();}

  ngOnDestroy(): void {
    this.verificationService.PurchaseOrder = new PurchaseOrder();
    this.routeFromService.RouteFrom = "";
  }

  ngOnInit() {
    this.PurchaseOrder = this.verificationService.PurchaseOrder;
    this.CheckForVerificationApplicable(); //even if this is false, we must show the details, but features like edit,cancel will not be available.
    this.GetInventoryPurchaseOrderDetails();
  }
  private GetInventoryPurchaseOrderDetails() {
    this.verificationBLService
      .GetInventoryPurchaseOrderDetails(this.PurchaseOrder.PurchaseOrderId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.PurchaseOrderVM = res.Results;
          this.CopyOrderedItemsQuantity();
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Something went wrong.", "Loading PO Failed."]);
          console.log(res.ErrorMessage)
        }
      },
        err => {
          console.log(err)
        });
  }

  private CopyOrderedItemsQuantity() {
    this.PurchaseOrderVM.OrderedItemList.forEach(item => {
      let CopyItem = { OrderedItemId: item.PurchaseOrderItemId, Quantity: item.Quantity, StandardRate: item.StandardRate };
      this.CopyOfOrderedItemsQuantity.push(CopyItem);
    });
  }
  private CheckForVerificationApplicable() {
    if (this.PurchaseOrder.IsVerificationAllowed == true && this.PurchaseOrder.POStatus == "pending") {
      this.isVerificationAllowed = true;
    }
    else if (this.PurchaseOrder.IsVerificationAllowed == false && this.PurchaseOrder.POStatus == "pending") {
      this.isVerificationAllowed = false;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["You have verified this Order already."])
    }
    else {
      this.isVerificationAllowed = false;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Verifying this Order is not allowed."]);
    }
  }
  EditItem(index) {
    if (this.isVerificationAllowed == true) {
      if (this.PurchaseOrderVM.OrderedItemList[index].IsEdited == true) {
        this.PurchaseOrderVM.OrderedItemList[index].IsEdited = false;
        this.PurchaseOrderVM.OrderedItemList[index].Quantity = this.CopyOfOrderedItemsQuantity[index].Quantity;
        this.PurchaseOrderVM.OrderedItemList[index].StandardRate = this.CopyOfOrderedItemsQuantity[index].StandardRate;
        this.CalculationForPO();
      } else {
        this.PurchaseOrderVM.OrderedItemList[index].IsEdited = true;
        var timer = setTimeout(() => {
          this.changeDetector.detectChanges();
          var element = document.getElementById("rqRowEditQty" + index);
          if (element != null) {
            element.click();
            clearInterval(timer);
          }
        }, 500);
      }
    } else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Editing this PO is forbidden."])
    }
  }
  CancelItem(index) {
    if (this.isVerificationAllowed == true) {
      if (this.PurchaseOrderVM.OrderedItemList[index].IsActive == true) {
        if (this.CheckForCancelItemsCondition()) {
          this.PurchaseOrderVM.OrderedItemList[index].POItemStatus = "cancelled";
          this.PurchaseOrderVM.OrderedItemList[index].IsActive = false;
          this.PurchaseOrderVM.OrderedItemList[index].IsEdited = false;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["You can not cancel the last item. Use Reject All instead."])
        }
      }
      else if (this.PurchaseOrderVM.OrderedItemList[index].CancelledBy != null) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["You can not undo this item cancellation."])
      }
      else {
        this.PurchaseOrderVM.OrderedItemList[index].POItemStatus = "active";
        this.PurchaseOrderVM.OrderedItemList[index].IsActive = true;
      }
      this.CalculationForPO();
    } else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cancelling this item is forbidden."])
    }
  }
  CheckForCancelItemsCondition(): boolean {
    var lengthOfActiveItems = this.PurchaseOrderVM.OrderedItemList.filter(RI => RI.IsActive == true).length;
    if (lengthOfActiveItems > 1) {
      return true;
    }
    else {
      return false;
    }
  }
  GetInventoryBillingHeaderParameter() {
    let paramValue = this.coreService.Parameters.find(a => a.ParameterName == "Inventory Receipt Header").ParameterValue;
    if (paramValue) {
      this.headerDetail = JSON.parse(paramValue);
    }
    else {
      console.log('Inventory Receipt Header parameter not found');
    }
  }

  RouteBack() {
    this.router.navigate([this.routeFromService.RouteFrom]);
  }
  ApprovePurchaseOrder() {
    if (this.CheckForItemValidity()) {
      this.loading = true;
      this.PurchaseOrder.PurchaseOrderItems = this.PurchaseOrderVM.OrderedItemList;
      this.verificationBLService.ApprovePurchaseOrder(this.PurchaseOrder, this.VerificationRemarks)
        .finally(() => this.loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Purchase Order " + this.PurchaseOrder.PurchaseOrderId + " is approved successfully."])
            this.RouteBack();
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Something went wrong..."]);
            console.log(res.ErrorMessage);
          }
        }, err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong..."]);
          console.log(err);
        });
    }
  }
  private CheckForItemValidity(): boolean {
    if (this.PurchaseOrderVM.OrderedItemList.some(RI => RI.Quantity < 1)) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["One of the quantity is edited less that 1.", "Use item cancel button instead."]);
      return false;
    }
    if (this.PurchaseOrderVM.OrderedItemList.some(RI => RI.StandardRate == null || RI.StandardRate <= 0)) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["One of the item has to provide standard rate"]);
      return false;
    }
    if (this.VerificationRemarks.trim() === '') {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Remarks is mandatory."]);
      return false;
    }
    return true;
  }

  RejectPurchaseOrder() {
    if (!this.VerificationRemarks || this.VerificationRemarks.trim() == '') {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Remarks is Compulsory for Cancellation"]);
    } else {
      this.loading = true;
      this.verificationBLService.RejectPurchaseOrder(this.PurchaseOrder.PurchaseOrderId, this.PurchaseOrder.CurrentVerificationLevel, this.PurchaseOrder.CurrentVerificationLevelCount + 1, this.PurchaseOrder.MaxVerificationLevel, this.VerificationRemarks.trim())
        .finally(() => this.loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Purchase Order " + this.PurchaseOrder.PurchaseOrderId + " is rejeceted successfully."])
            this.RouteBack();
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Something went wrong..."]);
            console.log(res.ErrorMessage);
          }
        }, err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong..."]);
          console.log(err);
        });
    }
  }

  ShowQuotationRates() {
    this.showQuotationRatesPopUp = true;
  }
  OnQuotationRatesClose() {
    this.showQuotationRatesPopUp = false;
  }


  PoUplodadedviewFiles() {
    this.PoUplodadedViewFiles = true;

  }
  OnUplodadedviewFiles() {
    this.PoUplodadedViewFiles = false;

  }
  //this calculation is for the whole PO
  CalculationForPO() {
    this.PurchaseOrder.SubTotal = 0;
    this.PurchaseOrder.VAT = 0;
    this.PurchaseOrder.TotalAmount = 0;

    for (let i = 0; i < this.PurchaseOrderVM.OrderedItemList.length; i++) {
      try {
        if (this.PurchaseOrderVM.OrderedItemList[i].POItemStatus !== 'cancelled') {
          this.PurchaseOrder.SubTotal += (this.PurchaseOrderVM.OrderedItemList[i].StandardRate * this.PurchaseOrderVM.OrderedItemList[i].Quantity);
          this.PurchaseOrderVM.OrderedItemList[i].VATAmount = this.PurchaseOrderVM.OrderedItemList[i].StandardRate * this.PurchaseOrderVM.OrderedItemList[i].Quantity * this.PurchaseOrderVM.OrderedItemList[i].VatPercentage / 100;
          this.PurchaseOrder.VAT += this.PurchaseOrderVM.OrderedItemList[i].VATAmount;
          this.PurchaseOrderVM.OrderedItemList[i].TotalAmount = (this.PurchaseOrderVM.OrderedItemList[i].StandardRate * this.PurchaseOrderVM.OrderedItemList[i].Quantity) + this.PurchaseOrderVM.OrderedItemList[i].VATAmount;
          this.PurchaseOrder.TotalAmount += this.PurchaseOrderVM.OrderedItemList[i].TotalAmount;
        }
      }
      catch (ex) {
        console.log("Some value is missing.");
      }
    }
  }
  Print() {
    let popUpWindow;
    var printContents = document.getElementById("printpage").innerHTML;
    popUpWindow = window.open(
      "",
      "_blank",
      "width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no"
    );
    popUpWindow.document.open();
    popUpWindow.document.write(
      `<html>
      <head>
        <style>
          .img-responsive{ position: static;left: -65px;top: 10px;}
          .qr-code{position: absolute; left: 1001px;top: 9px;}
        </style>
        <link rel="stylesheet" type="text/css" href="../../themes/theme-default/ReceiptList.css" />
      </head>
      <style>
        .printStyle {border: dotted 1px;margin: 10px 100px;}
        .print-border-top {border-top: dotted 1px;}
        .print-border-bottom {border-bottom: dotted 1px;}
        .print-border {border: dotted 1px;}.center-style {text-align: center;}
        .border-up-down {border-top: dotted 1px;border-bottom: dotted 1px;}
        .hidden-in-print { display:none !important}
        table th, table td {
            border: 1px solid #ccc;
        }
        .print-header .row {
            display: flex;
        }
        .print-header .col-md-3 {
            width: 25% 
        }
        .print-header .col-md-6 {
            width: 50%
        }
        .print-header .logo {
            padding: 20px 0 !important;
        }
      </style>
      <body onload="window.print()">` +
      printContents +
      "</html>"
    );
    popUpWindow.document.close();
  }
}
export class InventoryPurchaseOrderVM {
  public OrderedItemList: Array<PurchaseOrderItems>;
  public OrderingUser: VerificationActor;
  public Verifiers: Array<VerificationActor>;
}
