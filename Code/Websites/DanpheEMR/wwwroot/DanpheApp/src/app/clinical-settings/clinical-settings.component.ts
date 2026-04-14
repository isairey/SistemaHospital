import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityService } from '../security/shared/security.service';
import { CallbackService } from '../shared/callback.service';
import { RouteFromService } from '../shared/routefrom.service';

@Component({
  selector: 'app-clinical-settings',
  templateUrl: './clinical-settings.component.html',
  styleUrls: ['./clinical-settings.component.css']
})
export class ClinicalSettingsComponent {

  validRoutes: any;
  public primaryNavItems: Array<any> = null;
  public secondaryNavItems: Array<any> = null;
  constructor(public securityService: SecurityService,
    public callbackService: CallbackService, public router: Router,
    private _routeFrom: RouteFromService) {
    //get the chld routes of ClinicalSettings from valid routes available for this user.
    this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings");
    this.primaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    this.secondaryNavItems = this.validRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);
  }
  ngOnInit() {
  }

}
