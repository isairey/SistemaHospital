import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { CoreService } from "../core/shared/core.service";
import { SecurityService } from "../security/shared/security.service";
import { DanpheCache, MasterType } from "../shared/danphe-cache-service-utility/cache-services";
import { MessageboxService } from "../shared/messagebox/messagebox.service";
import { RouteFromService } from "../shared/routefrom.service";


@Component({
  selector: 'clinical',
  templateUrl: './clinical-main.component.html'
})
export class ClinicalMainComponent {

  validRoutes: any;
  public primaryNavItems: [] = [];
  public secondaryNavItems: [] = [];
  constructor(public securityService: SecurityService, public router: Router,
    public routeFromService: RouteFromService,
    public coreService: CoreService,
    public msgBoxServ: MessageboxService
  ) {
    this.validRoutes = this.securityService.GetChildRoutes("Clinical");
    this.primaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    // this.secondaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);
    const allCounters = DanpheCache.GetData(MasterType.BillingCounter, null);
    if (allCounters && allCounters.length) {
      const currentCounter = allCounters.find(c => c.CounterId === 1);
      if (currentCounter) {
        this.securityService.setLoggedInCounter(currentCounter);
      }
    }

  }

  public ShowSchemeReturnEntryPage: boolean = false;


}
