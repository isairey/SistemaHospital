import { Component } from '@angular/core';
import { Router } from '@angular/router';
//Security Service for Loading Child Route from Security Service
import { SecurityService } from "../security/shared/security.service";
import { MessageboxService } from '../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../shared/shared-enums';
import { AccountingBLService } from "./shared/accounting.bl.service";
import { AccountingService } from './shared/accounting.service';
@Component({
  templateUrl: "./accounting-main.html",
  styles: [`.page-bar .page-breadcrumb > li{vertical-align: middle;} .margin-rt-15{margin-right: 15px;}`]
})
export class AccountingComponent {
  validRoutes: any;
  fiscalYearName: any;
  fscStartDate: string;
  fscEndDate: string;
  nepStartDate: string;
  nepEndDate: string;
  nepFiscalYear: any;
  public loading: boolean = false; //mumbai-team-june2021-danphe-accounting-cache-change
  public primaryNavItems: Array<any> = null;
  public secondaryNavItems: Array<any> = null;
  public changeActivatedHospital: boolean = false;
  constructor(public securityService: SecurityService, public _router: Router,
    public accountingBLService: AccountingBLService, public accountingService: AccountingService,
    public messageBoxService: MessageboxService) {
    //get the chld routes of Accounting from valid routes available for this user.
    this.validRoutes = this.securityService.GetChildRoutes("Accounting");
    this.primaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    this.secondaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);

    this.LoadActiveHospital();

  }

  ngOnInit() {
  }

  public async LoadActiveHospital() { //mumbai-team-june2021-danphe-accounting-cache-change
    this.securityService.SetModuleName('accounting');
    let activeHospitalInfo = this.securityService.AccHospitalInfo;
    if (activeHospitalInfo && activeHospitalInfo.ActiveHospitalId > 0) {
      this.loading = true; //mumbai-team-june2021-danphe-accounting-cache-change
      await this.accountingService.getAccCacheData(); //mumbai-team-june2021-danphe-accounting-cache-change
      this.loading = false; //mumbai-team-june2021-danphe-accounting-cache-change
      this._router.navigate(['/Accounting/Transaction/VoucherEntry']);
    }
    else {
      this._router.navigate(['/Accounting/Transaction/ActivateHospital']);
    }
  }

  OpenHospitalChangeWindow() {
    let isConfirm = window.confirm("Are you sure you want to change the Current Hospital?");
    //we get true/false from window.confirm. if true then go to hosptial changing page.
    if (isConfirm) {
      this.accountingBLService.DeactivateAccountTenant()
        .subscribe({
          next: () => { }
          , error: () => { }
          , complete: () => {
            this.securityService.AccHospitalInfo.ActiveHospitalId = 0;
            this._router.navigate(['/Accounting/Transaction/ActivateHospital']);
          }
        });
    }
  }

  public async RefreshAccCacheData() {
    this.accountingService.RefreshAccCacheData();
    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Accounting Cache is successfully refreshed...`]);
  }

}
