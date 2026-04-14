import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { ServiceDepartmentVM } from "../../../shared/common-masters.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import {
  ENUM_DanpheHTTPResponses,
  ENUM_DanpheHTTPResponseText,
  ENUM_MessageBox_Status,
} from "../../../shared/shared-enums";
import { Department } from "../../shared/department.model";
import { SettingsBLService } from "../../shared/settings.bl.service";
import { BillServiceItemSchemeSetting_DTO } from "../shared/dto/bill-service-item-scheme-setting.dto";
import { ServiceItem_DTO } from "../shared/dto/service-item.dto";

@Component({
  selector: "bill-service-item-scheme-setting",
  templateUrl: "./bill-service-item-scheme-setting.component.html",
})
export class BillServiceItemSchemeSettingComponent implements OnInit {
  @Input("selected-scheme")
  public SelectedScheme = { SchemeId: 0, SchemeCode: "", SchemeName: "" };

  @Output("callback-close")
  callbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  public serviceDepartmentList: Array<ServiceDepartmentVM> = new Array<ServiceDepartmentVM>();
  public FilterServiceDepartmentList: Array<ServiceDepartmentVM> = new Array<ServiceDepartmentVM>();
  public serviceItemSettingList: Array<BillServiceItemSchemeSetting_DTO> = new Array<BillServiceItemSchemeSetting_DTO>();
  public FilteredServiceItemSettingList: Array<BillServiceItemSchemeSetting_DTO> = new Array<BillServiceItemSchemeSetting_DTO>();
  public serviceItemList: ServiceItem_DTO[] = [];
  public serviceItems: BillServiceItemSchemeSetting_DTO = new BillServiceItemSchemeSetting_DTO();
  public billServiceItemschemesettingDetails: BillServiceItemSchemeSetting_DTO[] =
    [];
  public tempBillServiceItemschemesettingDetails: BillServiceItemSchemeSetting_DTO[] =
    [];
  public ServiceDepartmentIds: number[] = [];
  public isAllChecked: boolean = false;
  public GlobalCopayCashPercent: number;
  public GlobalCopayCreditPercent: number;
  public headRegistrationDiscountPercent: number;
  public headOPDdiscountPercent: number;
  public headIPDdiscountPercent: number;
  public headAdmissiondiscountPercent: number;
  public isButtonDisabled: boolean = false;
  public headRegistrationDiscountPercentMsg: string;
  public headOPDdiscountPercentMsg: string;
  public headIPDdiscountPercentMsg: string;
  public headAdmissiondiscountPercentMsg: string;
  public GlobalCopayCashPercentMsg: string;
  public GlobalCopayCreditPercentMsg: string;
  public IsSelectAllCopayment: boolean;
  public selectAll: boolean = false;
  public selectedItem = new BillServiceItemSchemeSetting_DTO();
  public ServiceItemSettingListToFilterByItemName = new Array<BillServiceItemSchemeSetting_DTO>();
  public selectedPrice: string = 'All';
  public lessThanPrice: number = 0;
  public greaterThanPrice: number = 0;
  public betweenMinPrice: number = 0;
  public betweenMaxPrice: number = 0;
  public isFilterApplied: boolean = false;
  DepartmentList = new Array<Department>();
  SelectedDepartmentIds: number[] = [];
  FilteredServiceItemSettingDropDownList = new Array<BillServiceItemSchemeSetting_DTO>();
  ShowPriceFilter: boolean = false;

  constructor(
    public settingsBLService: SettingsBLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService
  ) {
    this.GetServiceDepartments();
    this.GetDepartmentList()
  }
  ngOnInit() {
    if (this.SelectedScheme.SchemeId > 0) {
      this.GetServiceItemSchemeSettings(this.SelectedScheme.SchemeId);
      this.getServiceItemList();
    }
  }

  ItemListFormatter(data) {
    return data['ServiceItemName']
  }
  GetDepartmentList() {
    this.settingsBLService.GetDepartments().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.DepartmentList = res.Results;
      }
    });
  }
  Close() {
    this.callbackClose.emit();
  }
  DiscardChanges() {
    this.Close();
  }
  AssignDefaultDepartment($event) {
    if ($event) {
      this.selectedItem = new BillServiceItemSchemeSetting_DTO();
      this.ServiceDepartmentIds = $event.map((a) => a.ServiceDepartmentId);
      this.FilteredServiceItemSettingDropDownList = this.serviceItemSettingList.filter((itmset) => this.ServiceDepartmentIds.includes(itmset.ServiceDepartmentId));
    }
    if (this.ServiceDepartmentIds && this.ServiceDepartmentIds.length > 0) {
      this.FilteredServiceItemSettingDropDownList = this.serviceItemSettingList.filter((itmset) => this.ServiceDepartmentIds.includes(itmset.ServiceDepartmentId));
    }
  }
  AssignDepartment($event) {
    if ($event) {
      this.SelectedDepartmentIds = $event.map(a => a.DepartmentId);
      if (this.SelectedDepartmentIds && this.SelectedDepartmentIds.length > 0) {
        this.FilterServiceDepartmentList = this.serviceDepartmentList.filter((sd) =>
          this.SelectedDepartmentIds.includes(sd.DepartmentId)
        );
        if (this.SelectedDepartmentIds && this.SelectedDepartmentIds.length > 0) {
          this.FilteredServiceItemSettingDropDownList = this.serviceItemSettingList.filter((itmset) => this.SelectedDepartmentIds.includes(itmset.DepartmentId));
        }
      }
    }
  }

  FilterServiceItemList() {
    this.FilteredServiceItemSettingList = [];
    this.ShowPriceFilter = false;
    let serviceItemList = this.serviceItemSettingList;
    if (this.SelectedDepartmentIds && this.SelectedDepartmentIds.length > 0) {
      this.FilteredServiceItemSettingList = serviceItemList.filter((itmset) => this.SelectedDepartmentIds.includes(itmset.DepartmentId));
    }
    if (this.ServiceDepartmentIds && this.ServiceDepartmentIds.length > 0) {
      this.FilteredServiceItemSettingList = serviceItemList.filter((itmset) => this.ServiceDepartmentIds.includes(itmset.ServiceDepartmentId));
    }
    if (this.selectedItem && this.selectedItem.ServiceItemId) {
      const filteredItem = this.FilteredServiceItemSettingList.filter(item => item.ServiceItemId === this.selectedItem.ServiceItemId);
      this.FilteredServiceItemSettingList = filteredItem;
    }
    this.FilteredServiceItemSettingDropDownList = this.FilteredServiceItemSettingList;
    this.MapServiceItemSetting();
    if (this.FilteredServiceItemSettingList && this.FilteredServiceItemSettingList.length > 0) {
      this.ShowPriceFilter = !this.ShowPriceFilter;
    }
    else {
      this.ShowPriceFilter = false;
    }
  }

  GetServiceDepartments() {
    this.serviceDepartmentList = this.coreService.Masters.ServiceDepartments;
    this.FilterServiceDepartmentList = this.serviceDepartmentList;
  }
  selectAllServiceItems(event) {
    let isChecked = event.target.checked;
    this.FilteredServiceItemSettingList.forEach(
      (item) => (item.itemIsSelected = isChecked)
    );
    if (!event.target.checked) {
      this.headRegistrationDiscountPercent = 0;
      this.headOPDdiscountPercent = 0;
      this.headIPDdiscountPercent = 0;
      this.headAdmissiondiscountPercent = 0;
      this.GlobalCopayCashPercent = 0;
      this.GlobalCopayCreditPercent = 0;
      this.IsSelectAllCopayment = false;

      this.FilteredServiceItemSettingList.forEach((row) => {
        row.RegDiscountPercent = this.headRegistrationDiscountPercent;
        row.OpBillDiscountPercent = this.headOPDdiscountPercent;
        row.IpBillDiscountPercent = this.headIPDdiscountPercent;
        row.AdmissionDiscountPercent = this.headAdmissiondiscountPercent;
        row.CoPaymentCashPercent = this.GlobalCopayCashPercent;
        row.CoPaymentCreditPercent = this.GlobalCopayCreditPercent;
        row.IsCoPayment = false;
      });
    }
  }

  selectAllCopayment(event) {
    let isChecked = event.target.checked;
    this.FilteredServiceItemSettingList.forEach((item) => {
      item.IsCoPayment = isChecked;
      if (!isChecked) {
        item.IsCoPayment = false;
      }
    });

    if (!isChecked) {
      this.GlobalCopayCashPercent = 0;
      this.GlobalCopayCreditPercent = 0;
    }
  }

  onCoPayCashChange(row) {
    const maxPercent = 100;
    let newCoPayCreditPercent = maxPercent - row.CoPaymentCashPercent;
    row.CoPaymentCreditPercent = newCoPayCreditPercent;
  }

  // onCoPayCreditChange(row) {
  //   const maxPercent = 100;
  //   let newCoPayCashPercent = maxPercent - row.CoPaymentCreditPercent;
  //   row.CoPaymentCashPercent = newCoPayCashPercent;
  // }

  onDiscountPercentCheckboxChange(row) {
    if (!row.itemIsSelected) {
      row.RegDiscountPercent = 0;
      row.OpBillDiscountPercent = 0;
      row.IpBillDiscountPercent = 0;
      row.AdmissionDiscountPercent = 0;
      row.CoPaymentCashPercent = 0;
      row.CoPaymentCreditPercent = 0;
      row.IsCoPayment = false;
    }
  }

  onCopayCheckboxChange(event: any, row: any) {
    if (!event.target.checked) {
      row.IsCoPayment = false;
      row.CoPaymentCashPercent = 0;
      row.CoPaymentCreditPercent = 0;
    }
  }

  onGlobalCoPayCashChange() {
    const maxPercent = 100;

    // let GlobalCopayCashPercent = maxPercent - this.GlobalCopayCashPercent;
    // this.GlobalCopayCreditPercent = GlobalCopayCashPercent;

    this.FilteredServiceItemSettingList.forEach((row) => {
      row.CoPaymentCashPercent = this.GlobalCopayCashPercent;
      //row.CoPaymentCreditPercent = maxPercent - row.CoPaymentCashPercent;
    });
  }

  onGlobalCoPayCreditChange() {
    const maxPercent = 100;

    // let GlobalCopayCreditPercent = maxPercent - this.GlobalCopayCreditPercent;
    // this.GlobalCopayCashPercent = GlobalCopayCreditPercent;

    this.FilteredServiceItemSettingList.forEach((row) => {
      row.CoPaymentCreditPercent = this.GlobalCopayCreditPercent;
      // row.CoPaymentCashPercent = maxPercent - row.CoPaymentCreditPercent;
    });
  }
  updateRegDiscountPercent() {
    this.FilteredServiceItemSettingList.forEach((row) => {
      row.RegDiscountPercent = this.headRegistrationDiscountPercent;
    });
  }
  upateOPDdiscountPercent() {
    this.FilteredServiceItemSettingList.forEach((row) => {
      row.OpBillDiscountPercent = this.headOPDdiscountPercent;
    });
  }
  upateIPDdiscountPercent() {
    this.FilteredServiceItemSettingList.forEach((row) => {
      row.IpBillDiscountPercent = this.headIPDdiscountPercent;
    });
  }
  upateAdmissiondiscountPercent() {
    this.FilteredServiceItemSettingList.forEach((row) => {
      row.AdmissionDiscountPercent = this.headAdmissiondiscountPercent;
    });
  }

  GetServiceItemSchemeSettings(SchemeId: number) {
    if (SchemeId) {
      this.settingsBLService.GetServiceItemSchemeSettings(SchemeId).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.tempBillServiceItemschemesettingDetails = res.Results;
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "Failed to get Service Items scheme setting",
            ]);
          }
        },
        (err: DanpheHTTPResponse) => {
          console.log(err);
        }
      );
    }
  }

  public getServiceItemList() {
    this.settingsBLService.GetServiceItemListBySchemeId(this.SelectedScheme.SchemeId).subscribe((res) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.serviceItemSettingList = [];
        this.serviceItemList = res.Results.filter((item) => item.IsActive);

        this.serviceItemList.forEach((item) => {
          let serviceItemSetting = new BillServiceItemSchemeSetting_DTO();
          serviceItemSetting.ServiceItemId = item.ServiceItemId;
          serviceItemSetting.SchemeId = this.SelectedScheme.SchemeId;
          serviceItemSetting.itemIsSelected = item.itemIsSelected;
          serviceItemSetting.ServiceItemCode = item.ItemCode;
          serviceItemSetting.ServiceItemName = item.ItemName;
          serviceItemSetting.Price = item.Price;
          serviceItemSetting.ServiceDepartmentId = item.ServiceDepartmentId;
          serviceItemSetting.DepartmentId = item.DepartmentId;
          this.serviceItemSettingList.push(serviceItemSetting);
        });
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    });
  }

  MapServiceItemSetting() {
    this.FilteredServiceItemSettingList.forEach((itm) => {
      let matcheddata = this.tempBillServiceItemschemesettingDetails.find(
        (x) => x.ServiceItemId === itm.ServiceItemId
      );
      if (matcheddata) {
        itm.ServiceItemSchemeSettingId = matcheddata.ServiceItemSchemeSettingId;
        itm.itemIsSelected = true;
        itm.initialSelectionState = true; // Set initialSelectionState to itemIsSelected
        itm.SchemeId = matcheddata.SchemeId;
        itm.ServiceItemId = matcheddata.ServiceItemId;
        itm.RegDiscountPercent = matcheddata.RegDiscountPercent;
        itm.OpBillDiscountPercent = matcheddata.OpBillDiscountPercent;
        itm.IpBillDiscountPercent = matcheddata.IpBillDiscountPercent;
        itm.AdmissionDiscountPercent = matcheddata.AdmissionDiscountPercent;
        itm.IsCoPayment = matcheddata.IsCoPayment;
        itm.CoPaymentCashPercent = matcheddata.CoPaymentCashPercent;
        itm.CoPaymentCreditPercent = matcheddata.CoPaymentCreditPercent;
        itm.IsActive = matcheddata.IsActive;
      } else {
        itm.initialSelectionState = false;
      }
    });
  }

  checkCopayDiscountPercentValidity(): boolean {
    let isValid = false;
    const invalidCopayPercent = this.serviceItemSettingList.filter((a) => a.itemIsSelected === true).some(
      (a) =>
        a.IsValidCopayCashPercent === false ||
        a.IsValidCopayCreditPercent === false
    );
    if (invalidCopayPercent) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Invalid Copay percent",
      ]);
      isValid = false;
    }
    else {
      isValid = true;
    }
    return isValid;
  }

  CheckDiscountPercentsValidity(): boolean {
    let isValid = false;
    const invalidDiscountPercentItems = this.serviceItemSettingList.filter(x => x.itemIsSelected === true).some(
      (a) =>
        a.IsValidRegDiscountPercent === false ||
        a.IsValidOpBillDiscountPercent === false ||
        a.IsValidAdmissionDiscountPercent === false ||
        a.IsValidIpBillDiscountPercent === false
    );
    if (invalidDiscountPercentItems) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "Invalid Discount Percent",
      ]);

      isValid = false;
    } else {
      isValid = true;
    }
    return isValid;
  }

  AddServiceItemSchemeSettings() {

    this.billServiceItemschemesettingDetails = this.FilteredServiceItemSettingList.filter(
      (a) => a.itemIsSelected || (a.itemIsSelected === a.initialSelectionState && a.itemIsSelected === true) || a.initialSelectionState === true
    );
    if (this.checkCopayDiscountPercentValidity() && this.CheckDiscountPercentsValidity()) {
      this.isButtonDisabled = true;
      this.settingsBLService
        .PostServiceItemSchemeSettings(this.billServiceItemschemesettingDetails)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status == ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                "Service Item Settings Added Successfully",
              ]);
              this.billServiceItemschemesettingDetails = [];
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                "Failed to add service Item settings, check log for details",
              ]);
            }
            this.Close();
            this.isButtonDisabled = false;
          },
          (err) => {
            this.logError(err);
          }
        );
    }
  }

  logError(err: any) {
    console.log(err);
  }

  CheckDiscountPercent(row: BillServiceItemSchemeSetting_DTO) {
    if (row) {
      const regDiscountPercent = row.RegDiscountPercent;
      const opBillDiscountPercent = row.OpBillDiscountPercent;
      const ipBillDiscountPercent = row.IpBillDiscountPercent;
      const admissionDiscountPercent = row.AdmissionDiscountPercent;
      const minimumDiscountPercent = 0;
      const maxDiscountPercent = 100;

      if (
        regDiscountPercent < minimumDiscountPercent || regDiscountPercent > maxDiscountPercent) {
        row.IsValidRegDiscountPercent = false;
      } else {
        row.IsValidRegDiscountPercent = true;
      }

      if (
        opBillDiscountPercent < minimumDiscountPercent || opBillDiscountPercent > maxDiscountPercent) {
        row.IsValidOpBillDiscountPercent = false;
      } else {
        row.IsValidOpBillDiscountPercent = true;
      }

      if (
        ipBillDiscountPercent < minimumDiscountPercent || ipBillDiscountPercent > maxDiscountPercent) {
        row.IsValidIpBillDiscountPercent = false;
      } else {
        row.IsValidIpBillDiscountPercent = true;
      }

      if (
        admissionDiscountPercent < minimumDiscountPercent || admissionDiscountPercent > maxDiscountPercent) {
        row.IsValidAdmissionDiscountPercent = false;
      } else {
        row.IsValidAdmissionDiscountPercent = true;
      }
    }
  }
  CheckGlobalDiscountPercent() {
    const minimumDiscountPercent = 0;
    const maxDiscountPercent = 100;
    if (
      this.headRegistrationDiscountPercent < minimumDiscountPercent || this.headRegistrationDiscountPercent > maxDiscountPercent) {
      this.headRegistrationDiscountPercentMsg = " Invalid percent";
    } else if (
      this.headRegistrationDiscountPercent > minimumDiscountPercent || this.headRegistrationDiscountPercent < maxDiscountPercent) {
      this.headRegistrationDiscountPercentMsg = "";
    }
    if (
      this.headOPDdiscountPercent < minimumDiscountPercent || this.headOPDdiscountPercent > maxDiscountPercent) {
      this.headOPDdiscountPercentMsg = " Invalid percent";
    } else if (
      this.headOPDdiscountPercent > minimumDiscountPercent || this.headOPDdiscountPercent < maxDiscountPercent) {
      this.headOPDdiscountPercentMsg = "";
    }
    if (
      this.headIPDdiscountPercent < minimumDiscountPercent || this.headIPDdiscountPercent > maxDiscountPercent) {
      this.headIPDdiscountPercentMsg = " Invalid percent";
    } else if (
      this.headIPDdiscountPercent > minimumDiscountPercent || this.headIPDdiscountPercent < maxDiscountPercent) {
      this.headIPDdiscountPercentMsg = "";
    }
    if (
      this.headAdmissiondiscountPercent < minimumDiscountPercent || this.headAdmissiondiscountPercent > maxDiscountPercent) {
      this.headAdmissiondiscountPercentMsg = " Invalid percent";
    } else if (
      this.headAdmissiondiscountPercent > minimumDiscountPercent || this.headAdmissiondiscountPercent < maxDiscountPercent) {
      this.headAdmissiondiscountPercentMsg = "";
    }
    if (
      this.GlobalCopayCashPercent < minimumDiscountPercent || this.GlobalCopayCashPercent > maxDiscountPercent) {
      this.GlobalCopayCashPercentMsg = " Invalid percent";
    } else {
      this.GlobalCopayCashPercentMsg = "";
    }
    if (
      this.GlobalCopayCreditPercent < minimumDiscountPercent || this.GlobalCopayCreditPercent > (maxDiscountPercent - this.GlobalCopayCashPercent)) {
      this.GlobalCopayCreditPercentMsg = " Invalid percent";
    } else {
      this.GlobalCopayCreditPercentMsg = "";
    }
  }

  CheckCopayPercent(row: BillServiceItemSchemeSetting_DTO) {
    if (row) {
      const minimumDiscountPercent = 0;
      const maxDiscountPercent = 100;
      const coPayCashPercent = row.CoPaymentCashPercent;
      const coPayCreditPercent = row.CoPaymentCreditPercent;
      if (
        coPayCashPercent < minimumDiscountPercent || coPayCashPercent > maxDiscountPercent) {
        row.IsValidCopayCashPercent = false;
      } else {
        row.IsValidCopayCashPercent = true;
      }
      if (
        coPayCreditPercent < minimumDiscountPercent || coPayCreditPercent > (maxDiscountPercent - coPayCashPercent)) {
        row.IsValidCopayCreditPercent = false;
      } else {
        row.IsValidCopayCreditPercent = true;
      }
    }
  }
  onPriceFilterChange($event) {
    this.isFilterApplied = false;
    if ($event) {
      const filteredByDepartment = this.serviceItemSettingList
        .filter(item => this.ServiceDepartmentIds.includes(item.ServiceDepartmentId));
      this.FilteredServiceItemSettingList = filteredByDepartment;
      this.lessThanPrice = 0;
      this.greaterThanPrice = 0;
      this.betweenMaxPrice = 0;
      this.betweenMinPrice = 0;

    }
  }
  OnPriceEntered() {
    const filteredByDepartment = this.serviceItemSettingList
      .filter(item => this.ServiceDepartmentIds.includes(item.ServiceDepartmentId));

    switch (this.selectedPrice) {
      case 'LessThan':
        if (this.lessThanPrice !== null) {
          this.FilteredServiceItemSettingList = filteredByDepartment
            .filter(item => item.Price < this.lessThanPrice);
        }
        break;

      case 'GreaterThan':
        if (this.greaterThanPrice !== null) {
          this.FilteredServiceItemSettingList = filteredByDepartment
            .filter(item => item.Price > this.greaterThanPrice);
        }
        break;

      case 'Between':
        if (this.betweenMinPrice !== null) {
          this.FilteredServiceItemSettingList = filteredByDepartment.filter(item => item.Price >= this.betweenMinPrice);
        } else if (this.betweenMaxPrice !== null) {
          this.FilteredServiceItemSettingList = filteredByDepartment.filter(item => item.Price <= this.betweenMaxPrice);
        } if (this.betweenMinPrice !== null && this.betweenMaxPrice !== null) {
          this.FilteredServiceItemSettingList = filteredByDepartment.filter(item => item.Price >= this.betweenMinPrice && item.Price <= this.betweenMaxPrice);
        }
        break;
      default:
        this.FilteredServiceItemSettingList = filteredByDepartment;
        this.isFilterApplied = false;
        break;
    }
  }

}
