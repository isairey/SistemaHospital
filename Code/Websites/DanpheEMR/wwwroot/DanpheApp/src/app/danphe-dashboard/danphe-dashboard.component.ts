import { Component } from '@angular/core';
import { SecurityService } from '../security/shared/security.service';

@Component({
  selector: 'app-danphe-dashboard',
  templateUrl: './danphe-dashboard.component.html',
  styleUrls: ['./danphe-dashboard.component.css']
})
export class DanpheDashboardComponent {

  validRoutes: any;
  public primaryNavItems: Array<any> = null;
  public secondaryNavItems: Array<any> = null;
  constructor(public securityService: SecurityService) {
    //get the child routes of Helpdesk from valid routes available for this user.
    this.validRoutes = this.securityService.GetChildRoutes("Dashboard");
    this.primaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    this.secondaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);
  }

}
