import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { Department } from "../../../settings-new/shared/department.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { DischargeSummaryBLService } from "../../shared/discharge-summary.bl.service";
import { DischargeSummaryDLService } from "../../shared/discharge-summary.dl.service";
import { DischargePatientReferralModel } from "../Model/discharge-summary-refferal.model";
@Component({
    selector: 'discharge-referral-add',
    templateUrl: './discharge-patient-referral-add.component.html'
})
export class DischargePatientReferralComponent {

    @Output()
    OnPopupClose: EventEmitter<any> = new EventEmitter();
    dischargeReferral: DischargePatientReferralModel = new DischargePatientReferralModel();
    departmentList: Array<Department> = new Array<Department>();
    ReferredFromDepartment: Department = null;
    PatientReferralId: number = null;
    showReferralLetterPopup: boolean = false;
    headerDetail: { hospitalName, address, email, PANno, tel, DDA };
    ReferredToDepartment: Department = null;
    @Input("selectedDischarge")
    public selectedPatientDetail: any = null;
    @Input("showDischargeReferral")
    public set value(value: boolean) {
        if (value && this.selectedPatientDetail) {
            this.dischargeReferral.PatientId = this.selectedPatientDetail.PatientId;
            this.dischargeReferral.PatientVisitId = this.selectedPatientDetail.PatientVisitId;
        }
    }
    constructor(public coreService: CoreService, private msgBoxServ: MessageboxService, private dischargeBLService: DischargeSummaryBLService, public dischargeSummaryDLService: DischargeSummaryDLService
    ) {
        this.getDepartmentList();
        this.GetPharmacyReceiptHeaderParameter();
    }
    Close() {
        this.showReferralLetterPopup = false;
        this.OnPopupClose.emit();
    }
    public FocusElementById(id: string) {
        window.setTimeout(function () {
            let itmNameBox = document.getElementById(id);
            if (itmNameBox) {
                itmNameBox.focus();
            }
        }, 10);
    }
    GetPharmacyReceiptHeaderParameter() {
        var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy Receipt Header').ParameterValue;
        if (paramValue) {
            this.headerDetail = JSON.parse(paramValue);
        }
        else {
            this.msgBoxServ.showMessage("error", ["Please enter parameter values for BillingHeader"]);
        }
    }
    public getDepartmentList() {
        this.dischargeSummaryDLService.GetDepartments()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.departmentList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong"]);
                }
            });
    }
    departmentListFormatter(data: any): string {
        return `${data["DepartmentName"]}`;
    }
    OnRefferredFromDepartmentChange() {
        this.dischargeReferral.ReferredFromDepartmentId = this.ReferredFromDepartment.DepartmentId;
    }
    OnReferredToDepartmentChange() {
        this.dischargeReferral.ReferredToDepartmentId = this.ReferredToDepartment.DepartmentId;
    }
    Save() {
        this.dischargeBLService.PostDischargeReferrel(this.dischargeReferral)
            .subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                        this.PatientReferralId = res.Results;
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Referral Letter Added Successfully"]);
                        this.GetPatientReferralDetails(this.PatientReferralId);
                    }
                    else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to save Referral data"]);
                    }
                });
    }
    GetPatientReferralDetails(patientReferralId: number) {
        if (this.PatientReferralId > 0) {
            this.dischargeBLService.GetPatientReferralDetails(patientReferralId)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                            this.dischargeReferral = res.Results;
                            if (this.dischargeReferral)
                                this.showReferralLetterPopup = true;
                        }
                        else {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["No Referral Letter Found"]);
                        }
                    });
        }
    }
    print() {
        let popupWinindow;
        var printContents = document.getElementById("printpage").innerHTML;
        popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
        popupWinindow.document.open();

        let documentContent = "<html><head>";
        documentContent += '<link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanphePrintStyle.css"/>';
        documentContent += '<link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css"/>';
        documentContent += '<link rel="stylesheet" type="text/css" href="../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
        documentContent += '<link rel="stylesheet" type="text/css" href="../../themes/theme-default/Danphe_ui_style.css"/>';
        documentContent += `<style>
        .img-responsive{ position: static;left: -65px;top: 10px;}
        .qr-code{position: absolute; left: 1001px;top: 9px;}
        .invoice-print-header .col-md-2 {
            width: 20%;
            float: left;
        }
        .invoice-print-header .col-md-8 {
            width: 60%;
            float: left;
        }
        .sub-main-cls, ul.adviceSubList li {
            width: 50% !important;
            display: inline-block !important;
            padding: 1%;
        }
        ul.adviceSubList li {
             flex: 0 0 47%;
        }
        .sub-main-cls-fullwidth, ul.adviceSubList li .sub-main-cls {
            width: 100% !important;
            display: block !important;
        }
        .dsv-div .left-panel .patient-hdr-label, .left-panel .patient-hdr-label {
            display: inline-block;
            width: 33.33%;
        }
        .left-panel .patient-hdr-label.signature, .dr-signature-list .patient-hdr-label {
            max-width: 400px;
            width: 100%;
            display: block;
        }
        .left-panel .patient-hdr-label b:before,
        .p-relative b:before {
            display: none !important;    
        }
        </style>`;

        documentContent += '</head>';
        documentContent += '<body onload="window.print()">' + printContents + '</body></html>'
        popupWinindow.document.write(documentContent);
        popupWinindow.document.close();
    }
}