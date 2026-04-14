import { ChangeDetectorRef, Component, EventEmitter, Output, ViewChild, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import * as _ from 'lodash';
import * as moment from "moment/moment";
import { CoreService } from '../../../core/shared/core.service';
import { DispensaryService } from "../../../dispensary/shared/dispensary.service";
import { PHRMPackingTypeModel } from '../../../pharmacy/shared/phrm-packing-type.model';
import { SecurityService } from "../../../security/shared/security.service";
import { CallbackService } from '../../../shared/callback.service';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_BillPaymentMode, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyItem_DTO } from "../../shared/dtos/pharmacy-item.dto";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PharmacyService } from "../../shared/pharmacy.service";
import { PHRMCompanyModel } from "../../shared/phrm-company.model";
import { PHRMGenericModel } from "../../shared/phrm-generic.model";
import { PHRMGoodsReceiptItemsModel } from "../../shared/phrm-goods-receipt-items.model";
import { PHRMGoodsReceiptViewModel } from "../../shared/phrm-goods-receipt-vm.model";
import { PHRMGoodsReceiptModel } from "../../shared/phrm-goods-receipt.model";
import { PHRMPurchaseOrderItems } from "../../shared/phrm-purchase-order-items.model";
import { PHRMStoreModel } from '../../shared/phrm-store.model';
import { PHRMSupplierModel } from "../../shared/phrm-supplier.model";
import { PHRMGoodsReceiptItemComponent } from "../phrm-gr-item/phrm-gr-item.component";

@Component({
  selector: "phrm-goods-receipt",
  templateUrl: "./phrm-goods-receipt.html",
  styleUrls: ["./phrm-goods-receipt.css"],
  encapsulation: ViewEncapsulation.None,
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PHRMGoodsReceiptComponent {
  @ViewChild('grItemPop')
  phrmGoodReceiptItemComponent: PHRMGoodsReceiptItemComponent;
  goodsReceiptVM: PHRMGoodsReceiptViewModel = new PHRMGoodsReceiptViewModel();
  tempGoodsReceiptVM: PHRMGoodsReceiptViewModel = new PHRMGoodsReceiptViewModel();
  goodReceiptItems: PHRMGoodsReceiptItemsModel = new PHRMGoodsReceiptItemsModel();
  grItemList: Array<PHRMGoodsReceiptItemsModel> = new Array<PHRMGoodsReceiptItemsModel>();
  currentSupplier: PHRMSupplierModel = new PHRMSupplierModel();
  supplierList: Array<PHRMSupplierModel> = new Array<PHRMSupplierModel>();
  currentCompany: Array<PHRMCompanyModel> = new Array<PHRMCompanyModel>();
  PurchaseOrderNo: number = 0;
  SupplierName: string = null;
  loading: boolean = false;
  index: number = 0;
  showAddItemPopUp: boolean = false;
  showAddSupplierPopUp: boolean;
  IsPOorder: boolean = false;
  IsGRedit: boolean = false;
  showAddGRPage: boolean = false;
  showUpdateGRPage: boolean = false;
  update: boolean = false;
  goodreceipt: PHRMGoodsReceiptModel;
  oldSupplierId: any;
  oldInvoiceNo: any;
  duplicateInvoice: boolean = false;
  itemList: Array<PharmacyItem_DTO> = new Array<PharmacyItem_DTO>();
  taxList: Array<any>;
  taxData: Array<any> = [];
  currentCounter: number = null;
  itemLst: Array<any> = [];
  goodsReceiptList: Array<PHRMGoodsReceiptModel> = new Array<PHRMGoodsReceiptModel>();
  storeList: PHRMStoreModel;
  currentStore: any;
  tempStore: any;
  //for show and hide packing features
  IsPackageItem: boolean = false;
  isItemLevelDiscountApplicable: boolean = false;
  PackingTypeList: Array<PHRMPackingTypeModel> = new Array<PHRMPackingTypeModel>();
  IsGReditAfterModification: boolean = false;
  dispensaryList: Array<any> = [];
  goodReceiptHistory: Array<any> = [];
  CheckIsValid: boolean = true;
  isExpiryNotApplicable: boolean = false;
  ItemId: number = 0;
  IsStripRateEdit: boolean = false;
  fiscalYearList: Array<any> = new Array<any>();
  showFreeQty: boolean = false;
  showCCCharge: boolean = false;
  showNepaliReceipt: boolean;
  goodsReceiptIdForPrint: number;
  showGRReceipt: boolean = false;
  isMainDiscountApplicable: boolean = false;
  checkCreditPeriod: boolean = false;
  genericList: PHRMGenericModel[] = [];
  AllowPreviousFiscalYear: boolean = false;
  @Output('call-back-popup-close') callBackPopupClose: EventEmitter<Object> = new EventEmitter<Object>();
  EnableAdjustmentEdit: boolean = false;
  GRTotalAmount: number = 0;
  IsDuplicateItemsFound: boolean = false;
  DuplicateItemNames: Set<string> = new Set<string>();
  throwError: boolean = false;

  constructor(public dispensaryService: DispensaryService,
    public pharmacyService: PharmacyService,
    public coreService: CoreService,
    public pharmacyBLService: PharmacyBLService,
    public securityService: SecurityService,
    public messageBoxService: MessageboxService,
    public router: Router,
    public callBackService: CallbackService,
    public changeDetectorRef: ChangeDetectorRef
  ) {
    this.GetAllFiscalYears();
    this.supplierList = new Array<PHRMSupplierModel>();
    this.currentSupplier = new PHRMSupplierModel();
    this.itemList = new Array<PharmacyItem_DTO>();
    this.GetAllItemData();
    this.getGenericList();
    this.GetSupplierList();
    this.goodsReceiptVM.goodReceipt.GoodReceiptDate = moment().format("YYYY-MM-DD");


    this.getGoodsReceiptList();
    this.getMainStore();
    this.GetDispensaryList();
    this.LoadGoodReceiptHistory();
    this.GetPackingTypeList();
    this.ShowItemLevelDiscount();
    this.ShowPacking();
    this.checkGRCustomization();
    this.GetEnablePharmacyGoodReceiptAdjustment();
  }


  ngOnInit() {
  }
  // for show and hide packing feature
  ShowPacking() {
    this.IsPackageItem = true;
    let pkg = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyGRpacking" && p.ParameterGroupName == "Pharmacy").ParameterValue;
    if (pkg == "true") {
      this.IsPackageItem = true;
    } else {
      this.IsPackageItem = false;
    }
  }
  // for Free Qty and CC Charge Paramaters.
  checkGRCustomization() {
    let GRParameterStr = this.coreService.Parameters.find(p => p.ParameterName == "GRFormCustomization" && p.ParameterGroupName == "Pharmacy");
    if (GRParameterStr != null) {
      let GRParameter = JSON.parse(GRParameterStr.ParameterValue);
      if (GRParameter.showFreeQuantity == true) {
        this.showFreeQty = true;
      }
      if (GRParameter.showCCCharge == true) {
        this.showCCCharge = true;
      }
    }
    //check for english or nepali receipt style
    let receipt = this.coreService.Parameters.find(lang => lang.ParameterName == 'NepaliReceipt' && lang.ParameterGroupName == 'Common').ParameterValue;
    this.showNepaliReceipt = (receipt == "true");
  }

  private CheckForPoOrGrEditMode() {
    if (this.pharmacyService.Id > 0) {
      this.Load(this.pharmacyService.Id);
    }
    else if (this.pharmacyService.GRId > 0) {
      this.IsGRedit = true;
      this.IsPOorder = false;
      this.LoadGR(this.pharmacyService.GRId);
      this.pharmacyService.GRId = null;
    }
    else {
      this.IsPOorder = false;
      this.IsGRedit = false;
    }
  }

  ngOnDestroy() {
    this.pharmacyService.Id = null;
  }

  //this function load all packing type  list
  public GetPackingTypeList() {
    this.pharmacyBLService.GetPackingTypeList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.PackingTypeList = res.Results;

        }
        else {
          alert("Failed ! " + res.ErrorMessage);
          console.log(res.ErrorMessage)
        }
      });
  }

  //this fuction load all item for GR
  GetAllItemData() {
    try {
      this.pharmacyBLService.GetPharmacyItems().finally(() => {
        this.CheckForPoOrGrEditMode();
      })
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.itemList = res.Results;
              this.itemLst = this.itemList;
            } else {
              console.log(res.ErrorMessage);
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get item list, see detail in console log"]);
            }
          },
          (err) => {
            console.log(err.ErrorMessage);
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get item list., see detail in console log"]);
          }
        );
    } catch (exception) {
      console.log(exception);
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["error details see in console log"]);
    }
  }

  AddGRItemPopUp(i?) {
    this.showAddGRPage = false;
    this.index = i;
    this.update = false;
    this.changeDetectorRef.detectChanges();
    this.showAddGRPage = true;
  }
  OnPopupClose($event) {
    if ($event == true) {
      this.showUpdateGRPage = false;
      this.showAddGRPage = false;
      let newIndex = this.phrmGoodReceiptItemComponent.GoodReceiptItem.IndexOnEdit + 1;
      if (this.IsPOorder && newIndex < this.grItemList.length)
        this.SetFocusById("editButton" + newIndex);
      else
        this.SetFocusById('btn_AddNew');
    }

  }
  Close() {
    this.showAddGRPage = false;
  }

  EditRow(i: number) {
    //ramesh: 24thOct :disable the Edit btn if the Stock ie Item is already altered ie transfered, dispatched or post to accounting.
    if (this.goodsReceiptVM.goodReceipt.IsTransferredToACC == true || this.grItemList[i].IsItemAltered == true) {
      this.update = false;
      this.showUpdateGRPage = false;
      this.messageBoxService.showMessage("notice-message", ["Can not edit the record as this Stock is already altered or post to accounting."])
    }
    else {
      this.update = true;
      this.showUpdateGRPage = true;
      this.changeDetectorRef.detectChanges();
      this.phrmGoodReceiptItemComponent.IsPOorder = this.IsPOorder;
      if (this.IsPOorder || (this.IsGRedit && this.goodsReceiptVM.goodReceipt.PurchaseOrderId != null)) {
        this.phrmGoodReceiptItemComponent.ShowPendingQty = true;
      }
      this.phrmGoodReceiptItemComponent.GoodReceiptItem = _.cloneDeep(this.grItemList[i]);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.IndexOnEdit = i;
      this.phrmGoodReceiptItemComponent.SelectedGeneric = this.genericList.find(a => a.GenericId === this.grItemList[i].GenericId);
      this.phrmGoodReceiptItemComponent.GRItemPrice = this.grItemList[i].GRItemPrice;
      this.phrmGoodReceiptItemComponent.VATPercentage = this.grItemList[i].VATPercentage;
      this.phrmGoodReceiptItemComponent.ItemQty = this.grItemList[i].ItemQTy;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.ItemQTy = this.grItemList[i].ItemQTy;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.FreeQuantity = this.grItemList[i].FreeQuantity;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.Packing = this.grItemList[i].Packing;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.CCCharge = this.grItemList[i].CCCharge;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.CCAmount = this.grItemList[i].CCAmount;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.SalePrice = this.grItemList[i].SalePrice;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.PendingQuantity = this.grItemList[i].PendingQuantity;

      let selectedItem = this.itemList.find(a => a.ItemId === this.grItemList[i].ItemId)
      if (selectedItem) {
        this.phrmGoodReceiptItemComponent.SelectedItem = selectedItem.ItemName;
        this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("ItemName").setValue(selectedItem);
        this.phrmGoodReceiptItemComponent.GoodReceiptItem.SelectedItem = selectedItem;
      }
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.MRP = this.grItemList[i].MRP;
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("ExpiryDate").setValue((moment().add(1, 'years')).format("YYYY-MM")); //By default expiry date will be 1 year from now.
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("ItemQTy").setValue(this.grItemList[i].ItemQTy);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("AdjustedMargin").setValue(this.grItemList[i].AdjustedMargin);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("FreeQuantity").setValue(this.grItemList[i].FreeQuantity);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("CCCharge").setValue(this.grItemList[i].CCCharge);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("CCCharge").setValue(this.grItemList[i].CCCharge);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("DiscountPercentage").setValue(this.grItemList[i].DiscountPercentage);
      this.phrmGoodReceiptItemComponent.GoodReceiptItem.GoodReceiptItemValidator.get("VATPercentage").setValue(this.grItemList[i].VATPercentage);
      this.phrmGoodReceiptItemComponent.IsUpdate = true;
      this.changeDetectorRef.detectChanges();
      this.phrmGoodReceiptItemComponent.ngOnInit();
    }
  }
  //this function load all suppliers details
  GetSupplierList() {
    this.loading = true;
    try {
      this.pharmacyBLService.GetSupplierList().finally(() => { this.loading = false; }).subscribe(
        (res) => {
          if (res.Status == "OK") {
            this.supplierList = res.Results;
            this.SetFocusById("SupplierName");
          } else {
            this.messageBoxService.showMessage("failed", [
              "Failed to get supplier list." + res.ErrorMessage,
            ]);
          }
        },
        (err) => {
          this.messageBoxService.showMessage("error", [
            "Failed to get supplier list." + err.ErrorMessage,
          ]);
        }
      );
    } catch (exception) {
      this.loading = false;
      console.log(exception);
      this.messageBoxService.showMessage("error", ["error details see in console log"]);
    }
  }

  CallBackUpdateGRItem(grItemToUpdate: PHRMGoodsReceiptItemsModel) {
    //let grItemToupdateInList = this.grItemList.find(x => x.ItemId === grItemToUpdate.ItemId);
    this.grItemList = this.grItemList.map((x, index) => {
      if (index === grItemToUpdate.IndexOnEdit) {
        x = grItemToUpdate;
      }
      return x;
    });

    this.CalculationForPHRMGoodsReceipt(null);
  }
  ///function to load all PO Items By passing purchaseOrderId
  Load(PurchaseOrderId) {
    if (PurchaseOrderId == null) {
      this.IsPOorder = false;
    } else {
      this.pharmacyBLService.GetPHRMPOItemsForGR(PurchaseOrderId).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results !== null) {
            this.IsPOorder = true;
            this.SetFocusById("InvoiceId");
            this.goodsReceiptVM.purchaseOrder = res.Results.OrderForGR;
            this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems = res.Results.OrderItemsForGr;
            // this.goodsReceiptVM.goodReceipt = Object.assign(new PHRMGoodsReceiptModel(), res.Results.OrderForGR);
            //this.goodsReceiptVM.goodReceipt.TransactionType = ENUM_BillPaymentMode.credit
            this.currentSupplier = this.supplierList.find(r => r.SupplierId === res.Results.OrderForGR.SupplierId);
            this.PurchaseOrderNo = res.Results.OrderForGR.PurchaseOrderNo;
            this.grItemList = res.Results.OrderItemsForGr.map((item) => {
              let orderItem = Object.assign(new PHRMGoodsReceiptItemsModel(), item);
              orderItem.SalePrice = item.SalePrice;
              orderItem.GRItemPrice = item.SalePrice;
              orderItem.ExpiryDate = (moment().add(1, 'years')).format("YYYY-MM") //By default expiry date will be 1 year from now.
              orderItem.MRP = item.MRP > 0 ? item.MRP : item.SalePrice;
              orderItem.AdjustedMargin = 0;
              orderItem.SellingPrice = 0;
              orderItem.ReceivedQuantity = item.ReceivedQuantity;
              orderItem.PendingQuantity = orderItem.ReceivedQuantity > 0 ? orderItem.IsPacking ? orderItem.PackingQty : orderItem.Quantity - orderItem.ReceivedQuantity : orderItem.PendingQuantity;
              orderItem.ItemQTy = item.PendingQuantity;
              orderItem.FreeQuantity = item.PendingFreeQuantity;
              orderItem.CCCharge = item.CCChargePercentage;
              orderItem.FreeGoodsAmount = CommonFunctions.parseAmount(orderItem.FreeQuantity * item.SalePrice, 4);
              orderItem.SubTotal = CommonFunctions.parseAmount(orderItem.PendingQuantity * (orderItem.IsPacking ? orderItem.StripRate : item.SalePrice), 4);
              orderItem.DiscountPercentage = item.DiscountPercentage;
              orderItem.DiscountAmount = CommonFunctions.parseAmount(orderItem.SubTotal * orderItem.DiscountPercentage / 100, 4);
              orderItem.VATPercentage = item.VATPercentage;
              orderItem.VATAmount = CommonFunctions.parseAmount((orderItem.SubTotal - orderItem.DiscountAmount) * orderItem.VATPercentage / 100, 4);
              orderItem.CCAmount = CommonFunctions.parseAmount(orderItem.FreeGoodsAmount * orderItem.CCCharge / 100, 4);
              orderItem.TotalAmount = CommonFunctions.parseAmount(orderItem.SubTotal - orderItem.DiscountAmount + orderItem.VATAmount + orderItem.CCAmount, 4);
              if (orderItem.IsPacking && this.PackingTypeList) {
                orderItem.PackingQty = item.PackingQty;
                orderItem.StripQty = item.PackingQty;
                orderItem.PackingName = item.PackingName;
                orderItem.StripRate = item.StripRate;
                orderItem.StripMRP = item.StripRate;
                orderItem.FreeStripQuantity = item.FreeQuantity;
                orderItem.Packing = this.PackingTypeList.find(p => p.PackingTypeId === item.PackingTypeId);
              }
              return orderItem;
            });
            this.goodsReceiptVM.goodReceipt.TransactionType = ENUM_BillPaymentMode.credit;
            this.goodsReceiptVM.goodReceipt.PurchaseOrderId = res.Results.OrderForGR.PurchaseOrderId;
            this.goodsReceiptVM.goodReceipt.SubTotal = CommonFunctions.parseAmount(this.grItemList.reduce((a, b) => a + b.SubTotal, 0), 4);
            this.goodsReceiptVM.goodReceipt.DiscountAmount = CommonFunctions.parseAmount(this.grItemList.reduce((a, b) => a + b.DiscountAmount, 0), 4);
            this.goodsReceiptVM.goodReceipt.DiscountPercentage = CommonFunctions.parseAmount((this.goodsReceiptVM.goodReceipt.DiscountAmount / this.goodsReceiptVM.goodReceipt.SubTotal) * 100, 4);
            this.goodsReceiptVM.goodReceipt.VATAmount = CommonFunctions.parseAmount(this.grItemList.reduce((a, b) => a + b.VATAmount, 0), 4);
            this.goodsReceiptVM.goodReceipt.VATPercentage = CommonFunctions.parseAmount(this.goodsReceiptVM.goodReceipt.VATAmount / (this.goodsReceiptVM.goodReceipt.TaxableSubTotal - this.goodsReceiptVM.goodReceipt.DiscountAmount), 4);
            this.goodsReceiptVM.goodReceipt.CCAmount = CommonFunctions.parseAmount(this.grItemList.reduce((a, b) => a + b.CCAmount, 0), 4);
            this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(this.goodsReceiptVM.goodReceipt.SubTotal - this.goodsReceiptVM.goodReceipt.DiscountAmount + this.goodsReceiptVM.goodReceipt.VATAmount + this.goodsReceiptVM.goodReceipt.CCAmount, 4);


          } else {
            this.messageBoxService.showMessage("failed", [
              "Failed to get OrderList." + res.ErrorMessage,
            ]);
          }
        },
        (err) => {
          this.messageBoxService.showMessage("error", [
            "Failed to get OrderList." + err.ErrorMessage,
          ]);
        }
      );
    }
  }
  private UpdatePackingSettingForItem(grItemToUpdate: PHRMGoodsReceiptItemsModel) {
    if (this.PackingTypeList != null && this.PackingTypeList.length > 0 && grItemToUpdate.SelectedItem.PackingTypeId != null) {
      let selectedItemPackingType = this.PackingTypeList.find(a => a.PackingTypeId == grItemToUpdate.SelectedItem.PackingTypeId);
      if (selectedItemPackingType != null) {
        grItemToUpdate.PackingName = selectedItemPackingType.PackingName + "\n" + "(" + selectedItemPackingType.PackingQuantity + ")";
        grItemToUpdate.PackingQty = selectedItemPackingType.PackingQuantity;
        grItemToUpdate.ItemQTy = grItemToUpdate.ReceivedQuantity / grItemToUpdate.PackingQty;

      }
    }
    else {
      grItemToUpdate.PackingName = "N/A";
      //grItemToUpdate.ItemQTy = grItemToUpdate.ReceivedQuantity;
      grItemToUpdate.GoodReceiptItemValidator.updateValueAndValidity();
    }
  }

  LoadGR(GoodReceiptId) {
    if (GoodReceiptId == null) {
      this.IsGRedit = true;
    } else {
      this.pharmacyBLService
        .GetGRItemsForEdit(GoodReceiptId)
        .subscribe((res) => {
          if (res.Status == "OK" && res.Results) {
            this.IsGRedit = true;
            this.goodsReceiptVM.goodReceipt.GoodReceiptId = res.Results.GoodReceiptId;
            this.goodsReceiptVM.goodReceipt.GoodReceiptPrintId = res.Results.GoodReceiptPrintId;
            this.goodsReceiptVM.goodReceipt.PurchaseOrderId = res.Results.PurchaseOrderId;
            this.goodsReceiptVM.goodReceipt.InvoiceNo = res.Results.InvoiceNo;
            this.goodsReceiptVM.goodReceipt.GoodReceiptDate = moment(res.Results.GoodReceiptDate).format('MM-DD-YYYY');
            this.goodsReceiptVM.goodReceipt.SupplierId = res.Results.SupplierId;
            this.oldInvoiceNo = res.Results.InvoiceNo;
            this.oldSupplierId = res.Results.SupplierId; //for duplication check
            this.currentSupplier = this.supplierList.find((a) => a.SupplierId == res.Results.SupplierId);
            this.goodsReceiptVM.goodReceipt.SubTotal = res.Results.SubTotal;
            this.goodsReceiptVM.goodReceipt.DiscountPercentage = res.Results.DiscountPercentage;
            this.goodsReceiptVM.goodReceipt.DiscountAmount = res.Results.DiscountAmount;
            this.goodsReceiptVM.goodReceipt.TotalAmount = res.Results.TotalAmount;
            //this.goodsReceiptVM.goodReceipt.TaxableSubTotal = this.goodsReceiptVM.goodReceipt.SubTotal - this.goodsReceiptVM.goodReceipt.DiscountAmount;
            //this.goodsReceiptVM.goodReceipt.NonTaxableSubTotal = this.goodsReceiptVM.goodReceipt.DiscountAmount;
            this.goodsReceiptVM.goodReceipt.Remarks = res.Results.Remarks;
            this.goodsReceiptVM.goodReceipt.Adjustment = res.Results.Adjustment;
            this.GRTotalAmount = this.goodsReceiptVM.goodReceipt.TotalAmount - this.goodsReceiptVM.goodReceipt.Adjustment;
            this.goodsReceiptVM.goodReceipt.CreatedBy = res.Results.CreatedBy;
            this.goodsReceiptVM.goodReceipt.CreatedOn = res.Results.CreatedOn;
            this.goodsReceiptVM.goodReceipt.VATAmount = res.Results.VATAmount;
            this.goodsReceiptVM.goodReceipt.VATPercentage = res.Results.VATPercentage;
            this.goodsReceiptVM.goodReceipt.CCAmount = res.Results.CCAmount;
            this.goodsReceiptVM.goodReceipt.IsCancel = res.Results.IsCancel;
            this.goodsReceiptVM.goodReceipt.IsTransferredToACC = res.Results.IsTransferredToACC;
            this.goodsReceiptVM.goodReceipt.TransactionType = res.Results.TransactionType;
            this.goodsReceiptVM.goodReceipt.StoreId = res.Results.StoreId;
            this.goodsReceiptVM.goodReceipt.CreditPeriod = res.Results.CreditPeriod;
            this.goodsReceiptVM.goodReceipt.StoreName = res.Results.StoreName;
            this.goodsReceiptVM.goodReceipt.IsPacking = res.Results.IsPacking;
            this.goodsReceiptVM.goodReceipt.IsItemDiscountApplicable = res.Results.IsItemDiscountApplicable;
            this.tempStore = this.storeList;
            this.AssignStore();
            let goodsReceiptItems: Array<any> = res.Results.GoodReceiptItem;
            //this.changeDetectorRef.detectChanges();
            for (let i = 0; i < goodsReceiptItems.length; i++) {
              //this.changeDetectorRef.detectChanges();
              let currGRItem: PHRMGoodsReceiptItemsModel = new PHRMGoodsReceiptItemsModel();
              currGRItem.GoodReceiptItemId = goodsReceiptItems[i].GoodReceiptItemId;
              currGRItem.GoodReceiptId = goodsReceiptItems[i].GoodReceiptId;
              currGRItem.CompanyName = goodsReceiptItems[i].CompanyName;
              currGRItem.SupplierName = goodsReceiptItems[i].SupplierName;
              currGRItem.ItemName = goodsReceiptItems[i].ItemName;
              currGRItem.ItemId = goodsReceiptItems[i].ItemId;
              currGRItem.ItemName = goodsReceiptItems[i].ItemName;
              this.ItemId = currGRItem.ItemId;
              currGRItem.SelectedItem = this.itemList.find((a) => a.ItemId == currGRItem.ItemId);
              currGRItem.StockId = goodsReceiptItems[i].StockId;
              currGRItem.StoreStockId = goodsReceiptItems[i].StoreStockId;
              currGRItem.BatchNo = goodsReceiptItems[i].BatchNo;
              currGRItem.ExpiryDate = goodsReceiptItems[i].ExpiryDate;
              if (currGRItem.ExpiryDate != null) {
                currGRItem.ExpiryDate = moment(currGRItem.ExpiryDate).format("YYYY-MM");
              }
              currGRItem.ReceivedQuantity = goodsReceiptItems[i].ReceivedQuantity;
              if (goodsReceiptItems[i].PackingTypeId != null) {
                let packing = this.PackingTypeList.find(x => x.PackingTypeId == goodsReceiptItems[i].PackingTypeId);
                currGRItem.PackingQty = goodsReceiptItems[i].PackingQty;
                currGRItem.ItemQTy = goodsReceiptItems[i].ReceivedQuantity / currGRItem.PackingQty;
                currGRItem.PackingName = packing.PackingName + "\n" + "(" + packing.PackingQuantity + ")";
                currGRItem.Packing = packing;
              }
              else {
                currGRItem.ItemQTy = goodsReceiptItems[i].ReceivedQuantity;
              }
              currGRItem.GenericName = goodsReceiptItems[i].GenericName;
              currGRItem.GenericId = goodsReceiptItems[i].GenericId;
              currGRItem.StripRate = goodsReceiptItems[i].StripRate;
              currGRItem.StripSalePrice = goodsReceiptItems[i].StripSalePrice;
              currGRItem.StripQty = goodsReceiptItems[i].PackingQty;
              currGRItem.PackingTypeId = goodsReceiptItems[i].PackingTypeId;
              currGRItem.FreeQuantity = goodsReceiptItems[i].FreeQuantity;
              currGRItem.RejectedQuantity = goodsReceiptItems[i].RejectedQuantity;
              currGRItem.UOMName = goodsReceiptItems[i].UOMName;
              currGRItem.SellingPrice = goodsReceiptItems[i].SellingPrice;
              currGRItem.GRItemPrice = goodsReceiptItems[i].GRItemPrice;
              currGRItem.SubTotal = goodsReceiptItems[i].SubTotal;
              currGRItem.VATPercentage = goodsReceiptItems[i].VATPercentage;
              currGRItem.IsPacking = goodsReceiptItems[i].IsPacking;
              currGRItem.MRP = goodsReceiptItems[i].MRP;
              currGRItem.StripMRP = goodsReceiptItems[i].StripMRP;
              currGRItem.IsItemDiscountApplicable = goodsReceiptItems[i].IsItemDiscountApplicable;
              if (goodsReceiptItems[i].CCCharge == null) {
                currGRItem.CCCharge = 0;
              }
              else {
                currGRItem.CCCharge = goodsReceiptItems[i].CCCharge;
                currGRItem.CCAmount = goodsReceiptItems[i].CCAmount;

              }
              currGRItem.DiscountPercentage = goodsReceiptItems[i].DiscountPercentage;
              currGRItem.DiscountAmount = goodsReceiptItems[i].GrPerItemDisAmt;
              currGRItem.VATAmount = goodsReceiptItems[i].GrPerItemVATAmt;
              // this.goodsReceiptVM.goodReceipt.TaxableSubTotal += goodsReceiptItems[i].SubTotal - goodsReceiptItems[i].DiscountAmount;
              // this.goodsReceiptVM.goodReceipt.NonTaxableSubTotal += goodsReceiptItems[i].DiscountAmount;
              if (currGRItem.VATAmount) {
                this.goodsReceiptVM.goodReceipt.TaxableSubTotal += goodsReceiptItems[i].SubTotal;
              }
              else {
                this.goodsReceiptVM.goodReceipt.NonTaxableSubTotal += goodsReceiptItems[i].SubTotal;
              }
              currGRItem.TotalAmount = goodsReceiptItems[i].TotalAmount;
              currGRItem.CreatedBy = goodsReceiptItems[i].CreatedBy;
              currGRItem.CreatedOn = goodsReceiptItems[i].CreatedOn;
              currGRItem.SalePrice = goodsReceiptItems[i].SalePrice;
              currGRItem.AvailableQuantity = goodsReceiptItems[i].AvailableQuantity;
              currGRItem.CostPrice = goodsReceiptItems[i].CostPrice;
              currGRItem.QtyDiffCount = goodsReceiptItems[i].QtyDiffCount;
              currGRItem.StkManageInOut = goodsReceiptItems[i].StkManageInOut;
              currGRItem.IsItemAltered = goodsReceiptItems[i].IsItemAltered;
              if (currGRItem.PackingTypeId != null) {
                currGRItem.Margin = CommonFunctions.parseAmount(((currGRItem.StripSalePrice - currGRItem.StripRate) / currGRItem.StripRate) * 100, 4);
                currGRItem.AdjustedMargin = currGRItem.Margin;
              }
              else {
                currGRItem.Margin = CommonFunctions.parseAmount(((currGRItem.SalePrice - currGRItem.GRItemPrice) / currGRItem.GRItemPrice) * 100, 4);
                currGRItem.AdjustedMargin = currGRItem.Margin;
              }
              this.grItemList.push(currGRItem);
              //this.UpdatePackingSettingForItem(currGRItem); //ramesh: this is updating the item wise packing; need discussion
            }
            this.changeDetectorRef.detectChanges();
            //sanjit: set focus by default to invoice no, as focusing to supplier brings out issues. will be solved later.
            this.SetFocusById("InvoiceId")

            if (res.Results.IsGRModified) {
              this.IsGReditAfterModification = true;
            }
          } else {
            //this.msgserv.showMessage("Error", ["Failed to load GR.", res.Results + " has been modified or transfered"]);
            //this.logError(res.ErrorMessage);
            this.messageBoxService.showMessage("Error", ["Failed to load GR."]);
            this.logError(res.ErrorMessage);
          }
        }),
        (err) => {
          this.messageBoxService.showMessage("Error", [
            "Failed to load GR.",
            err.ErrorMessage,
          ]);
        };
    }
  }


  EditGR() {
    if (this.grItemList != null) {
      let CheckIsValid = true;
      if (this.currentSupplier.SupplierId <= 0) {
        alert("Please select supplier");
        CheckIsValid = false;
      }
      if (this.goodsReceiptVM.goodReceipt.InvoiceNo == null || !this.goodsReceiptVM.goodReceipt.InvoiceNo.trim()) {
        alert("Please enter Invoice no.");
        CheckIsValid = false;
      }
      if (this.currentStore == null || this.currentStore.StoreId == 0) {
        alert("Please select store");
        CheckIsValid = false;
      }
      this.OnInvoiceChange();
      if (this.duplicateInvoice) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Duplicate Supplier Name and InvoiceNo is not allowed']);
        return;
      }
      let invoiceNo = this.goodsReceiptVM.goodReceipt.InvoiceNo;
      let SupplierId = this.currentSupplier.SupplierId;
      if (this.oldInvoiceNo != invoiceNo || this.oldSupplierId != SupplierId) {
        for (let i = 0; i < this.goodsReceiptList.length; i++) {
          let InvNum = this.goodsReceiptList[i].InvoiceNo;
          let SuppNum = this.goodsReceiptList[i].SupplierId;
          if (invoiceNo == InvNum && SupplierId == SuppNum) {
            this.duplicateInvoice = true;
            CheckIsValid = false;
          }

        }
      }
      if (this.EnableAdjustmentEdit) {
        const integerPart = this.getIntegerPart(this.goodsReceiptVM.goodReceipt.Adjustment);
        if (integerPart >= 1) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Adjustment must be in decimal and range must between -1 and 1.']);
          CheckIsValid = false;
        }
      }
      this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls['GoodReceiptDate'].setValue(this.goodsReceiptVM.goodReceipt.GoodReceiptDate);
      // for loop is used to show GoodsReceiptValidator message ..if required  field is not filled
      for (let a in this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls) {
        this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls[a].markAsDirty();
        this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls[a].updateValueAndValidity();
        if (this.goodsReceiptVM.goodReceipt.IsValidCheck(undefined, undefined) == false) {
          CheckIsValid = false;
        }
      }

      for (let c = 0; c < this.grItemList.length; c++) {
        for (let ctrl in this.grItemList[c].GoodReceiptItemValidator.controls) {
          this.grItemList[c].GoodReceiptItemValidator.controls[ctrl].markAsDirty();
          this.grItemList[c].GoodReceiptItemValidator.controls[ctrl].updateValueAndValidity();
          //this.grItemList[c].CounterId = this.currentCounter;

        }
        if ((this.grItemList[c].FreeQuantity != 0) && (this.grItemList[c].ItemQTy == 0 || this.grItemList[c].ReceivedQuantity == 0)) {
          this.grItemList[c].GoodReceiptItemValidator.controls["ItemQTy"].disable();
          this.grItemList[c].GoodReceiptItemValidator.controls["ReceivedQuantity"].disable();
        }
        // if (this.grItemList[c].IsValidCheck(undefined, undefined) == false) {
        //   CheckIsValid = false;

        // }
      }
      if (CheckIsValid) {
        this.goodsReceiptVM.goodReceipt.GoodReceiptItem = [];
        this.tempGoodsReceiptVM.goodReceipt.GoodReceiptItem = [];
        for (let k = 0; k < this.grItemList.length; k++) {
          this.goodsReceiptVM.goodReceipt.GoodReceiptItem[k] = this.grItemList[k];
        }
        for (let c = 0; c < this.goodsReceiptVM.goodReceipt.GoodReceiptItem.length; c++) {
          if (this.goodsReceiptVM.goodReceipt.GoodReceiptItem[c].ReceivedQuantity != 0 || this.goodsReceiptVM.goodReceipt.GoodReceiptItem[c].FreeQuantity != 0) {
            this.tempGoodsReceiptVM.goodReceipt.GoodReceiptItem.push(this.goodsReceiptVM.goodReceipt.GoodReceiptItem[c]);
          }
        }
        this.goodsReceiptVM.goodReceipt.GoodReceiptItem = [];
        for (let e = 0; e < this.tempGoodsReceiptVM.goodReceipt.GoodReceiptItem.length; e++) {
          this.goodsReceiptVM.goodReceipt.GoodReceiptItem.push(this.tempGoodsReceiptVM.goodReceipt.GoodReceiptItem[e]);
        }

        if (this.goodsReceiptVM.goodReceipt.GoodReceiptItem.length > 0) {
          this.loading = true;
          this.goodsReceiptVM.goodReceipt.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
          this.goodsReceiptVM.goodReceipt.SupplierId = this.currentSupplier.SupplierId;
          this.goodsReceiptVM.goodReceipt.StoreId = this.currentStore.StoreId;
          this.goodsReceiptVM.goodReceipt.StoreName = this.currentStore.Name;
          this.goodsReceiptVM.goodReceipt.CreatedOn = moment().format("YYYY-MM-DD");
          this.goodsReceiptVM.goodReceipt.GoodReceiptItem.forEach(
            t => {
              t.CreatedBy = this.goodsReceiptVM.goodReceipt.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
              t.CreatedOn = moment().format("YYYY-MM-DD");
            }
          );
          this.goodsReceiptVM.purchaseOrder.SupplierId = this.currentSupplier.SupplierId;
          this.goodsReceiptVM.purchaseOrder.SupplierName = this.currentSupplier.SupplierName;
          if (!this.IsPOorder) {
            // this.MakePoWithPOItemsForPost(this.goodsReceiptVM);
          } else {
            this.ChangePOAndPOItemsStatus();
          }
          this.pharmacyBLService.UpdateGoodsReceipt(this.goodsReceiptVM.goodReceipt).finally(() => this.loading = false).subscribe(
            (res) => {
              if (res.Status == "OK") {
                this.messageBoxService.showMessage("success", ["Goods Receipt is Updated and Saved.",]);
                this.pharmacyService.CreateNew();
                this.IsPOorder = false;
                this.IsGRedit = false;
                this.ItemId = 0;
                this.router.navigate(["/Pharmacy/Order/GoodsReceiptList"]);
              } else {
                this.messageBoxService.showMessage("failed", ["Failed to Update", res.ErrorMessage,]);
              }
              this.loading = false;
            },
            (err) => {
              (this.loading = false), this.logError(err);
            }
          );
        } else {
          this.messageBoxService.showMessage("notice-message", ["Received Qty of All Items is Zero",]);
        }
      } else {
        this.messageBoxService.showMessage("notice-message", ["missing value, please fill it",]);
      }
    }
    this.loading = false;
  }
  //Method for transforming POItems to GRItems
  GetGrItemsFromPoItems() {
    for (let i = 0; i < this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems.length; i++
    ) {
      let currGRItem: PHRMGoodsReceiptItemsModel = new PHRMGoodsReceiptItemsModel();
      currGRItem.ItemId = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].ItemId;
      currGRItem.ItemName = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].ItemName;
      currGRItem.SellingPrice = 0;
      currGRItem.VATPercentage = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].VATPercentage;
      currGRItem.ExpiryDate = moment().format("YYYY-MM-DD");
      currGRItem.GRItemPrice = 0; // need to refacor again
      currGRItem.DiscountPercentage = 0;
      currGRItem.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      currGRItem.SupplierName = this.currentSupplier.SupplierName;
      currGRItem.CompanyName = this.currentCompany[i].CompanyName;
      currGRItem.SelectedItem = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].PHRMItemMaster;
      currGRItem.GRItemPrice = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].StandardRate;
      if (this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].ReceivedQuantity == 0) {
        ///if pending qty is zero then replace it with original Purchase Oty
        currGRItem.PendingQuantity = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].Quantity;
      } else {
        currGRItem.PendingQuantity = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].PendingQuantity;
      }
      currGRItem.ItemQTy = currGRItem.PendingQuantity;
      if (this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].PHRMItemMaster.CCCharge == null) {
        currGRItem.CCCharge = 0;
      }
      else {
        currGRItem.CCCharge = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].PHRMItemMaster.CCCharge;
      }

      if (this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems[i].PHRMItemMaster.PackingTypeId == null) {
        currGRItem.PackingName = "N/A";
      }
      ///push  local variable GrData to GrList Variable
      this.grItemList.push(currGRItem);
      this.UpdatePackingSettingForItem(currGRItem);
    }
  }

  public getGoodsReceiptList() {
    this.pharmacyBLService.GetGoodsReceiptList().subscribe((res) => {
      if (res.Status == "OK") {
        this.goodsReceiptList = res.Results;
      }
    });
  }

  public GetAllFiscalYears() {
    this.pharmacyBLService.GetAllFiscalYears().subscribe((res) => {
      if (res.Status == "OK") {
        this.fiscalYearList = res.Results;
      }
    });
  }
  public getMainStore() {
    this.pharmacyBLService.GetMainStore().subscribe((res) => {
      if (res.Status == "OK") {
        this.storeList = res.Results;

        if (this.storeList && this.storeList.StoreId) {
          this.currentStore = this.storeList;
        }

      }
    });
  }

  SaveGoodsReceipt() {
    if (this.grItemList && this.grItemList.length) {
      if (this.duplicateInvoice) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Duplicate Supplier Name and InvoiceNo is not allowed']);
        return;
      }
      if (this.goodsReceiptVM && this.goodsReceiptVM.goodReceipt && this.goodsReceiptVM.goodReceipt.InvoiceNo && !this.goodsReceiptVM.goodReceipt.InvoiceNo.trim()) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Please enter Invoice no.']);
        return;
      }
      this.goodsReceiptVM.goodReceipt.GoodReceiptItem = [...this.grItemList];
      this.goodsReceiptVM.goodReceipt.GoodReceiptItem.forEach((item, index) => {
        item.FreeQuantity = item.FreeQuantity != null ? item.FreeQuantity : 0;
        item.ReceivedQuantity = item.ItemQTy;
        this.goodsReceiptVM.goodReceipt.IsPacking = this.grItemList[index].IsPacking == true ? true : false
        this.goodsReceiptVM.goodReceipt.IsItemDiscountApplicable = item.DiscountAmount ? true : false;
      });

      this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls['GoodReceiptDate'].setValue(this.goodsReceiptVM.goodReceipt.GoodReceiptDate);

      let isValid = this.CheckGoodReceiptValidity();
      if (!isValid) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Missing or Invalid value ! !",]);
        return;
      }
      let goSignal: boolean = false;
      if (this.CheckIsValid) {
        goSignal = this.CheckGRItemHistory();
      }
      if (goSignal) {
        let goodReceipt = this.goodsReceiptVM.goodReceipt;
        if (this.CheckIsValid && isValid) {
          goodReceipt.GoodReceiptItem = goodReceipt.GoodReceiptItem.filter(a => a.ReceivedQuantity > 0 || a.FreeQuantity > 0);

          if (goodReceipt.GoodReceiptItem.length > 0) {
            goodReceipt.GoodReceiptItem.forEach(
              gri => {
                gri.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
                gri.CreatedOn = moment().format("YYYY-MM-DD");
              }
            );
            goodReceipt.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
            goodReceipt.SupplierId = this.currentSupplier.SupplierId;
            goodReceipt.CreatedOn = moment().format("YYYY-MM-DD");
            goodReceipt.StoreId = this.currentStore.StoreId;
            goodReceipt.StoreName = this.currentStore.Name;
            goodReceipt.PaymentStatus = "pending";
            this.goodsReceiptVM.purchaseOrder.SubTotal = this.goodsReceiptVM.goodReceipt.SubTotal;
            this.goodsReceiptVM.purchaseOrder.TotalAmount = this.goodsReceiptVM.goodReceipt.TotalAmount;
            this.goodsReceiptVM.purchaseOrder.DiscountAmount = this.goodsReceiptVM.goodReceipt.DiscountAmount;
            this.goodsReceiptVM.purchaseOrder.DiscountPercentage = this.goodsReceiptVM.goodReceipt.DiscountPercentage;
            this.goodsReceiptVM.purchaseOrder.VATAmount = this.goodsReceiptVM.goodReceipt.VATAmount;
            this.goodsReceiptVM.purchaseOrder.SupplierId = this.currentSupplier.SupplierId;
            this.goodsReceiptVM.purchaseOrder.SupplierName = this.currentSupplier.SupplierName;
            this.goodsReceiptVM.goodReceipt.CreditPeriod = this.goodsReceiptVM.goodReceipt.CreditPeriod == null ? 0 : this.goodsReceiptVM.goodReceipt.CreditPeriod;
            this.goodsReceiptVM.purchaseOrder.CCChargeAmount = this.goodsReceiptVM.goodReceipt.CCAmount;


            if (!this.IsPOorder) {
              // this.MakePoWithPOItemsForPost(goodReceiptVM);
            } else {
              this.ChangePOAndPOItemsStatus();
            }
            this.loading = true;
            this.pharmacyBLService.PostGoodReceipt(this.goodsReceiptVM, this.IsPOorder).finally(() => {
              this.loading = false;
            }).subscribe(
              (res) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                  this.goodsReceiptVM = new PHRMGoodsReceiptViewModel();
                  this.CallBackAddGoodsReceipt(res);
                }
                else {
                  this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to save. " + res.ErrorMessage]);
                }
              },
              (err) => {
                this.logError(err);
              }
            );
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Received Qty of All Items is Zero",]);
          }
        } else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Missing or Invalid value ! !",]);
        }
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please, Insert Valid Data",]);
      }
    }
  }

  invalidDiscountPercentage: boolean = false;
  invalidDiscountAmount: boolean = false;
  invalidVATPercentage: boolean = false;
  invalidVATAmount: boolean = false;
  public CheckGoodReceiptValidity(): boolean {
    let CheckIsValid = true;
    if (!this.currentSupplier || this.currentSupplier.SupplierId == undefined || this.currentSupplier.SupplierId <= 0) {
      //this.msgserv.showMessage("error", ['Please select supplier']);
      alert("Please select supplier");
      CheckIsValid = false;
    }
    if (this.goodsReceiptVM.goodReceipt.InvoiceNo == null || this.goodsReceiptVM.goodReceipt.InvoiceNo == "") {
      alert("Please enter Invoice no.");
      CheckIsValid = false;
    }
    if (this.goodsReceiptVM.goodReceipt.CreditPeriod < 0) {
      alert("Credit Period must be positive");
      CheckIsValid = false;
    }
    if (this.currentStore == null || this.currentStore.StoreId == 0) {
      alert("Please select store");
      CheckIsValid = false;
    }

    if (this.EnableAdjustmentEdit) {
      const integerPart = this.getIntegerPart(this.goodsReceiptVM.goodReceipt.Adjustment);
      if (integerPart >= 1) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Adjustment should be a decimal value and cannot be greater than or equals to 1']);
        return;
      }
    }
    if (this.checkCreditPeriod) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Credit Period should be positive and whole number']);
      return;
    }

    this.IsDuplicateItemsFound = this.CheckForDuplicateItems();

    if (this.IsDuplicateItemsFound && this.DuplicateItemNames && this.DuplicateItemNames.size) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Duplicate items found' + Array.from(this.DuplicateItemNames).join(", ") + 'with the identical Batch, Expiry and Price']);
      CheckIsValid = false;
      return;
    }

    if ((this.goodsReceiptVM.goodReceipt.DiscountPercentage < 0 || this.goodsReceiptVM.goodReceipt.DiscountPercentage > 100) || this.goodsReceiptVM.goodReceipt.DiscountAmount < 0) {
      this.invalidDiscountPercentage = true;
      this.invalidDiscountAmount = true;
      CheckIsValid = false;
    }
    else {
      this.invalidDiscountPercentage = false;
      this.invalidDiscountAmount = false;
    }

    if ((this.goodsReceiptVM.goodReceipt.VATPercentage < 0 || this.goodsReceiptVM.goodReceipt.VATPercentage > 100) || this.goodsReceiptVM.goodReceipt.VATAmount < 0) {
      this.invalidVATPercentage = true;
      this.invalidVATAmount = true;
      CheckIsValid = false;
    }
    else {
      this.invalidVATPercentage = false;
      this.invalidVATAmount = false;
    }


    // for loop is used to show GoodsReceiptValidator message ..if required  field is not filled
    if (this.goodsReceiptVM.goodReceipt.GoodReceiptValidator) {
      for (let a in this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls) {

        this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls[a].markAsDirty();
        this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls[a].updateValueAndValidity();

        if (this.goodsReceiptVM.goodReceipt.IsValidCheck(undefined, undefined) == false) {
          CheckIsValid = false;
        }
      }
    }
    for (let grItem of this.goodsReceiptVM.goodReceipt.GoodReceiptItem) {

      for (let ctrl in grItem.GoodReceiptItemValidator.controls) {

        if ((grItem.FreeQuantity != 0) && (grItem.ItemQTy == 0 || grItem.ReceivedQuantity == 0)) {
          if (grItem.GoodReceiptItemValidator.status != "VALID") {
            grItem.GoodReceiptItemValidator.controls["ItemQTy"].disable();
          }
        }
        if (this.isExpiryNotApplicable && grItem.GoodReceiptItemValidator.controls["ExpiryDate"] == grItem.GoodReceiptItemValidator.controls[ctrl]) {
          grItem.GoodReceiptItemValidator.controls["ExpiryDate"].disable();
          grItem.GoodReceiptItemValidator.updateValueAndValidity();

        } else {
          grItem.GoodReceiptItemValidator.controls[ctrl].markAsDirty();
          grItem.GoodReceiptItemValidator.controls[ctrl].updateValueAndValidity();
        }
        if (this.IsPOorder) {
          grItem.GoodReceiptItemValidator.controls['ItemName'].setErrors(null);
        }
      }
      if (grItem.IsValidCheck(undefined, undefined) == false) {
        CheckIsValid = false;
      }

    }


    return CheckIsValid;
  }

  //call after Goods Receipt saved
  CallBackAddGoodsReceipt(res) {
    if (res.Status == "OK") {
      this.messageBoxService.showMessage("success", ["Goods Receipt is Generated and Saved.",]);
      this.pharmacyService.CreateNew();
      this.loadItemRateHistory();
      this.loadMRPHistory();
      this.IsPOorder = false;
      this.PurchaseOrderNo = 0;
      this.goodsReceiptIdForPrint = res.Results as number;
      this.showGRReceipt = true;
      this.ClearAllFields();
      this.getGoodsReceiptList();
    } else {
      this.messageBoxService.showMessage("failed", ["failed to add result.. please check log for details.",]);
      this.logError(res.ErrorMessage);

    }
  }
  loadItemRateHistory() {
    this.pharmacyBLService.getItemRateHistory()
      .subscribe(res => {
        if (res.Status == "OK" && res.Results.length > 0) {
          this.pharmacyService.setItemRateHistory(res.Results);
        }
      }, err => {
        console.log(err.error.ErrorMessage);
      })
  }
  loadMRPHistory() {
    this.pharmacyBLService.getMRPHistory()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length > 0) {
          this.pharmacyService.setMRPHistory(res.Results);
        }
      }, err => {
        console.log(err.error.ErrorMessage);
      })
  }

  public getGenericList() {
    if (this.update != true) {
      this.pharmacyBLService.GetGenericList()
        .subscribe(res => {
          if (res.Status == "OK") {
            this.genericList = res.Results;
          }
        });
    }
  }
  ClearAllFields() {
    this.goodsReceiptVM = new PHRMGoodsReceiptViewModel();
    this.grItemList = new Array<PHRMGoodsReceiptItemsModel>();
    this.tempGoodsReceiptVM = new PHRMGoodsReceiptViewModel();
    this.goodReceiptItems = new PHRMGoodsReceiptItemsModel();
    this.goodsReceiptList = new Array<PHRMGoodsReceiptModel>();
    this.goodsReceiptVM.goodReceipt.GoodReceiptDate = moment().format("YYYY-MM-DD");
    this.goodsReceiptVM.goodReceipt.GoodReceiptValidator.controls['GoodReceiptDate'].setValue(this.goodsReceiptVM.goodReceipt.GoodReceiptDate);
    this.PurchaseOrderNo = null;
    this.currentSupplier = null;
  }

  OnGRViewPopUpClose() {
    this.showGRReceipt = false;
    this.SetFocusById("SupplierName");
  }
  OnSupplierViewPopUpClose() {
    this.showAddSupplierPopUp = false;
  }
  logError(err: any) {
    this.PurchaseOrderNo = 0;
    this.pharmacyService.CreateNew();
    this.IsPOorder = false;
    console.log(err);
  }

  SetFocusById(IdToBeFocused: string) {
    window.setTimeout(function () {
      let elemToFocus = document.getElementById(IdToBeFocused);
      if (elemToFocus != null && elemToFocus != undefined) {
        elemToFocus.focus();
      }
    }, 0);
  }
  // Calculation for Goods Receipt Item

  OnNewGRItemAdded(grItemToAdded: PHRMGoodsReceiptItemsModel) {
    let grItem = grItemToAdded;

    if (!this.grItemList || this.grItemList.length == 0) {
      this.grItemList = [];
    }
    this.grItemList.push(grItem);
    this.CalculationForPHRMGoodsReceipt();
    this.changeDetectorRef.detectChanges();
    this.goodReceiptItems = new PHRMGoodsReceiptItemsModel();
    this.SetFocusById("btn_AddNew");
  }



  CalculationForPHRMGoodsReceipt(discPer?: number, discAmt?: number) {
    let SubTotal = 0;
    let DiscountAmount = 0;
    let DiscountPercentage = 0;
    let VATAmount = 0;
    let VATPercentage = 0;
    let TotalAmount = 0;
    let CCAmount = 0;
    let TaxableSubTotal = 0;
    let NonTaxableSubTotal = 0;

    if ((discPer < 0 || discPer > 100) || discAmt < 0) {
      this.invalidDiscountPercentage = true;
      this.invalidDiscountAmount = true;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ['Enter a valid discount']);
      return;
    }
    else {
      this.invalidDiscountPercentage = false;
      this.invalidDiscountAmount = false;
    }

    this.grItemList.forEach(itm => {
      if (discPer > 0 && discAmt === 0) {
        itm.DiscountPercentage = discPer;
        itm.DiscountAmount = (itm.SubTotal * itm.DiscountPercentage) / 100;
      }
      if (discPer == 0 && discAmt > 0) {
        let DiscountPercentage = 0;
        let subTotal = this.grItemList.reduce((a, b) => a + b.SubTotal, 0);
        DiscountPercentage = (discAmt / subTotal) * 100;
        itm.DiscountPercentage = DiscountPercentage;
        itm.DiscountAmount = (itm.SubTotal * itm.DiscountPercentage) / 100;
      }
      if (discPer === 0 && discAmt === 0) {
        itm.DiscountPercentage = 0;
        itm.GrTotalDisAmt = 0;
        itm.DiscountAmount = 0;
      }
      if (itm.VATPercentage) {
        itm.TaxableSubTotal = itm.SubTotal
      }
      else {
        itm.NonTaxableSubTotal = itm.SubTotal
      }

      itm.VATAmount = CommonFunctions.parseAmount((itm.SubTotal - itm.DiscountAmount) * itm.VATPercentage / 100, 4);
      itm.TotalAmount = CommonFunctions.parseAmount(itm.SubTotal - itm.DiscountAmount + itm.VATAmount + itm.CCAmount, 4);
      itm.CostPrice = CommonFunctions.parseAmount(itm.TotalAmount / (itm.FreeQuantity + itm.ReceivedQuantity), 4);

    });

    SubTotal = this.grItemList.reduce((a, b) => a + b.SubTotal, 0);
    DiscountAmount = this.grItemList.reduce((a, b) => a + b.DiscountAmount, 0);
    DiscountPercentage = (DiscountAmount / SubTotal) * 100;
    VATAmount = this.grItemList.reduce((a, b) => a + b.VATAmount, 0);
    CCAmount = this.grItemList.reduce((a, b) => a + b.CCAmount, 0);
    TaxableSubTotal = this.grItemList.reduce((a, b) => a + b.TaxableSubTotal, 0);
    VATPercentage = ((VATAmount / (TaxableSubTotal - DiscountAmount)) * 100);
    NonTaxableSubTotal = this.grItemList.reduce((a, b) => a + b.NonTaxableSubTotal, 0);

    if (this.isMainDiscountApplicable) {
      discAmt = discAmt ? discAmt : 0;
      discPer = discPer ? discPer : 0;

      if (discPer == 0 && discAmt > 0) {
        DiscountAmount = discAmt;
        discPer = (discAmt / SubTotal) * 100;
        DiscountPercentage = discPer;
      }
      if (discPer > 0 && discAmt == 0) {
        discAmt = (SubTotal * discPer) / 100;
        DiscountAmount = discAmt;
        DiscountPercentage = discPer;
      }
    }


    TotalAmount = SubTotal - DiscountAmount + VATAmount + CCAmount;
    this.GRTotalAmount = TotalAmount;


    if (this.EnableAdjustmentEdit && this.goodsReceiptVM.goodReceipt.Adjustment) {
      const integerPart = this.getIntegerPart(this.goodsReceiptVM.goodReceipt.Adjustment);
      if (integerPart < 1) {
        TotalAmount = TotalAmount + this.goodsReceiptVM.goodReceipt.Adjustment;
      }
    }
    this.goodsReceiptVM.goodReceipt.TaxableSubTotal = CommonFunctions.parseAmount(TaxableSubTotal, 4);
    this.goodsReceiptVM.goodReceipt.NonTaxableSubTotal = CommonFunctions.parseAmount(NonTaxableSubTotal, 4);
    this.goodsReceiptVM.goodReceipt.SubTotal = CommonFunctions.parseAmount(SubTotal, 4);
    this.goodsReceiptVM.goodReceipt.DiscountAmount = CommonFunctions.parseAmount(DiscountAmount, 4);
    this.goodsReceiptVM.goodReceipt.DiscountPercentage = CommonFunctions.parseAmount(DiscountPercentage, 4);
    this.goodsReceiptVM.goodReceipt.VATAmount = CommonFunctions.parseAmount(VATAmount, 4);
    this.goodsReceiptVM.goodReceipt.VATPercentage = CommonFunctions.parseAmount(VATPercentage, 4);
    this.goodsReceiptVM.goodReceipt.CCAmount = CommonFunctions.parseAmount(CCAmount, 4);
    this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(TotalAmount, 4);

    if (this.goodsReceiptVM.goodReceipt.DiscountAmount > this.goodsReceiptVM.goodReceipt.SubTotal) {
      this.throwError = true;
      this.loading = true;
    }
    else {
      this.loading = false;
      this.throwError = false;
    }

    if ((this.goodsReceiptVM.goodReceipt.DiscountPercentage < 0 || this.goodsReceiptVM.goodReceipt.DiscountPercentage > 100) || this.goodsReceiptVM.goodReceipt.DiscountAmount < 0) {
      this.invalidDiscountPercentage = true;
      this.invalidDiscountAmount = true;
      this.throwError = true;
    }
    else {
      this.invalidDiscountPercentage = false;
      this.invalidDiscountAmount = false;
      this.throwError = false;
    }

    if ((this.goodsReceiptVM.goodReceipt.VATPercentage < 0 || this.goodsReceiptVM.goodReceipt.VATPercentage > 100) || this.goodsReceiptVM.goodReceipt.VATAmount < 0) {
      this.invalidVATPercentage = true;
      this.invalidVATAmount = true;
      this.throwError = true;
    }
    else {
      this.invalidVATPercentage = false;
      this.invalidVATAmount = false;
      this.throwError = false;
    }
  }

  OnVATChange(vatPer?: number, vatAmt?: number) {


    if ((vatPer < 0 || vatPer > 100) || vatAmt < 0) {
      this.invalidVATPercentage = true;
      this.invalidVATAmount = true;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ['Enter a valid VAT']);
      return;
    }
    else {
      this.invalidVATPercentage = false;
      this.invalidVATAmount = false;
    }
    let vatAmount = 0;
    let vatPercentage = 0;


    this.grItemList.forEach(itm => {
      if (vatPer > 0 && vatAmt === 0) {
        itm.VATPercentage = vatPer;
        itm.VATAmount = (itm.SubTotal - itm.DiscountAmount) * itm.VATPercentage / 100;
      }

      if (vatPer === 0 && vatAmt > 0) {

        let VATPercentage = 0;
        VATPercentage = vatAmt / (this.goodsReceiptVM.goodReceipt.TaxableSubTotal - this.goodsReceiptVM.goodReceipt.DiscountAmount) * 100;
        itm.VATPercentage = VATPercentage;
        itm.VATAmount = (itm.SubTotal - itm.DiscountAmount) * itm.VATPercentage / 100;
      }
      if (vatPer === 0 && vatAmt === 0) {
        itm.VATPercentage = 0;
        itm.VATAmount = 0;
      }
    });
    this.CalculationForPHRMGoodsReceipt();
  }



  Old_CalculationForPHRMGoodsReceipt(discAmt?: number, discPer?: number, vatAmt?: number) {
    let STotal: number = 0;

    let TAmount: number = 0;
    let VAmount: number = 0;
    let DAmount: number = 0;
    let TotalItemLevelDiscount: number = 0;
    let SubTotalOfItem: number = 0;

    let aggregateResult = this.grItemList.reduce((aggregatedObject, currentItem) => {
      aggregatedObject.subTotal += currentItem.SubTotal;
      aggregatedObject.discountTotal += currentItem.DiscountAmount;
      aggregatedObject.vatTotal += currentItem.VATAmount;
      aggregatedObject.totalAmount += currentItem.TotalAmount;
      return aggregatedObject;
    }, { subTotal: 0, discountTotal: 0, vatTotal: 0, totalAmount: 0 });

    TAmount = aggregateResult.totalAmount;
    VAmount = aggregateResult.vatTotal;
    TotalItemLevelDiscount = aggregateResult.discountTotal;
    SubTotalOfItem = aggregateResult.subTotal;


    //for bulk discount calculation and conversion of percentage into amount and vice versa
    if (this.isItemLevelDiscountApplicable == false) {
      if (discPer == 0 && discAmt > 0) {
        this.goodsReceiptVM.goodReceipt.TotalAmount =
          CommonFunctions.parseAmount(STotal, 4) - discAmt;
        this.goodsReceiptVM.goodReceipt.DiscountAmount = discAmt;
        discPer = (discAmt / CommonFunctions.parseAmount(STotal)) * 100;
        this.goodsReceiptVM.goodReceipt.DiscountPercentage = CommonFunctions.parseAmount(
          discPer
          , 4);
      }
      if (discPer > 0 && discAmt == 0) {
        discAmt = CommonFunctions.parseAmount((TAmount * discPer) / 100, 4);
        this.goodsReceiptVM.goodReceipt.TotalAmount =
          CommonFunctions.parseAmount(STotal, 4) - discAmt;
        this.goodsReceiptVM.goodReceipt.DiscountAmount = discAmt;
        this.goodsReceiptVM.goodReceipt.DiscountPercentage = discPer;
      }
      if (discPer == 0 && discAmt == 0 && vatAmt == 0) {
        this.goodsReceiptVM.goodReceipt.SubTotal = CommonFunctions.parseAmount(STotal, 4);
        this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(TAmount, 4
        );
        //this.goodsReceiptVM.goodReceipt.DiscountAmount = CommonFunctions.parseAmount(DAmount);
        this.goodsReceiptVM.goodReceipt.VATAmount = CommonFunctions.parseAmount(
          VAmount, 4
        );
        this.goodsReceiptVM.goodReceipt.DiscountAmount = 0;
        this.goodsReceiptVM.goodReceipt.DiscountPercentage = 0;
      }
      if (vatAmt >= 0) {
        this.goodsReceiptVM.goodReceipt.VATAmount = vatAmt;
        this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(
          this.goodsReceiptVM.goodReceipt.SubTotal -
          this.goodsReceiptVM.goodReceipt.DiscountAmount +
          vatAmt, 4
        );
      } else {
        this.goodsReceiptVM.goodReceipt.SubTotal = CommonFunctions.parseAmount(
          STotal, 4
        );
        this.goodsReceiptVM.goodReceipt.TotalAmount =
          CommonFunctions.parseAmount(TAmount, 4) -
          this.goodsReceiptVM.goodReceipt.DiscountAmount;
        //this.goodsReceiptVM.goodReceipt.DiscountAmount = CommonFunctions.parseAmount(DAmount);
        this.goodsReceiptVM.goodReceipt.VATAmount = CommonFunctions.parseAmount(
          VAmount, 4
        );
      }
    }
    else {                                                                             //this cal for total item level discount
      this.goodsReceiptVM.goodReceipt.SubTotal = CommonFunctions.parseAmount(SubTotalOfItem, 4);
      this.goodsReceiptVM.goodReceipt.DiscountAmount = CommonFunctions.parseAmount(TotalItemLevelDiscount, 4);
      let TotalDiscountPercentage = (this.goodsReceiptVM.goodReceipt.DiscountAmount / this.goodsReceiptVM.goodReceipt.SubTotal) * 100;
      this.goodsReceiptVM.goodReceipt.DiscountPercentage = CommonFunctions.parseAmount(TotalDiscountPercentage, 4);
      this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(TAmount, 4);
      this.goodsReceiptVM.goodReceipt.VATAmount = CommonFunctions.parseAmount(VAmount, 4);
      if (vatAmt > 0) {
        this.goodsReceiptVM.goodReceipt.VATAmount = vatAmt;
        this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(this.goodsReceiptVM.goodReceipt.SubTotal - this.goodsReceiptVM.goodReceipt.DiscountAmount + vatAmt, 4);
      }
    }


    // this.goodsReceiptVM.goodReceipt.Adjustment =
    //   CommonFunctions.parseFinalAmount(
    //     this.goodsReceiptVM.goodReceipt.TotalAmount
    //   ) - this.goodsReceiptVM.goodReceipt.TotalAmount;
    // this.goodsReceiptVM.goodReceipt.Adjustment = CommonFunctions.parseAmount(
    //   this.goodsReceiptVM.goodReceipt.Adjustment
    // );

    this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(this.goodsReceiptVM.goodReceipt.TotalAmount, 4);
  }

  //to delete the row
  DeleteGrItemRow(index) {
    //Don't allow to remove the item if the stock is already dispatched to dispensary. //sud:8July'2022
    if (this.goodsReceiptVM.goodReceipt.IsTransferredToACC == true || this.grItemList[index].IsItemAltered == true) {
      this.messageBoxService.showMessage("notice-message", ["Can not remove this item since this Stock is already altered or post to accounting."]);
      return;
    }

    // if (this.IsGRedit) {
    //   this.msgserv.showMessage("Failed", [
    //     "Can not delete any items in edit mode",
    //   ]);
    //   return;
    // }
    // if the index is 0 then ..  currentPOItem is pushhed in POItems to show the textboxes
    if (this.grItemList.length > 0) {
      //this will remove the data from the array

      this.grItemList.splice(index, 1);
    }

    if (index == 0 && this.grItemList.length == 0) {
      // let tempGRItemObj = new PHRMGoodsReceiptItemsModel();
      // this.grItemList.push(tempGRItemObj);
      this.CalculationForPHRMGoodsReceipt();
      this.changeDetectorRef.detectChanges();
    } else {
      this.CalculationForPHRMGoodsReceipt();
      this.changeDetectorRef.detectChanges();
    }
  }

  //After Goods Receipt Generation Updating The Pending and Received Qty of PO Item and also PO
  ChangePOAndPOItemsStatus() {
    let poItemList = this.goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems;
    //Set the Received and Pending Quantity for Each Purchaser Order Item
    for (let i = 0; i < poItemList.length; i++) {
      let grItemEquivalentOfPoItem = this.grItemList.find(a => a.ItemId == poItemList[i].ItemId)
      if (grItemEquivalentOfPoItem != null) {
        poItemList[i].ReceivedQuantity = poItemList[i].ReceivedQuantity + grItemEquivalentOfPoItem.ItemQTy; //- poItemList[i].ReceivedQuantity;
        let pending = poItemList[i].Quantity - poItemList[i].ReceivedQuantity;
        poItemList[i].PendingQuantity = pending > 0 ? pending : 0;
        let pendingFreeQuantity = grItemEquivalentOfPoItem.FreeQuantity - poItemList[i].PendingFreeQuantity;
        poItemList[i].PendingFreeQuantity = pendingFreeQuantity > 0 ? pendingFreeQuantity : 0;
      }
    }
  }

  //method for make PO with Po items when user need to create goods receipt without purchase order
  //here we are creating purchase order by using goods receipt data and first posting po and then gr
  MakePoWithPOItemsForPost(goodsReceiptVM: PHRMGoodsReceiptViewModel) {
    goodsReceiptVM.purchaseOrder.PurchaseOrderId = 0;
    goodsReceiptVM.purchaseOrder.SupplierId = this.currentSupplier.SupplierId;
    // goodsReceiptVM.purchaseOrder.PODate = moment().format("YYYY-MM-DD HH:mm:sss");
    goodsReceiptVM.purchaseOrder.POStatus = "complete";
    goodsReceiptVM.purchaseOrder.SubTotal = goodsReceiptVM.goodReceipt.SubTotal;
    goodsReceiptVM.purchaseOrder.VATAmount = goodsReceiptVM.goodReceipt.VATAmount;
    goodsReceiptVM.purchaseOrder.TotalAmount = goodsReceiptVM.goodReceipt.TotalAmount;
    goodsReceiptVM.purchaseOrder.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
    for (let x = 0; x < goodsReceiptVM.goodReceipt.GoodReceiptItem.length; x++) {
      let tempPOItem = new PHRMPurchaseOrderItems();
      tempPOItem.PurchaseOrderId = 0;
      tempPOItem.PurchaseOrderItemId = 0;
      tempPOItem.ItemId = goodsReceiptVM.goodReceipt.GoodReceiptItem[x].SelectedItem.ItemId;
      tempPOItem.Quantity = goodsReceiptVM.goodReceipt.GoodReceiptItem[x].ReceivedQuantity;
      tempPOItem.StandardRate = goodsReceiptVM.goodReceipt.GoodReceiptItem[x].SelectedItem.StandardPrice;
      tempPOItem.ReceivedQuantity = tempPOItem.Quantity;
      tempPOItem.PendingQuantity = 0;
      tempPOItem.SubTotal = goodsReceiptVM.goodReceipt.GoodReceiptItem[x].SubTotal;
      tempPOItem.VATAmount = CommonFunctions.parseAmount(goodsReceiptVM.goodReceipt.GoodReceiptItem[x].TotalAmount - tempPOItem.SubTotal, 4);
      tempPOItem.TotalAmount = goodsReceiptVM.goodReceipt.GoodReceiptItem[x].TotalAmount;
      tempPOItem.DeliveryDays = 1;
      tempPOItem.POItemStatus = "complete";
      tempPOItem.AuthorizedBy = this.securityService.GetLoggedInUser().EmployeeId;
      //tempPOItem.AuthorizedOn = moment().format("YYYY-MM-DD HH:mm:sss");
      tempPOItem.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      // tempPOItem.CreatedOn = moment().format("YYYY-MM-DD HH:mm:sss");
      goodsReceiptVM.purchaseOrder.PHRMPurchaseOrderItems.push(tempPOItem);
    }
    return goodsReceiptVM.purchaseOrder;
  }





  public AssignStore() {
    try {
      if (this.tempStore) {
        if (this.tempStore.StoreId != 0 && this.tempStore != null) {
          this.currentStore = this.tempStore;
        } else {
          this.currentStore = null;
        }
      } else {
        this.currentStore = null;
      }
    } catch (ex) {
      this.messageBoxService.showMessage("error", [
        "Failed to get Store." + ex.ErrorMessage,
      ]);
    }
  }


  //used to format display item in ng-autocomplete
  supplierListFormatter(data: any): string {
    let html = data["SupplierName"];
    return html;
  }


  dispensaryListFormatter(data: any): string {
    let html = data["Name"];
    return html;
  }

  //Discard button
  DiscardGoodsReceipt() {
    this.pharmacyService.CreateNew();
    this.PurchaseOrderNo = 0;
    this.IsPOorder = false;
    this.ItemId = 0;
    //navigate to GRLIST Page
    this.callBackPopupClose.emit();
  }

  //for item add popup page to turn on

  AddItemPopUp(i) {
    this.showAddItemPopUp = false;
    this.index = i;
    this.changeDetectorRef.detectChanges();
    this.showAddItemPopUp = true;
  }


  //for supplier add popup page to turn on
  AddSupplierPopUp() {
    this.showAddSupplierPopUp = false;
    // this.index = i;
    this.changeDetectorRef.detectChanges();
    this.showAddSupplierPopUp = true;
  }

  OnNewSupplierAdded($event) {
    this.showAddSupplierPopUp = false;
    let supplier = $event.supplier;
    this.supplierList.unshift(supplier);
    this.supplierList = this.supplierList.slice();
    this.currentSupplier = supplier;
    this.goodReceiptItems = new PHRMGoodsReceiptItemsModel();
  }



  //show or hide GR item level discount
  ShowItemLevelDiscount() {
    this.isItemLevelDiscountApplicable = true;
    this.isMainDiscountApplicable = true;
    let discountParameter = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyDiscountCustomization" && p.ParameterGroupName == "Pharmacy").ParameterValue;
    discountParameter = JSON.parse(discountParameter);
    this.isItemLevelDiscountApplicable = (discountParameter.EnableItemLevelDiscount == true);
    this.isMainDiscountApplicable = (discountParameter.EnableMainDiscount == true);
  }
  // Get Dispensary List
  GetDispensaryList() {
    this.dispensaryService.GetAllDispensaryList().subscribe(
      (res) => {
        if (res.Status == "OK" && res.Results && res.Results.length > 0) {
          this.dispensaryList = res.Results;
        } else {
          this.messageBoxService.showMessage("failed", ["Failed to get Dispensary List"]);
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }
  public LoadGoodReceiptHistory() { // of 1 months
    try {
      this.goodReceiptHistory = [];
      this.pharmacyBLService.GetGoodReceiptHistory().subscribe(res => {
        if (res.Status == "OK" && res.Results && res.Results.length > 0) {
          this.goodReceiptHistory = res.Results;
        }
      });

    } catch (err) {
      console.log(err);
    }
  }


  public CheckGRItemHistory(): boolean {
    const noOfCurrentGRItems = this.grItemList.length;

    if (this.goodReceiptHistory && this.goodReceiptHistory.length > 0) {

      const filteredGRHistory = this.goodReceiptHistory.filter(gr =>
        gr.SupplierId === this.currentSupplier.SupplierId && gr.items.length === noOfCurrentGRItems
      );

      let duplicateInvoices: string[] = [];

      for (let historyGR of filteredGRHistory) {
        const matchingItems = historyGR.items.filter(grItem =>
          this.grItemList.some(currentItem =>
            currentItem.ItemId === grItem.ItemId &&
            currentItem.ReceivedQuantity === grItem.ReceivedQuantity &&
            currentItem.GRItemPrice === grItem.GRItemPrice &&
            currentItem.SubTotal === grItem.SubTotal
          )
        );

        if (matchingItems.length === noOfCurrentGRItems) {
          duplicateInvoices.push(historyGR.InvoiceNo);
        }
      }

      if (duplicateInvoices.length > 0) {
        const invoiceString = duplicateInvoices.join(', ');
        // const confirmIt = confirm(`Similar GR found with these Invoices: ${invoiceString}\n Want to continue?`);
        // if (!confirmIt) {
        //     return false;
        // }
      }
    }
    return true;
  }


  OnInvoiceChange() {
    this.duplicateInvoice = false;
    this.CheckIsValid = true;
    this.goodsReceiptVM.goodReceipt.InvoiceNo = this.goodsReceiptVM.goodReceipt.InvoiceNo.trim();
    let invoiceNo = this.goodsReceiptVM.goodReceipt.InvoiceNo;
    let SupplierId = this.currentSupplier.SupplierId;
    let selectedDate = this.goodsReceiptVM.goodReceipt.GoodReceiptDate;
    let isGRCancelled = true;
    let fiscalYearName = (this.fiscalYearList.length > 0) ? this.fiscalYearList.filter(f => moment(f.StartYear).format('YYYY-MM-DD') <= moment(selectedDate).format('YYYY-MM-DD') && moment(f.EndYear).format('YYYY-MM-DD') >= moment(selectedDate).format('YYYY-MM-DD'))[0].FiscalYearName : "";
    let grId = this.goodsReceiptVM.goodReceipt.GoodReceiptId;

    if (invoiceNo && SupplierId > 0 && fiscalYearName != "") {
      let goodReceipt = new PHRMGoodsReceiptModel();
      if (!this.IsGRedit) {
        goodReceipt = this.goodsReceiptList && this.goodsReceiptList.find(a => a.InvoiceNo == invoiceNo && a.SupplierId == SupplierId && a.CurrentFiscalYear == fiscalYearName && a.IsCancel != isGRCancelled);
      }
      else {
        goodReceipt = this.goodsReceiptList && this.goodsReceiptList.find(a => a.GoodReceiptId !== grId && a.InvoiceNo == invoiceNo && a.SupplierId == SupplierId && a.CurrentFiscalYear == fiscalYearName && a.IsCancel != isGRCancelled);
      }
      if (goodReceipt) {
        this.duplicateInvoice = true;
        this.CheckIsValid = false;
      }
    }
  }

  HasDuplicateItems(ItemId, i): boolean {

    let seen = new Set();
    let hasDuplicates = this.grItemList.some(obj => { return seen.size == seen.add(obj.ItemId).size && obj.ItemId != 0 && (obj.ItemId == ItemId || ItemId == null); });
    if (hasDuplicates) {
      if (this.grItemList[i].BatchNo && this.grItemList[i].ExpiryDate && this.grItemList[i].GRItemPrice) {

        let hasDuplicates = this.grItemList.some(obj => {

          let myBool1 = seen.size == seen.add(obj.BatchNo).size && obj.BatchNo != "" && (obj.BatchNo == this.grItemList[i].BatchNo);
          let myBool2 = seen.size == seen.add(obj.ExpiryDate).size && obj.ExpiryDate != null && (obj.ExpiryDate == this.grItemList[i].ExpiryDate);
          let myBool3 = seen.size == seen.add(obj.GRItemPrice).size && obj.GRItemPrice != 0 && (obj.GRItemPrice == this.grItemList[i].GRItemPrice);
          if (myBool1 && myBool2 && myBool3) {
            this.DuplicateItemNames.add(obj.ItemName);
            return true;
          } else {
            this.CheckIsValid = true;
            this.DuplicateItemNames.add(obj.ItemName);
            return false;
          }
        });
        return hasDuplicates;

      } else {
        hasDuplicates = true;
      }
    }
    else {
      this.CheckIsValid = true;
      hasDuplicates = false;
    }
    return hasDuplicates;
  }

  public hotkeys(event) {
    if (event.altKey) {
      console.log(event.keyCode);
      switch (event.keyCode) {
        case 80: {// => ALT+P comes here
          if (this.IsGRedit == true) this.EditGR();
          else this.SaveGoodsReceipt();
          break;
        }
        default:
          break;
      }
    }
  }
  setFocusById(id: string, waitingTimeInms = 0) {
    let Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        nextEl.select();
        clearTimeout(Timer);
      }
    }, waitingTimeInms)
  }
  setFocusToBtnById(id: string, waitingTimeInms = 0) {
    let Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        clearTimeout(Timer);
      }
    }, waitingTimeInms)
  }

  OnCreditPeriodChange() {
    this.checkCreditPeriod = false;
    if (this.goodsReceiptVM.goodReceipt.CreditPeriod < 0 || !Number.isInteger(this.goodsReceiptVM.goodReceipt.CreditPeriod)) {
      this.checkCreditPeriod = true;
    }
  }

  GetEnablePharmacyGoodReceiptAdjustment() {
    let adjust = this.coreService.Parameters.find((p) => p.ParameterName == "EnableEditPHRMGRAdjustment" && p.ParameterGroupName == "Pharmacy");
    if (adjust && adjust.ParameterValue) {
      if (adjust.ParameterValue == "true") {
        this.EnableAdjustmentEdit = true;
      } else {
        this.EnableAdjustmentEdit = false;
      }

    }
  }
  OnAdjustmentChange($event) {
    if ($event && this.goodsReceiptVM.goodReceipt.Adjustment) {
      const integerPart = this.getIntegerPart(this.goodsReceiptVM.goodReceipt.Adjustment);
      if (this.EnableAdjustmentEdit && integerPart >= 1) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Adjustment must be in decimal and range must between -1 and 1."]);
        return;
      }
      if (this.EnableAdjustmentEdit && integerPart < 1) {
        if (this.goodsReceiptVM.goodReceipt.TotalAmount > 0) {
          this.goodsReceiptVM.goodReceipt.TotalAmount = CommonFunctions.parseAmount(this.GRTotalAmount + this.goodsReceiptVM.goodReceipt.Adjustment, 4);
        }
      }
    }
    else {
      this.goodsReceiptVM.goodReceipt.TotalAmount = this.GRTotalAmount;
    }
  }
  getIntegerPart(value: number): number {
    return Math.trunc(Math.abs(value));

  }
  OnNewMasterItemAdded($event) {
    if ($event) {
      this.itemList.push($event);
    }
  }

  CheckForDuplicateItems(): boolean {
    let seenItems = new Set<string>();
    let hasDuplicates = false;

    const uniqueFields = ['BatchNo', 'ExpiryDate', 'GRItemPrice'];

    for (let item of this.grItemList) {
      let uniqueKey = uniqueFields.map(field => item[field]).join('|');

      if (seenItems.has(uniqueKey)) {
        hasDuplicates = true;
        break;
      } else {
        seenItems.add(uniqueKey);
      }
    }
    return hasDuplicates;
  }
}
