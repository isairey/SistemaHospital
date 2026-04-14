import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { Observable } from 'rxjs-compat/Observable';
import { InventoryService } from '../../../inventory/shared/inventory.service';
import { SecurityService } from '../../../security/shared/security.service';
import { CallbackService } from '../../../shared/callback.service';
import { ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { WardInventoryConsumptionModel } from '../../shared/ward-inventory-consumption.model';
import { WardSupplyBLService } from '../../shared/wardsupply.bl.service';
import { InvPatientConsumptionModel } from './inv-patient-consumption.model';
import { wardsupplyService } from '../../shared/wardsupply.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';


@Component({
  templateUrl: "./inventory-ward-patient-consumption.html"
})
export class InventoryPatientConsumptionComponent {
  public CurrentStoreId: number = 0;
  public ConsumptionDate: string = moment().format('YYYY-MM-DD HH:mm:ss');
  public ItemTypeListWithItems: Array<any> = [];
  public SelectedItemList: Array<WardInventoryConsumptionModel> = new Array<WardInventoryConsumptionModel>();
  public IsShowConsumption: boolean = true;
  public TotalConsumption: any;
  public WardConsumption: WardInventoryConsumptionModel = new WardInventoryConsumptionModel();
  public loading: boolean = false;
  //public currentCounterId: number = 0;

  public ValidPatient: boolean = true;
  public SelectedPatient: any;
  public PatientConsumptionReceipt: InvPatientConsumptionModel = new InvPatientConsumptionModel();
  AllowPreviousFiscalYear: boolean = false;
  constructor(
    public wardBLService: WardSupplyBLService,
    public messageBoxService: MessageboxService,
    public securityService: SecurityService,
    public router: Router,
    public callBackService: CallbackService,
    public inventoryService: InventoryService,
    public wardSupplyService: wardsupplyService,
  ) {
    this.CheckForSubStoreActivation();
    this.FocusElementById('srch_PatientList')
  }
  CheckForSubStoreActivation() {
    this.CurrentStoreId = this.securityService.getActiveStore().StoreId;
    try {
      if (!this.CurrentStoreId) {
        this.router.navigate(['/WardSupply']);
      }
      else {
        this.GetInventoryStockDetailsList();
        this.SelectedItemList = new Array<WardInventoryConsumptionModel>();
        this.PatientConsumptionReceipt = new InvPatientConsumptionModel();
        this.AddRow();
      }
    } catch (exception) {
      this.messageBoxService.showMessage("Error", [exception]);
    }
  }
  GetInventoryStockDetailsList() {
    try {
      this.wardBLService.GetInventoryItemsForPatConsumptionByStoreId(this.CurrentStoreId)
        .subscribe(res => {
          if (res.Status == "OK") {
            if (res.Results.length) {
              this.ItemTypeListWithItems = [];
              this.ItemTypeListWithItems = res.Results;
              this.ItemTypeListWithItems = this.ItemTypeListWithItems.filter(item => item.Quantity > 0 && item.ItemType == "Consumables");
              if (this.ItemTypeListWithItems.length == 0) { this.messageBoxService.showMessage("Failed", ["No Stock Available. Please Add Stock."]); }
            }
            else {
              this.messageBoxService.showMessage("Failed", ["No Stock Available. Please Add Stock."]);
            }
          }
        });

    } catch (exception) {
      this.messageBoxService.showMessage("Error", [exception]);
    }
  }
  GetAvailableQuantity(itm) {
    try {
      return this.ItemTypeListWithItems.find(a => a.ItemId == itm.ItemId).Quantity;
    }
    catch (ex) {
      this.messageBoxService.showMessage("Error", ['Quantity not available!!']);
      return 0;
    }
  }
  //used to format display of item in ng-autocomplete
  ItemListFormatter(data: any): string {
    let html = data["ItemName"] + '|Qty:' + data["Quantity"];
    html += (data["Description"] == null || data["Description"] == "") ? "" : ("|" + data["Description"]);
    return html;
  }
  onChangeItem($event, index) {
    let checkIsItemPresent = false;
    if (this.SelectedItemList.find(a => a.ItemId == $event.ItemId)) {
      checkIsItemPresent = true;
    }
    if (checkIsItemPresent == false) {
      this.SelectedItemList[index].ItemId = $event.ItemId;
      this.SelectedItemList[index].Quantity = this.GetAvailableQuantity(this.SelectedItemList[index]);
      this.SelectedItemList[index].ItemName = $event.ItemName;
      this.SelectedItemList[index].Code = $event.Code;
      this.SelectedItemList[index].UOMName = $event.UOMName;
      this.SelectedItemList[index].DepartmentName = $event.DepartmentName;
      this.SelectedItemList[index].UsedBy = this.securityService.GetLoggedInUser().UserName;
      this.SelectedItemList[index].StockId = $event.StockId
      this.SelectedItemList[index].CostPrice = $event.CostPrice
      this.SelectedItemList[index].MRP = $event.MRP;
      this.SelectedItemList[index].BatchNo = $event.BatchNo;
      this.SelectedItemList[index].ExpiryDate = $event.ExpiryDate;

    }
    else {
      this.messageBoxService.showMessage("Error", ["Item is already present in the list"]);
      this.AddRow(index);
      this.FocusElementById("itemName" + index);
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
      this.messageBoxService.showMessage("Error", [exception]);
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
      this.messageBoxService.showMessage("Error", [exception]);
    }
  }
  FocusElementById(id: string) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }

  Save() {
    let check = true;
    if (!this.ConsumptionDate) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Consumption Date is required"]);
      check = false;
      return;
    }
    if (typeof (this.SelectedPatient) == 'string' || !this.SelectedPatient) {
      this.messageBoxService.showMessage("Warning", ["Select Patient First! Its required!"]);
      this.ValidPatient = false;
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
      this.loading = true;
      for (var j = 0; j < this.SelectedItemList.length; j++) {
        this.SelectedItemList[j].StoreId = this.CurrentStoreId;
        this.SelectedItemList[j].ConsumptionDate = this.ConsumptionDate;
        this.SelectedItemList[j].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      }
      this.AssignPatConsumptionReceipt();
      this.wardBLService.PostInventoryPatConsumptionData(this.PatientConsumptionReceipt)
        .subscribe(res => {
          if (res.Status == "OK" && res.Results != null) {
            this.messageBoxService.showMessage("Success", ['Consumption completed']);
            this.loading = false;
            this.DiscardChanges();
          }
          else if (res.Status == "Failed") {
            this.loading = false;
            this.messageBoxService.showMessage("Error", ['There is problem, please try again']);

          }
        },
          err => {
            this.loading = false;
            this.messageBoxService.showMessage("Error", [err.error.ErrorMessage]);
          });
    }
  }
  DiscardChanges() {
    this.IsShowConsumption = false;
    this.WardConsumption = new WardInventoryConsumptionModel();
    this.ShowConsumptionPage();
  }
  ShowConsumptionPage() {
    this.router.navigate(['/WardSupply/Inventory/PatientConsumption']);
  }
  GoToNextInput(idToSelect: string) {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
      nextEl.select();
    }
  }


  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + '' + "</b></font>";
    return html;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {

    return this.wardBLService.GetAllPatients(keyword);

  }

  public PatientInfoChanged() {
    this.ValidPatient = true;
  }

  public AssignPatConsumptionReceipt() {
    this.PatientConsumptionReceipt.ConsumptionDate = this.ConsumptionDate;
    this.PatientConsumptionReceipt.PatientId = this.SelectedPatient.PatientId;
    this.PatientConsumptionReceipt.StoreId = this.CurrentStoreId;
    this.PatientConsumptionReceipt.ConsumptionList = this.SelectedItemList;
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
        this.SelectedItemList.splice(index, 1);
        this.FocusElementById('save');
      }
    }
  }
}
