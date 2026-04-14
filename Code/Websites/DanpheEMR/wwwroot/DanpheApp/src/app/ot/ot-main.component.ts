import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../security/shared/security.service';
import { OTService } from './shared/ot.service';

@Component({
  selector: 'ot',
  templateUrl: './ot-main.component.html',
  styleUrls: ['./ot-main.component.css']
})

export class OTMainComponent implements OnInit {
  ValidRoutes: any;
  PrimaryNavItems = [];
  SecondaryNavItems = [];

  constructor(
    private _securityService: SecurityService,
    private _otService: OTService
  ) {
    this.ValidRoutes = this._securityService.GetChildRoutes("OperationTheatre");
    this.PrimaryNavItems = this.ValidRoutes.filter(a => a.IsSecondaryNavInDropdown === null || a.IsSecondaryNavInDropdown === 0);
    this.SecondaryNavItems = this.ValidRoutes.filter(a => a.IsSecondaryNavInDropdown === 1);
  }
  ngOnInit() {
    this._otService.LoadOTMachines();
    this._otService.LoadPersonnelTypes();
    this._otService.LoadOTSurgeries();
    this._otService.LoadOTMSTCheckList();
    this._otService.LoadPersonnel();
    this._otService.LoadAnaesthesiaTypes();
    this._otService.LoadOTPrescriberList();
    this._otService.LoadOTBillingItems();
    this._otService.GetICDList();
  }

}
