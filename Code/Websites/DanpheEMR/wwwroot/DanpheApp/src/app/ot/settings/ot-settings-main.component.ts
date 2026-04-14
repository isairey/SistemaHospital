import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../security/shared/security.service';

@Component({
  selector: 'ot-settings-main',
  templateUrl: './ot-settings-main.component.html',
  styleUrls: ['./ot-settings-main.component.css']
})
export class OTSettingsMainComponent implements OnInit {

  ValidRoutes: any;

  constructor(
    private _securityService: SecurityService,
  ) {
    this.ValidRoutes = this._securityService.GetChildRoutes("OperationTheatre/Settings");
  }

  ngOnInit() {
  }

}
