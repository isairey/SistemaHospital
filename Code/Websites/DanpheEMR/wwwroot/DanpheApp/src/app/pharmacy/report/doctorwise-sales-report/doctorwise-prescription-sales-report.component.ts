import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { VisitService } from '../../../appointments/shared/visit.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PHRMDoctorList_DTO } from '../../shared/dtos/pharmacy-doctor-list.dto';
import { PHRMDoctorwiseSalesReport_DTO } from '../../shared/dtos/pharmacy-doctorwise-sales-report.dto';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";

@Component({
    templateUrl: "./doctorwise-prescription-sales-report.component.html"
})
export class DoctorWisePrescriptionSalesReportComponent {

    ///Daily Stock Summary Report Columns variable
    DoctorwisePrescriptionSalesReportColumns: Array<any> = null;
    public doctorList: PHRMDoctorList_DTO[] = [];
    public filteredDocList: PHRMDoctorList_DTO[] = [];
    public enablePreview: boolean = false;
    public toDate: string = '';
    public fromDate: string = '';
    public dateRange: string = '';
    public doctorWiseReport: PHRMDoctorwiseSalesReport_DTO = new PHRMDoctorwiseSalesReport_DTO();
    public selectedDoctor: PHRMDoctorList_DTO = new PHRMDoctorList_DTO();
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    public ItemsList: PHRMItemsList_DTO = new PHRMItemsList_DTO();
    public SelectedItem: PHRMItemsList_DTO = new PHRMItemsList_DTO();
    public ItemId: number = null;
    public prescriberId: number = null;
    public DoctorwiseSalesReport: PHRMDoctorwiseSalesReport_DTO[] = [];
    public FilterParameters: IGridFilterParameter[] = [];
    public ItemName: string = '';
    public DoctorName: string = '';


    constructor(public pharmacyBLService: PharmacyBLService,
        public dlService: DLService,
        public visitService: VisitService,
        public msgBoxServ: MessageboxService) {
        this.DoctorwisePrescriptionSalesReportColumns = PHRMReportsGridColumns.PHRMDoctorwisePrescriptionSalesReport;
        this.GetVisitDoctors();
        this.GetItemList();
    }


    ////Export data grid options for excel file
    gridExportReportOptions = {
        fileName: 'DoctorwisePrescriptionSalesReport' + moment().format('YYYY-MM-DD') + '.xls',
    };

    OnFromToDateChange($event) {
        this.fromDate = $event ? $event.fromDate : this.fromDate;
        this.toDate = $event ? $event.toDate : this.toDate;

        this.dateRange = "<b>Date:</b><b>From:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
    }
    GetVisitDoctors() {
        this.pharmacyBLService.GetDoctorList().subscribe(res => {
            if (res.Status == ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
                this.filteredDocList = res.Results;
            }
            else {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["No Data is Available for doctor list"]);

            }
        })

    }
    GetItemList() {
        this.pharmacyBLService.GetItemMasterList().subscribe(res => {
            if (res.Status == ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
                this.ItemsList = res.Results;
            }
            else {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["No Data is Available for Items list"]);

            }
        })

    }
    GetDoctorwiseSalesReport() {
        this.FilterParameters = [
            { DisplayName: "DoctorName", Value: this.DoctorName !== '' ? this.DoctorName : 'All' },
            { DisplayName: "ItemName", Value: this.ItemName !== '' ? this.ItemName : 'All' },
            { DisplayName: "DateRange", Value: `<b>From:</b>&nbsp;${this.fromDate}&nbsp;<b>To:</b>&nbsp;${this.toDate}` },
        ];
        this.DoctorwiseSalesReport = new Array<PHRMDoctorwiseSalesReport_DTO>();
        this.pharmacyBLService.GetDoctorwiseSalesReport(this.fromDate, this.toDate, this.prescriberId, this.ItemId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length) {
                        this.DoctorwiseSalesReport = res.Results;
                    }
                    else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Data Available"]);
                    }
                    this.Clear();
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Field to load data" + res.ErrorMessage]);
                }

            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Field to load data" + err]);
                });
    }
    onDoctorSelectionChange() {
        if (this.selectedDoctor) {
            this.prescriberId = this.selectedDoctor.EmployeeId;
            this.DoctorName = this.selectedDoctor.FullName;
        } else {
            this.prescriberId = null;
        }
    }
    onItemSelectedChange() {
        if (this.SelectedItem) {
            this.ItemId = this.SelectedItem.ItemId;
            this.ItemName = this.SelectedItem.ItemName;
        } else {
            this.ItemId = null;
        }
    }

    DocListFormatter(data: any): string {
        let html = data["FullName"];
        return html;
    }
    ItemsListFormatter(data: any): string {
        let html = data["ItemName"];
        return html;
    }

    Clear() {
        this.SelectedItem = null;
        this.ItemId = null;
        this.ItemName = null;
        this.selectedDoctor = null;
        this.DoctorName = null;
        this.prescriberId = null;
    }
}
class PHRMItemsList_DTO {
    public ItemName: string = '';
    public ItemId: number = 0;

}



