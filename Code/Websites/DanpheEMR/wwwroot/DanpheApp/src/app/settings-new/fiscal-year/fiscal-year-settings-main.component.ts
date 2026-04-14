import { Component } from '@angular/core';
import { SecurityService } from '../../security/shared/security.service';
@Component({
  templateUrl: "./fiscal-year-settings-main.html"
})
export class FiscalYearSettingsMainComponent {
  validRoutes: any;
  constructor(public securityService: SecurityService) {
    //get the chld routes of ADTMain from valid routes available for this user.
    this.validRoutes = this.securityService.GetChildRoutes("Settings/FiscalYear");
  }
}
