import { Component } from '@angular/core';


import * as moment from 'moment/moment';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";
import { PHRMReportsModel } from "../../shared/phrm-reports-model";

import { Patient } from "../../../patients/shared/patient.model";
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PHRMCreditInOutPatientReportData_DTO } from './phrm-credit-in-out-patient-data.dto';
@Component({
    selector: 'my-app',
    templateUrl: "./phrm-credit-in-out-patient-report.html"
})
export class PHRMCreditInOutPatientReportComponent {

    PHRMCreditInOutPatReportColumns: Array<any> = null;
    PHRMCreditInOutPatReportData = new Array<PHRMCreditInOutPatientReportData_DTO>();
    FilterParameters: IGridFilterParameter[] = [];
    public phrmReports: PHRMReportsModel = new PHRMReportsModel();
    public patientName: string = "";
    PHRMPatient: Array<Patient> = new Array<Patient>();
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    VisitType: string = "";
    DateRange: string = "";

    VisitTypes = [
        { value: '', label: 'All' },
        { value: 'inpatient', label: 'Inpatient' },
        { value: 'outpatient', label: 'Outpatient' }
    ];


    constructor(public pharmacyBLService: PharmacyBLService, public dlService: DLService,
        public msgBoxServ: MessageboxService) {
        this.PHRMCreditInOutPatReportColumns = PHRMReportsGridColumns.PHRMCreditInOutPatReport;
        this.phrmReports.FromDate = moment().format('YYYY-MM-DD');
        this.phrmReports.ToDate = moment().format('YYYY-MM-DD');
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("Date", false));
        this.VisitType = '';
    }
    onChangeGetPatientListByPatientType(selectedPatientType) {
        if (selectedPatientType == "Inpatient") {
            this.VisitType = selectedPatientType;

        }
        else if (selectedPatientType == "Outpatient") {
            this.VisitType = selectedPatientType;

        }
        else {
            this.VisitType = selectedPatientType;
        }
    }


    ////Export data grid options for excel file
    gridExportOptions = {
        fileName: 'CreditIN_OUT_InfoReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };

    ////Function Call on Button Click of Report
    ngAfterViewChecked() {
        this.DateRange = "<b>From:</b>&nbsp;" + this.phrmReports.FromDate + "&nbsp;<b>To:</b>&nbsp;" + this.phrmReports.ToDate;
    }
    GetReportData() {
        this.FilterParameters = [
            { DisplayName: "Visit Type", Value: this.VisitType ? this.VisitType : "All" },
            { DisplayName: "DateRange", Value: this.DateRange }

        ]
        this.pharmacyBLService.GetCreditInOutPatReportList(this.phrmReports, this.VisitType)
            .subscribe(res => {
                this.PHRMCreditInOutPatReportData = [];
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.PHRMCreditInOutPatReportData = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to Load report data."]);
                }
            });
    }

    myListFormatter(data: any): string {
        let html = data["ShortName"];
        return html;
    }

    // SelectItemFromSearchBox() {
    //     //if proper Patient is selected then the below code runs ..othewise it goes out side the function
    //     if (typeof this.selectedPat === "object" && !Array.isArray(this.selectedPat) && this.selectedPat !== null) {
    //         ////If Patient Is Proper Then Setting Patient Name and Patient Type Property
    //         this.patientName = this.selectedPat.ShortName;
    //         if (this.selectedPat.IsOutdoorPat) {
    //             this.VisitType = "out";
    //             this.IsInOutPat = true;
    //         }
    //         else {
    //             this.VisitType = "in";
    //             this.IsInOutPat = false;
    //         }
    //     }
    // }


    //on click grid export button we are catching in component an event.. 
    //and in that event we are calling the server excel export....
    // OnGridExport($event: GridEmitModel) {
    //     this.dlService.ReadExcel("/api/PharmacyReport/ExportToExcelPHRMCreditInOutPatientReport?FromDate="
    //         + this.phrmReports.FromDate + "&ToDate=" + this.phrmReports.ToDate + "&IsInOutPat=" + this.VisitType + "&patientName=" + this.patientName)
    //         .map(res => res)
    //         .subscribe(data => {
    //             let blob = data;
    //             let a = document.createElement("a");
    //             a.href = URL.createObjectURL(blob);
    //             a.download = "CreditIN_OUT_InfoReport_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
    //             document.body.appendChild(a);
    //             a.click();
    //         },

    //             res => this.ErrorMsg(res));
    // }
    ErrorMsg(err) {
        this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
        console.log(err.ErrorMessage);
    }

    OnFromToDateChange($event) {
        this.phrmReports.FromDate = $event ? $event.fromDate : this.phrmReports.FromDate;
        this.phrmReports.ToDate = $event ? $event.toDate : this.phrmReports.ToDate;
    }


}






