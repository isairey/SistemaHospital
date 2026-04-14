import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";



@Component({
  selector: "cln-emergency-main",
  templateUrl: "./clinical-emergency-main.component.html",
})
export class ClinicalEmergencyMainComponent {
  validRoutes: any;
  constructor(public securityService: SecurityService) {

    this.validRoutes = this.securityService.GetChildRoutes("Clinical/Emergency");
  }
}
