import { Component } from '@angular/core';
//Security Service for Loading Child Route from Security Service
import { SecurityService } from "../../security/shared/security.service";
@Component({
  templateUrl: "./online-appointment-main.html"
})
export class OnlineAppointmentMainComponent {
  validRoutes: any;
  constructor(public securityService: SecurityService) {
    //get the chld routes of AppointmentMain from valid routes available for this user.
    this.validRoutes = this.securityService.GetChildRoutes("Appointment/OnlineAppointment");
  }
}
