import { ChangeDetectorRef, Component } from "@angular/core";
import { Router } from "@angular/router";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyPackage_DTO } from "../../shared/dtos/pharmacy-package-dto";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMGridColumns from "../../shared/phrm-grid-columns";

@Component({
    selector: "phrm-package-list",
    templateUrl: "./phrm-package-manage-list.component.html"
})

export class PHRMPackageManageListComponent {
    PackageGridColumns: typeof PHRMGridColumns.PhrmPackageManageListGridColumns = null;
    PackageList: Array<PharmacyPackage_DTO> = Array<PharmacyPackage_DTO>();
    ShowPackageAddComponent: boolean = false;
    PharmacyPackageId: number = null;
    IsActivate: boolean = false;
    IsEditMode: boolean = false;

    constructor(public messageBoxService: MessageboxService, public pharmacyBLService: PharmacyBLService, public router: Router, public changeDetector: ChangeDetectorRef) {
        this.PackageGridColumns = PHRMGridColumns.PhrmPackageManageListGridColumns;
        this.getPackageList();
    }
    ShowAddNewPackage() {
        this.ShowPackageAddComponent = true;
    }
    Close() {
        this.ShowPackageAddComponent = false;
        this.PharmacyPackageId = null;
        this.IsEditMode = false;
    }
    PackageGridActions($event) {
        switch ($event.Action) {
            case "edit": {
                this.PharmacyPackageId = $event.Data.PharmacyPackageId;
                this.IsEditMode = true;
                this.changeDetector.detectChanges();
                this.ShowPackageAddComponent = true;

                break;
            }
            case "activate": {
                this.PharmacyPackageId = $event.Data.PharmacyPackageId;
                this.IsActivate = true;
                if (confirm("Are you Sure want to Activate the " + $event.Data.PharmacyPackageName + "Package" + ' ?')) {
                    this.ActivateDeactivatePackage(this.PharmacyPackageId, this.IsActivate);
                }
                break;
            }
            case "deactivate": {
                this.PharmacyPackageId = $event.Data.PharmacyPackageId;
                this.IsActivate = false;
                if (confirm("Are you Sure want to Deactivate the " + $event.Data.PharmacyPackageName + "Package" + ' ?')) {
                    this.ActivateDeactivatePackage(this.PharmacyPackageId, this.IsActivate);
                }
                break;
            }
            default:
                break;
        }
    }
    public getPackageList() {
        this.pharmacyBLService.GetMedicinePackageList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.PackageList = res.Results;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["PackageList is empty"]);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Something Wrong " + err.ErrorMessage]);
                });
    }
    OnClickCloseButton($event) {
        if ($event) {
            this.Close();
            this.getPackageList();
        }
    }
    ActivateDeactivatePackage(PharmacyPackageId, IsActivate) {
        this.pharmacyBLService.ActivateDeactivatePackage(PharmacyPackageId, IsActivate)
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    if (this.IsActivate === true) {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Package Activated Successfully"]);
                    }
                    else {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Package Deactivated Successfully"]);
                    }
                    this.getPackageList();
                }
            })
    }
}