
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Ward } from "../../../adt/shared/ward.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_Data_Type, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Doctors_DTO } from "../../shared/dto/appointmentApplicableDoctor.dto";
import { DepartmentDto } from "../../shared/dto/department.dto";
import { IPDAdmittedPatient_DTO } from "../../shared/dto/ip-admitted-patients-dto";
import { AdmFilterParam_DTO } from "../../shared/dto/ip-admitted-patients-filter-params.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";


@Component({
  selector: "ip-admitted-pat",
  templateUrl: "ip-admitted-patient.component.html"
})

export class IPAdmittedPatient {
  PatientListLength: number;
  DepartmentList: Array<DepartmentDto> = new Array<DepartmentDto>();
  FilteredDepartment: Array<DepartmentDto> = new Array<DepartmentDto>();
  FilteredDoctorList: Array<Doctors_DTO> = new Array<Doctors_DTO>();
  DoctorsList: Array<Doctors_DTO> = new Array<Doctors_DTO>();
  Filter_DTO: AdmFilterParam_DTO = new AdmFilterParam_DTO;
  SelectedAdmittedFilter: AdmFilterParam_DTO = new AdmFilterParam_DTO;
  IPAdmittedPatientList: Array<IPDAdmittedPatient_DTO> = new Array<IPDAdmittedPatient_DTO>();
  IPAdmittedPatGridColumn: typeof GridColumnSettings.AdmittedPatientList;
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  WardList: Array<Ward> = new Array<Ward>();
  constructor(private _msgBoxServ: MessageboxService,
    private _selectedPatientService: ClinicalPatientService,
    private _router: Router,
    private _clinicalNoteBLService: ClinicalNoteBLService,

  ) {
    this.IPAdmittedPatGridColumn = GridColumnSettings.AdmittedPatientList;
    this.GetDepartmentList();
    this.GetDoctorsList();
    this.GetAdmittedPatientsList();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AdmittedDate", false)
    );
    this.GetWardList();

  }
  PatientFilter(): void {
    if (this.Filter_DTO.FilterFormGroup && this.Filter_DTO.FilterFormGroup.value) {
      if (typeof (this.Filter_DTO.FilterFormGroup.value.SelectedDepartment) === ENUM_Data_Type.Object) {
        this.SelectedAdmittedFilter.SelectedDepartmentId = + this.Filter_DTO.FilterFormGroup.value.SelectedDepartment.DepartmentId;
      }
      else if (typeof (this.Filter_DTO.FilterFormGroup.value.SelectedDepartment) === ENUM_Data_Type.String) {
        let selectedDepartmentString = this.Filter_DTO.FilterFormGroup.value.SelectedDepartment;
        if (selectedDepartmentString && this.DepartmentList && this.DepartmentList.length > 0) {
          let selectedDepartmentObj = this.DepartmentList.find(a => a.DepartmentName === selectedDepartmentString);
          if (selectedDepartmentObj) {
            this.SelectedAdmittedFilter.SelectedDepartmentId = selectedDepartmentObj.DepartmentId;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['There is no department associated with that selected Doctor.']);
          }
        }
      }
      this.SelectedAdmittedFilter.SelectedEmployeeId = + this.Filter_DTO.FilterFormGroup.value.SelectedEmployee.EmployeeId;
      this.SelectedAdmittedFilter.SelectedWardId = + this.Filter_DTO.FilterFormGroup.value.SelectedWard.WardId;

      this.GetAdmittedPatientsList();

    } else {
      console.error("filterFormGroup is undefined");
    }
  }

  DepartmentListFormatter(data: any): string {
    return data["DepartmentName"];
  }
  FormatSelectedDepartment(department: any): string {
    if (!department) {
      return '';
    }
    if (typeof department === ENUM_Data_Type.String) {
      return department;
    }
    return department.DepartmentName || '';
  }

  DoctorListFormatter(data: any): string {
    return data["FullName"];
  }

  GetAdmittedPatientsList() {
    this._clinicalNoteBLService.GetAdmittedPatientsList(this.SelectedAdmittedFilter.SelectedDepartmentId, this.SelectedAdmittedFilter.SelectedEmployeeId, this.SelectedAdmittedFilter.SelectedWardId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.IPAdmittedPatientList = res.Results;
          this.PatientListLength = this.IPAdmittedPatientList.length;
          this.SelectedAdmittedFilter.SelectedDepartmentId = null;
          this.SelectedAdmittedFilter.SelectedEmployeeId = null;
          this.SelectedAdmittedFilter.SelectedWardId = null;

        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get Admitted Patient list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable To Get Admitted Patient List Please Check The Console.`]);
        console.log(err);
      }
    );
  }
  GetDepartmentList() {
    this._clinicalNoteBLService.GetDepartmentsList().subscribe(
      (res: DanpheHTTPResponse) => {

        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepartmentList = res.Results;
          this.FilteredDepartment = this.DepartmentList;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Department list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed To Get Department List Please Check The Console,${err.ErrorMessage}`]);
      }
    );
  }
  GetDoctorsList() {
    this._clinicalNoteBLService.GetDoctorsList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DoctorsList = res.Results;
          this.FilteredDoctorList = this.DoctorsList;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Doctors list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed To Get Department List Please Check The Console.`]);
        console.log(err);
      }

    );
  }
  GetFilteredDoctorList() {
    let selectedDepartment = this.Filter_DTO.FilterFormGroup.get('SelectedDepartment').value;
    if (selectedDepartment && selectedDepartment.DepartmentId && this.DoctorsList && this.DoctorsList.length > 0) {
      this.FilteredDoctorList = this.DoctorsList.filter(a => a.DepartmentId === selectedDepartment.DepartmentId);
    }
    else {
      this.FilteredDoctorList = this.DoctorsList;
    }
  }
  GetFilteredDepartmentList() {
    let selectedDoctor = this.Filter_DTO.FilterFormGroup.get('SelectedEmployee').value;
    if (selectedDoctor && this.DepartmentList && this.DepartmentList.length > 0) {
      let FilteredDepartment = this.DepartmentList.find(a => a.DepartmentId === selectedDoctor.DepartmentId);
      if (FilteredDepartment) {
        const formattedDepartment = this.FormatSelectedDepartment(FilteredDepartment);
        this.Filter_DTO.FilterFormGroup.get('SelectedDepartment').setValue(formattedDepartment);
      } else {
        this.Filter_DTO.FilterFormGroup.get('SelectedDepartment').setValue('');
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['The selected doctor has no department.']);
      }
    }
  }
  IpAdmittedPatientGridActions($event: GridEmitModel) {
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


