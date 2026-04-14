import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { InventoryBLService } from '../../../inventory/shared/inventory.bl.service';
import { InventoryService } from '../../../inventory/shared/inventory.service';
import { SecurityService } from '../../../security/shared/security.service';
import { CallbackService } from '../../../shared/callback.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { WardConsumptionType } from '../../shared/ward-consumption-types.model';
import { WardInventoryConsumptionModel } from '../../shared/ward-inventory-consumption.model';
import { WardSupplyBLService } from '../../shared/wardsupply.bl.service';
import { wardsupplyService } from '../../shared/wardsupply.service';


@Component({
  templateUrl: "./inventory-ward-consumption.html" // "/Inventory/Consumption"
})
export class InventoryConsumptionComponent {
  public CurrentStoreId: number = 0;
  public ConsumptionDate: string = moment().format('YYYY-MM-DD HH:mm:ss');
  public ItemTypeListWithItems: Array<any> = new Array<any>();
  public SelectedItemList: Array<WardInventoryConsumptionModel> = new Array<WardInventoryConsumptionModel>();
  public IsShowConsumption: boolean = true;
  public TotalConsumption: any;
  public WardConsumption: WardInventoryConsumptionModel = new WardInventoryConsumptionModel();
  public loading: boolean = false;
  loadingScreen: boolean = false;
  public SubCategoryId: number = 0;
  //public currentCounterId: number = 0;
  ConsumptionTypes: WardConsumptionType[] = [];
  ShowAddConsumptionPopupPage: boolean = false;
  SelectedConsumptionType: WardConsumptionType = new WardConsumptionType();
  ConsumptionTypeId: number = null;

  AllowPreviousFiscalYear: boolean = false;

  constructor(
    public wardBLService: WardSupplyBLService,
    public messageboxService: MessageboxService,
    public securityService: SecurityService,
    public router: Router,
    public callBackService: CallbackService,
    public inventoryService: InventoryService,
    public wardSupplyService: wardsupplyService,
    public inventoryBLService: InventoryBLService
  ) {
    this.CheckForSubstoreActivation();
    this.GetConsumptionTypes();
  }
  CheckForSubstoreActivation() {
    this.CurrentStoreId = this.securityService.getActiveStore().StoreId;
    try {
      if (!this.CurrentStoreId) {
        //routeback to substore selection page.
        this.router.navigate(['/WardSupply']);
      }
      else {
        this.ItemTypeListWithItems = this.wardSupplyService.inventoryStockList;
        this.ItemTypeListWithItems = this.ItemTypeListWithItems.filter(a => a.ItemType == 'Consumables');
        this.SelectedItemList = new Array<WardInventoryConsumptionModel>();
        this.AddRow();
        //write whatever is need to be initialise in constructor here.
      }
    } catch (exception) {
      this.messageboxService.showMessage("Error", [exception]);
    }
  }
  //get wardsupply stock list - sanjit 17feb2019   //this method is not used. --Rohit 22Mar2022
  public GetInventoryStockDetailsList() {
    try {
      this.wardBLService.GetInventoryStockByStoreId(this.CurrentStoreId)
        .subscribe(res => {
          if (res.Status == "OK") {
            if (res.Results.length) {
              this.ItemTypeListWithItems = [];
              this.ItemTypeListWithItems = res.Results;

              this.ItemTypeListWithItems = this.ItemTypeListWithItems.filter(item => item.AvailableQuantity > 0 && item.ItemType == "Consumables");
              if (this.ItemTypeListWithItems == undefined) {
                this.messageboxService.showMessage("Failed", ["No Stock Available. Please Add Stock."]);
              }
            }
            else {
              this.messageboxService.showMessage("Failed", ["No Stock Available. Please Add Stock."]);
            }
          }
        });

    } catch (exception) {
      this.messageboxService.showMessage("Error", [exception]);
    }
  }
  GetAvailableQuantity(itm) {
    try {
      return this.ItemTypeListWithItems.find(a => a.ItemId == itm.ItemId && a.CostPrice == itm.CostPrice && a.Code == itm.Code).AvailableQuantity;
    }
    catch (ex) {
      this.messageboxService.showMessage("Error", ['Quantity not available!!']);
      return 0;
    }
  }
  //used to format display of item in ng-autocomplete
  ItemListFormatter(data: any): string {
    let html = data["ItemName"] + '|Qty:' + data["AvailableQuantity"] + '|ItemCode:' + data["Code"] + '|CostPrice:' + data["CostPrice"];
    html += (data["Description"] == null || data["Description"] == "") ? "" : ("|" + data["Description"]);
    return html;
  }
  onChangeItem($event, index) {
    try {
      if ($event && typeof ($event) === 'object') {
        let checkIsItemPresent: Boolean = false;
        if (this.SelectedItemList.find(a => a.ItemId == $event.ItemId && $event.CostPrice == a.CostPrice && a.Code == $event.Code)) {
          checkIsItemPresent = true;
        }
        if (checkIsItemPresent) {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [$event.ItemName + " is already added..Please Check!!!"]);
          this.SelectedItemList[index].SelectedItem = null;
          checkIsItemPresent = false;
        }
        else {
          this.SelectedItemList[index].ItemId = $event.ItemId;
          this.SelectedItemList[index].CostPrice = $event.CostPrice;
          this.SelectedItemList[index].Code = $event.Code;
          this.SelectedItemList[index].Quantity = this.GetAvailableQuantity(this.SelectedItemList[index]);
          this.SelectedItemList[index].ItemName = $event.ItemName;
          this.SelectedItemList[index].UOMName = $event.UOMName;
          this.SelectedItemList[index].DepartmentName = $event.DepartmentName;
          this.SelectedItemList[index].UsedBy = this.securityService.GetLoggedInUser().UserName;
          this.SelectedItemList[index].StockId = $event.StockId;
          this.SelectedItemList[index].MRP = $event.MRP;
          this.SelectedItemList[index].BatchNo = $event.BatchNo;
          this.SelectedItemList[index].ExpiryDate = $event.ExpiryDate;

        }
      } else {
        this.SelectedItemList[index] = new WardInventoryConsumptionModel();
      }
    }
    catch (exception) {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, [exception]);
    }

  }

  DeleteRow(index) {
    try {
      this.SelectedItemList.splice(index, 1);
      if (this.SelectedItemList.length == 0) {
        this.AddRow();
      }
    }
    catch (exception) {
      this.messageboxService.showMessage("Error", [exception]);
    }
  }
  AddRow(index?) {
    try {
      var tempSale: WardInventoryConsumptionModel = new WardInventoryConsumptionModel();
      if (index == null) {
        this.SelectedItemList.push(tempSale);
      }
      else {
        this.SelectedItemList.splice(index, 1, tempSale);
      }

      let len = this.SelectedItemList.length - 1;
      this.FocusElementById("itemName" + len);
    }
    catch (exception) {
      this.messageboxService.showMessage("Error", [exception]);
    }
  }
  private FocusElementById(id: string) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }

  Save() {
    let check = true;
    // if(this.IsConsumptionDateValid() == false){
    //   check = false;
    //   alert("Invalid Fiscal Year Date Assigned to Consumption Date.")
    // }
    if (!this.ConsumptionDate) {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, ['Consumption Date should be valid']);
      return;
    }
    for (var j = 0; j < this.SelectedItemList.length; j++) {
      if (this.SelectedItemList[j].ConsumeQuantity > this.SelectedItemList[j].Quantity) {
        check = false;
        alert("Consume Quantity is greater than Available Quantity.")
        break;
      }
      for (var i in this.SelectedItemList[j].ConsumptionValidator.controls) {
        this.SelectedItemList[j].ConsumptionValidator.controls[i].markAsDirty();
        this.SelectedItemList[j].ConsumptionValidator.controls[i].updateValueAndValidity();
      }
      if (!this.SelectedItemList[j].IsValid(undefined, undefined)) {
        check = false;
        break;
      }
      if (this.SelectedItemList[j].ItemId == 0 || this.SelectedItemList == null) {
        check = false;
        alert("Select Item.");
        break;
      }
    }
    if (check) {
      for (let j = 0; j < this.SelectedItemList.length; j++) {
        this.SelectedItemList[j].StoreId = this.CurrentStoreId;
        this.SelectedItemList[j].ConsumptionDate = this.ConsumptionDate;
        this.SelectedItemList[j].Remark = this.WardConsumption.Remark;
        this.SelectedItemList[j].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
        this.SelectedItemList[j].ConsumptionTypeId = this.ConsumptionTypeId;
      }
      let IsConsumptionTypeInvalid = this.SelectedItemList.some(item => item.ConsumptionTypeId === 0 || item.ConsumptionTypeId === null);
      if (IsConsumptionTypeInvalid) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['Consumption type is mandatory']);
        return;
      }
      this.loading = true;
      this.wardBLService.PostInventoryConsumptionData(this.SelectedItemList)
        .subscribe(res => {
          if (res.Status == "OK" && res.Results != null) {
            this.loading = false;
            this.ReloadStock();
          }
          else if (res.Status == "Failed") {
            this.loading = false;
            this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['There is problem, please try again ' + res.ErrorMessage]);

          }
        },
          err => {
            this.loading = false;
            this.messageboxService.showMessage("Error", [err.ErrorMessage]);
          });
    }
  }
  DiscardChanges() {
    this.IsShowConsumption = false;
    this.WardConsumption = new WardInventoryConsumptionModel();
    this.ShowConsumptionPage();
  }

  ReloadStock() {
    this.loadingScreen = true;
    this.wardBLService.GetInventoryStockByStoreId(this.CurrentStoreId)
      .finally(() => { this.loadingScreen = false; })
      .subscribe(res => {
        if (res.Status == "OK") {
          this.wardSupplyService.inventoryStockList = res.Results;
          this.DiscardChanges();
          this.messageboxService.showMessage("Success", ['Consumption completed']); //* INFO: Rohit: 1Nov'22, This message ma seem irrelevant here, but this message neeeds to be displayed after the stock reload process hence done here.
        }
        else {
          this.messageboxService.showMessage("Failed", ['Please see console for more information']);
          console.log(res.ErrorMessage);
        }
      })
  }
  ShowConsumptionPage() {
    this.router.navigate(['/WardSupply/Inventory/Consumption/ConsumptionList']);
  }

  GoToNextInput(idToSelect: string) {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
      nextEl.select();
    }
  }
  OnPressedEnterKeyInItemField(index) {
    if (this.SelectedItemList[index].SelectedItem != null && this.SelectedItemList[index].ItemId != 0) {
      this.FocusElementById(`qtyip${index}`);
    }
    else {
      if (this.SelectedItemList.length == 1) {
        this.FocusElementById('itemName0')
      }
      else {
        // this.SelectedItemList.splice(index, 1);
        this.FocusElementById('save');
      }

    }
  }
  // public IsConsumptionDateValid() : boolean{
  //   return this.inventoryService.allFiscalYearList.some( fy => (fy.IsClosed == null || fy.IsClosed == false) && moment(this.ConsumptionDate).isBetween(fy.StartDate,fy.EndDate));
  // }
  GetConsumptionTypes() {
    this.wardBLService.GetActiveConsumptionTypes().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ConsumptionTypes = res.Results;
      }
    },
      err => {
        console.log(err.ErrorMessage);
      })
  }

  ShowConsumptionAddPage() {
    this.ShowAddConsumptionPopupPage = true;
  }

  CloseConsumptionAddPage() {
    this.ShowAddConsumptionPopupPage = false;
  }


  CloseAddConsumptionTypePopupPage($event) {
    if ($event && $event.data) {
      switch ($event.action) {
        case 'add':
          this.ConsumptionTypes.unshift($event.data);
          this.ConsumptionTypes = this.ConsumptionTypes.slice();
          this.SelectedConsumptionType = $event.data;
          if (this.SelectedConsumptionType && this.SelectedConsumptionType.ConsumptionTypeId) {
            this.ConsumptionTypeId = this.SelectedConsumptionType.ConsumptionTypeId;
          }
          break;
        default:
          break;
      }
    }
    this.ShowAddConsumptionPopupPage = false;
  }

  OnConsumptionTypeChange() {
    if (this.SelectedConsumptionType && this.SelectedConsumptionType.ConsumptionTypeId) {
      this.ConsumptionTypeId = this.SelectedConsumptionType.ConsumptionTypeId;
    }
    else {
      this.ConsumptionTypeId = null;
    }
  }


  ConsumptionTypeFormatter(data): string {
    return data["ConsumptionTypeName"];
  }
}
