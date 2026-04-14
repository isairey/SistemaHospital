import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SecurityBLService } from "../../security/shared/security.bl.service";
import { SecurityService } from "../../security/shared/security.service";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { AccountTenantMapWrapper_DTO, AddAccountTenantPost_DTO } from "../shared/DTOs/account-tenant-section-map.dto";
import { AccountingBLService } from "../shared/accounting.bl.service";

@Component({
    selector: 'add-tenant',
    templateUrl: './add-tenant.component.html',
})
export class AddTenantComponent {
    TenantSectionMaps: AccountTenantMapWrapper_DTO = new AccountTenantMapWrapper_DTO();
    SelectedSectionList: Array<number> = [];
    Loading: boolean = false;
    AddTenantPostObject: AddAccountTenantPost_DTO = new AddAccountTenantPost_DTO();
    constructor(private _accountingBlService: AccountingBLService,
        private _messageBoxService: MessageboxService,
        private _router: Router, private _securityService: SecurityService,
        private _securityBlService: SecurityBLService
    ) {
        this.GetTenantSectionMap();
    }

    ngOnInit() {
        this.MoveToNextInput("id_input_addTenant_hospitalShortCode");
    }

    GetTenantSectionMap() {
        this._accountingBlService.GetTenantSectionMap()
            .subscribe((res) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.TenantSectionMaps = res.Results;
                }
            },
                (err) => {
                    console.log(err);
                }
            )
    }
    OnSectionSelected($event) {
        if ($event) {
            this.SelectedSectionList = [];
            if ($event && $event.length) {
                $event.forEach(v => {
                    this.SelectedSectionList.push(v.SectionId);
                })
                console.log(this.SelectedSectionList);
            }
        }
    }

    CapitalizeWord() {
        this.AddTenantPostObject.HospitalShortCode = this.AddTenantPostObject.HospitalShortCode.toUpperCase();
    }

    AddNewTenant() {
        if (this.AddTenantPostObject.HospitalName !== "" && this.AddTenantPostObject.HospitalShortCode !== "") {
            let hospital = this.TenantSectionMaps.Maps.find(a => a.HospitalShortCode === this.AddTenantPostObject.HospitalShortCode);
            if (hospital) {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Another Account Section with same HospitalShortCode already exists, Please enter unique Hospital Short Code...`]);
                return;
            }

            this.Loading = true;
            this.AddTenantPostObject.SectionIds = JSON.stringify(this.SelectedSectionList).replace(/\[|\]/g, "")
            this._accountingBlService.AddNetAccountTenant(this.AddTenantPostObject)
                .finally(() => { this.Loading = false })
                .subscribe(
                    (res) => {
                        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Account tenant has been successfully added...`]);
                            this.GetPermissions();
                        }
                    },
                    (err) => {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
                        console.log(err);
                    }
                )
        }
        else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Please fill all the mandatory input fields...`]);
        }
    }

    GetPermissions(): void {
        this._securityBlService.GetValidUserPermissionList()
            .finally(() => {
                this._securityService.AccHospitalInfo.ActiveHospitalId = 0;
                this._router.navigate(['/Accounting/Transaction/ActivateHospital']);
            })
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this._securityService.UserPermissions = res.Results;
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                }
            );
    }

    MoveToNextInput(id: string) {
        let htmlElement = document.getElementById(id);
        if (htmlElement) {
            htmlElement.focus();
        }
    }
}