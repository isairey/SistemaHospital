import { Component } from '@angular/core';
//Security Service for Loading Child Route from Security Service
import { SecurityService } from "../../security/shared/security.service";
@Component({
  templateUrl: "./appointment-reports-main.html"
})
export class RPT_APPT_AppointmentReportsMainComponent {
  ValidRoutes: any;
  PrimaryNavItems: Array<any> = null;
  SecondaryNavItems: Array<any> = null;
  constructor(public securityService: SecurityService) {
    //get the chld routes of AppointmentMain from valid routes available for this user.
    this.ValidRoutes = this.securityService.GetChildRoutes("Reports/AppointmentMain");
    this.PrimaryNavItems = this.ValidRoutes.filter(a => a.IsSecondaryNavInDropdown == null || a.IsSecondaryNavInDropdown == 0);
    this.SecondaryNavItems = this.ValidRoutes.filter(a => a.IsSecondaryNavInDropdown == 1);
  }
}
