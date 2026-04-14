import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";

@Component({
    selector: 'adt-bed-reservation',
    templateUrl: './bed-reservation-main.component.html'
})
export class ADTBedReservationMainComponent {

    validRoutes: any;
    constructor(public securityService: SecurityService) {
        //get the chld routes of Settlements from valid routes available for this user.
        this.validRoutes = this.securityService.GetChildRoutes("ADTMain/BedReservation");
    }

}