import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";

@Component({
    selector: 'app-clinical-template',
    templateUrl: './clinical-template.component.html',

})
export class ClinicalTemplateComponent {
    validRoutes: any;
    constructor(public securityService: SecurityService) {
        //get the chld routes of AppointmentMain from valid routes available for this user.  
        this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings/Templates");
    }

}