import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../../security/shared/security.service';



@Component({
  selector: 'ot-manage-anaesthesia-type',
  templateUrl: './ot-manage-anaesthesia-type.component.html',

})
export class OtManageAnaesthesiaTypeComponent implements OnInit {

  ValidRoutes: any;

  constructor(
    private _securityService: SecurityService,
  ) {
    this.ValidRoutes = this._securityService.GetChildRoutes("OperationTheatre/Settings/ManageAnaesthesiaTypes");
  }

  ngOnInit(): void {
  }

}
