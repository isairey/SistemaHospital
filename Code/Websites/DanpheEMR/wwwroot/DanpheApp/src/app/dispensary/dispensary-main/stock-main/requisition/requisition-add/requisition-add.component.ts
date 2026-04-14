import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { CoreBLService } from '../../../../../core/shared/core.bl.service';
import { PharmacyBLService } from '../../../../../pharmacy/shared/pharmacy.bl.service';
import { PharmacyService } from '../../../../../pharmacy/shared/pharmacy.service';
import { PHRMGenericModel } from '../../../../../pharmacy/shared/phrm-generic.model';
import { PHRMStoreRequisitionItems } from '../../../../../pharmacy/shared/phrm-store-requisition-items.model';
import { PHRMStoreRequisition } from '../../../../../pharmacy/shared/phrm-store-requisition.model';
import { PHRMStoreModel } from '../../../../../pharmacy/shared/phrm-store.model';
import { SecurityService } from '../../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../../shared/common-models';
import { MessageboxService } from '../../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../../shared/shared-enums';
import { DispensaryService } from '../../../../shared/dispensary.service';
import { DispensaryRequisitionService } from '../dispensary-requisition.service';

@Component({
  selector: 'app-requisition-add',
  templateUrl: './requisition-add.component.html',
  styleUrls: ['./requisition-add.component.css']
})
export class RequisitionAddComponent implements OnInit {
  public currentRequItem: PHRMStoreRequisitionItems = new PHRMStoreRequisitionItems();
  public requisition: PHRMStoreRequisition = new PHRMStoreRequisition();
  ////this Item is used for search button(means auto complete button)...
  public ItemList: any[] = [];
  public checkIsItemPresent: boolean = false;
  public currentActiveDispensary: PHRMStoreModel;
  public isCurrentDispensaryInsurance: boolean = false;
  public loading: boolean = false;
  public GenericList: PHRMGenericModel[] = [];
  AllowPreviousFiscalYear: boolean = false;

  constructor(private _dispensaryService: DispensaryService,
    public dispensaryRequisitionService: DispensaryRequisitionService,
    public changeDetectorRef: ChangeDetectorRef,
    public phrmBLService: PharmacyBLService,
    public phrmService: PharmacyService,
    public securityService: SecurityService,
    public router: Router,
    public messageBoxService: MessageboxService,
    public coreBLService: CoreBLService) {
    ////pushing currentPOItem for the first Row in UI 
    this.currentActiveDispensary = this._dispensaryService.activeDispensary;
    this.isCurrentDispensaryInsurance = this._dispensaryService.isInsuranceDispensarySelected;
    this.LoadItemList();
    this.GetGenericList();
  }
  ngOnInit(): void {
    // this.setFocusById(`itemName${0}`);
    // this.AddRowRequest();
  }
  LoadItemList(): void {
    this.loading = true;
    this.dispensaryRequisitionService.GetItemsForRequisition(this.isCurrentDispensaryInsurance)
      .finally(() => this.loading = false)
      .subscribe(res => {
        if (res.Status == 'OK') {
          this.ItemList = res.Results.ItemList;
          this.ItemList = this.ItemList.filter(a => a.IsActive == true);
          //this.setFocusById(`itemName${0}`);
          this.AddRowRequest();
        }
        else {
          err => {
            this.messageBoxService.showMessage("failed", ['failed to get Item.. please check log for details.']);
            this.logError(err.ErrorMessage);
          }
        }
      });
  }
  ////add a new row 
  AddRowRequest() {
    for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
      // for loop is used to show RequisitionItemValidator message ..if required  field is not filled
      for (var a in this.requisition.RequisitionItems[i].RequisitionItemValidator.controls) {
        this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].markAsDirty();
        this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].updateValueAndValidity();
      }
    }
    this.currentRequItem = new PHRMStoreRequisitionItems();
    this.currentRequItem.Quantity = 1;
    this.currentRequItem.FilteredItemList = this.ItemList;
    this.requisition.RequisitionItems.push(this.currentRequItem);
    this.setFocusById('generic' + i);
  }
  DeleteRow(index) {
    //this will remove the data from the array
    this.requisition.RequisitionItems.splice(index, 1);
    // if the index is 0 then ..  currentPOItem is pushhed in POItems to show the textboxes
    if (index == 0) {
      this.AddRowRequest();
    }
  }

  OnItemSelected(Item: any, index) {
    if (typeof Item === "string" && !Array.isArray(Item) && Item !== null) {
      Item = this.ItemList.find(a => a.ItemName == Item);
      if (Item != undefined) this.requisition.RequisitionItems[index].SelectedItem = Item;
    }
    if (typeof Item === "object" && !Array.isArray(Item) && Item !== null) {
      for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
        if (this.requisition.RequisitionItems[i].ItemId == Item.ItemId && i != index) {
          this.checkIsItemPresent = true;
        }
      }
      //id item is present the it show alert otherwise it assign the value
      if (this.checkIsItemPresent == true) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [Item.ItemName + " is already added..Please Check!!!"]);
        this.checkIsItemPresent = false;
        this.requisition.RequisitionItems.splice(index, 1);
        this.AddRowRequest();
      }
      else {
        this.requisition.RequisitionItems[index].ItemId = Item.ItemId;
        this.requisition.RequisitionItems[index].selectedGeneneric = this.GenericList.find(g => g.GenericId === Item.GenericId);
        this.requisition.RequisitionItems[index].ItemCode = Item.ItemCode;
        this.requisition.RequisitionItems[index].AvailableQuantity = Item.AvailableQuantity;
        this.requisition.RequisitionItems[index].BatchNo = Item.BatchNo;
        this.requisition.RequisitionItems[index].UOMName = Item.UOMName;
      }
    }
    else {
      this.requisition.RequisitionItems[index].ItemId = null;
    }
  }
  ////used to format display item in ng-autocomplete
  // itemListFormatter(data: any): string {
  //   let html = `<font color='blue'; size=03 >${data["ItemName"]}</font> (<i>${data["GenericName"]}</i>)`;
  //   return html;
  // }
  ItemListFormatter(data: any): string {
    let html = "";
    let todaysDate = new Date();
    todaysDate.setMonth(todaysDate.getMonth() + 3);
    let expiryDate = new Date(data["ExpiryDate"]);
    if (expiryDate < todaysDate) {
      html = `<font color='crimson'; size=03 >${data["ItemName"]}</font> <b>|Unit |${data["UOMName"]}</b> |Qty|${data["AvailableQuantity"]}`;
    }
    else {
      html = `<font color='blue'; size=03 >${data["ItemName"]}</font> <b>|Unit |${data["UOMName"]}</b>|Qty|${data["AvailableQuantity"]}`;
    }
    return html;
  }

  AddRequisition() {
    // this CheckIsValid varibale is used to check whether all the validation are proper or not ..
    //if the CheckIsValid == true the validation is proper else no
    var CheckIsValid = true;
    var errorMessages: string[] = [];
    if (this.requisition.IsValidCheck(undefined, undefined) == false) {
      // for loop is used to show RequisitionValidator message ..if required  field is not filled
      for (var a in this.requisition.RequisitionValidator.controls) {
        this.requisition.RequisitionValidator.controls[a].markAsDirty();
        this.requisition.RequisitionValidator.controls[a].updateValueAndValidity();
      }
      CheckIsValid = false;
      errorMessages.push(`Invalid Requisition Date`);
    }
    for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
      if (this.requisition.RequisitionItems[i].IsValidCheck(undefined, undefined) == false) {

        // for loop is used to show RequisitionItemValidator message ..if required  field is not filled
        for (var a in this.requisition.RequisitionItems[i].RequisitionItemValidator.controls) {
          this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].markAsDirty();
          this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].updateValueAndValidity();
          if (this.requisition.RequisitionItems[i].RequisitionItemValidator.controls[a].invalid) {
            errorMessages.push(`${a} is not valid for item ${i + 1}.`)
          }
        }
        CheckIsValid = false;
      }
      if (this.requisition.RequisitionItems[i].ItemId == null) {
        CheckIsValid = false;
        errorMessages.push(`Item ${i + 1} is not a valid item.`);
      }
    }

    if (CheckIsValid == true && this.requisition.RequisitionItems != null) {
      //Updating the Status
      this.requisition.RequisitionStatus = "active";
      //this.requisition.RequisitionDate = moment(this.requisition.RequisitionDate).format('YYYY-MM-DD') + ' ' + moment().format('HH:mm:ss.SSS')
      this.requisition.StoreId = this.currentActiveDispensary.StoreId;
      this.requisition.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      for (var i = 0; i < this.requisition.RequisitionItems.length; i++) {
        this.requisition.RequisitionItems[i].RequisitionItemStatus = "active";
        this.requisition.RequisitionItems[i].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
        this.requisition.RequisitionItems[i].AuthorizedBy = this.securityService.GetLoggedInUser().EmployeeId;
        this.requisition.RequisitionItems[i].CreatedOn = moment().format('YYYY-MM-DD');
        this.requisition.RequisitionItems[i].Item = null;
      }
      this.requisition.CreatedOn = moment().format('YYYY-MM-DD');
      this.loading = true;
      this.dispensaryRequisitionService.AddRequisition(this.requisition)
        .finally(() => this.loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Requisition is Generated and Saved"]);
            this.changeDetectorRef.detectChanges();
            this.requisition = new PHRMStoreRequisition();
            this.AddRowRequest();
            //route back to requisition list
            this.RouteToViewDetail(res.Results);
          }
          else {
            err => {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['failed to add Requisition.. please check log for details.']);
              this.logError(err.ErrorMessage);
              //route back to requisition list
              this.router.navigate(['/Dispensary/Stock/Requisition/List']);
            }
          }
        });
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, errorMessages);
    }

  }
  ////this is to cancel the whole PO at one go and adding new PO
  Cancel() {
    this.requisition.RequisitionItems = new Array<PHRMStoreRequisitionItems>();
    this.requisition = new PHRMStoreRequisition();
    this.AddRowRequest();
    //route back to requisition list
    this.router.navigate(['/Dispensary/Stock/Requisition/List']);
  }
  logError(err: any) {
    console.log(err);
  }

  RouteToViewDetail(data) {
    //pass the Requisition Id to RequisitionView page for List of Details about requisition
    this.phrmService.Id = data;
    this.router.navigate(['/Dispensary/Stock/Requisition/View']);

  }
  OnPressedEnterKeyInItemField(index) {
    if (this.requisition.RequisitionItems[index].SelectedItem != null && this.requisition.RequisitionItems[index].ItemId != null) {
      this.setFocusById(`req_qty${index}`);
    }
    else {
      if (this.requisition.RequisitionItems.length == 1) {
        this.SetFocusOnItemName(index)
      }
      else {
        this.requisition.RequisitionItems.splice(index, 1);
        this.setFocusById('btn_Add');
      }
    }
  }
  private SetFocusOnItemName(index: number) {
    this.setFocusById("itemName" + index);
  }
  onPressedEnterKeyInRemarkField(index) {
    if (index == (this.requisition.RequisitionItems.length - 1)) {
      this.AddRowRequest();
    }
    this.SetFocusOnItemName(index + 1);
  }
  O
  setFocusById(id: string) {
    var Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        clearTimeout(Timer);
      }
    }, 100)
  }
  phrmGenericListFormatter(data: any): string {
    let html = "";
    if (data["GenericId"]) {
      html = `<font color='blue'; size=03 >${data["GenericName"]}</font>`;
    }
    return html;
  }

  public GetGenericList() {
    this.phrmBLService.GetGenericList()
      .subscribe(res => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.GenericList = res.Results;
        }
      });
  }

  public AssignSelectedGenName(row, i) {
    if ((row.selectedGeneneric != 0) && (row.selectedGeneneric != null)) {
      this.requisition.RequisitionItems[i].FilteredItemList = this.ItemList.filter(i => i.GenericId === row.selectedGeneneric.GenericId)
      this.requisition.RequisitionItems[i].SelectedItem = null;
    }
    else {
      this.requisition.RequisitionItems[i].FilteredItemList = this.ItemList;
      this.requisition.RequisitionItems[i].SelectedItem = null;
      this.requisition.RequisitionItems[i].Quantity = 0;
      row.Quantity = 0;
    }
  }

}
