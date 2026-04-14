import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Ward } from "../../../adt/shared/ward.model";
import { Department } from "../../../settings-new/shared/department.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_FilterStatusOptions, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { IPDischargedPatientsDto } from "../../shared/dto/ip-discharged-patients-dto";
import { PatientFilterParam_DTO as PatientFilterParams_DTO } from "../../shared/dto/ip-discharged-patients-filter-params.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";


@Component({
  selector: "ip-discharge-pat",
  templateUrl: "ip-discharged-patients.component.html"
})

export class IPDischargedPatient implements OnInit {
  SelectedToDate: Date;
  SelectedFromDate: Date;
  IpDischargedPatientList: Array<IPDischargedPatientsDto> = new Array<IPDischargedPatientsDto>();
  IPDischargedGridColumn: Array<any> = null;
  DepartmentList: Array<Department> = new Array<Department>();
  FilterDto: PatientFilterParams_DTO = new PatientFilterParams_DTO();
  SelectedDischargedFilter: PatientFilterParams_DTO = new PatientFilterParams_DTO();
  FilterStatusOptions = ENUM_FilterStatusOptions;
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  WardList: Array<Ward> = new Array<Ward>();

  constructor(
    private _msgBoxServ: MessageboxService,
    private _router: Router,
    private _clinicalNoteBLService: ClinicalNoteBLService,

    private _selectedPatientService: ClinicalPatientService
  ) {
    this.IPDischargedGridColumn = GridColumnSettings.DischargedPatientList;
    this.GetDepartmentList();
    this.GetDischargedPatientList();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AdmittedDate", false),
      new NepaliDateInGridColumnDetail("DischargeDate", false)
    );
    this.GetWardList();

  }
  ngOnInit(): void {
    this.FilterDto.FilterFormGroup.patchValue({
      FilterStatus: 'dischargedDate',
      DepartmentId: 0
    });
  }


  PatientFilter(): void {
    if (this.FilterDto.FilterFormGroup) {
      this.SelectedDischargedFilter = this.FilterDto.FilterFormGroup.value;
      this.SelectedDischargedFilter.WardId = + this.FilterDto.FilterFormGroup.value.SelectedWard.WardId;
      this.SelectedDischargedFilter.FromDate = this.SelectedFromDate;
      this.SelectedDischargedFilter.ToDate = this.SelectedToDate;
      this.GetDischargedPatientList();
    } else {
      console.error("filterFormGroup is undefined");
    }
  }
  GetDepartmentList() {
    this._clinicalNoteBLService.GetDepartments().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepartmentList = res.Results;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Department list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed To Get Department List Please Check The Console,${err.ErrorMessage}`]);
      }
    );
  }
  OnDateChange($event) {
    this.SelectedToDate = $event.toDate;
    this.SelectedFromDate = $event.fromDate;
  }


  GetDischargedPatientList() {
    this._clinicalNoteBLService.GetDischargedPatientsList(this.SelectedDischargedFilter.FromDate, this.SelectedDischargedFilter.ToDate, this.SelectedDischargedFilter.HospitalNumber, this.SelectedDischargedFilter.DepartmentId, this.SelectedDischargedFilter.FilterStatus, this.SelectedDischargedFilter.WardId).subscribe(
      (res: DanpheHTTPResponse) => {

        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.IpDischargedPatientList = res.Results;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get Discharged Patient list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable To Get Discharged Patient List Please Check The Console,${err.ErrorMessage}`]);
      }
    );
  }

  IpDischargedPatientGridActions($event: GridEmitModel) {
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


  GetWardList() {
    this._clinicalNoteBLService.GetWardList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.WardList = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Ward List Is Empty.']);
          }
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Ward list']);
        }
      }
    );
  }
  WardListFormatter(data: any): string {
    return data["WardName"];
  }
}
