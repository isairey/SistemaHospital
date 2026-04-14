import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';

import { SecurityService } from '../../security/shared/security.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { InventoryBLService } from "../shared/inventory.bl.service";

import * as moment from 'moment/moment';
import { ActivateInventoryService } from '../../shared/activate-inventory/activate-inventory.service';
import { ItemMaster } from "../shared/item-master.model";
import { WriteOffItems } from "../shared/write-off-items.model";

@Component({

  templateUrl: "write-off-items.component.html"

})
export class WriteOffItemsComponent {

  public SubTotal: number = 0;
  public VAT: number = 0;
  public TotalAmount: number = 0;
  public loading: boolean = false;
  // public itemIdBatchNoMap = new Array<{ ItemId: number, BatchDetail: Array<{ BatchNo: string, ItemPrice: number, AvailableQuantity: number, StockId: number }> }>();
  public currentWriteOffItem: WriteOffItems = new WriteOffItems();
  public currentWO: WriteOffItems = new WriteOffItems();
  public WOItems: Array<WriteOffItems> = new Array<WriteOffItems>();
  //this Item is used for search button(means auto complete button)...
  public ItemList: any;

  public checkIsItemPresent: boolean = false;
  StoreId: number;


  constructor(public changeDetectorRef: ChangeDetectorRef, public InventoryBLService: InventoryBLService,
    public router: Router,
    public securityService: SecurityService,
    public messageBoxService: MessageboxService,
    private _activateInventoryService: ActivateInventoryService) {
    //Create one empty record first time
    this.WOItems.push(this.currentWriteOffItem);
    this.StoreId = this._activateInventoryService.activeInventory.StoreId;
    this.LoadItemList();
  }
  //to load the item in the start
  LoadItemList(): void {
    this.InventoryBLService.GetAvailableQtyItemList(this.StoreId)
      .subscribe(res => this.CallBackAvailableQtyItemList(res));
  }
  //Load all Items which has Available Qty > 0
  CallBackAvailableQtyItemList(res) {
    if (res.Status == 'OK') {
      this.ItemList = [];
      if (res && res.Results) {
        res.Results.forEach(a => {
          this.ItemList.push({
            "ItemId": a.ItemId, "ItemName": a.ItemName, "Description": a.Description, VAT: a.VAT, StandardRate: a.Rate, "Code": a.Code, "AvailableQuantity": a.AvailableQuantity, "StockId": a.StockId
          });
        });
      }
      this.setFocusById('itemName0');
    }
    else {
      err => {
        this.messageBoxService.showMessage("failed", ['failed to get Item.. please check log for details.']);

        this.logError(err.ErrorMessage);
      }
    }
  }

  //add a new row
  AddRowRequest(index: number) {
    this.currentWriteOffItem = new WriteOffItems();
    this.WOItems.push(this.currentWriteOffItem);
    this.setFocusById('itemName' + index);
  }
  //to delete the row
  DeleteRow(index) {
    //this will remove the data from the array
    this.WOItems.splice(index, 1);
    // if the index is 0 then ..
    if (index == 0) {
      this.currentWriteOffItem = new WriteOffItems();
      this.WOItems.push(this.currentWriteOffItem);
      this.changeDetectorRef.detectChanges();
    }
    else {
      this.changeDetectorRef.detectChanges();
    }
  }

  SelectItemFromSearchBox(Item: ItemMaster, index) {
    //if proper item is selected then the below code runs ..othewise it goes out side the function
    if (typeof Item === "object" && !Array.isArray(Item) && Item !== null) {

      for (var a = 0; a < this.WOItems.length; a++) {
        // Assiging the value StandardRate,VatPercentage and ItemId in the particular index ..
        //it helps for changing item after adding the item and also in adding in new item
        if (a == index) {
          this.WOItems[index].VAT = Item.VAT;
          this.WOItems[index].ItemId = Item.ItemId;
          this.WOItems[index].AvailableQty = Item.AvailableQuantity;
          this.WOItems[index].Code = Item.Code;
          this.WOItems[index].ItemRate = Item.StandardRate;
          this.WOItems[index].StockId = this.ItemList.find(i => i.ItemId == Item.ItemId).StockId;
        }
      }
    }
    else {
      this.WOItems[index].ItemRate = 0;
      this.WOItems[index].VAT = 0
      this.WOItems[index].ItemId = 0
      this.WOItems[index].BatchNo = null;
      this.WOItems[index].AvailableQty = 0;
    }
  }
  //used to format display item in ng-autocomplete
  myListFormatter(data: any): string {
    let html = "<b>" + data["ItemName"] + "</b>" + "(Rate:" + data["StandardRate"] + ")";
    html += (data["Description"] == null || data["Description"] == "") ? "" : ("|" + data["Description"]);
    return html;
  }

  //All calculation done from here
  CalculationAll(index) {
    //check if Itemrate is  null or  0 -If yes then don't do any operation or calculation
    if (this.WOItems[index].ItemRate != null && this.WOItems[index].ItemRate > 0) {
      let vat = 0;
      let subtotal = 0;
      let totalamount = 0;
      this.WOItems[index].SubTotal = this.WOItems[index].ItemRate * this.WOItems[index].WriteOffQuantity;
      this.WOItems[index].TotalAmount = ((this.WOItems[index].VAT * this.WOItems[index].SubTotal) / 100) + this.WOItems[index].SubTotal;
      for (var i = 0; i < this.WOItems.length; i++) {
        subtotal = subtotal + this.WOItems[i].SubTotal;
        vat = Math.round(vat + (this.WOItems[i].TotalAmount - this.WOItems[i].SubTotal));
        totalamount = subtotal + vat;

      }
      this.SubTotal = subtotal;
      this.TotalAmount = totalamount;
      this.VAT = vat;
    }

  }


  //Save WriteOff Transaction to Database with checking validation part
  AddWriteOffItems() {
    if (this.WOItems != null) {

      //checking Validation
      let CheckIsValid = true;
      let CheckValidQty = true;

      for (var i = 0; i < this.WOItems.length; i++) {
        for (var x in this.WOItems[i].WriteOffItemValidator.controls) {
          this.WOItems[i].WriteOffItemValidator.controls[x].markAsDirty();
          this.WOItems[i].WriteOffItemValidator.controls[x].updateValueAndValidity();
        }

        //This is for check every item from itemsToReturn is valid or not (itemsToReturn is Array of WriteOffItems)
        if (this.WOItems[i].IsValidCheck(undefined, undefined) == false) { CheckIsValid = false; }

        //Assign CreatedOn and CreatedBy value
        this.WOItems[i].CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        this.WOItems[i].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;

        //for checking  quantity is less than available quantity
        if (this.WOItems[i].AvailableQty < this.WOItems[i].WriteOffQuantity || this.WOItems[i].AvailableQty == 0) {
          CheckValidQty = false;
        }

        //if (this.WOItems[i].WriteOffQuantity == 0) {
        //    //this will remove the data from the array
        //    this.WOItems.splice(i, 1);
        //}
      }

      //Validation Pass then Post WriteOff Transaction and Save
      if ((CheckIsValid && CheckValidQty) && this.WOItems.length > 0) {
        this.loading = true;

        if (!this._activateInventoryService.activeInventory.StoreId) {
          this.messageBoxService.showMessage("Alert!", ["Cannot find StoreId. Please select Inventory First"])
          return;
        } else {
          this.WOItems.forEach(a => a.StoreId = this._activateInventoryService.activeInventory.StoreId);
        }

        this.InventoryBLService.PostToWriteOffItems(this.WOItems)
          .subscribe(
            res => {
              this.CallBackSaveWriteOffItems(res),
                this.loading = false;
            },
            err => {
              this.loading = false,
                this.logError(err);

            });
      } else {
        let warningStr = CheckValidQty == false ? this.messageBoxService.showMessage("notice-message", ['Please Enter valid write Off quantity']) : 'Please fill value';

      }
    }
    else {

      this.messageBoxService.showMessage("notice-message", ["Add Item ...Before Requesting"]);
    }

  }
  //after post data to server
  CallBackSaveWriteOffItems(res) {
    if (res.Status == "OK") {
      this.messageBoxService.showMessage("success", ["Write-Off Successfully Done."]);
      //this.loading = false;
      //this.currentWriteOffItem = new WriteOffItems();
      //this.currentWO = new WriteOffItems();
      //this.WOItems = new Array<WriteOffItems>();
      //this.currentWriteOffItem = new WriteOffItems();
      //this.WOItems.push(this.currentWriteOffItem);
      //this.itemIdBatchNoMap = new Array<{ ItemId: number, BatchDetail: Array<{ BatchNo: string, ItemPrice: number, AvailableQuantity: number }> }>();
      //this.LoadItemList();
      this.router.navigate(['/Inventory/InternalMain/WriteOffItemsList']);

    }
    else {
      this.messageBoxService.showMessage("failed", [res.ErrorMessage]);
      this.loading = false;
    }
  }

  //this is to cancel the whole PO at one go and adding new PO
  Cancel() {
    this.WOItems = new Array<WriteOffItems>();
    this.currentWriteOffItem = new WriteOffItems();
    this.WOItems.push(this.currentWriteOffItem);
    this.CalculationAll(0);
  }

  logError(err: any) {
    console.log(err);
  }

  public hideScroll() {
    //x.style.overflow = "inherit";
    var d = document.getElementById('tableIdResponsive');
    d.style.overflow = "inherit";
  }

  public removeScroll() {
    var d = document.getElementById('tableIdResponsive');
    d.style.overflow = "auto";
  }

  GoToNextInput(idToSelect: string, Item?: any, index?: number) {
    if (document.getElementById(idToSelect) && Item) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
      nextEl.select();
    }
    else {
      this.DeleteRow(index);
      idToSelect = 'Request';
      if (document.getElementById(idToSelect)) {
        let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
        nextEl.focus();
        nextEl.select();
      }
    }
  }

  setFocusById(targetId: string, waitingTimeinMS: number = 10) {
    var timer = window.setTimeout(function () {
      let htmlObject = document.getElementById(targetId);
      if (htmlObject) {
        htmlObject.focus();
      }
      clearTimeout(timer);
    }, waitingTimeinMS);
  }
}
