import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

import * as moment from 'moment/moment';
import { CoreService } from '../../core/shared/core.service';
import { SecurityService } from '../../security/shared/security.service';
import { Department } from '../../settings-new/shared/department.model';
import { PriceCategory } from '../../settings-new/shared/price.category.model';
import { SettingsBLService } from '../../settings-new/shared/settings.bl.service';
import { ServiceDepartmentVM } from '../../shared/common-masters.model';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { CommonFunctions } from '../../shared/common.functions';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { Bill_Types_Applicable, ENUM_DanpheHTTPResponses, ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, Percentage_Type } from '../../shared/shared-enums';
import { EmployeeBillItemsMap_DTO } from '../shared/employee-billItems-map.dto';
import { IncentiveBLService } from '../shared/incentive.bl.service';
import { INCTVGridColumnSettings } from '../shared/inctv-grid-column-settings';
import { ProfileItemMap_DTO } from '../shared/profile-item-map.dto';
import { ProfileItemMapModel } from '../shared/profile-item-map.model';
import { ProfileModel } from '../shared/profile.model';

@Component({
  selector: 'profile-item-map',
  templateUrl: './profile-item-mapping.component.html'
})
export class ProfileItemMapComponent {
  public currentProfileItems: Array<ProfileItemMapModel> = new Array<ProfileItemMapModel>();
  public currentProfile: ProfileModel = new ProfileModel();
  public PreviousProfileBillItems: Array<ProfileItemMapModel> = [];

  public uniqueDeptNames = [];
  public selServiceDepartment: string = '';
  public strSearchItem: string = '';
  //public showAddPage: boolean = false;
  public showEditFields: boolean = false;
  public isDataAvailable: boolean = false;
  public loading: boolean = false;
  //public selectAll: boolean = false;

  public ProfileObj: any = null;
  public ProfileItemSetup: ProfileItemsVM = new ProfileItemsVM();
  public FilteredItemList: any = [];
  public update: boolean = false;
  public newProfile: boolean = true;
  public IsPercentageValid: boolean = true;
  public ShowEditItem = false;
  public updateSelectedItem: ProfileItemMapModel = new ProfileItemMapModel();
  public ProfileBillItemGridColumns: Array<any> = [];
  // public allBillItems: any = [];

  @Input('profileId')
  public selectedProfileId: number = null;
  @Input('profileList')
  public profileList: any = null;
  @Input('categoryList')
  public PricecategoryList: any = null;
  @Input('all-BillitmList')
  public allBillItems: any = [];
  @Input('IsViewMapping')
  IsViewMapping: boolean = false;
  // public set allBillItemList(_allBillItems) {
  //   if (_allBillItems) {
  //     _allBillItems.forEach(element => {
  //       element["Price_Unit"] = this.coreService.currencyUnit + element.Price;
  //     });
  //     this.allBillItems = _allBillItems;
  //   }
  // }

  //@Input('showAddPage')
  //public set value(val: boolean) {
  //  if (val) {
  //    this.showAddPage = val;
  //    this.getProfileItemsDetails();
  //  }
  //}
  @Output('callback-add')
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

  public SelectedItem: ProfileItemsVM = new ProfileItemsVM();

  public PriceCategories = new Array<PriceCategory>();
  public SelectedPriceCategoryId: number = null;
  public ShowProfleDD: boolean = false;
  public searchText: string = null;
  public SelectedRadioButton: any;
  public SelProfileForAttach: any;
  public selectedProfile: any;
  public showProfileTable: boolean = true;
  public ShowPreview: boolean = false;
  public ProfilePreviewGridColumns: Array<any> = [];
  AttachProfileId: number = 0;
  DepartmentList = new Array<Department>();
  ServiceDepartmentList: Array<ServiceDepartmentVM> = new Array<ServiceDepartmentVM>();
  FilterServiceDepartmentList: Array<ServiceDepartmentVM> = new Array<ServiceDepartmentVM>();
  ServiceDepartmentIds: number[] = [];
  ServiceItemList: ProfileItemsVM[] = [];
  FilteredServiceItemSettingDropDownList = new Array<ProfileItemsVM>();
  ProfilePreviousBillItemsMapped: Array<EmployeeBillItemsMap_DTO> = [];
  SearchItemName: string = '';
  DisplayedServiceItems = [];
  SelectedDepartmentIds: number[] = [];
  SelectAll: boolean = false;
  PerformerPercent: number = 0;
  PrescriberPercent: number = 0;
  ReferrerPercent: number = 0;
  Outpatient: boolean = false;
  Inpatient: boolean = false;
  PerformerPercentMsg: string;
  PrescriberPercentMsg: string;
  ReferrerPercentMsg: string;
  // IsSaveButtonEnable: boolean = false;
  AlredyMappedServiceItems = []
  constructor(
    public incBLservice: IncentiveBLService,
    public msgBoxServ: MessageboxService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef,
    public settingsBLService: SettingsBLService,
    public coreService: CoreService) {
    const allPriceCategories = this.coreService.Masters.PriceCategories;
    if (allPriceCategories && allPriceCategories.length > 0) {
      this.PriceCategories = allPriceCategories.filter(p => p.IsActive);
    }

    this.GetIncentiveOpdIpdSettings();
    this.ProfilePreviewGridColumns = INCTVGridColumnSettings.ProfilePreviewList;
    // this.ProfileBillItemGridColumns = GridColumnSettings.ProfileBillItemGridColumns;
  }

  ngOnInit() {
    if (this.selectedProfileId && this.selectedProfileId != 0) {
      this.update = true;
      this.newProfile = false;
      this.getProfileItemsDetails();
      // this.GetDeptsForSearchDDL(this.allBillItems);
      // this.FilteredItemList = this.allBillItems;
    }
    else {
      this.update = false;
      this.newProfile = true;
    }
    this.GetServiceDepartments();
    this.GetDepartmentList();
  }

  public OpdIpdSettings: any = null;
  public GetIncentiveOpdIpdSettings() {
    let IncentiveOpdIpdSettings = this.coreService.Parameters.find(
      a => a.ParameterGroupName == "Incentive" && a.ParameterName == "IncentiveOpdIpdSettings"
    );
    if (IncentiveOpdIpdSettings) {
      this.OpdIpdSettings = JSON.parse(IncentiveOpdIpdSettings.ParameterValue);
      if (this.OpdIpdSettings.EnableOpdIpd) {
        this.ProfileItemSetup.OpdSelected = this.OpdIpdSettings.OpdSelected;
        this.ProfileItemSetup.IpdSelected = this.OpdIpdSettings.IpdSelected;
        this.ProfileBillItemGridColumns = INCTVGridColumnSettings.ProfileBillItemGridColumnsWithOpdIpdSettingEnabled;
      }
      else {
        this.ProfileItemSetup.OpdSelected = true;
        this.ProfileItemSetup.IpdSelected = true;
        this.ProfileBillItemGridColumns = INCTVGridColumnSettings.ProfileBillItemGridColumns;
      }
    }
  }

  // not using this method
  // getItemList() {
  //   this.incBLservice.getItemsforProfile().subscribe(res => {
  //     if (res.Status == 'OK') {
  //     }
  //     else {
  //       this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
  //       console.log(res.ErrorMessage);
  //     }
  //   });
  // }

  getProfileItemsDetails() {
    try {
      this.incBLservice.GetProfileItemsMapping(this.selectedProfileId).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.currentProfile = new ProfileModel();
          let profile = res.Results;
          if (profile) {
            this.currentProfile.ProfileId = profile.ProfileId;
            this.currentProfile.ProfileName = profile.ProfileName;
            this.currentProfile.PriceCategoryId = profile.PriceCategoryId;
            this.currentProfile.PriceCategoryName = profile.PriceCategoryName;

            this.PreviousProfileBillItems = res.Results.MappedItems;
            console.log(this.PreviousProfileBillItems + "this.PreviousProfileBillItems")
            this.GetServiceItemsByPriceCategoryId(this.currentProfile.PriceCategoryId);

            const mappedData = (profile.MappedItems).map(item => {
              const mappedItem: ProfileItemMap_DTO = {
                BillItemProfileMapId: item.BillItemProfileMapId || 0,
                PriceCategoryId: item.PriceCategoryId || 0,
                PriceCategoryName: item.PriceCategoryName || "",
                ServiceItemId: item.ServiceItemId || 0,
                PerformerPercent: item.PerformerPercent || 0,
                PrescriberPercent: item.PrescriberPercent || 0,
                ReferrerPercent: item.ReferrerPercent || 0,
                IsActive: item.IsActive !== undefined ? item.IsActive : true,
                BillingTypesApplicable: item.BillingTypesApplicable || null,
                ItemName: item.ItemName || "",
                DepartmentName: item.DepartmentName || "",
                IsSelected: true,
                IpdSelected: false,
                OpdSelected: false,
                ProfileId: profile.ProfileId || null,
                Price: item.Price
              };

              switch (item.BillingTypesApplicable) {
                case 'inpatient':
                  mappedItem.IpdSelected = true;
                  mappedItem.OpdSelected = false;
                  break;
                case 'outpatient':
                  mappedItem.OpdSelected = true;
                  mappedItem.IpdSelected = false;
                  break;
                case 'both':
                  mappedItem.OpdSelected = true;
                  mappedItem.IpdSelected = true;
                  break;
                default:
                  mappedItem.OpdSelected = false;
                  mappedItem.IpdSelected = false;
                  break;
              }

              return mappedItem;
            });

            this.DisplayedServiceItems = mappedData;
            console.log(this.DisplayedServiceItems, "DisplayServiceItem");
            this.AlredyMappedServiceItems = mappedData;
            // this.PreviousProfileBillItems.forEach(a => {
            //   var itemObj = this.allBillItems.find(itm => itm.ServiceItemId == a.ServiceItemId);
            //   if (itemObj && itemObj.ServiceItemId) {
            //     a.ItemName = itemObj.ItemName;
            //     a.DepartmentName = itemObj.ServiceDepartmentName;
            //   }
            // });
            //let itmList = res.Results.itemsDetails;
            //itmList.forEach(el => {
            //  let itm = new ProfileItemMapModel();
            //  itm.BillItemPriceId = el.BillItemPriceId;
            //  itm.ItemName = el.ItemName;
            //  itm.DepartmentName = el.ServiceDepartmentName;
            //  itm.PriceCategoryId = profile.PriceCategoryId;
            //  itm.ProfileId = profile.ProfileId;
            //  itm.DocObj = el.Doctor ? el.Doctor : {};
            //  itm.IsPercentageValid = true;//by default this will be true.

            //  this.currentProfileItems.push(itm);
            //});

            //profile.MappedItems.forEach(el => {
            //  let index = this.currentProfileItems.findIndex(a => a.BillItemPriceId == el.BillItemPriceId);
            //  if (index > -1) {
            //    this.currentProfileItems[index].BillItemProfileMapId = el.BillItemProfileMapId;
            //    this.currentProfileItems[index].AssignedToPercent = el.AssignedToPercent;
            //    this.currentProfileItems[index].ReferredByPercent = el.ReferredByPercent;
            //  }
            //});

            //this.currentProfileItems.sort((t1) => {
            //  if (t1.AssignedToPercent == null) { return 1; }
            //  if (t1.AssignedToPercent != null) { return -1; }
            //  return 0;
            //});

            //this.filteredItemList = this.currentProfileItems;
            //this.GetDeptsForSearchDDL(this.allBillItems);
          }
          this.isDataAvailable = true;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      });
    } catch (error) {

    }

  }



  //SaveProfileItems() {
  //  try {

  //    //get all selected rows first then go for further processing.
  //    let rowsToUpdate = this.currentProfileItems.filter(a => a.IsSelected);
  //    rowsToUpdate.forEach(a => {
  //      a.AssignedToPercent = a.AssignedToPercent ? a.AssignedToPercent : 0;
  //      a.ReferredByPercent = a.ReferredByPercent ? a.ReferredByPercent : 0;
  //    });

  //    if (rowsToUpdate && rowsToUpdate.length > 0) {
  //      if (rowsToUpdate.every(a => a.IsPercentageValid)) {
  //        this.loading = true;
  //        this.incBLservice.SaveProfileItemMap(rowsToUpdate).subscribe(
  //          res => {
  //            this.CallBackAddProfileItems(res);
  //            this.currentProfile = new ProfileModel();
  //          },
  //          err => {
  //            this.msgBoxServ.showMessage('error', [err.ErrorMessage]);
  //            console.log(err.ErrorMessage);
  //          });

  //      }
  //      else {
  //        this.msgBoxServ.showMessage("failed", ["Percentages of some items are invalid"]);
  //      }

  //    }
  //    else {
  //      this.msgBoxServ.showMessage("failed", ["Please select/check at least one item to update."]);
  //    }

  //  } catch (error) {
  //    this.loading = false;
  //  }
  //}

  Close() {
    //this.showAddPage = false;
    this.showEditFields = false;
    this.callbackAdd.emit();
  }
  CloseShowEditItemPopup() {
    this.ShowEditItem = false;
  }

  CallBackAddProfileItems(res) {
    this.loading = false;
    if (res.Status == 'OK') {
      this.callbackAdd.emit();
      this.msgBoxServ.showMessage('success', ['Profile Items Mapping saved.']);
    }
    else {
      this.msgBoxServ.showMessage('error', [res.ErrorMessage]);
      console.log(res.ErrorMessage);
    }
  }

  //checkBoxClicked(event) {
  //  this.showEditFields = this.currentProfileItems.some(a => a.IsSelected) ? true : false;
  //  this.selectAll = this.PreviousProfileBillItems.some(a => a.IsSelected == false) ? false : true;
  //}


  SearchItemsListFormatter(data: any): string {
    const html = data['ItemName'];
    return html;
  }

  //selectAllClicked() {
  //  this.PreviousProfileBillItems.forEach(el => {
  //    el.IsSelected = this.selectAll;
  //  });
  //  this.showEditFields = this.currentProfileItems.some(a => a.IsSelected) ? true : false;
  //}

  GetDeptsForSearchDDL(itemList: Array<any>) {
    const allDepts = itemList.map(el => {
      return el.ServiceDepartmentName;
    });

    var uniqueItms = CommonFunctions.GetUniqueItemsFromArray(allDepts);

    this.uniqueDeptNames = uniqueItms.map(el => {
      return { ServiceDepartmentName: el }
    });
  }


  // common method serve filter purpose for both item search and department dropdown
  //filterList() {
  //  this.PreviousProfileBillItems = this.currentProfileItems.filter(itm =>
  //    (this.selServiceDepartment != '' ? itm.DepartmentName == this.selServiceDepartment : true)
  //    && (this.strSearchitem.length > 1 ? itm.ItemName.toUpperCase().includes(this.strSearchitem.toUpperCase()) : true)
  //  );
  //  this.selectAll = this.PreviousProfileBillItems.some(a => a.IsSelected == false) ? false : true;
  //}

  //public RefererrPercentChange(currMap: ProfileItemMapModel) {
  //  this.CheckIfItemPercentValid(currMap);


  //}

  //public AssignPercentChange(currMap: ProfileItemMapModel) {
  //  this.CheckIfItemPercentValid(currMap);
  //}


  CheckIfItemPercentValid(currItem) {
    let prescriberPercent = currItem.PrescriberPercent ? currItem.PrescriberPercent : 0;
    let performerPercent = currItem.PerformerPercent ? currItem.PerformerPercent : 0;
    let referrerPercent = currItem.ReferrerPercent ? currItem.ReferrerPercent : 0;

    if (performerPercent < 0 || prescriberPercent < 0 || referrerPercent < 0 || (prescriberPercent + performerPercent + referrerPercent) > 100) {
      this.IsPercentageValid = false;
    }
    else {
      this.IsPercentageValid = true;
    }
  }

  ServiceDeptListFormatter(data: any): string {
    const html = data['ServiceDepartmentName'];
    return html;
  }

  profileListFormatter(data: any): string {
    const html = data['ProfileName'];
    return html;
  }

  ItemsListFormatter(data: any): string {
    if (data["Doctor"]) {
      let html: string = data["ServiceDepartmentName"] + "-" + "<font color='blue'; size=03 >" + data["ItemName"] + "</font>"
        + "(" + data["Doctor"].DoctorName + ")" + "&nbsp;&nbsp;" + "<b>" + data["Price"] + "</b >";
      return html;
    }
    else {
      let html: string = data["ServiceDepartmentName"] + "-" + "<font color='blue'; size=03 >" + data["ItemName"] + "</font>"
        + "&nbsp;&nbsp;" + "&nbsp;&nbsp;" + "<b>" + data["Price"] + "</b >";
      return html;
    }
  }

  public OnChangeProfile() {
    if (typeof (this.ProfileObj) == 'string') {
      this.currentProfile.ProfileName = this.ProfileObj;
    }
    else if (typeof (this.ProfileObj) == 'object') {
      this.msgBoxServ.showMessage('Warning', ['Profie Name already exist!']);
      this.ProfileObj = null;
    }
  }

  public SaveProfile() {
    if (!this.currentProfile.ProfileName && !this.SelectedPriceCategoryId) {
      this.msgBoxServ.showMessage('error', ['Please fill in all mandatory fields.']);
      return;
    }
    if (!this.currentProfile.ProfileName) {
      this.msgBoxServ.showMessage('error', ['Please Enter the Profile Name']);
      return;
    }
    if (!this.SelectedPriceCategoryId) {
      this.msgBoxServ.showMessage('error', ['Please Select the Price Category.']);
      return;
    }
    if (this.selectedProfile && this.selectedProfile.PriceCategoryId !== this.SelectedPriceCategoryId) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select the profile with the same PriceCategory.']);
      return;
    }

    if (this.ShowProfleDD) {
      if (this.SelProfileForAttach == null) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select a profile first']);
        return;
      }
    } else {
      this.currentProfile.ProfileBillItemMap = [];
      this.AttachProfileId = null;
    }

    if (this.currentProfile && this.currentProfile.ProfileName) {
      this.currentProfile.PriceCategoryId = this.SelectedPriceCategoryId;
      // this.currentProfile.PriceCategoryName = priceCAt.PriceCategoryName;
      this.currentProfile.AttachedProfileId = this.AttachProfileId ? this.AttachProfileId : 0;
      this.currentProfile.TDSPercentage = 0
      this.currentProfile.IsActive = true;
      this.currentProfile.CreatedBy = this.securityService.loggedInUser.EmployeeId;//change this and assign from server side..
      this.currentProfile.CreatedOn = moment().format('YYYY-MM-DD');
      this.incBLservice.AddProfile(this.currentProfile).subscribe(
        res => {
          if (res.Status == 'OK') {
            this.currentProfile = new ProfileModel();
            this.currentProfile = res.Results;
            this.msgBoxServ.showMessage('success', ['Profile Added.']);
            this.ProfileObj = null;
            this.update = true;
            this.newProfile = false;

            this.selectedProfileId = this.currentProfile.ProfileId;
            this.getProfileItemsDetails();
          }
          else {
            this.msgBoxServ.showMessage('error', ['Something Wrong' + res.ErrorMessage]);
          }
        },
        err => {
          this.msgBoxServ.showMessage('error', ['Something Wrong' + err.ErrorMessage]);
        });
    }
  }

  public OnDepartmentChange() {

    let srvDeptObj = null;
    // check if user has given proper input string for department name
    //or has selected object properly from the dropdown list.
    if (typeof (this.ProfileItemSetup.SelServDepartment) == 'string') {
      if (this.uniqueDeptNames.length && this.ProfileItemSetup.SelServDepartment)
        srvDeptObj = this.uniqueDeptNames.find(a => a.ServiceDepartmentName.toLowerCase() == this.ProfileItemSetup.SelServDepartment.toLowerCase());
    }
    else if (typeof (this.ProfileItemSetup.SelServDepartment) == 'object') {
      srvDeptObj = this.ProfileItemSetup.SelServDepartment;
    }

    //if selection of department from string or selecting object from the list is true
    //then assign proper department name
    if (srvDeptObj && srvDeptObj.ServiceDepartmentName) {
      this.FilteredItemList = this.FilteredItemList.filter(a => a.ServiceDepartmentName == srvDeptObj.ServiceDepartmentName)
    }
    else {
      this.FilteredItemList = this.FilteredItemList;
    }
  }

  public AssignSelectedItem() {
    //this.ItemsSetup -> This object is binded with dropdown, so taking all property from this.
    this.ProfileItemSetup = Object.assign(this.ProfileItemSetup, this.SelectedItem);
    if (this.ProfileItemSetup.ItemName && this.ProfileItemSetup.ItemName != '') {
      if (this.PreviousProfileBillItems.find(a => a.ItemName == this.ProfileItemSetup.ItemName)) {
        this.msgBoxServ.showMessage('Warning', [this.ProfileItemSetup.ItemName + ' is already added, Please edit the percentage from below list.']);
        this.SetFocusOn_SearchBox("srch_itemName");
        this.ProfileItemSetup.SelServDepartment = null;
        this.ProfileItemSetup.Price = 0;
        this.ProfileItemSetup.ItemName = null;
      }
      else {
        this.ProfileItemSetup.SelServDepartment = this.ProfileItemSetup.ServiceDepartmentName;
        this.ProfileItemSetup.Price = this.ProfileItemSetup.Price ? this.ProfileItemSetup.Price : 0;
      }

    }
    else {
      this.ProfileItemSetup.Price = 0;
      this.ProfileItemSetup.SelServDepartment = null;
    }
    this.OnDepartmentChange();
  }

  private SetFocusOn_SearchBox(idToSelect: string) {
    window.setTimeout(function () {
      let searchBoxObj = document.getElementById(idToSelect);
      if (searchBoxObj) {
        searchBoxObj.focus();
      }
    }, 600);
  }
  GoToNextInput(idToSelect: string) {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
      nextEl.select();
    }
  }

  public DiscardItem() {
    this.ProfileItemSetup = new ProfileItemsVM();
    this.SelectedItem = new ProfileItemsVM();
    this.OnDepartmentChange();
  }
  public SaveIncentiveItem() {

    const selectedItems = this.DisplayedServiceItems.filter(item => item.IsSelected);
    if (selectedItems.length === 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please select at least one item to save.']);
      return;
    }

    const invalidPercentItems = selectedItems.filter(item =>
      item.PerformerPercent < 0 || item.PerformerPercent > 100 ||
      item.PrescriberPercent < 0 || item.PrescriberPercent > 100 ||
      item.ReferrerPercent < 0 || item.ReferrerPercent > 100
    );

    if (invalidPercentItems.length > 0) {
      const invalidItemsNames = invalidPercentItems.map(item => item.ItemName).join(', ');
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`The following items have invalid percentage values (should be between 0 and 100): ${invalidItemsNames}`]);
      return;
    }


    // const zeroPercentItems = selectedItems.filter(item =>
    //   item.PerformerPercent === 0 && item.PrescriberPercent === 0 && item.ReferrerPercent === 0
    // );

    // if (zeroPercentItems.length > 0) {
    //   const zeroPercentItemNames = zeroPercentItems.map(item => item.ItemName).join(', ');
    //   this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, [`The items must have At least one percentage (Performer, Prescriber, or Referrer) greater than 0: ${zeroPercentItemNames}`]);
    //   return;
    // }

    const invalidItems = selectedItems.filter(item => !item.OpdSelected && !item.IpdSelected);

    if (invalidItems.length > 0) {
      const invalidItemsNames = invalidItems.map(item => item.ItemName).join(', ');
      this.msgBoxServ.showMessage('Warning', [`The following items must have either Outpatient or Inpatient selected: ${invalidItemsNames}`]);
      return;
    }

    const mappedItems = selectedItems.map(item => {
      const profileBillItemsObj = new ProfileItemMapModel();
      profileBillItemsObj.PriceCategoryId = this.currentProfile.PriceCategoryId;
      profileBillItemsObj.ProfileId = this.currentProfile.ProfileId;
      profileBillItemsObj.PerformerPercent = item.PerformerPercent || 0;
      profileBillItemsObj.PrescriberPercent = item.PrescriberPercent || 0;
      profileBillItemsObj.ReferrerPercent = item.ReferrerPercent || 0;
      profileBillItemsObj.ServiceItemId = item.ServiceItemId;
      profileBillItemsObj.BillItemProfileMapId = item.BillItemProfileMapId || 0;
      profileBillItemsObj.ItemName = item.ItemName;
      profileBillItemsObj.DepartmentName = item.SelServDepartment;
      profileBillItemsObj.BillingTypesApplicable = item.OpdSelected && item.IpdSelected
        ? Bill_Types_Applicable.Both
        : item.OpdSelected
          ? Bill_Types_Applicable.Outpatient
          : item.IpdSelected
            ? Bill_Types_Applicable.Inpatient
            : '';

      return profileBillItemsObj;
    });

    this.currentProfileItems = [...mappedItems];
    this.incBLservice.SaveProfileItemMap(this.currentProfileItems).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === 'OK') {
        this.selectedProfileId = this.currentProfile.ProfileId;
        this.getProfileItemsDetails();
        this.ProfileItemSetup = new ProfileItemsVM();
        this.SelectedItem = new ProfileItemsVM();
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Profile BillItems Map is successfully saved!']);
        this.Close();
        this.OnDepartmentChange();
        this.SetFocusOn_SearchBox("srch_itemName");

      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        console.error(res.ErrorMessage);
      }
    });
  }


  ProfileBillItemGridActions($event) {
    switch ($event.Action) {
      case 'edititem': {
        this.updateSelectedItem = $event.Data;
        if (this.updateSelectedItem.BillingTypesApplicable === 'outpatient') {
          this.updateSelectedItem.IpdSelected = false;
          this.updateSelectedItem.OpdSelected = true;
        }
        else if (this.updateSelectedItem.BillingTypesApplicable === 'inpatient') {
          this.updateSelectedItem.IpdSelected = true;
          this.updateSelectedItem.OpdSelected = false;
        }
        else {
          this.updateSelectedItem.IpdSelected = true;
          this.updateSelectedItem.OpdSelected = true;
        }

        this.ShowEditItem = true;
        break;
      }
      case 'removeitem': {
        this.updateSelectedItem = $event.Data;
        let proceed: boolean = true;
        proceed = window.confirm(this.currentProfile.ProfileName + " will not get Incentive from" + this.updateSelectedItem.ItemName + ". Do you want to continue ?")
        if (proceed) {
          this.RemoveSelectedBillItem();
        }

        break;
      }
      default:
        break;
    }
  }

  public RemoveSelectedBillItem() {
    if (this.updateSelectedItem && this.updateSelectedItem.BillItemProfileMapId) {
      this.incBLservice.RemoveSelectedBillItemFromProfileMap(this.updateSelectedItem)
        .subscribe(res => {
          if (res.Status == 'OK') {
            this.getProfileItemsDetails();
            this.msgBoxServ.showMessage('Success', ['Bill Item successfully Removed!!']);
          }
          else {
            this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
            console.log(res.ErrorMessage);
          }
        });
    }
  }

  UpdateBillItems() {

    if (this.updateSelectedItem && this.updateSelectedItem.BillItemProfileMapId) {
      if (this.updateSelectedItem.OpdSelected && this.updateSelectedItem.IpdSelected) {
        this.updateSelectedItem.BillingTypesApplicable = 'both';
      }
      else if (this.updateSelectedItem.OpdSelected) {
        this.updateSelectedItem.BillingTypesApplicable = 'outpatient';
      }
      else if (this.updateSelectedItem.IpdSelected) {
        this.updateSelectedItem.BillingTypesApplicable = 'inpatient';
      }

      this.incBLservice.UpdateProfileBillItemMap(this.updateSelectedItem)
        .subscribe(res => {
          if (res.Status == 'OK') {
            this.getProfileItemsDetails();
            this.msgBoxServ.showMessage('Success', ['Bill Item successfully update!!']);
            this.ShowEditItem = false;
          }
          else {
            this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
            console.log(res.ErrorMessage);
          }
        });
    }
  }

  OnPriceCategoryChanged($event): void {
    if ($event) {
      const priceCategoryId = +$event.target.value;
      this.SelectedPriceCategoryId = priceCategoryId;
      this.SelectedRadioButton = null;
      this.selectedProfile = null;
      this.SelProfileForAttach = null;
      this.GetServiceItemsByPriceCategoryId(priceCategoryId);
    }
  }
  GetServiceItemsByPriceCategoryId(priceCategoryId: number): void {
    this.incBLservice.GetItemsForIncentive(priceCategoryId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DiscardItem();
          const serviceItems = res.Results;
          this.GetDeptsForSearchDDL(serviceItems);
          this.FilteredItemList = serviceItems;
        }
        else {
          this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      });
  }

  public DiscardSelectedProfile() {
    this.SelectedRadioButton = null;
    this.SelProfileForAttach = null;
    if (this.selectedProfile != null) {
      this.selectedProfile = null;
      this.showProfileTable = true;
    }
  }

  public SaveSelectedProfile() {
    if (!this.ProfileObj || !this.SelectedPriceCategoryId) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select Profile Name and Price Category.']);
    } else {
      if (this.selectedProfile && this.selectedProfile.PriceCategoryId !== this.SelectedPriceCategoryId) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select the profile with the same PriceCategory.']);
        return;
      }

      this.ProfileChanged();
      this.showProfileTable = false;
    }
  }

  public RadioChanged(event, profile) {
    this.SelProfileForAttach = this.SelectedRadioButton ? profile : null;
    this.selectedProfile = profile;
    this.SaveSelectedProfile();
  }

  public PreviewItem(data) {
    this.SelProfileForAttach = data;
    this.SelectedRadioButton = data.ProfileName;
    this.selectedProfile = data;
    this.SaveSelectedProfile();
    this.incBLservice.GetProfileItemsMapping(this.SelProfileForAttach.ProfileId)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          let profile = res.Results;

          if (!profile.MappedItems || profile.MappedItems.length === 0) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`No items are mapped to this profile.`]);
            return;
          }
          this.currentProfile.ProfileBillItemMap = [];
          profile.MappedItems.forEach(el => {
            let ProfileBillItemsObj = new ProfileItemMapModel();
            ProfileBillItemsObj.PriceCategoryId = this.SelectedPriceCategoryId;
            ProfileBillItemsObj.PriceCategoryName = el.PriceCategoryName;
            ProfileBillItemsObj.ServiceItemId = el.ServiceItemId;
            ProfileBillItemsObj.ItemName = el.ItemName;
            ProfileBillItemsObj.DepartmentName = el.DepartmentName;
            ProfileBillItemsObj.PerformerPercent = el.PerformerPercent ? el.PerformerPercent : 0;
            ProfileBillItemsObj.PrescriberPercent = el.PrescriberPercent ? el.PrescriberPercent : 0;
            ProfileBillItemsObj.ReferrerPercent = el.ReferrerPercent ? el.ReferrerPercent : 0;
            ProfileBillItemsObj.IsActive = true;
            this.currentProfile.ProfileBillItemMap.push(ProfileBillItemsObj)
          });
          this.PreviousProfileBillItems = this.currentProfile.ProfileBillItemMap;
          this.PreviousProfileBillItems = this.PreviousProfileBillItems.filter(e => {
            return e.ItemName !== "";
          })
          this.ShowPreview = true;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      });
  }

  public GetBillItemProfileMap(profileId) {
    this.incBLservice.GetProfileItemsMapping(profileId)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          let profile = res.Results;

          this.currentProfile.ProfileBillItemMap = [];

          profile.MappedItems.forEach(el => {
            var ProfileBillItemsObj = new ProfileItemMapModel();
            ProfileBillItemsObj.PriceCategoryId = profile.PriceCategoryId;
            ProfileBillItemsObj.PriceCategoryName = el.PriceCategoryName;
            ProfileBillItemsObj.ServiceItemId = el.ServiceItemId;
            ProfileBillItemsObj.ItemName = el.ItemName;
            ProfileBillItemsObj.DepartmentName = el.DepartmentName;
            ProfileBillItemsObj.PerformerPercent = el.PerformerPercent ? el.PerformerPercent : 0;
            ProfileBillItemsObj.PrescriberPercent = el.PrescriberPercent ? el.PrescriberPercent : 0;
            ProfileBillItemsObj.ReferrerPercent = el.ReferrerPercent ? el.ReferrerPercent : 0;
            ProfileBillItemsObj.IsActive = true;
            this.currentProfile.ProfileBillItemMap.push(ProfileBillItemsObj)
          });
          this.PreviousProfileBillItems = this.currentProfile.ProfileBillItemMap;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      });
  }

  ProfileChanged() {
    let profile = null;
    console.log("Selected Profile" + this.SelProfileForAttach);
    this.selectedProfile = this.SelProfileForAttach;
    if (this.SelProfileForAttach && this.profileList) {
      if (typeof (this.SelProfileForAttach) == 'string' && this.profileList.length) {
        profile = this.profileList.find(a => a.ProfileName.toLowerCase() == this.SelProfileForAttach);
      }
      else if (typeof (this.SelProfileForAttach) == 'object') {
        profile = this.SelProfileForAttach;
      }
      if (profile) {
        this.GetBillItemProfileMap(profile.ProfileId);
        this.AttachProfileId = profile.ProfileId;
      }
      else {
        this.SelProfileForAttach = null;
      }
    }
  }
  public ClosePreviewPopup() {
    this.ShowPreview = false;
  }

  GetDepartmentList() {
    this.settingsBLService.GetDepartments().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.DepartmentList = res.Results;
      }
    });
  }
  GetServiceDepartments() {
    this.ServiceDepartmentList = this.coreService.Masters.ServiceDepartments;
    this.FilterServiceDepartmentList = this.ServiceDepartmentList;
  }
  AssignDepartment($event) {
    if ($event) {
      this.SelectedDepartmentIds = $event.map(a => a.DepartmentId);


      this.FilterServiceDepartmentList = this.ServiceDepartmentList.filter(sd =>
        this.SelectedDepartmentIds.includes(sd.DepartmentId)
      );


      const serviceDeptIds = this.FilterServiceDepartmentList.map(sd => sd.ServiceDepartmentId);
      this.FilteredServiceItemSettingDropDownList = this.ServiceItemList.filter(itm =>
        serviceDeptIds.includes(itm.ServiceDepartmentId)
      );
    } else {

      this.FilterServiceDepartmentList = [...this.ServiceDepartmentList];
      this.FilteredServiceItemSettingDropDownList = [...this.ServiceItemList];
    }
  }
  AssignDefaultDepartment($event) {
    if ($event) {
      this.ServiceDepartmentIds = $event.map(a => a.ServiceDepartmentId);


      this.FilteredServiceItemSettingDropDownList = this.ServiceItemList.filter(itm =>
        this.ServiceDepartmentIds.includes(itm.ServiceDepartmentId)
      );
    } else {

      this.FilteredServiceItemSettingDropDownList = [...this.ServiceItemList];
    }
  }

  ToggleSelectAll(event) {
    const isChecked = event.target.checked;
    this.SelectAll = isChecked;

    this.DisplayedServiceItems.forEach(item => {
      item.IsSelected = isChecked;
      if (isChecked) {
        item.PerformerPercent = item.PerformerPercent || 0;
        item.PrescriberPercent = item.PrescriberPercent || 0;
        item.ReferrerPercent = item.ReferrerPercent || 0;
        item.OpdSelected = item.OpdSelected || this.Outpatient;
        item.IpdSelected = item.IpdSelected || this.Inpatient;
      } else {
        item.OpdSelected = item.OpdSelected || this.Outpatient;
        item.IpdSelected = item.IpdSelected || this.Inpatient;
      }
      item.IsBulkApplied = isChecked;
    });
  }
  CheckGlobalDiscountPercent() {
    const minimumDiscountPercent = 0;
    const maxDiscountPercent = 100;

    if (this.PerformerPercent < minimumDiscountPercent || this.PerformerPercent > maxDiscountPercent) {
      this.PerformerPercentMsg = "Invalid percent";
    } else {
      this.PerformerPercentMsg = "";
    }

    if (this.PrescriberPercent < minimumDiscountPercent || this.PrescriberPercent > maxDiscountPercent) {
      this.PrescriberPercentMsg = "Invalid percent";
    } else {
      this.PrescriberPercentMsg = "";
    }

    if (this.ReferrerPercent < minimumDiscountPercent || this.ReferrerPercent > maxDiscountPercent) {
      this.ReferrerPercentMsg = "Invalid percent";
    } else {
      this.ReferrerPercentMsg = "";
    }
  }
  ApplyBulkPercentage(type: Percentage_Type.Performer | Percentage_Type.Prescriber | Percentage_Type.Referrer) {
    this.DisplayedServiceItems.forEach(item => {
      if (item.IsSelected) {
        switch (type) {
          case 'Performer':
            item.PerformerPercent = this.PerformerPercent;
            break;
          case 'Prescriber':
            item.PrescriberPercent = this.PrescriberPercent;
            break;
          case 'Referrer':
            item.ReferrerPercent = this.ReferrerPercent;
            break;
        }
      }
    });
  }
  ApplyBulkOutpatient(event) {
    const isChecked = event.target.checked;
    this.DisplayedServiceItems.forEach(item => {
      if (item.IsSelected) {
        item.OpdSelected = isChecked;
        item.IsBulkApplied = isChecked;
      }
    });
  }
  ApplyBulkInpatient(event) {
    const isChecked = event.target.checked;
    this.DisplayedServiceItems.forEach(item => {
      if (item.IsSelected) {
        item.IpdSelected = isChecked;
        item.IsBulkApplied = isChecked;
      }
    });
  }
  OnDiscountPercentCheckboxChange(row) {
    if (!row.IsSelected) {
      row.IsSelected = false;
    } else {

      row.IsSelected = true;
      row.PerformerPercent = row.PerformerPercent || 0;
      row.PrescriberPercent = row.PrescriberPercent || 0;
      row.ReferrerPercent = row.ReferrerPercent || 0;
    }
  }
  ApplyIndividualOutpatient(row) {
    row.IsBulkApplied = false;
  }
  ApplyIndividualInpatient(row) {
    row.IsBulkApplied = false;
  }
  ClearForm() {
    this.DisplayedServiceItems = [];
    this.SelectAll = false;
    this.PerformerPercent = 0;
    this.PrescriberPercent = 0;
    this.ReferrerPercent = 0;
    this.Inpatient = false;
    this.Outpatient = false;
  }
  LoadFilteredData() {
    if (!this.currentProfile.PriceCategoryId || this.currentProfile.PriceCategoryId === 0) {

      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select a PriceCategory before loading data.']);
      return;
    }
    let filteredServiceDepartmentIds: number[] = [];
    if (this.ServiceDepartmentIds && this.ServiceDepartmentIds.length > 0) {
      filteredServiceDepartmentIds = this.ServiceDepartmentIds;
    } else if (this.SelectedDepartmentIds && this.SelectedDepartmentIds.length > 0) {
      const filteredServiceDepartments = this.ServiceDepartmentList.filter(sd =>
        this.SelectedDepartmentIds.includes(sd.DepartmentId)
      );
      filteredServiceDepartmentIds = filteredServiceDepartments.map(sd => sd.ServiceDepartmentId);
    }
    const requestPayload = {
      PriceCategoryId: this.currentProfile.PriceCategoryId,
      ServiceDepartmentIds: filteredServiceDepartmentIds,
    };

    this.incBLservice.GetFilteredServiceItems(requestPayload).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          const newServiceItems = res.Results;
          this.FilteredServiceItemSettingDropDownList = newServiceItems;
          const updatedServiceItems = [...this.AlredyMappedServiceItems];

          newServiceItems.forEach(newItem => {
            const existingItemIndex = updatedServiceItems.findIndex(
              existingItem => existingItem.ServiceItemId === newItem.ServiceItemId
            );

            if (existingItemIndex === -1) {

              updatedServiceItems.push({
                ...newItem,
                PrescriberPercent: 0,
                ReferrerPercent: 0,
                PerformerPercent: 0,
                OpdSelected: true,
                IpdSelected: true,
                IsSelected: false,
                IsBulkApplied: false,
              });
            } else {

              const existingItem = updatedServiceItems[existingItemIndex];
              updatedServiceItems[existingItemIndex] = {
                ...existingItem,
                PrescriberPercent: existingItem.PrescriberPercent || newItem.PrescriberPercent || 0,
                ReferrerPercent: existingItem.ReferrerPercent || newItem.ReferrerPercent || 0,
                PerformerPercent: existingItem.PerformerPercent || newItem.PerformerPercent || 0,
                OpdSelected: existingItem.OpdSelected,
                IpdSelected: existingItem.IpdSelected,
                IsSelected: existingItem.IsSelected,
                IsBulkApplied: existingItem.IsBulkApplied,
              };
            }
          });
          this.DisplayedServiceItems = updatedServiceItems;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage])
        }
      },
      error => {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error occurred while loading data:' + error])
      }
    );
  }
  public ItemListFormatter(data: any): string {
    let html = data["ItemName"];
    return html;
  }
  BillingTypesApplicable = (billingType: string) => {
    switch (billingType) {
      case 'inpatient':
        return { IpdSelected: true, OpdSelected: false };
      case 'outpatient':
        return { IpdSelected: false, OpdSelected: true };
      case 'both':
        return { IpdSelected: true, OpdSelected: true };
      default:
        return { IpdSelected: true, OpdSelected: true };
    }
  };
  SearchServiceItem() {
    const searchQuery = (this.SearchItemName || '').toString().trim().toLowerCase();

    if (searchQuery) {

      this.DisplayedServiceItems = this.DisplayedServiceItems.filter(item =>
        item.ItemName.toLowerCase().includes(searchQuery)
      );

      if (this.DisplayedServiceItems.length === 0) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['No matching items found.']);
      }
    } else {

      const mappedItemIds = new Set(this.PreviousProfileBillItems.map(item => item.ServiceItemId));
      this.DisplayedServiceItems = [
        ...this.PreviousProfileBillItems.map(item => {
          const { IpdSelected, OpdSelected } = this.BillingTypesApplicable(item.BillingTypesApplicable);
          return {
            ...item,
            IpdSelected,
            OpdSelected,
            IsSelected: true,
          };
        }),
        ...this.FilteredServiceItemSettingDropDownList
          .filter(item => !mappedItemIds.has(item.ServiceItemId))
          .map(item => {
            const { IpdSelected, OpdSelected } = this.BillingTypesApplicable(item.BillingTypesApplicable);
            return {
              ...item,
              IpdSelected,
              OpdSelected,
              IsSelected: item.IsSelected || false,
            };
          }),
      ];
    }
  }
  public OnExistingMappingToggle(isChecked: boolean): void {
    if (!isChecked) {
      this.SelProfileForAttach = null;
      this.selectedProfile = null;
      this.currentProfile.ProfileBillItemMap = [];
      this.PreviousProfileBillItems = [];
      this.ShowPreview = false;
      this.AttachProfileId = null;
    }
  }

}


class ProfileItemsVM {
  public SelServDepartment: any = null;
  public ItemName: string = "";
  public Price: number = null;
  // public AssignedToPercent: number = 0;
  // public ReferredByPercent: number = 0;
  public PerformerPercent: number = 0; // Krishna, 27th,jun'22, AssignedToPercent changed to PerformerPercent
  public PrescriberPercent: number = 0;// Krishna, 27th,jun'22, ReferredByPercent changed to PrescriberPercent
  public ReferrerPercent: number = 0;// Krishna, 27th,jun'22, Added new ReferrerPercent
  public OpdSelected: boolean = true;
  public IpdSelected: boolean = true;
  public ServiceDepartmentName: string = "";
  public ServiceItemId: number = null;
  public ServiceDepartmentId: number = null;
  BillItemProfileMapId: number = 0;
  BillingTypesApplicable: string = null;
  IsSelected: boolean = false;
}
