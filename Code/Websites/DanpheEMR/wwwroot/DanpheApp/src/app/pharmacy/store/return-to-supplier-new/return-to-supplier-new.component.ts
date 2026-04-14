import { Component } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PHRMGenericModel } from "../../shared/phrm-generic.model";
import { PHRMSupplierModel } from "../../shared/phrm-supplier.model";
import { ReturnToSupplier_DTO, ReturnToSupplierItem_DTO, SupplierWiseAvailableStock_DTO } from "./return-to-supplier.dto";

@Component({
  templateUrl: './return-to-supplier-new.component.html',
})
export class PHRMReturnToSupplierNewComponent {
  SelectedSupplier = new PHRMSupplierModel();
  ReturnToSupplier: ReturnToSupplier_DTO = new ReturnToSupplier_DTO();
  Suppliers: PHRMSupplierModel[] = [];
  ReturnSupplierItem: ReturnToSupplierItem_DTO = new ReturnToSupplierItem_DTO();
  ReturnSupplierItems: ReturnToSupplierItem_DTO[] = [];
  SelectedGeneric: PHRMGenericModel = new PHRMGenericModel();
  GenericList: PHRMGenericModel[] = [];
  FilteredGenericList: PHRMGenericModel[] = [];
  SelectedSupplierWiseItem: SupplierWiseAvailableStock_DTO = new SupplierWiseAvailableStock_DTO()
  SupplierWiseAvailableStocks: SupplierWiseAvailableStock_DTO[] = [];
  FilteredSupplierWiseAvailableStocks: SupplierWiseAvailableStock_DTO[] = [];
  IsInvalidSupplier: boolean = false;
  PreviousFiscalYear: boolean = false;


  constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService, public coreService: CoreService) {
    this.GetSupplierList();
    this.GetGenericList();
    this.GetSupplierWiseAvailableStock();
  }


  GetSupplierList() {
    this.pharmacyBLService.GetSupplierList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.Suppliers = res.Results;
          this.Suppliers = this.Suppliers.filter(s => s.IsActive);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get SupplierList.' + res.ErrorMessage]);
        }
      },
        err => {
          console.error(err);
        }
      );
  }

  SupplierListFormatter(data: any): string {
    let html = data["SupplierName"];
    return html;
  }

  OnSupplierChange() {
    if (this.SelectedSupplier && this.SelectedSupplier.SupplierId) {
      this.FilteredSupplierWiseAvailableStocks = this.SupplierWiseAvailableStocks.filter(a => a.SupplierId === this.SelectedSupplier.SupplierId);
      this.ReturnToSupplier.SupplierId = this.SelectedSupplier.SupplierId;
      this.IsInvalidSupplier = false;
    }
    else {
      this.FilteredSupplierWiseAvailableStocks = [];
      this.ReturnToSupplier.SupplierId = 0;
      this.IsInvalidSupplier = true;
      this.ReturnSupplierItems = [];
      this.ReturnToSupplier = new ReturnToSupplier_DTO();
      this.ReturnToSupplier.ReturnValidator.controls['ReturnDate'].setValue(moment().format('YYYY-MM-DD'));
    }
  }
  GetGenericList() {
    this.pharmacyBLService.GetGenericList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.GenericList = res.Results;
          this.FilteredGenericList = res.Results;
        }
        else {
          console.log(res.ErrorMessage);
        }
      }, err => {
        console.error(err);
      });
  }
  GenericListFormatter(data: any): string {
    let html = "";
    if (data["GenericId"]) {
      html = `<font color='blue'; size=03 >${data["GenericName"]}</font>`;
    }
    return html;
  }

  OnGenericSelect() {
    if (this.SelectedGeneric && this.SelectedGeneric.GenericId) {
      this.ReturnSupplierItem.GenericId = this.SelectedGeneric.GenericId;
      this.FilteredSupplierWiseAvailableStocks = this.SupplierWiseAvailableStocks.filter(a => a.GenericId === this.SelectedGeneric.GenericId)
    }
    else {
      this.ReturnSupplierItem.GenericId = null;
    }
  }

  GetSupplierWiseAvailableStock() {
    this.SupplierWiseAvailableStocks = [];
    this.FilteredSupplierWiseAvailableStocks = [];
    this.pharmacyBLService.GetSupplierWiseAvailableStock()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.SupplierWiseAvailableStocks = res.Results;
        }
        else {
          console.log(res.ErrorMessage);
        }
      },
        err => {
          console.error(err);
        });
  }

  ItemListFormatter(data: any): string {
    let html = "";
    let date = new Date();
    let dateNow = date.setMonth(date.getMonth() + 0);
    let dateThreeMonth = date.setMonth(date.getMonth() + 3);
    if (data["ItemId"]) {
      let expiryDate = new Date(data["ExpiryDate"]);
      let expDate = expiryDate.setMonth(expiryDate.getMonth() + 0);
      if (expDate < dateNow) {
        html = `<font color='crimson'; size=03 >${data["ItemName"]}</font> <b>|Unit|${data["Unit"]}</b> |E:${moment(data["ExpiryDate"]).format('YYYY-MM-DD')} |B.No.|${data["BatchNo"]} |Qty|${data["AvailableQuantity"]} |SalePrice|${data["SalePrice"]} |CostPrice|${data["CostPrice"]}`;
      }
      if (expDate < dateThreeMonth && expDate > dateNow) {

        html = `<font  color='#FFBF00'; size=03 >${data["ItemName"]}</font><b>|Unit|${data["Unit"]}</b> |E:${moment(data["ExpiryDate"]).format('YYYY-MM-DD')} |B.No.|${data["BatchNo"]} |Qty|${data["AvailableQuantity"]} |SalePrice|${data["SalePrice"]} |CostPrice|${data["CostPrice"]}`;
      }
      if (expDate > dateThreeMonth) {
        html = `<font color='blue'; size=03 >${data["ItemName"]}</font><b>|Unit|${data["Unit"]}</b> |E:${moment(data["ExpiryDate"]).format('YYYY-MM-DD')} |B.No.|${data["BatchNo"]} |Qty|${data["AvailableQuantity"]} |SalePrice|${data["SalePrice"]} |CostPrice|${data["CostPrice"]}`;
      }
    }
    else {
      html = data["ItemName"];
    }
    return html;
  }

  OnItemSelect($event: any) {
    if (this.SelectedSupplierWiseItem && this.SelectedSupplierWiseItem.ItemId) {
      this.ReturnSupplierItem = Object.assign(new ReturnToSupplierItem_DTO(), this.SelectedSupplierWiseItem);
      this.ReturnSupplierItem.ReturnCostPrice = this.ReturnSupplierItem.CostPrice;
    }
    else {
      this.ReturnSupplierItem = new ReturnToSupplierItem_DTO();
    }
  }

  ItemLevelCalculation() {
    const item = this.ReturnSupplierItem;

    if (!item.Quantity || !item.ReturnRate) {
      item.SubTotal = 0;
      item.DiscountedAmount = 0;
      item.DiscountPercentage = 0;
      item.VATAmount = 0;
      item.VATPercentage = 0;
      item.TotalAmount = 0;
      return;
    }

    item.SubTotal = CommonFunctions.parseAmount(item.Quantity * item.ReturnRate, 4);

    item.DiscountPercentage = item.DiscountedAmount ? CommonFunctions.parseAmount((item.DiscountedAmount / item.SubTotal) * 100, 4) : 0;

    const VATApplicableAmount = item.SubTotal - (item.DiscountedAmount || 0);

    item.VATPercentage = item.VATAmount ? CommonFunctions.parseAmount((item.VATAmount / VATApplicableAmount) * 100, 4) : 0;

    item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - (item.DiscountedAmount || 0) + (item.VATAmount || 0), 4);
  }


  AddReturnItem() {
    let check: boolean = true;

    for (let i in this.ReturnSupplierItem.ReturnItemsValidator.controls) {
      this.ReturnSupplierItem.ReturnItemsValidator.controls[i].markAsDirty();
      this.ReturnSupplierItem.ReturnItemsValidator.controls[i].updateValueAndValidity();
    }

    if (!this.ReturnSupplierItem.IsValidCheck(undefined, undefined)) {
      check = false;
    }

    if (!check) {
      return;
    }

    if (this.ReturnSupplierItems.some(i => i.ItemId === this.ReturnSupplierItem.ItemId && i.BatchNo === this.ReturnSupplierItem.BatchNo && i.CostPrice === this.ReturnSupplierItem.CostPrice && i.SalePrice === this.ReturnSupplierItem.SalePrice && i.ExpiryDate === this.ReturnSupplierItem.ExpiryDate)) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Duplicate item with same batch, expiry and cost price cannot be added ']);
      return;
    }
    this.ReturnSupplierItems.push(this.ReturnSupplierItem);
    this.ReturnSupplierItem = new ReturnToSupplierItem_DTO();
    this.SelectedGeneric = null;
    this.SelectedSupplierWiseItem = null;
    this.MainLevelCalculation();

  }

  RemoveReturnItem(index: number) {
    this.ReturnSupplierItems.splice(index, 1);
    this.MainLevelCalculation();

  }

  MainLevelCalculation() {
    let subTotal = CommonFunctions.parseAmount(this.ReturnSupplierItems.reduce((a, b) => a + b.SubTotal, 0), 4);
    let discountAmount = CommonFunctions.parseAmount(this.ReturnSupplierItems.reduce((a, b) => a + b.DiscountedAmount, 0), 4);
    let discountPercentage = CommonFunctions.parseAmount((discountAmount / subTotal) * 100, 4)
    let vatAmount = this.ReturnSupplierItems.reduce((a, b) => a + b.VATAmount, 0);
    let vatApplicableAmount = CommonFunctions.parseAmount((subTotal - discountAmount), 4)
    let vatPercentage = CommonFunctions.parseAmount((vatAmount / vatApplicableAmount) * 100, 4)
    let totalAmount = this.ReturnSupplierItems.reduce((a, b) => a + b.TotalAmount, 0);

    this.ReturnToSupplier.SubTotal = subTotal;
    this.ReturnToSupplier.DiscountAmount = discountAmount;
    this.ReturnToSupplier.DiscountPercentage = discountPercentage;
    this.ReturnToSupplier.VATAmount = vatAmount;
    this.ReturnToSupplier.VATPercentage = vatPercentage;
    this.ReturnToSupplier.TotalAmount = totalAmount;
    this.ReturnToSupplier.ReturnToSupplierItems = this.ReturnSupplierItems;
  }

  OnMainLevelDiscountChange(discountAmount: number, discountPercentage: number) {
    let DiscountAmount = 0;
    let DiscountPercentage = 0;

    if (discountPercentage == 0 && discountAmount > 0) {
      DiscountAmount = discountAmount;
      discountPercentage = (discountAmount / this.ReturnToSupplier.SubTotal) * 100;
      DiscountPercentage = discountPercentage;
    }
    if (discountPercentage > 0 && discountAmount == 0) {
      discountAmount = (this.ReturnToSupplier.SubTotal * discountPercentage) / 100;
      DiscountAmount = discountAmount;
      DiscountPercentage = discountPercentage;
    }
    this.ReturnSupplierItems.forEach(item => {
      item.DiscountPercentage = DiscountPercentage;
      item.DiscountedAmount = CommonFunctions.parseAmount(((item.SubTotal * item.DiscountPercentage) / 100), 4);
      const VATApplicableAmount = item.SubTotal - (item.DiscountedAmount || 0);
      if (item.VATPercentage) {
        item.VATAmount = CommonFunctions.parseAmount(VATApplicableAmount * item.VATPercentage / 100, 4);
      }
      else {
        item.VATAmount = 0;
      }
      item.TotalAmount = item.SubTotal - item.DiscountedAmount + item.VATAmount;
    });
    this.MainLevelCalculation();
  }

  OnMainLevelVATChange(vatAmount: number, vatPercentage: number) {
    let VATAmount = 0;
    let VATPercentage = 0;

    const VATApplicableAmount = this.ReturnToSupplier.SubTotal - this.ReturnToSupplier.DiscountAmount;
    if (vatPercentage == 0 && vatAmount > 0) {
      VATAmount = vatAmount;
      vatPercentage = (vatAmount / VATApplicableAmount) * 100;
      VATPercentage = vatPercentage;
    }
    if (vatPercentage > 0 && vatAmount == 0) {
      vatAmount = (VATApplicableAmount * vatPercentage) / 100;
      VATAmount = vatAmount;
      VATPercentage = vatPercentage;
    }

    this.ReturnSupplierItems.forEach(item => {
      item.VATPercentage = VATPercentage;
      if (item.VATPercentage) {
        const VATApplicableAmount = item.SubTotal - item.DiscountedAmount;
        item.VATAmount = CommonFunctions.parseAmount(VATApplicableAmount * item.VATPercentage / 100, 4);
      }
      else {
        item.VATAmount = 0;
      }
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.DiscountedAmount + item.VATAmount, 4);
    });
    this.MainLevelCalculation();
  }

  SaveReturnToSupplier() {
    if (this.IsInvalidSupplier) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select valid supplier.']);
      return;
    }
    if (!this.ReturnToSupplier.ReturnToSupplierItems.length) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No items to return.']);
      return;
    }
    if (this.ReturnToSupplier.ReturnValidator.valid === false) {
      for (let key in this.ReturnToSupplier.ReturnValidator.controls) {
        if (this.ReturnToSupplier.ReturnValidator.controls[key].valid === false) {
          this.ReturnToSupplier.ReturnValidator.controls[key].markAsDirty();
          this.ReturnToSupplier.ReturnValidator.controls[key].updateValueAndValidity();
        }
      }
      return;
    }

    this.ReturnToSupplier.ReturnToSupplierItems.forEach(item => {
      if (item.ReturnItemsValidator.valid === false) {
        for (let key in item.ReturnItemsValidator.controls) {
          if (item.ReturnItemsValidator.controls[key].valid == false) {
            item.ReturnItemsValidator.controls[key].markAsDirty();
            item.ReturnItemsValidator.controls[key].updateValueAndValidity();
          }
        }
        return;
      }
    });

    this.pharmacyBLService.SaveReturnToSupplier(this.ReturnToSupplier).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Return to supplier information saved successfully']);
        this.ReturnToSupplier = new ReturnToSupplier_DTO();
        this.ReturnToSupplier.ReturnValidator.controls['ReturnDate'].setValue(moment().format('YYYY-MM-DD'));
        this.ReturnSupplierItems = new Array<ReturnToSupplierItem_DTO>();
        this.SelectedSupplier = null;
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save return to supplier information.' + res.ErrorMessage]);
        console.log(res.ErrorMessage);
      }
    },
      err => {
        console.error(err);
      });

  }

}
