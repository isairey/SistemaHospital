import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import * as moment from "moment";
import { forkJoin, of } from 'rxjs';
import { Observable } from 'rxjs-compat';
import { catchError } from 'rxjs/operators';
import { PatientsBLService } from "../../../patients/shared/patients.bl.service";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ReportingService } from "../../shared/reporting-service";
import { BedFeatureModel, PatientBedDetailsVM, WardModel } from "./PatientBedDetailsVM";

@Component({
  selector: 'patient-bed-details-report',
  templateUrl: './patient-bed-details-report.component.html',
  styleUrls: ['./patient-bed-details-report.component.css']
})
export class RPT_ADT_PatientBedDetailsReportComponent {
  PatientBedDetailsColumns: Array<any> = null;
  PatientBedDetailsData: Array<PatientBedDetailsVM> = new Array<PatientBedDetailsVM>();
  public fromDate: string = "";
  public toDate: string = "";
  public ward: WardModel | null = null;
  public bedFeature: BedFeatureModel | null = null;
  public wardId: number = null;
  public bedFeatureId: number = null;

  public patientId: number = null;
  public admissionStatus: string | null;
  public showGrid: boolean = false;
  public searchText: any = '';
  public WardList: Array<WardModel> = new Array<WardModel>();
  public BedFeatureList: Array<BedFeatureModel> = new Array<BedFeatureModel>();
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();

  constructor(public httpClient: HttpClient,
    public dlService: DLService,
    public msgBoxServ: MessageboxService,
    private _patientBlService: PatientsBLService,
    public reportServ: ReportingService) {
    this.PatientBedDetailsColumns = this.reportServ.reportGridCols.PatientBedDetailsReportColumns;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("AdmittedDate", false));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("TransinDate", false));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("TransOutDate", false));

    this.admissionStatus = null;
    var reqs: Observable<any>[] = [];
    reqs.push(this.dlService.getWard().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));

    reqs.push(this.dlService.getBedFeature().pipe(
      catchError((err) => {
        return of(err.error);
      })
    ));
    forkJoin(reqs).subscribe(result => {
      this.getWard(result[0]);
      this.getBedFeature(result[1]);
    });
  }
  Load() {
    this.PatientBedDetailsData = [];
    this.dlService
      .Read(
        "/Reporting/PatientBedDetailsReport?fromDate=" +
        this.fromDate +
        "&toDate=" +
        this.toDate +
        "&patientId=" +
        this.patientId +
        "&wardId=" +
        this.wardId +
        "&bedFeatureId=" +
        this.bedFeatureId +
        "&admissionStatus=" +
        this.admissionStatus
      )
      .map((res) => res)
      .subscribe(
        (res) => this.Success(res),
        (err) => this.Error(err)
      );
  }

  Error(err) {
    this.msgBoxServ.showMessage("error", [err]);
  }
  Success(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
      this.PatientBedDetailsData = [];
      this.PatientBedDetailsData = res.Results;
      this.showGrid = true;
    } else if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length == 0) {
      this.PatientBedDetailsData = [];
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Data Available for Applied Filter!",]);
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
    }
  }


  OnDateSelect($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;

  }

  getBedFeature(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      this.BedFeatureList = res.Results;
    }
    else {
      this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
    }
  }

  getWard(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      this.WardList = res.Results;
    }
    else {
      this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
    }
  }

  AssignBedFeatureId() {
    this.bedFeatureId = this.bedFeature ? this.bedFeature.BedFeatureId : null;
  }

  AssignWardId() {
    this.wardId = this.ward ? this.ward.WardId : null;
  }

  WardListFormatter(data: any): string {
    let html = data["WardName"];
    return html;
  }

  BedFeatureListFormatter(data: any): string {
    let html = data["BedFeatureName"];
    return html;
  }

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }
  assignPatientData() {
    if (this.searchText && typeof (this.searchText) == 'object') {
      // this.PatientBedDetailsData = [];
      this.patientId = this.searchText.PatientId;
      // this.PatientBedDetailsData.push(this.searchText);
    } else if (this.searchText === '' || this.searchText === null) {
      // this.PatientBedDetailsData = [];
      this.patientId = null;
      this.showGrid = false;
    }
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this._patientBlService.GetPatientsList(keyword, false);
  }

  gridExportOptions = {
    fileName: "PatientBedDetailsReport" + moment().format("YYYY-MM-DD") + ".xls",
  };
}
