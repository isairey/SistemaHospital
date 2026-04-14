import { Component, EventEmitter, Input, Output } from "@angular/core";

import { BillingPackageItem } from '../../../billing/shared/billing-package-item.model';
import { BillingPackage } from '../../../billing/shared/billing-package.model';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ServiceDepartment } from '../../shared/service-department.model';
import { SettingsBLService } from '../../shared/settings.bl.service';

import { BillingInvoiceBlService } from "../../../billing/shared/billing-invoice.bl.service";
import { BillingMasterBlService } from "../../../billing/shared/billing-master.bl.service";
import { BillingService } from "../../../billing/shared/billing.service";
import { BillingPackageServiceItems_DTO } from "../../../billing/shared/dto/bill-package-service-items.dto";
import { BillingPackages_DTO } from "../../../billing/shared/dto/billing-packages.dto";
import { ServiceItemDetails_DTO } from "../../../billing/shared/dto/service-item-details.dto";
import { CoreService } from "../../../core/shared/core.service";
import { Employee } from "../../../employee/shared/employee.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from '../../../shared/common.functions';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PriceCategory_DTO } from "../../shared/DTOs/price-category.dto";
import { Department } from "../../shared/department.model";
import { BillingPackageForGrid_DTO } from "../shared/dto/bill-package-for-grid.dto";
import { BillingPackageServiceItem_DTO } from "../shared/dto/billing-package-service-item.dto";
@Component({
  selector: "billingPackage-add",
  templateUrl: "./billing-package-add.html",
  host: { '(window:keydown)': 'KeysPressed($event)' }
})
export class BillingPackageAddComponent {

  public CurrentBillingPackage = new BillingPackage();
  @Input("showAddPage")
  public showAddPage: boolean = false;
  @Input("selectedItem")
  public selectedItem: BillingPackageForGrid_DTO;
  @Output("callback-add")
  public callbackAdd = new EventEmitter<Object>();
  @Input("isUpdate")
  public isUpdate: boolean = false;
  public selectedServDepts: Array<Department> = []; //added yub 24th sept 2018
  public srvdeptList = new Array<ServiceDepartment>(); //service department list
  public packageItemList: Array<BillingPackageItem>;
  public totalAmount: number = 0;
  public totalDiscount: number = 0;
  public taxPercent: number = 0;
  public loading: boolean = false;
  public doctorList: Array<Employee> = [];
  public selectedDoctors: Array<Employee> = [];
  public LabTypeName: string = 'op-lab'; // Krishna,5thMay'22 , Added this to handle labtypes while adding billing packages..
  public IsItemLevelDiscount: boolean = false;
  public IsEditable: boolean = false;
  public ServiceItems = new Array<ServiceItemDetails_DTO>();
  public loadingScreen: boolean = false;
  public SchemePriCeCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public PriceCategoryId: number = 0;

  public OldSchemePriCeCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public serviceBillingContext: string = "";
  public EnablePrice: boolean = false;
  public DisableSchemePriceSelection: boolean = false;
  public SelectedServiceItem = new BillingPackageServiceItem_DTO();
  public SelectedServiceItemList = new Array<BillingPackageServiceItem_DTO>();
  public SelectedPerformer = new Employee();
  public DiscountPercent: number = 0;
  public BillingPackage: BillingPackages_DTO = new BillingPackages_DTO();
  public confirmationTitle: string = "Confirm !";
  public confirmationMessageForSave: string = "Are you sure you want to Save Billing Package ?";
  public confirmationMessageForUpdate: string = "Are you sure you want to Update Billing Package ?";
  public IsPackageItemsInitialLoad: boolean = false;
  public DisplaySchemePriceCategorySelection: boolean = false;
  public IsPerformerValid: boolean = true;
  public CurrencyUnit: string = "Rs";
  public IsDiscountPercentValid: boolean = true;
  public billingPackageList: BillingPackageForGrid_DTO[] = [];

  constructor(
    private _settingsBLService: SettingsBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _billingService: BillingService,
    private _billingMasterBlService: BillingMasterBlService,
    public billingInvoiceBlService: BillingInvoiceBlService,
  ) {
    this.GetBillingPackageList();
    this.GetSrvDeptList();
    this.LoadAllDoctorsList();
    if (this.coreService.currencyUnit) {
      this.CurrencyUnit = this.coreService.currencyUnit;
    } else {
      this.CurrencyUnit = "Rs";
    }
  }

  ngOnInit() {
    this.IsItemLevelDiscount = false;
    this.SelectedServiceItemList = new Array<BillingPackageServiceItem_DTO>();
    this.CurrentBillingPackage = new BillingPackage();
    this.CurrentBillingPackage.PackageServiceItems = new Array<BillingPackageItem>();
    this.SelectedPerformer = null;
    if (this.isUpdate) {
      this.IsPackageItemsInitialLoad = true;
      this.SchemePriCeCategory.SchemeId = this.selectedItem.SchemeId;
      this.SchemePriCeCategory.PriceCategoryId = this.selectedItem.PriceCategoryId;
      this.PriceCategoryId = this.SchemePriCeCategory.PriceCategoryId;
      this.DisableSchemePriceSelection = true;
      this.GetBillingPackageServiceItemList(this.selectedItem.BillingPackageId, this.selectedItem.PriceCategoryId);
    } else {
      this.DisplaySchemePriceCategorySelection = true;
    }
    this.taxPercent = this._billingService.taxPercent;
    this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
  }

  public GetBillingPackageServiceItemList(BillingPackageId: number, PriceCategoryId: number): void {
    this._settingsBLService.GetBillingPackageServiceItemList(BillingPackageId, PriceCategoryId)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.SelectedServiceItemList = res.Results;
            this.SchemePriCeCategory.SchemeId = this.selectedItem.SchemeId;
            console.log('selected value : ', this.selectedItem);
            this.SchemePriCeCategory.PriceCategoryId = this.selectedItem.PriceCategoryId;
            this.CurrentBillingPackage = new BillingPackage();
            this.SetValuesInCurrentBillingPackageFormControl();
            this.CurrentBillingPackage.BillingPackageId = this.selectedItem.BillingPackageId;
            this.CurrentBillingPackage.SchemeId = this.selectedItem.SchemeId;
            this.CurrentBillingPackage.PriceCategoryId = this.selectedItem.PriceCategoryId;
            this.CurrentBillingPackage.TotalPrice = this.selectedItem.TotalPrice;
            this.CurrentBillingPackage.IsEditable = this.selectedItem.IsEditable;
            this.CurrentBillingPackage.IsItemLevelDiscount = this.selectedItem.IsItemLevelDiscount;
            this.CurrentBillingPackage.IsHealthPackage = this.selectedItem.IsHealthPackage;
            this.CurrentBillingPackage.IsItemLoadPackage = this.selectedItem.IsItemLoadPackage;
            this.CurrentBillingPackage.IsDiscountEditableInSales = this.selectedItem.IsDiscountEditableInSales;
            this.IsEditable = this.selectedItem.IsEditable;
            this.IsItemLevelDiscount = this.selectedItem.IsItemLevelDiscount;
            this.CurrentBillingPackage.DiscountPercent = CommonFunctions.parseAmount(this.selectedItem.DiscountPercent, 4);
            this.DiscountPercent = this.selectedItem.DiscountPercent;
            this.CurrentBillingPackage.IsActive = this.selectedItem.IsActive;
            this.CurrentBillingPackage.LabTypeName = this.selectedItem.LabTypeName;
            this.AssignPackageServiceItemtoDTO();
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to get BillingPackageServiceItemList"]);
          this.logError(res.ErrorMessage);
        }
      },
        err => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Unable to get BillingPackageServiceItemList. Check log for error message."]);
          this.logError(err.ErrorMessage);
        });
  }

  public SetValuesInCurrentBillingPackageFormControl(): void {
    this.CurrentBillingPackage.BillingPackageValidator.get('BillingPackageName').setValue(this.selectedItem.BillingPackageName);
    this.CurrentBillingPackage.BillingPackageValidator.get('PackageCode').setValue(this.selectedItem.PackageCode);
    this.CurrentBillingPackage.BillingPackageValidator.get('Description').setValue(this.selectedItem.Description);
  }

  public AssignValuesInCurrentBillingPackage(): void {
    this.CurrentBillingPackage.BillingPackageName = this.CurrentBillingPackage.BillingPackageValidator.value.BillingPackageName;
    this.CurrentBillingPackage.PackageCode = this.CurrentBillingPackage.BillingPackageValidator.value.PackageCode;
    this.CurrentBillingPackage.Description = this.CurrentBillingPackage.BillingPackageValidator.value.Description;
  }

  public ItemLevelDiscountCheckBoxOnChange(): void {
    this.CalculationForSelectedServiceItem();
  }

  public EditableCheckBoxOnChange(): void {
    if (this.IsEditable) {
      this.IsEditable = false;
    }
    else {
      this.IsEditable = true;
    }
  }

  public OnItemQuantityChanged(): void {
    this.SelectedServiceItem.Quantity = this.SelectedServiceItem.Quantity ? this.SelectedServiceItem.Quantity : 1;
    this.CalculationForSelectedServiceItem();
  }

  public OnItemDiscountPercentChanged(): void {
    if (this.SelectedServiceItem && (this.SelectedServiceItem.DiscountPercent >= 0 && this.SelectedServiceItem.DiscountPercent <= 100)) {
      this.IsDiscountPercentValid = true;
      this.CalculationForSelectedServiceItem();
    } else {
      this.IsDiscountPercentValid = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Discount Percent should be between 0 and 100"]);
    }
  }

  public OnItemDiscountAmountChanged(): void {
    this.CalculationForSelectedServiceItem();
  }

  public CalculationForSelectedServiceItem(): void {
    if (this.IsItemLevelDiscount) {
      this.SelectedServiceItem.DiscountAmount = (this.SelectedServiceItem.DiscountPercent / 100) * this.SelectedServiceItem.Price;
    }
    else {
      this.SelectedServiceItem.DiscountAmount = 0;
    }
    this.SelectedServiceItem.TotalAmount = (this.SelectedServiceItem.Price * this.SelectedServiceItem.Quantity) - this.SelectedServiceItem.DiscountAmount;
  }

  public CalculationForCurrentBillingPackage(): void {
    if (this.SelectedServiceItemList.length === 0) {
      this.CurrentBillingPackage.TotalPrice = 0;
      this.CurrentBillingPackage.DiscountPercent = 0;
      this.totalDiscount = 0;
      this.totalAmount = 0;
      return;
    }
    this.totalAmount = this.CurrentBillingPackage.TotalPrice;
    if (this.totalDiscount) {
      this.CurrentBillingPackage.DiscountPercent = CommonFunctions.parseAmount(((this.totalDiscount / this.CurrentBillingPackage.TotalPrice) * 100), 4);
    } else {
      this.totalDiscount = Math.round((this.CurrentBillingPackage.DiscountPercent * this.CurrentBillingPackage.TotalPrice) / 100);
    }
    if (this.IsItemLevelDiscount) {
      this.CurrentBillingPackage.PackageServiceItems.map(itm => itm.IsItemLevelDiscount = true);
      const overAllSubTotal = this.CurrentBillingPackage.PackageServiceItems.reduce((acc, curr) => acc + (curr.Price * curr.Quantity), 0);
      const overAllDiscountAmount = this.CurrentBillingPackage.PackageServiceItems.reduce((acc, curr) => acc + curr.DiscountAmount, 0);

      this.CurrentBillingPackage.TotalPrice = overAllSubTotal;
      this.totalAmount = this.CurrentBillingPackage.TotalPrice - overAllDiscountAmount;
      this.totalDiscount = Math.round(overAllDiscountAmount);
      this.CurrentBillingPackage.DiscountPercent = CommonFunctions.parseAmount(((this.totalDiscount * 100) / this.CurrentBillingPackage.TotalPrice), 4);
      // this.CurrentBillingPackage.DiscountPercent = Math.round(this.CurrentBillingPackage.DiscountPercent * 10000) / 10000;
      this.CurrentBillingPackage.DiscountPercent = CommonFunctions.parseAmount(((this.CurrentBillingPackage.DiscountPercent * 10000) / 10000), 4);

      this.CurrentBillingPackage.TotalPrice = CommonFunctions.parseAmount(this.CurrentBillingPackage.TotalPrice, 3);
      this.totalAmount = CommonFunctions.parseAmount(this.totalAmount, 3);
      this.totalDiscount = Math.round(this.totalDiscount);
      this.CurrentBillingPackage.PackageServiceItems.forEach((item, index) => {
        this.SelectedServiceItemList[index].DiscountAmount = item.DiscountAmount;
        this.SelectedServiceItemList[index].TotalAmount = item.Total;
      });

    } else {
      this.CurrentBillingPackage.PackageServiceItems.map(itm => itm.IsItemLevelDiscount = false);
      //this.CurrentBillingPackage.TotalPrice = 0;

      this.totalAmount = 0;
      //this.totalDiscount = (this.CurrentBillingPackage.DiscountPercent * this.CurrentBillingPackage.TotalPrice) / 100;
      this.CurrentBillingPackage.PackageServiceItems.forEach((item, index) => {
        const itemSubTotal = item.Price * item.Quantity;
        let itemDiscount;
        if (!this.IsPackageItemsInitialLoad) {
          itemDiscount = CommonFunctions.parseAmount(((itemSubTotal * this.CurrentBillingPackage.DiscountPercent) / 100), 2);
          item.DiscountPercent = this.CurrentBillingPackage.DiscountPercent;
        }
        else {
          itemDiscount = CommonFunctions.parseAmount(((itemSubTotal * item.DiscountPercent) / 100), 2);
        }
        item.DiscountAmount = itemDiscount;
        item.Total = itemSubTotal - itemDiscount;
        this.SelectedServiceItemList[index].DiscountAmount = item.DiscountAmount;
        this.SelectedServiceItemList[index].TotalAmount = item.Total;
        item.Tax = (this.taxPercent * item.Total) / 100;
        item.Total = CommonFunctions.parseAmount(item.Total + item.Tax);
      });
      this.IsPackageItemsInitialLoad = false;
      this.CurrentBillingPackage.TotalPrice = this.CurrentBillingPackage.PackageServiceItems.reduce((acc, curr) => acc + (curr.Price * curr.Quantity), 0)
      this.totalAmount = CommonFunctions.parseAmount(this.CurrentBillingPackage.TotalPrice - this.totalDiscount);
    }
  }

  public AssignSelectedInvoiceItem(): void {

    if (this.SelectedServiceItem && this.SelectedServiceItem.ServiceItemId && typeof (this.SelectedServiceItem) === 'object') {
      const isDuplicate = this.SelectedServiceItemList.some(serviceItem => serviceItem.ServiceItemId === this.SelectedServiceItem.ServiceItemId);
      if (isDuplicate) {
        this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Duplicate ServiceItem.",]);
        return;
      }
      this.SelectedServiceItem.Quantity = 1;
      this.CalculationForSelectedServiceItem();
      if (this.SelectedServiceItem.IsDoctorMandatory) {
        this.IsPerformerValid = !!this.SelectedServiceItem.PerformerId;
      } else {
        this.IsPerformerValid = true;
      }
      if (this.SelectedServiceItem.IsDoctorMandatory) {
        this.AssignDefaultPerformer();
      }
    }
  }

  private AssignDefaultPerformer(): void {
    /*
             !Step 1: First update validation for Performer to required it Doctor is Mandatory for the selected item.
             !Step 2: Check if the DoctorList of that item is null. If Doctor List is not empty, Parse the string DoctorList to local variable in the form of array of numbers.
             !Step 3: If the DoctorList contains single doctor, Find that doctor from all AppointmentApplicable DoctorList & assign that doctor as performer of that service item.
             !Step 4: Else if the DoctorList contains multiple doctors,
                       !- Assign selected default to one variable, say defaultDoctors by filtering from the main DoctorList.
                       !- Assign other remaining doctors to one variable, say otherDoctors by filtering from the main DoctorList and excluding defaultDoctors.
                       !- Then combine defaultDoctors and otherDoctors to AssignedDoctorList in order that defaultDoctors comes first and then otherDoctors on the dropDown Menu.
     */
    //!Step 1:
    this.IsPerformerValid = false;

    //!Step 2:
    if (this.SelectedServiceItem.DefaultDoctorList !== null) {
      let defaultDoctorsIdsList = JSON.parse(this.SelectedServiceItem.DefaultDoctorList);

      //!Step 3:
      if (defaultDoctorsIdsList.length === 1) {
        let doctor = this.doctorList.find(d => d.EmployeeId === defaultDoctorsIdsList[0]);
        if (doctor) {
          this.SelectedPerformer = doctor;
          this.AssignSelectedPerformer();
        }
      }

      //!Step 4:
      else if (defaultDoctorsIdsList.length > 1) {
        let defaultDoctors = [];
        defaultDoctorsIdsList.forEach(doctorId => {
          let matchingDoctor = this.doctorList.find(d => d.EmployeeId === doctorId);
          if (matchingDoctor) {
            defaultDoctors.push(matchingDoctor);
          }
        });
        let otherDoctors = this.doctorList.filter(doctor => !defaultDoctorsIdsList.includes(doctor.EmployeeId));
        this.doctorList = [...defaultDoctors, ...otherDoctors];
      }
    }
  }

  public AssignSelectedPerformer(): void {
    if (this.SelectedPerformer) {
      this.SelectedServiceItem.PerformerId = this.SelectedPerformer.EmployeeId;
      this.SelectedServiceItem.PerformerName = this.SelectedPerformer.FullName;
    }
    else {
      this.SelectedServiceItem.PerformerId = null;
      this.SelectedServiceItem.PerformerName = null;
    }
    if (this.SelectedServiceItem.IsDoctorMandatory && this.SelectedServiceItem.PerformerId) {
      this.IsPerformerValid = true;
    }
    else if (this.SelectedServiceItem.IsDoctorMandatory && !this.SelectedServiceItem.PerformerId) {
      this.IsPerformerValid = false;
    }
    else if (!this.SelectedServiceItem.IsDoctorMandatory && this.SelectedServiceItem.PerformerId) {
      this.IsPerformerValid = true;
    }
  }

  public AddInvoiceItems(): void {
    this.totalDiscount = 0;
    if (this.SelectedServiceItem.ItemName === "" || this.SelectedServiceItem.ItemName && this.SelectedServiceItem.ItemName.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Select ServiceItem.",]);
      return;
    }
    if (typeof (this.SelectedServiceItem) !== 'object') {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Select ServiceItem.",]);
      return;
    }

    this.SelectedServiceItemList.push(this.SelectedServiceItem);
    let packageServiceItem = new BillingPackageItem();
    packageServiceItem.ServiceDeptId = this.SelectedServiceItem.ServiceDepartmentId;
    packageServiceItem.SchemeId = this.SelectedServiceItem.SchemeId;
    packageServiceItem.PriceCategoryId = this.SelectedServiceItem.PriceCategoryId;
    packageServiceItem.Price = this.SelectedServiceItem.Price;
    packageServiceItem.DiscountPercent = this.SelectedServiceItem.DiscountPercent;
    packageServiceItem.Quantity = this.SelectedServiceItem.Quantity;
    packageServiceItem.Total = this.SelectedServiceItem.TotalAmount;
    packageServiceItem.DiscountAmount = this.SelectedServiceItem.DiscountAmount;
    packageServiceItem.IsActive = true;
    packageServiceItem.PerformerId = this.SelectedServiceItem.PerformerId;
    packageServiceItem.ServiceItemId = this.SelectedServiceItem.ServiceItemId;
    this.CurrentBillingPackage.PackageServiceItems.push(packageServiceItem);
    this.CalculationForCurrentBillingPackage();
    this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
    this.SelectedPerformer = null;
  }

  public AssignPackageServiceItemtoDTO(): void {
    this.SelectedServiceItemList.forEach(element => {
      let packageServiceItem = new BillingPackageItem();
      packageServiceItem.ServiceDeptId = element.ServiceDepartmentId;
      packageServiceItem.PackageServiceItemId = element.PackageServiceItemId;
      packageServiceItem.ServiceDeptId = element.ServiceDepartmentId;
      packageServiceItem.SchemeId = element.SchemeId;
      packageServiceItem.PriceCategoryId = element.PriceCategoryId;
      packageServiceItem.Price = element.Price;
      packageServiceItem.DiscountPercent = element.DiscountPercent;
      packageServiceItem.Quantity = element.Quantity;
      packageServiceItem.SubTotal = element.Price * element.Quantity;
      packageServiceItem.DiscountAmount = (element.DiscountPercent / 100) * packageServiceItem.SubTotal;
      packageServiceItem.Total = packageServiceItem.SubTotal - packageServiceItem.DiscountAmount;
      packageServiceItem.IsActive = true;
      packageServiceItem.PerformerId = element.PerformerId;
      packageServiceItem.ServiceItemId = element.ServiceItemId;
      this.CurrentBillingPackage.PackageServiceItems.push(packageServiceItem);
    });
    this.CalculationForCurrentBillingPackage();
  }

  public RemoveInvoiceItem(index: number): void {
    this.SelectedServiceItemList.splice(index, 1);
    this.CurrentBillingPackage.PackageServiceItems.splice(index, 1);
    this.CalculationForCurrentBillingPackage();
  }

  public OnDiscountAmountChange(): void {
    if (this.totalDiscount === null || this.totalDiscount === 0) {
      this.CurrentBillingPackage.DiscountPercent = 0;
    }
    if (this.totalDiscount > this.CurrentBillingPackage.TotalPrice) {
      this.totalDiscount = this.CurrentBillingPackage.TotalPrice;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Discount Amount Cannot be greater than Total Amount"]);

    }
    this.CalculationForCurrentBillingPackage();
  }

  // public OnSchemePriceCategoryChanged(schemePriceObj: SchemePriceCategory_DTO): void {
  //   if (schemePriceObj.SchemeId === this.OldSchemePriCeCategory.SchemeId && schemePriceObj.PriceCategoryId === this.OldSchemePriCeCategory.PriceCategoryId) {
  //     return;
  //   }
  //   if (!this.isUpdate) {
  //     this.CurrentBillingPackage = new BillingPackage();
  //     this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
  //     this.SelectedServiceItemList = new Array<BillingPackageServiceItem_DTO>();
  //     this.CurrentBillingPackage.PackageServiceItems = new Array<BillingPackageItem>();
  //     this.totalDiscount = 0;
  //     this.totalAmount = 0;
  //   }
  //   this.SelectedPerformer = null;
  //   if (schemePriceObj) {
  //     this.serviceBillingContext = ENUM_ServiceBillingContext.OpBilling;
  //     this.GetServiceItems(this.serviceBillingContext, schemePriceObj.SchemeId, schemePriceObj.PriceCategoryId);
  //     this.CurrentBillingPackage.SchemeId = schemePriceObj.SchemeId;
  //     this.CurrentBillingPackage.PriceCategoryId = schemePriceObj.PriceCategoryId;
  //   }
  //   this.OldSchemePriCeCategory.SchemeId = schemePriceObj.SchemeId;
  //   this.OldSchemePriCeCategory.PriceCategoryId = schemePriceObj.PriceCategoryId;
  // }

  public GetServiceItems(serviceBillingContext: string, schemeId: number, priceCategoryId: number): void {
    this.ServiceItems = new Array<ServiceItemDetails_DTO>();
    this.loadingScreen = true; //not implement as in view as of now
    this._billingMasterBlService.GetServiceItems(serviceBillingContext, schemeId, priceCategoryId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
          this.ServiceItems = res.Results;
          if (this.ServiceItems && this.ServiceItems.length > 0) {
            this.loadingScreen = false;
          }
        } else {
          this.loadingScreen = false;
          this.ServiceItems = new Array<ServiceItemDetails_DTO>();
          console.log("This priceCategory does not have Service Items mapped.");
        }
      },
        err => {
          this.loadingScreen = false;
          console.log(err);
        }
      );
  }

  public GetSrvDeptList(): void {
    this._settingsBLService.GetBillingServDepartments()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.srvdeptList = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for error message."]);
            this.logError(res.ErrorMessage);
          }
        }
      },
        err => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get service departments. Check log for error message."]);
          this.logError(err.ErrorMessage);
        });
  }

  public LoadAllDoctorsList(): void {
    this._settingsBLService.GetDoctorsList()
      .subscribe((res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          console.log("doctors list are loaded successfully (billing-main).");
          this.doctorList = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Couldn't get doctor's list."]);
        }
      });
  }

  public SetSelectedDoctor(index: number): void {
    var doc = this.doctorList.find(a => Number(a.EmployeeId) === Number(this.packageItemList[index].EmployeeId));
    if (doc) {
      this.selectedDoctors[index] = doc;
    }
  }

  Submit(value: string): void {
    this.loading = true;
    this.AssignValuesInCurrentBillingPackage();
    for (let i in this.CurrentBillingPackage.BillingPackageValidator.controls) {
      this.CurrentBillingPackage.BillingPackageValidator.controls[i].markAsDirty();
      this.CurrentBillingPackage.BillingPackageValidator.controls[i].updateValueAndValidity();
    }
    for (let packageItem of this.CurrentBillingPackage.PackageServiceItems) {
      for (let i in packageItem.BillingPackageItemValidator.controls) {
        packageItem.BillingPackageItemValidator.controls[i].markAsDirty();
        packageItem.BillingPackageItemValidator.controls[i].updateValueAndValidity();
      }
    }
    if (this.CurrentBillingPackage.TotalPrice < this.totalDiscount) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Discount amount should be less than total price."]);
    }
    if (this.CurrentBillingPackage.IsItemLoadPackage) {
      this.CurrentBillingPackage.IsDiscountEditableInSales = true; //Bibek 2ndJan'25 allow invoice level discount in sales page for item load package
    }
    if (this.CheckValidation()) {
      if (value === "add")
        this.Add();
      else
        this.Update();
    }
    this.loading = false;
  }

  public AssignBillingPackageIntoDTO(): void {
    this.BillingPackage.BillingPackageId = this.CurrentBillingPackage.BillingPackageId;
    this.BillingPackage.BillingPackageName = this.CurrentBillingPackage.BillingPackageName;
    this.BillingPackage.Description = this.CurrentBillingPackage.Description;
    this.BillingPackage.TotalPrice = this.CurrentBillingPackage.TotalPrice;
    this.BillingPackage.DiscountPercent = this.CurrentBillingPackage.DiscountPercent;
    this.BillingPackage.PackageCode = this.CurrentBillingPackage.PackageCode;
    this.BillingPackage.IsActive = this.isUpdate ? this.CurrentBillingPackage.IsActive : true;
    this.BillingPackage.LabTypeName = this.CurrentBillingPackage.LabTypeName;
    this.BillingPackage.SchemeId = this.CurrentBillingPackage.SchemeId;
    this.BillingPackage.PriceCategoryId = this.CurrentBillingPackage.PriceCategoryId;
    this.BillingPackage.IsEditable = this.IsEditable;
    this.BillingPackage.IsItemLevelDiscount = this.IsItemLevelDiscount;
    this.BillingPackage.IsDiscountEditableInSales = this.CurrentBillingPackage.IsDiscountEditableInSales;
    this.BillingPackage.IsHealthPackage = this.CurrentBillingPackage.IsHealthPackage;
    this.BillingPackage.IsItemLoadPackage = this.CurrentBillingPackage.IsItemLoadPackage;
    this.BillingPackage.BillingPackageServiceItemList = new Array<BillingPackageServiceItems_DTO>();
    this.CurrentBillingPackage.PackageServiceItems.forEach(element => {
      let packageItem = new BillingPackageServiceItems_DTO();
      packageItem.PackageServiceItemId = element.PackageServiceItemId;
      packageItem.BillingPackageId = element.BillingPackageId;
      packageItem.ServiceItemId = element.ServiceItemId;
      packageItem.DiscountPercent = element.DiscountPercent;
      packageItem.Quantity = element.Quantity;
      packageItem.PerformerId = element.PerformerId;
      packageItem.IsActive = this.isUpdate ? element.IsActive : true;
      this.BillingPackage.BillingPackageServiceItemList.push(packageItem);
    });
  }

  public checkNegative(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const inputValue = parseFloat(inputElement.value);

    if (inputValue < 0) {
      inputElement.value = '0';
      this.totalDiscount = 0;
    } else {
      this.totalDiscount = inputValue;
    }
  }

  public Add(): void {
    if (this.totalDiscount === 0) {
      this.CurrentBillingPackage.DiscountPercent = 0;
    }
    this.CurrentBillingPackage.LabTypeName = this.LabTypeName;
    this.AssignBillingPackageIntoDTO();
    this._settingsBLService.AddBillingPackage(this.BillingPackage)
      .subscribe(
        res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.callbackAdd.emit({ packageItem: res.Results });
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Billing Package Added"]);
            this.CurrentBillingPackage = new BillingPackage();
            this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
            this.SelectedServiceItemList = new Array<BillingPackageServiceItem_DTO>();
            this.CurrentBillingPackage = new BillingPackage();
            this.CurrentBillingPackage.PackageServiceItems = new Array<BillingPackageItem>();
            // this.IsItemLevelDiscount = false;
            this.SelectedPerformer = null;
            this.Close();
          }
          else {
            this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Check log for details"]);
            this.CurrentBillingPackage.PackageServiceItems = new Array<BillingPackageItem>();
            console.log(res.ErrorMessage);
          }
        },
        err => {
          this.logError(err);
        });
  }

  public Update(): void {
    this.CurrentBillingPackage.LabTypeName = this.LabTypeName;
    this.AssignBillingPackageIntoDTO();
    this._settingsBLService.UpdateBillingPackage(this.BillingPackage)
      .subscribe(
        res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Billing Package Updated"]);
            this.callbackAdd.emit({ packageItem: res.Results });
            this.Close();
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Check log for details"]);
            console.log(res.ErrorMessage);
          }
        },
        err => {
          this.logError(err);
        });
  }

  public CheckValidation(): boolean {
    let isValid = true;
    if (!this.CurrentBillingPackage.IsValidCheck(undefined, undefined)) {
      this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Please fill mandatory fields."]);
      return isValid = false;
    }
    if (this.CurrentBillingPackage.PackageServiceItems.length === 0) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Atleast One Service Item is Required."]);
      return isValid = false;
    }
    if (this.totalDiscount < 0) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Discount Amount can't be negative."]);
      return isValid = false;
    }
    if (!this.CheckForDuplicatePackage(this.isUpdate)) {
      return isValid = false;
    }
    return isValid;
  }

  public logError(err: any): void {
    console.log(err);
  }

  public Close(): void {
    this.SelectedServiceItem = new BillingPackageServiceItem_DTO();
    this.SelectedServiceItemList = new Array<BillingPackageServiceItem_DTO>();
    this.CurrentBillingPackage = new BillingPackage();
    this.CurrentBillingPackage.PackageServiceItems = new Array<BillingPackageItem>();
    this.IsItemLevelDiscount = false;
    this.SelectedPerformer = null;
    this.selectedServDepts = [];
    // this.selectedBillItems = [];
    this.selectedDoctors = [];
    this.selectedItem = null;
    this.isUpdate = false;
    this.showAddPage = false;
  }

  public ServiceDeptListFormatter(data: any): string {
    return data["ServiceDepartmentName"];
  }

  public DoctorListFormatter(data: any): string {
    return data["FullName"];
  }

  public ItemsListFormatter(data: any): string {
    let html: string = "";
    if (data.ServiceDepartmentName !== "OPD") {
      html = "<font color='blue'; size=03 >" + data["ItemCode"] + "&nbsp;&nbsp;" + ":" + "&nbsp;" + data["ItemName"].toUpperCase() + "</font>" + "&nbsp;&nbsp;";
      html += "(<i>" + data["ServiceDepartmentName"] + "</i>)" + "&nbsp;&nbsp;" + 'Rs.' + "<b>" + data["Price"] + "</b>";
      return html;
    }
    else {
      let docName = data.Doctor ? data.Doctor.DoctorName : "";
      html = "<font color='blue'; size=03 >" + data["ItemCode"] + "&nbsp;&nbsp;" + ":" + "&nbsp;" + data["ItemName"].toUpperCase() + "&nbsp;&nbsp;" +
        data["ServiceDepartmentName"] + "</i>)" + "&nbsp;&nbsp;" + this.CurrencyUnit + "<b>" + data["Price"] + "</b>";
    }
    return html;
  }

  public GoToNextElement(id: string): void {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 50);
  }

  public ValidateAndMoveFocus(): void {
    // Ensure that the performer is selected and validated
    this.AssignSelectedPerformer();

    // If the performer is valid, move focus to the add button
    if (this.IsPerformerValid) {
      this.GoToNextElement('id_btn_add_serviceItem');
    }
  }


  public KeysPressed(event): void {
    if (event.keyCode == 27) { // For ESCAPE_KEY =>close pop up
      this.Close();
    }
  }

  public HandleConfirmForSave(): void {
    this.loading = true;
    this.Submit('add');
  }

  public HandleConfirmForUpdate(): void {
    this.loading = true;
    this.Submit('update');
  }

  public HandleCancel(): void {
    this.loading = false;
  }
  RecalculateBillingPackageItem() {
    this.CurrentBillingPackage.PackageServiceItems = [];
    this.SelectedServiceItemList = [];
    this.CalculationForCurrentBillingPackage();
  }
  ItemLoadPackageCheckBoxOnChange() {
    this.RecalculateBillingPackageItem();
    if (this.CurrentBillingPackage.IsItemLoadPackage) {
      this.CurrentBillingPackage.IsHealthPackage = false;
      this.BillingPackage.IsItemLevelDiscount = this.IsItemLevelDiscount = false;
      this.BillingPackage.IsDiscountEditableInSales = this.CurrentBillingPackage.IsDiscountEditableInSales = false;
    } else {
      this.CurrentBillingPackage.IsHealthPackage = true;
    }
  }
  HealthPackageCheckBoxOnChange() {
    this.RecalculateBillingPackageItem();
    if (this.CurrentBillingPackage.IsHealthPackage) {
      this.CurrentBillingPackage.IsItemLoadPackage = false;
    }
    else {
      this.CurrentBillingPackage.IsItemLoadPackage = true;
    }
  }
  IsDiscountEditableInsSalesCheckBoxOnChange(): void {
    this.CurrentBillingPackage.IsDiscountEditableInSales;
  }
  OnPriceCategoryChanged(priceCategory: PriceCategory_DTO): void {
    if (priceCategory) {
      this.loadingScreen = true; // Set loading screen to true
      this.CurrentBillingPackage.PriceCategoryId = priceCategory.PriceCategoryId;
      this._billingMasterBlService.GetServiceItemsByPriceCategoryId(priceCategory.PriceCategoryId)
        .subscribe((res: DanpheHTTPResponse) => {
          console.log("Response received:", res);
          this.loadingScreen = false; // Set loading screen to false
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
            this.ServiceItems = res.Results.map(result => Object.assign(new ServiceItemDetails_DTO(), result));
          } else {
            this.ServiceItems = new Array<ServiceItemDetails_DTO>();
            console.log("This priceCategory does not have Service Items mapped.");
          }
        }, (error: any) => {
          this.loadingScreen = false; // Set loading screen to false
          console.error("Error getting service items:", error);
        });
    }
  }
  public GetBillingPackageList(): void {
    this._settingsBLService.GetBillingPackageList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.billingPackageList = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      });
  }
  CheckForDuplicatePackage(isUpdating: boolean): boolean {
    const selectedPackageName = this.CurrentBillingPackage.BillingPackageValidator.get('BillingPackageName').value;
    const selectedPackageCode = this.CurrentBillingPackage.BillingPackageValidator.get('PackageCode').value;

    for (const billingPackage of this.billingPackageList) {
      if (isUpdating && billingPackage.BillingPackageId === this.selectedItem.BillingPackageId) {
        continue;
      }
      if (billingPackage.BillingPackageName === selectedPackageName) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Duplicate Package Name"]);
        return false;
      }
      if (billingPackage.PackageCode === selectedPackageCode) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Duplicate Package Code"]);
        return false;
      }
    }

    return true;
  }

}
