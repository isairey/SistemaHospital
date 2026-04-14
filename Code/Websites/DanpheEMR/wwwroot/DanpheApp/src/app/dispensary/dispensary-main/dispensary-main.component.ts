import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { BillingService } from '../../billing/shared/billing.service';
import { PharmacyCounter } from '../../pharmacy/shared/pharmacy-counter.model';
import { CreditOrganization } from '../../pharmacy/shared/pharmacy-credit-organizations.model';
import { PharmacyBLService } from '../../pharmacy/shared/pharmacy.bl.service';
import { PHRMStoreModel } from '../../pharmacy/shared/phrm-store.model';
import { SecurityBLService } from '../../security/shared/security.bl.service';
import { SecurityService } from '../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses } from '../../shared/shared-enums';
import { DispensaryService } from '../shared/dispensary.service';

@Component({
  selector: 'app-dispensary-main',
  templateUrl: './dispensary-main.component.html',
  styleUrls: ['./dispensary-main.component.css']
})
export class DispensaryMainComponent implements OnInit {
  validRoutes: any;
  public primaryNavItems: Array<any> = null;
  public secondaryNavItems: Array<any> = null;
  showDispensaryInfo: boolean;
  selectedDispensary: PHRMStoreModel;
  public creditOrganizationsList: Array<CreditOrganization> = new Array<CreditOrganization>();

  constructor(private _securityService: SecurityService, private _dispensaryService: DispensaryService, public router: Router, public msgBoxServ: MessageboxService, public pharmacyBLService: PharmacyBLService, private billingService: BillingService, private billingBlService: BillingBLService, public securityBLService: SecurityBLService) {
    //get the child routes of Dispensary from valid routes available for this user.
    this.validRoutes = this._securityService.GetChildRoutes("Dispensary");
    this.primaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    this.secondaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);
    this.LoadINVHospitalInfo();
    this.GetInsurancePackageBillServiceItems();
  }

  ngOnInit() {
    this.selectedDispensary = this._dispensaryService.activeDispensary;
    this.GetPharmacyCreditOrganizations();
    this.GetBillingCreditOrganizationList();
  }
  UnsetGlobalDispensary() {
    this.selectedDispensary = new PHRMStoreModel();
    this._dispensaryService.activeDispensary = this.selectedDispensary;
    //also unset the counter.
    this._securityService.setPhrmLoggedInCounter(new PharmacyCounter());
    //rohit: also deactivate the dispensary;
    this._dispensaryService.DeactivateDispensary().subscribe(res => {
      if (res.Status == "OK") {
        this.router.navigate(['/Dispensary/ActivateDispensary']);
      }
      else {
        this.msgBoxServ.showMessage("Notice", ["Failed to logout dispensary"]);
      }
    });

  }
  ShowInfo() {
    this.showDispensaryInfo = true;
    var timer = setInterval(() => { this.CloseInfo(); clearInterval(timer) }, 10000);
  }
  CloseInfo() {
    this.showDispensaryInfo = false;
  }
  GetPharmacyCreditOrganizations() {
    this.pharmacyBLService.GetCreditOrganization()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.creditOrganizationsList = res.Results;
          this._dispensaryService.SetAllCreditOrgList(res.Results);
        }
      });
  }

  //getting credit organization list and set to the global variable.
  public GetBillingCreditOrganizationList() {
    this.billingBlService.GetOrganizationList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == 'OK') {
          console.log("CreditOrganization list are loaded successfully (billing-main).");
          this._dispensaryService.SetAllBillingCreditOrgList(res.Results);
          this.billingService.SetAllCreditOrgList(res.Results);
        }
        else {
          console.log("Couldn't get CreditOrganization List(billing-main).");
        }
      });
  }
  // ! this is to load fiscal year list for fiscal-year-calender
  LoadINVHospitalInfo() {
    this._securityService.SetModuleName('inventory');
    if (!(this._securityService.INVHospitalInfo.CurrFiscalYear.FiscalYearId > 0)) {
      this.securityBLService.GetINVHospitalInfo()
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._securityService.SetINVHospitalInfo(res.Results);
          }
        },
          err => {
            alert('Failed to get Fiscal Year Details');
          });
    }
  }
/**
 * This method fetch all the Insurance Package Bill Service Items from API
 */
  GetInsurancePackageBillServiceItems() {
    this.pharmacyBLService.GetInsurancePackageBillServiceItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._dispensaryService.SetInsurancePackageBillServiceItems(res.Results)
      }
    })
  }

}
