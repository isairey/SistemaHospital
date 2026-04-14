import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_TriageStatus } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Doctors_DTO } from "../../shared/dto/appointmentApplicableDoctor.dto";
import { ERPatVisitsParam_DTO } from "../../shared/dto/er-pat-visits-params.dto";
import { ERPatientVisit_DTO } from "../../shared/dto/er-pat-visits.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";

@Component({
  selector: "emergency-patient-visit",
  templateUrl: "emergency-patient-visit.component.html"
})

export class EmergencyPatientVisit implements OnInit {
  ERPatVisitsGridColumn: typeof GridColumnSettings.ERPatientVisitsList;
  ERVisit_Filter: ERPatVisitsParam_DTO = new ERPatVisitsParam_DTO;
  ShowCustomDateRange: boolean = false;
  ERPatient_SelectedFilter: ERPatVisitsParam_DTO = new ERPatVisitsParam_DTO;
  ShowDate: Boolean = true;
  ValidDate: boolean = false;
  DateRange: string = null;
  ERPatVisitList = new Array<ERPatientVisit_DTO>();
  DoctorsList = new Array<Doctors_DTO>();
  FilteredERPatVisitList = new Array<ERPatientVisit_DTO>();
  SelectedTriageStatus: string = 'Triage Done';
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  TriageDate: string = 'triaged-date';
  VisitDate: string = 'visit-date';
  TriageVisitFilter: string;
  ShowRadioButton: boolean = false;


  constructor(private _msgBoxServ: MessageboxService,
    private _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _router: Router,
    private _securityService: SecurityService,

  ) {
    this.ERPatVisitsGridColumn = GridColumnSettings.ERPatientVisitsList;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("VisitDate", false)
    );
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("TriagedOn", true)
    );
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    this.ERPatient_SelectedFilter.SelectedEmployeeId = + this.ERVisit_Filter.FilterFormGroup.value.SelectedEmployee.EmployeeId;
    this.ERVisit_Filter.FilterFormGroup.controls["FromDate"].setValue(formattedToday);
    this.ERVisit_Filter.FilterFormGroup.controls["ToDate"].setValue(formattedToday);
    this.ERPatient_SelectedFilter.FromDate = this.ERVisit_Filter.FilterFormGroup.value.FromDate;
    this.ERPatient_SelectedFilter.ToDate = this.ERVisit_Filter.FilterFormGroup.value.ToDate;
    this.GetDoctorsList();
    this.TriageVisitFilter = this.TriageDate;
    this.SelectedTriageStatus = this.TriageDate;
    //this.FilterERPatients();

  }
  ngOnInit(): void {

    this.ERVisit_Filter.FilterFormGroup.controls['VisitDateFilter'].setValue(this.TriageDate);
    this.OnVisitDateChange({ target: { value: this.TriageDate } });
    this.SelectedTriageStatus = ENUM_TriageStatus.TriageDone;

  }
  GetDoctorsList() {
    this._clinicalNoteBLService.GetDoctorsList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.DoctorsList = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Doctor List Is Empty.']);
          }
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Doctors list']);
        }
      }
    );
  }
  DoctorListFormatter(data: any): string {
    return data["FullName"];
  }
  IsDateCheck() {
    this.ShowDate = !this.ShowDate;
  }
  OnVisitDateChange(event) {
    this.TriageVisitFilter = event.target.value;
    const selectedValue = event.target.value;
    if (this.TriageDate == selectedValue) {
      this.SelectedTriageStatus = ENUM_TriageStatus.TriageDone;
      this.OnTriageStatusChange(ENUM_TriageStatus.TriageDone);
      this.ShowRadioButton = false;
    }
    if (this.VisitDate == selectedValue) {
      this.SelectedTriageStatus = ENUM_TriageStatus.All;
      this.OnTriageStatusChange(ENUM_TriageStatus.All);
      this.ShowRadioButton = true;
    }
  }
  GetTodayVisits() {
    const fromDate = moment().startOf('day').format('YYYY-MM-DD');
    const toDate = moment().endOf('day').format('YYYY-MM-DD');
    this.ERVisit_Filter.FilterFormGroup.patchValue({
      FromDate: fromDate,
      ToDate: toDate
    });
    this.LoadERPatientList();
  }
  OnDateChange($event) {
    this.ERPatient_SelectedFilter.FromDate = $event.fromDate;
    this.ERPatient_SelectedFilter.ToDate = $event.toDate;
    this.ERVisit_Filter.FilterFormGroup.controls["FromDate"].setValue(this.ERPatient_SelectedFilter.FromDate);
    this.ERVisit_Filter.FilterFormGroup.controls["ToDate"].setValue(this.ERPatient_SelectedFilter.ToDate);
    this.ERVisit_Filter.FilterFormGroup.updateValueAndValidity();
    this.ValidDate = false;
  }
  ERPatientsVisitsGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "preview": {
        let selectedPatient: PatientDetails_DTO = $event.Data;
        this._selectedPatientService.SelectedPatient = selectedPatient;
        this._router.navigate(['/Clinical/Clinical-Overview']);
        break;
      }
      default:
        break;
    }
  }

  GetERPatientVisitsList() {
    let SearchText = {
      SelectedEmployeeId: this.ERPatient_SelectedFilter.SelectedEmployeeId,
      FromDate: this.ShowDate ? this.ERPatient_SelectedFilter.FromDate : null,
      ToDate: this.ShowDate ? this.ERPatient_SelectedFilter.ToDate : null,
      FilterBy: this.TriageVisitFilter
    };

    this._clinicalNoteBLService.GetERPatientVisitsList(SearchText.SelectedEmployeeId, SearchText.FromDate, SearchText.ToDate, SearchText.FilterBy).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.ERPatVisitList = res.Results;
            this.ERPatVisitList.forEach(item => {
              if (item.VisitDateTime) {
                item.VisitDate = moment(item.VisitDateTime).format('YYYY-MM-DD');
                item.VisitTime = moment(item.VisitDateTime).format('hh:mm A');
              }
            });
            this.FilterERPatients();
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['The List Is Empty.']);
            this.ERPatVisitList = [];
            this.FilteredERPatVisitList = [];
          }
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get Emergency Patient list']);
        }
      }

    );
  }

  LoadERPatientList() {
    if (this.ERVisit_Filter.FilterFormGroup && this.ERVisit_Filter.FilterFormGroup.value) {
      this.ERPatient_SelectedFilter.SelectedEmployeeId = null;
      this.ERPatient_SelectedFilter.FromDate = null;
      this.ERPatient_SelectedFilter.ToDate = null;
      this.ERPatient_SelectedFilter.SelectedEmployeeId = + this.ERVisit_Filter.FilterFormGroup.value.SelectedEmployee.EmployeeId;
      this.ERPatient_SelectedFilter.FromDate = this.ERVisit_Filter.FilterFormGroup.value.FromDate;
      this.ERPatient_SelectedFilter.ToDate = this.ERVisit_Filter.FilterFormGroup.value.ToDate;

      this.GetERPatientVisitsList();
    }

  }
  OnTriageStatusChange(status: string) {
    this.SelectedTriageStatus = status;
    this.GetERPatientVisitsList();
    //this.FilterERPatients();
  }

  FilterERPatients() {
    if (this.SelectedTriageStatus === ENUM_TriageStatus.All) {
      this.FilteredERPatVisitList = this.ERPatVisitList;
    } else {
      this.FilteredERPatVisitList = this.ERPatVisitList.filter(visit => visit.TriageStatus === this.SelectedTriageStatus);
    }
  }


}
