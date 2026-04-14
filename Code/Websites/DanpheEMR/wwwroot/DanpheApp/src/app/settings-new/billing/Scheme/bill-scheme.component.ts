import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as moment from "moment";
import { BillingSubSchemeModel } from "../../../billing/shared/bill-sub-scheme.model";
import { BillingSubScheme_DTO } from "../../../billing/shared/dto/bill-subscheme.dto";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import {
  ENUM_DanpheHTTPResponseText,
  ENUM_DanpheHTTPResponses,
  ENUM_MessageBox_Status,
} from "../../../shared/shared-enums";
import { CreditOrganization } from "../../price-cateogory/model/credit-organiztion.model";
import { PaymentModes } from "../../shared/PaymentMode";
import { BillingSchemeModel } from "../../shared/bill-scheme.model";
import { PriceCategory } from "../../shared/price.category.model";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
  selector: "bill-scheme",
  templateUrl: "./bill-scheme.component.html",
  styleUrls: ["./bill-scheme.component.css"],
})
export class BillSchemeComponent {
  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Output("callback-close")
  callbackClose: EventEmitter<Object> = new EventEmitter<Object>();

  public isAddNewPriceCategory: boolean = true;
  public defaultPayment: Array<PaymentModes> = new Array<PaymentModes>();
  // public CreditOrganizations: Array<CreditOrganization> =
  //   new Array<CreditOrganization>();
  // public priceCategoryList: Array<PriceCategory> = new Array<PriceCategory>();

  @Input("credit-organizations") CreditOrganizations: CreditOrganization[];
  @Input("price-category-list") PriceCategoryList: PriceCategory[];
  public tempCreditOrganization: Array<CreditOrganization> =
    new Array<CreditOrganization>();
  public tempdefaultPaymentlist: Array<PaymentModes> =
    new Array<PaymentModes>();
  public BillingSubScheme: BillingSubSchemeModel = new BillingSubSchemeModel();
  // public setBillItmGriColumns: SettingsGridColumnSettings = null;
  // public BillingSubSchemeColumns: Array<any> = null;
  public BillingSubSchemeList: Array<BillingSubScheme_DTO> = new Array<BillingSubScheme_DTO>();
  public CurrentPayment: PaymentModes = new PaymentModes();
  public CurrentCreditOrganizationModel: CreditOrganization =
    new CreditOrganization();
  public billSchemeList: Array<BillingSchemeModel> = new Array<BillingSchemeModel>();
  DiscountSettings: any;

  @Input("bill-scheme-to-edit")
  BillSchemeId: number = 0;

  @Input("component-mode")
  ComponentMode: string = "add";

  ValidFromDate: string = "";
  ValidToDate: string = "";
  CopaymentSettings: {
    SettingsFor: string;
    IsApplicable: boolean;
    CopayCashPercent: number;
    CopayCreditPercent: number;
  }[];
  CallBackAddUpdate: any;
  loading: boolean = false;

  isval: boolean = false;

  @Input("show-Scheme-Add-Update-Page")
  public ShowSchemeAddUpdatePage: boolean = false;
  // public set value(val: boolean) {
  //   this.showAddNewPage = val;
  //   if (this.billScheme && this.billScheme.SchemeId != 0) {
  //     this.update = true;
  //     //this.billScheme = new billScheme();
  //     this.billScheme = Object.assign({}, this.billScheme, this.billScheme);
  //     this.billScheme.SchemeValidator.controls['SchemeName'].setValue(this.billScheme.SchemeName);
  //     this.billScheme.SchemeValidator.controls['SchemeCode'].setValue(this.billScheme.SchemeCode);
  //     this.billScheme.SchemeValidator.controls['CommunityName'].setValue(this.billScheme.CommunityName);

  //   } else {
  //     //this.billScheme = new billScheme();
  //     this.update = false;
  //   }
  // }

  public billScheme: BillingSchemeModel = new BillingSchemeModel();

  constructor(
    public settingsBLService: SettingsBLService,
    public messageBoxService: MessageboxService,
    public coreService: CoreService,
    private securityService: SecurityService
  ) {
    this.GetBillingSchemes();
    this.ValidFromDate = moment().format("YYYY-MM-DD");
    this.ValidToDate = moment().format("YYYY-MM-DD");
  }

  ngOnInit() {
    if (this.ComponentMode.toLowerCase() === "edit" && this.BillSchemeId) {
      this.GetSchemeBySchemeId(this.BillSchemeId);
    }
  }

  GetSchemeBySchemeId(BillSchemeId: number) {
    this.settingsBLService.GetBillingSchemeById(BillSchemeId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.billScheme = Object.assign({}, this.billScheme, res.Results);
          if (this.CreditOrganizations && this.CreditOrganizations.length > 0) {
            this.selectedCreditOrganization = this.CreditOrganizations.find(
              (a) => a.OrganizationId === this.billScheme.DefaultCreditOrganizationId
            );
          }
          if (this.PriceCategoryList && this.PriceCategoryList.length > 0) {
            this.selectedPriceCategory = this.PriceCategoryList.find(
              (a) => a.PriceCategoryId === this.billScheme.DefaultPriceCategoryId
            );
          }
          this.updateCopaymentCheckboxState();
        } else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
            "Bill Scheme not found",
          ]);
        }
      },
      (err) => {
        this.logError(HttpErrorResponse);
      }
    );
  }

  close() {
    this.billScheme = new BillingSchemeModel();
    this.callbackAdd.emit({ action: "close", data: null });
    this.ShowSchemeAddUpdatePage = false;
  }

  OnCreditOrganizationChange() {
    if (this.selectedCreditOrganization.OrganizationId > 0) {
      this.billScheme.DefaultCreditOrganizationId =
        this.selectedCreditOrganization.OrganizationId;
    } else {
      this.billScheme.DefaultCreditOrganizationId = null;
    }
  }
  OnPriceCategoryChange() {
    if (this.selectedPriceCategory.PriceCategoryId > 0) {
      this.billScheme.DefaultPriceCategoryId =
        this.selectedPriceCategory.PriceCategoryId;
    } else {
      this.billScheme.DefaultPriceCategoryId = null;
    }
  }

  selectedCreditOrganization: CreditOrganization = new CreditOrganization();
  selectedPriceCategory: PriceCategory = new PriceCategory();
  AddBillScheme() {

    let isSystemDefault = this.billSchemeList.some(a => a.IsSystemDefault === true && a.IsActive === true);
    if (isSystemDefault && this.billScheme.IsSystemDefault) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Default Duplicate Scheme is not allowed"]);
      return;
    }


    if (this.billScheme.IsCopaymentApplicable && this.billScheme.IsBillingCoPayment) {
      if (this.billScheme.BillCoPayCashPercent < 0 || this.billScheme.BillCoPayCashPercent > 100 || this.billScheme.BillCoPayCreditPercent < 0 || this.billScheme.BillCoPayCreditPercent > 100) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
      let totalBillingCoPayPercentage = this.billScheme.BillCoPayCashPercent + this.billScheme.BillCoPayCreditPercent;
      if (totalBillingCoPayPercentage > 100 || totalBillingCoPayPercentage < 0 || (totalBillingCoPayPercentage < 100 && totalBillingCoPayPercentage > 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
    }

    if (this.billScheme.IsCopaymentApplicable && this.billScheme.IsPharmacyCoPayment) {
      if (this.billScheme.PharmacyCoPayCashPercent < 0 || this.billScheme.PharmacyCoPayCashPercent > 100 || this.billScheme.PharmacyCoPayCreditPercent < 0 || this.billScheme.PharmacyCoPayCreditPercent > 100) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
      let totalPharmacyCoPayPercentage = this.billScheme.PharmacyCoPayCashPercent + this.billScheme.PharmacyCoPayCreditPercent;
      if (totalPharmacyCoPayPercentage > 100 || totalPharmacyCoPayPercentage < 0 || (totalPharmacyCoPayPercentage < 100 && totalPharmacyCoPayPercentage > 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
    }

    this.loading = true;
    for (let i in this.billScheme.SchemeValidator.controls) {
      this.billScheme.SchemeValidator.controls[i].markAsDirty();
      this.billScheme.SchemeValidator.controls[i].updateValueAndValidity();
    }
    // if (this.billScheme.IsValidCheck(undefined, undefined)) {
    this.billScheme.CreatedOn = moment().format("YYYY-MM-DD");
    if (this.billScheme.HasSubScheme !== true) {
      this.billScheme.BillingSubSchemes = new Array<BillingSubSchemeModel>();
    }
    if (
      this.billScheme.IpReferralCodeVisitLimit < 0 ||
      this.billScheme.OpReferralCodeVisitLimit < 0 ||
      this.billScheme.ErReferralCodeVisitLimit < 0 ||
      this.billScheme.IpReferralCodeValidityPeriod < 0 ||
      this.billScheme.OpReferralCodeValidityPeriod < 0 ||
      this.billScheme.ErReferralCodeValidityPeriod < 0
    ) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
        "Referral Code Visit Limit and Validity Period must be positive numbers.",
      ]);
      this.loading = false;
      return;
    }
    if (
      (this.billScheme.IpReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.IpReferralCodeVisitLimit)) ||
      (this.billScheme.OpReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.OpReferralCodeVisitLimit)) ||
      (this.billScheme.ErReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.ErReferralCodeVisitLimit)) ||
      (this.billScheme.IpReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.IpReferralCodeValidityPeriod)) ||
      (this.billScheme.OpReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.OpReferralCodeValidityPeriod)) ||
      (this.billScheme.ErReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.ErReferralCodeValidityPeriod))
    ) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
        "Referral Code Visit Limit and Validity Period cannot be decimal values.",
      ]);
      this.loading = false;
      return;
    }

    this.settingsBLService.PostBillScheme(this.billScheme)
      .finally(() => { this.loading = false; })
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponseText.OK) {
            this.callbackAdd.emit({ action: "add", data: res.Results });
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [
              "Billing Scheme  Added",
            ]);
            this.GetBillingSchemes();
            this.billScheme = new BillingSchemeModel();
            this.loading = false;
            this.close();
          } else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
              "Billing Scheme not Added",
            ]);
            this.loading = false;
          }
        },
        (err) => {
          this.logError(err);
        }
      );
    // }
    //   else {
    //     this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["some data are invalid."]);
    // }
  }

  logError(err: any) {
    console.log(err);
  }

  showMessageBox(status: string, message: string) {
    this.messageBoxService.showMessage(status, [message]);
  }
  UpdateBillScheme() {
    let isSystemDefault = this.billSchemeList.some(a => a.IsSystemDefault === true && a.IsActive === true && a.SchemeId !== this.billScheme.SchemeId);
    if (isSystemDefault && this.billScheme.IsSystemDefault) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Default Duplicate Scheme is not allowed"]);
      return;
    }

    if (this.billScheme.IsCopaymentApplicable && this.billScheme.IsBillingCoPayment) {
      if (this.billScheme.BillCoPayCashPercent < 0 || this.billScheme.BillCoPayCashPercent > 100 || this.billScheme.BillCoPayCreditPercent < 0 || this.billScheme.BillCoPayCreditPercent > 100) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
      let totalBillingCoPayPercentage = this.billScheme.BillCoPayCashPercent + this.billScheme.BillCoPayCreditPercent;
      if (totalBillingCoPayPercentage > 100 || totalBillingCoPayPercentage < 0 || (totalBillingCoPayPercentage < 100 && totalBillingCoPayPercentage > 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
    }

    if (this.billScheme.IsCopaymentApplicable && this.billScheme.IsPharmacyCoPayment) {
      if (this.billScheme.PharmacyCoPayCashPercent < 0 || this.billScheme.PharmacyCoPayCashPercent > 100 || this.billScheme.PharmacyCoPayCreditPercent < 0 || this.billScheme.PharmacyCoPayCreditPercent > 100) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
      let totalPharmacyCoPayPercentage = this.billScheme.PharmacyCoPayCashPercent + this.billScheme.PharmacyCoPayCreditPercent;
      if (totalPharmacyCoPayPercentage > 100 || totalPharmacyCoPayPercentage < 0 || (totalPharmacyCoPayPercentage < 100 && totalPharmacyCoPayPercentage > 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["CoPay Percentage Cannot be greater than 100 or less than 0"]);
        return;
      }
    }
    if (
      this.billScheme.IpReferralCodeVisitLimit < 0 ||
      this.billScheme.OpReferralCodeVisitLimit < 0 ||
      this.billScheme.ErReferralCodeVisitLimit < 0 ||
      this.billScheme.IpReferralCodeValidityPeriod < 0 ||
      this.billScheme.OpReferralCodeValidityPeriod < 0 ||
      this.billScheme.ErReferralCodeValidityPeriod < 0
    ) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
        "Referral Code Visit Limit and Validity Period must be positive numbers.",
      ]);
      return;
    }

    if (
      (this.billScheme.IpReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.IpReferralCodeVisitLimit)) ||
      (this.billScheme.OpReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.OpReferralCodeVisitLimit)) ||
      (this.billScheme.ErReferralCodeVisitLimit != null && !Number.isInteger(this.billScheme.ErReferralCodeVisitLimit)) ||
      (this.billScheme.IpReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.IpReferralCodeValidityPeriod)) ||
      (this.billScheme.OpReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.OpReferralCodeValidityPeriod)) ||
      (this.billScheme.ErReferralCodeValidityPeriod != null && !Number.isInteger(this.billScheme.ErReferralCodeValidityPeriod))
    ) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
        "Referral Code Visit Limit and Validity Period cannot be decimal values.",
      ]);
      return;
    }
    if (this.billScheme.HasSubScheme !== true) {
      this.billScheme.BillingSubSchemes = new Array<BillingSubSchemeModel>();
    }
    this.settingsBLService
      .UpdateBillScheme(this.billScheme)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponseText.OK) {
          this.callbackAdd.emit({ action: "edit", data: res.Results });
          this.billScheme = new BillingSchemeModel();
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [
            "Updated.",
          ]);
          this.GetBillingSchemes();
        } else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
            "failed to update",
          ]);
        }
      });
  }
  filterPaymentMode() {
    this.tempdefaultPaymentlist = this.defaultPayment.filter(
      (a) => a.PaymentSubCategoryId == this.CurrentPayment.PaymentSubCategoryId
    );
  }
  filteCreditOrganization() {
    this.tempCreditOrganization = this.CreditOrganizations.filter(
      (a) =>
        a.OrganizationId == this.CurrentCreditOrganizationModel.OrganizationId
    );
  }

  DiscardChanges() {
    this.close();
  }

  isDirty(field) {
    this.isval = this.billScheme.SchemeValidator.controls[field].dirty;
    return this.isval;
  }

  public isValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined) {
      return this.billScheme.SchemeValidator.valid;
    } else {
      return !this.billScheme.SchemeValidator.hasError(validator, fieldName);
    }
  }

  updateCopaymentCheckboxState() {
    if (
      this.billScheme.IsBillingCoPayment ||
      this.billScheme.IsPharmacyCoPayment
    ) {
      this.billScheme.IsCopaymentApplicable = true;
    } else {
      this.billScheme.IsCopaymentApplicable = false;
    }
  }
  GoToNextInput(idToSelect: string) {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
      nextEl.select();
    }
  }

  public AddSubSchemeItemToList(): void {
    if (this.BillingSubScheme.SubSchemeName !== "") {
      const isDuplicate = this.billScheme.BillingSubSchemes.some(subScheme => subScheme.SubSchemeName.toLowerCase() === this.BillingSubScheme.SubSchemeName.toLowerCase());
      if (isDuplicate) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
          "Duplicate SubSchemeName.",
        ]);
      }
      else {
        if (this.BillingSubScheme.SubSchemeId === 0) {
          this.BillingSubScheme.SchemeId = this.BillSchemeId > 0 ? this.BillSchemeId : 0;
          this.BillingSubScheme.IsActive = true;
          this.billScheme.BillingSubSchemes.push(this.BillingSubScheme);
          this.BillingSubScheme = new BillingSubSchemeModel();
        }
        else {
          this.billScheme.BillingSubSchemes.map((subScheme) => {
            if (subScheme.SubSchemeId === this.BillingSubScheme.SubSchemeId) {
              subScheme.SubSchemeName = this.BillingSubScheme.SubSchemeName;
              this.BillingSubScheme = new BillingSubSchemeModel();
            }
          });
        }
      }
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [
        "SubScheme can't be empty.",
      ]);
    }
  }

  public GetBillingSubSchemesBySchemeId(SchemeId: number): void {
    this.settingsBLService.GetBillingSubSchemesBySchemeId(SchemeId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.billScheme.BillingSubSchemes = res.Results;
        }
        else[
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Billing Sub Schemes."])
        ]
      },
      (err) => {
        this.logError(err);
      }
    )
  }

  public ActivateDeactivateSubScheme(SubSchemeId: number): void {
    this.settingsBLService.ActivateDeactivateSubScheme(SubSchemeId)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetBillingSubSchemesBySchemeId(this.billScheme.SchemeId);
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [
              `SubScheme ${res.Results ? 'Activated' : 'Deactivated'} Successfully.`,
            ]);
          } else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
              `Unable to Change Status.`,
            ]);
          }
        },
        (err) => {
          this.logError(err);
        }
      );
  }

  public DeleteSubSchemeFromRow(index: number): void {
    this.billScheme.BillingSubSchemes.splice(index, 1);
  }

  public EditSubScheme(selectedSubScheme: BillingSubSchemeModel): void {
    if (selectedSubScheme) {
      this.BillingSubScheme.SubSchemeName = selectedSubScheme.SubSchemeName;
      this.BillingSubScheme.SubSchemeId = selectedSubScheme.SubSchemeId
    }
  }

  GetBillingSchemes() {
    this.settingsBLService.GetBillingSchemes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.billSchemeList = res.Results;
          this.loading = false;
        } else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
            "Biling Scheme not available",
          ]);
          this.loading = false;
        }
      },
      (err) => {
        this.logError(err);
        this.loading = false;
      }
    );
  }
}
