import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { CoreService } from "../../../core/shared/core.service";
import { Employee } from "../../../employee/shared/employee.model";
import { LabTest } from "../../../labs/shared/lab-test.model";
import { ImagingItem } from "../../../radiology/shared/imaging-item.model";
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { DanpheCache, MasterType } from "../../../shared/danphe-cache-service-utility/cache-services";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_IntegrationNames, ENUM_MessageBox_Status, ENUM_OTCategories } from "../../../shared/shared-enums";
import { IntegrationName } from "../../shared/integration-name.model";
import { ServiceDepartment } from '../../shared/service-department.model';
import { SettingsService } from "../../shared/settings-service";
import { SettingsBLService } from '../../shared/settings.bl.service';
import { BillServiceItemModel, BillServiceItemsPriceCategoryMap, ServiceCategories } from "../shared/bill-service-item.model";
@Component({
  selector: 'app-bill-service-item',
  templateUrl: './bill-service-item.component.html',
})
export class BillServiceItemComponent {
  public loading: boolean = false;
  public CurrentBillingItem: BillServiceItemModel = new BillServiceItemModel();
  public showAddServiceDepartmentPopUp: boolean = false;
  @Input("selectedItem")
  public selectedItem: BillServiceItemModel;
  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  public srvdeptList: Array<ServiceDepartment> = new Array<ServiceDepartment>();
  @Input('service-categories')
  public ServiceCategoryList: Array<ServiceCategories> = new Array<ServiceCategories>();
  @Input('integration-name-list')
  public integrationNameList: Array<IntegrationName> = new Array<IntegrationName>();
  @Input("service-items")
  public ServiceItems = new Array<BillServiceItemModel>();
  public allEmployeeList: Array<Employee> = [];
  public docterList: Array<Employee> = [];
  public defaultDoctorList: string;
  public PreSelectedDoctors: Array<Employee> = [];
  public BillItemsPriceCatMap: BillServiceItemsPriceCategoryMap[] = [];
  public tempBillItemsPriceCatMap: BillServiceItemsPriceCategoryMap[] = [];
  public isSrvDeptValid: boolean;
  public selectedServiceCategory: ServiceCategories;
  public isServiceCategoryValid: boolean = false;
  public selectedSrvDept: ServiceDepartment = new ServiceDepartment();
  @Input('update') update: boolean = false;
  public selectedIntegration: IntegrationName;
  public tempData: { tempItemName: string, tempItemCode: string } = { tempItemName: '', tempItemCode: '' };
  OTCategories: { CategoryName: string, CategoryValue: string }[] = [];
  SelectedOTCategory: string = '';
  LabTests = new Array<LabTest>();
  ImagingMasterItems = new Array<ImagingItem>();
  ShowLabTestSelection: boolean = false;
  ShowImagingItemSelection: boolean = false;
  SelectedLabTest: LabTest;
  SelectedImagingItem: ImagingItem;


  constructor(
    public settingsBLService: SettingsBLService,
    public securityService: SecurityService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public coreService: CoreService, public settingsService: SettingsService) {
    this.GetSrvDeptList();
    this.GetPriceCategories();
    this.GetLabTests();
    this.GetImagingMasterItems();

    this.allEmployeeList = DanpheCache.GetData(MasterType.Employee, null);
    this.docterList = this.allEmployeeList.filter(a => a.IsAppointmentApplicable == true && a.IsActive);
    this.GoToNextInput("ServiceDepartmentName");

    this.OTCategories = Object.keys(ENUM_OTCategories)
      .map(key => ({
        CategoryName: key,
        CategoryValue: ENUM_OTCategories[key as keyof typeof ENUM_OTCategories]
      }));


  }

  ngOnInit() {

    this.loading = false;
    if (this.selectedItem) {
      this.update = true;
      this.CurrentBillingItem = Object.assign(this.CurrentBillingItem, this.selectedItem);
      this.selectedIntegration = this.integrationNameList.find(i => i.IntegrationName === this.selectedItem.IntegrationName);
      this.selectedServiceCategory = this.ServiceCategoryList.find(c => c.ServiceCategoryId === this.selectedItem.ServiceCategoryId);
      this.SelectedOTCategory = this.selectedItem.OTCategory ? this.selectedItem.OTCategory : "";

      if (this.CurrentBillingItem.DefaultDoctorList && this.CurrentBillingItem.DefaultDoctorList.length) {
        this.AssignPreSelectedDocter();
      }

      this.selectedSrvDept.ServiceDepartmentName = this.CurrentBillingItem.ServiceDepartmentName;
      this.CurrentBillingItem.EnableControl("ServiceDepartmentId", false);
      this.CurrentBillingItem.CreatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
      this.CurrentBillingItem.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.GetBilCfgItemsVsPriceCategory(this.selectedItem.ServiceItemId);
    }
    else {
      this.CurrentBillingItem = new BillServiceItemModel();
      this.selectedSrvDept = null;
      this.CurrentBillingItem.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.CurrentBillingItem.CreatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
      this.update = false;
    }

  }


  public GetPriceCategories() {
    this.settingsBLService.GetPriceCategories().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          let priceCategories = res.Results;
          this.coreService.Masters.PriceCategories = priceCategories;
          let activePriceCategories = priceCategories.filter(a => a.IsActive === true);
          this.BillItemsPriceCatMap = [];
          for (let index = 0; index < activePriceCategories.length; index++) {
            let temp = new BillServiceItemsPriceCategoryMap();
            temp.PriceCategoryId = activePriceCategories[index].PriceCategoryId;
            temp.PriceCategoryName = activePriceCategories[index].PriceCategoryName;
            temp.ItemLegalCode = '';
            temp.Price = 0;
            temp.ItemLegalName = '';
            this.BillItemsPriceCatMap.push(temp);
          }
        } else {
          this.msgBoxServ.showMessage('Failed', ['Failed to get price categories.']);
          console.error(res.ErrorMessage);
        }
      }, err => {
        this.msgBoxServ.showMessage('Error', ['Error fetching price categories.']);
        console.error(err);
      });
  }



  GetBilCfgItemsVsPriceCategory(ServiceItemId: number) {
    if (ServiceItemId) {
      this.settingsBLService.GetServiceItemsVsPriceCategory(ServiceItemId).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            console.log(this.BillItemsPriceCatMap);
            let billItemsPriceCategoryMapFromServer: Array<BillServiceItemsPriceCategoryMap> = res.Results;
            this.BillItemsPriceCatMap.map(a => {
              let matchedData = billItemsPriceCategoryMapFromServer.find(b => b.PriceCategoryId == a.PriceCategoryId);
              if (matchedData) {
                a.PriceCategoryServiceItemMapId = matchedData.PriceCategoryServiceItemMapId;
                if (matchedData.IsActive === true) {
                  a.IsSelected = true;
                }
                a.ServiceItemId = matchedData.ServiceItemId;
                a.IsDiscountApplicable = matchedData.IsDiscountApplicable;
                a.ItemLegalCode = matchedData.ItemLegalCode;
                a.ItemLegalName = matchedData.ItemLegalName;
                a.Price = matchedData.Price;
                a.HasAdditionalBillingItems = matchedData.HasAdditionalBillingItems;
                a.IsIncentiveApplicable = matchedData.IsIncentiveApplicable;
                a.IsPriceChangeAllowed = matchedData.IsPriceChangeAllowed;
                a.IsZeroPriceAllowed = matchedData.IsZeroPriceAllowed;
                a.IsCappingEnabled = matchedData.IsCappingEnabled;
                a.CappingLimitDays = matchedData.CappingLimitDays;
                a.CappingQuantity = matchedData.CappingQuantity;
              }
            });
          } else {
            console.log(res);
          }
        },
        (err: DanpheHTTPResponse) => {
          console.log(err);
        }
      );
    }
  }

  AssignSelectedDepartment() {
    if (this.selectedSrvDept && !this.selectedItem) {
      const selectedServiceDept = this.srvdeptList.find(dept => dept.ServiceDepartmentName === this.selectedSrvDept.ServiceDepartmentName);

      if (selectedServiceDept) {
        this.CurrentBillingItem.BillingItemValidator.get('IntegrationName').setValue(selectedServiceDept.IntegrationName);
        let selIntegration = this.integrationNameList.find(i => i.IntegrationName === selectedServiceDept.IntegrationName);
        if (selIntegration) {
          this.CurrentBillingItem.IntegrationItemId = 0;//selIntegration.IntegrationNameID;
          this.CurrentBillingItem.IntegrationName = selIntegration.IntegrationName;
          if (selIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.LAB.toLowerCase()) {
            this.ShowLabTestSelection = true;
            this.ShowImagingItemSelection = false;
          } else if (selIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.Radiology.toLowerCase()) {
            this.ShowLabTestSelection = false;
            this.ShowImagingItemSelection = true;
          } else {
            this.ShowLabTestSelection = false;
            this.ShowImagingItemSelection = false;
          }
        }
      }
      if (selectedServiceDept && selectedServiceDept.IntegrationName == null) {
        let selIntegration = this.integrationNameList.find(i => i.IntegrationName === 'None');
        if (selIntegration) {
          this.CurrentBillingItem.IntegrationItemId = 0;//selIntegration.IntegrationNameID;
          this.CurrentBillingItem.IntegrationName = selIntegration.IntegrationName;
          this.CurrentBillingItem.BillingItemValidator.get('IntegrationName').setValue(selIntegration.IntegrationName);
        }
      }
    }
  }

  public GetSrvDeptList() {
    try {
      this.settingsBLService.GetServiceDepartments()
        .subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results.length) {
              this.srvdeptList = res.Results;

            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for error message."]);
              this.logError(res.ErrorMessage);
            }
          }
        },
          err => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get service departments Check log for error message."]);
            this.logError(err.ErrorMessage);
          });
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }
  showMessageBox(arg0: string, arg1: string) {
    throw new Error("Method not implemented.");
  }
  logError(ErrorMessage: any) {
    throw new Error("Method not implemented.");
  }
  ShowCatchErrMessage(exception: any) {
    throw new Error("Method not implemented.");
  }
  CheckValidations(): boolean {
    let isValid: boolean = true;
    for (var i in this.CurrentBillingItem.BillingItemValidator.controls) {
      this.CurrentBillingItem.BillingItemValidator.controls[i].markAsDirty();
      this.CurrentBillingItem.BillingItemValidator.controls[i].updateValueAndValidity();
    }
    isValid = this.CurrentBillingItem.IsValidCheck(undefined, undefined);
    return isValid;
  }

  Add() {
    this.CurrentBillingItem.BilCfgItemsVsPriceCategoryMap = this.BillItemsPriceCatMap.filter(a => a.IsSelected === true);
    //check if itemCode is same with already existing items.
    if (this.ServiceItems && this.ServiceItems.length && !this.update) {
      const isAlreadyExists = this.ServiceItems.some(s => s.ItemCode === this.CurrentBillingItem.ItemCode);
      if (isAlreadyExists) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Add ServiceItems as ItemCode: ${this.CurrentBillingItem.ItemCode} is already Taken!`]);
        return;
      }
    }
    if (this.CheckValidations() && !this.loading) {
      this.CurrentBillingItem.DefaultDoctorList = this.defaultDoctorList ? this.defaultDoctorList : null;
      if (this.CurrentBillingItem.IsOT) {
        if (!this.SelectedOTCategory) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`OT Type is Mandatory.`]);
          return;
        }
        this.CurrentBillingItem.OTCategory = this.SelectedOTCategory;
      }
      this.settingsBLService.AddServiceItems(this.CurrentBillingItem)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status == ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Item Added Successfully']);
              this.CurrentBillingItem = new BillServiceItemModel();
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to add service item!`]);
            }
            this.loading = false;
            this.Close();
          },
          err => {
            this.logError(err);
            this.loading = false;
          });
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please fill all mandatory fields."]);
    }
  }


  Discard() {
    this.CurrentBillingItem = new BillServiceItemModel;
    this.selectedItem = null;
    this.callbackAdd.emit({ action: "close", item: null });
    this.update = false;
    this.router.navigate(["/Settings/BillingManage/ServiceItems"]);
  }

  AddBillServiceItemsPriceCategoryMap(rowToAdd: BillServiceItemsPriceCategoryMap, index: number) {
    if (rowToAdd.IsSelected) {
      if (rowToAdd.Price < 0) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Row cannot be added as the Price is negative. Please enter the positive value.']);
        return;
      }
      rowToAdd.ServiceItemId = this.CurrentBillingItem.ServiceItemId;
      rowToAdd.ServiceDepartmentId = this.CurrentBillingItem.ServiceDepartmentId;
      this.settingsBLService.AddBillServiceItemsPriceCategoryMap(rowToAdd).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.BillItemsPriceCatMap[index].PriceCategoryServiceItemMapId = res.Results.PriceCategoryMapId;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Successfully added BillServiceItemsPriceCategoryMap!']);
            // this.GetPriceGategories();
            this.changeDetector.detectChanges();
          }
        },
        (err: DanpheHTTPResponse) => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Cannot Add BillServiceItemsPriceCategoryMap!"]);
          console.log(err.ErrorMessage);
        }
      );
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for Details "]);
    }
  }

  UpdateServiceItemsPriceCategoryMap(rowToUpdate: BillServiceItemsPriceCategoryMap) {
    if (rowToUpdate) {
      if (rowToUpdate.Price < 0) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Row cannot be updated as the Price is negative. Please enter the positive value.']);
        return;
      }
      rowToUpdate.IsActive = rowToUpdate.IsSelected;
      this.settingsBLService.UpdateBillServiceItemsPriceCategoryMap(rowToUpdate).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Successfully Updated BillServiceItemsPriceCategoryMap!']);
            this.changeDetector.detectChanges();

          }
        },
        (err: DanpheHTTPResponse) => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Cannot Update BillServiceItemsPriceCategoryMap!"]);
          console.log(err.ErrorMessage);
        }
      );
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for Details "]);
    }
  }

  ServiceDeptListFormatter(data: any): string {
    return data["ServiceDepartmentName"];
  }

  ServiceCatListFormatter(data: any): string {
    return data["ServiceCategoryName"];
  }

  IntegrationNameListFormatter(data: any): string {
    return data["IntegrationName"];
  }

  OnSrvDeptValueChanged() {
    let srvDept = null;
    if (!this.selectedSrvDept) {
      this.CurrentBillingItem.ServiceDepartmentId = null;
      this.isSrvDeptValid = false;
    }
    else if (typeof (this.selectedSrvDept) === 'string') {
      srvDept = this.srvdeptList.find(a => a.ServiceDepartmentName.toLowerCase() == this.selectedSrvDept.ServiceDepartmentName.toLowerCase());
    }
    else if (typeof (this.selectedSrvDept) === "object") {
      srvDept = this.selectedSrvDept;
    }

    if (srvDept) {
      this.CurrentBillingItem.ServiceDepartmentId = srvDept.ServiceDepartmentId;
      this.isSrvDeptValid = true;
    }
    else {
      this.CurrentBillingItem.ServiceDepartmentId = null;
      this.isSrvDeptValid = false;
    }
  }

  OnIntegrationChange() {
    if (this.selectedIntegration && this.selectedIntegration.IntegrationName) {
      if (this.selectedIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.LAB.toLowerCase()) {
        this.SelectedLabTest = undefined;
        this.ShowLabTestSelection = true;
        this.ShowImagingItemSelection = false;
      } else if (this.selectedIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.Radiology.toLowerCase()) {
        this.SelectedImagingItem = undefined;
        this.ShowLabTestSelection = false;
        this.ShowImagingItemSelection = true;

      }
      else if (this.selectedIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.BedCharges.toLowerCase() && this.selectedItem && this.selectedItem.IntegrationItemId) {
        this.ShowLabTestSelection = false;
        this.ShowImagingItemSelection = false;
        this.CurrentBillingItem.IntegrationItemId = this.selectedItem.IntegrationItemId;
      }
      else if (this.selectedIntegration.IntegrationName.toLowerCase() === ENUM_IntegrationNames.OPD.toLowerCase()) {
        this.ShowLabTestSelection = false;
        this.ShowImagingItemSelection = false;
        this.CurrentBillingItem.IntegrationItemId = this.selectedItem.IntegrationItemId;
      }
      else {
        this.ShowLabTestSelection = false;
        this.ShowImagingItemSelection = false;
        this.CurrentBillingItem.IntegrationItemId = 0;
      }
      this.CurrentBillingItem.IntegrationName = this.selectedIntegration.IntegrationName;
    }
    else {
      this.CurrentBillingItem.IntegrationItemId = 0;
      this.CurrentBillingItem.IntegrationName = null;
    }
  }
  OnCategoryValueChanged() {

    if (this.selectedServiceCategory.ServiceCategoryId > 0) {
      this.CurrentBillingItem.ServiceCategoryId = this.selectedServiceCategory.ServiceCategoryId;
      this.isServiceCategoryValid = true;
    }
    else {
      this.CurrentBillingItem.ServiceCategoryId = null;
      this.isServiceCategoryValid = false;
    }
  }
  Update() {
    this.CurrentBillingItem.BilCfgItemsVsPriceCategoryMap = this.BillItemsPriceCatMap.filter(a => a.IsSelected === true);
    //check if itemCode is same with already existing items.
    if (this.ServiceItems && this.ServiceItems.length && !this.update) {
      const isAlreadyExists = this.ServiceItems.some(s => s.ItemCode === this.CurrentBillingItem.ItemCode && s.ServiceItemId !== this.CurrentBillingItem.ServiceItemId);
      if (isAlreadyExists) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update ServiceItems as ItemCode: ${this.CurrentBillingItem.ItemCode} is already Taken!`]);
        return;
      }
    }

    // Checking for negative values in selected rows
    const hasNegativePrice = this.CurrentBillingItem.BilCfgItemsVsPriceCategoryMap.some(item => item.Price < 0);
    if (hasNegativePrice) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Cannot update Service Items as one or more rows have a negative price. Please enter valid amounts.']);
      return;
    }

    if (this.CheckValidations() && !this.loading) {
      if (this.defaultDoctorList) {
        this.CurrentBillingItem.DefaultDoctorList = this.defaultDoctorList;
      }
      if (this.CurrentBillingItem.IsOT) {
        if (!this.SelectedOTCategory) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`OT Type is Mandatory.`]);
          return;
        }
        this.CurrentBillingItem.OTCategory = this.SelectedOTCategory;
      }
      this.settingsBLService.UpdateServiceItem(this.CurrentBillingItem)
        .subscribe(
          (res: DanpheHTTPResponse) => {

            if (res.Status == ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Service Item Details Updated']);
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed updating Service Item, check log for details']);
            }
            this.CurrentBillingItem = new BillServiceItemModel();
            this.loading = false;
            this.Close();
          },
          err => {
            this.logError(err);
            this.loading = false;
          });



    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please fill all mandatory fields."]);
    }
  }
  Close() {
    this.CurrentBillingItem = new BillServiceItemModel;
    this.selectedItem = null;
    this.callbackAdd.emit({ action: "close", item: null });
    this.update = false;
  }

  OnNewServiceDepartmentAdded($event) {
    if ($event.action == "add") {
      var serviceDepartment = $event.servDepartment;
      this.srvdeptList.push(serviceDepartment);
      this.srvdeptList = this.srvdeptList.slice();
      this.selectedSrvDept = serviceDepartment;
      this.OnSrvDeptValueChanged();

    }

    this.showAddServiceDepartmentPopUp = false;
  }

  public AssignDefaultDocter($event) {
    this.defaultDoctorList;
    let defDocListString = [];
    let selectedDoc = $event;
    selectedDoc.forEach(x => {
      defDocListString.push(x.EmployeeId);
    });

    var DocListString = defDocListString.join(",");
    if (defDocListString) {
      this.defaultDoctorList = "[" + DocListString + "]";
    }

  }

  public AssignPreSelectedDocter() {
    var str = JSON.parse(this.CurrentBillingItem.DefaultDoctorList);
    str.forEach(a => {
      var abd = this.docterList.find(b => b.EmployeeId == a);
      this.PreSelectedDoctors.push(abd);
    });
  }

  public GoToNextInput(id: string) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }
  KeysPressed(event) {
    if (event.keyCode == 27) {
      this.Close();
    }
  }

  AssignItemLegalNameCode(index: number) {
    if (this.BillItemsPriceCatMap[index].IsSelected) {
      const item = this.BillItemsPriceCatMap[index];
      if (!item.ItemLegalCode) {
        item.ItemLegalCode = this.CurrentBillingItem.ItemCode;
      }
      if (!item.ItemLegalName) {
        item.ItemLegalName = this.CurrentBillingItem.ItemName;
      }
      if (!item.Price) {
        item.Price = this.CurrentBillingItem.Price;
      }
    }
    else {
      const item = this.BillItemsPriceCatMap[index];
      item.ItemLegalCode = '';
      item.ItemLegalName = '';
      item.Price = 0;
    }
  }

  generateItemCodeClicked: boolean = false;
  GenerateItemCodeAutomatically(): void {
    if (this.CurrentBillingItem && this.CurrentBillingItem.ItemName && this.CurrentBillingItem.ItemName.trim()) {
      this.generateItemCodeClicked = true;
      this.settingsBLService.GenerateItemCode(this.CurrentBillingItem.ItemName).finally(() => this.generateItemCodeClicked = false).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.CurrentBillingItem.ItemCode = res.Results;
          this.CurrentBillingItem.BillingItemValidator.get('ItemCode').setValue(this.CurrentBillingItem.ItemCode);
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Could not generate ItemCode automatically!`]);
        }
      }, err => {
        console.log(err);
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Something Went Wrong, Could not generate ItemCode automatically!`]);
      });
    } else {
      this.generateItemCodeClicked = false;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Please provide ItemName to generate ItemCode automatically!`]);
    }
  }
  onCappingChange(row: any) {
    if (!row.IsCappingEnabled) {
      row.CappingLimitDays = 0;
      row.CappingQuantity = 0;
    }
  }

  GetLabTests(): void {
    this.settingsBLService.GetAllLabTests().subscribe((res: DanpheHTTPResponse) => {
      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        const labTests = res.Results;
        if (labTests && labTests.length) {
          this.LabTests = labTests.filter(l => l.IsActive === true);
          if (this.update) {
            this.SelectedLabTest = this.LabTests.find(a => a.LabTestId === this.CurrentBillingItem.IntegrationItemId);
          }
        }
      }
    }, err => {
      console.error(err);
    });
  }

  GetImagingMasterItems(): void {
    this.settingsBLService.GetAllImagingItems().subscribe((res: DanpheHTTPResponse) => {
      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        const imagingItems = res.Results;
        if (imagingItems && imagingItems.length) {
          this.ImagingMasterItems = imagingItems.filter(i => i.IsActive === true);
          if (this.update) {
            this.SelectedImagingItem = this.ImagingMasterItems.find(a => a.ImagingItemId === this.CurrentBillingItem.IntegrationItemId);
          }
        }
      }
    }, err => {
      console.error(err);
    });
  }

  LabTestFormatter(data): string {
    return data['LabTestName'];
  }

  ImagingItemFormatter(data): string {
    return data['ImagingItemName'];
  }

  OnLabTestSelected(): void {
    if (this.SelectedLabTest) {
      this.CurrentBillingItem.IntegrationItemId = this.SelectedLabTest.LabTestId;
    }
  }

  OnImagingItemSelected(): void {
    if (this.SelectedImagingItem) {
      this.CurrentBillingItem.IntegrationItemId = this.SelectedImagingItem.ImagingItemId;
    }
  }
}
