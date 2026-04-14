import { Component } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { forkJoin } from "rxjs";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_Data_Type, ENUM_MessageBox_Status, ENUM_VisitDateFilter } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteDLService } from "../../shared/clinical.dl.service";
import { Doctors_DTO } from "../../shared/dto/appointmentApplicableDoctor.dto";
import { DepartmentDto } from "../../shared/dto/department.dto";
import { OPDPatVisitsParam_DTO } from "../../shared/dto/op-pat-visits-params.dto";
import { OPDPatientVisit_DTO } from "../../shared/dto/op-pat-visits.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";

@Component({
  selector: "opd-pat-visit",
  templateUrl: "opd-patient-visit.component.html"
})

export class OPDPatientVisit {
  SearchPatientUsingHospitalNo: boolean = false;
  IsHospitalNoSearch: boolean = false;
  DepartmentList: Array<DepartmentDto> = new Array<DepartmentDto>();
  FilteredDepartment: Array<DepartmentDto> = new Array<DepartmentDto>();
  FilteredDoctorList: Array<Doctors_DTO> = new Array<Doctors_DTO>();
  DoctorsList: Array<Doctors_DTO> = new Array<Doctors_DTO>();
  OPDPatVisitList: Array<OPDPatientVisit_DTO> = new Array<OPDPatientVisit_DTO>();
  Pat_Visit_Filter_DTO: OPDPatVisitsParam_DTO = new OPDPatVisitsParam_DTO;
  Pat_Visit_SelectedFilter_DTO: OPDPatVisitsParam_DTO = new OPDPatVisitsParam_DTO;
  OPDPatVisitsGridColumn: typeof GridColumnSettings.PatientVisitsList;
  ShowDate: Boolean = true;
  HospitalNumber: string = '';
  ValidDate: boolean = false;
  DateRange: string = null;
  ShowCustomDateRange: boolean = false;
  LockDepartment: boolean = true;
  LockedDepartmentId: number = 0;
  LockDoctor: boolean = true;
  LockedDoctorId: number = 0;
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  HasOverridePermission: boolean = false;

  constructor(private _msgBoxServ: MessageboxService,
    private _clinicalNoteDLSerivce: ClinicalNoteDLService,
    public _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
    private _router: Router,
    private _securityService: SecurityService
  ) {
    this.OPDPatVisitsGridColumn = GridColumnSettings.PatientVisitsList;
    this.getParamter();
    this.LoadData();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AppointmentDate", false)
    );
  }

  FilterBasedOnClinicalPatientListConfig(): void {
    let logedInUser = this._securityService.loggedInUser;
    this.HasOverridePermission = this._securityService.HasPermission("btn-clinical-outpatient-allpatient");
    if (logedInUser.IsSystemAdmin || this.HasOverridePermission) {
      this.LockDepartment = false;
      this.LockDoctor = false;
      return;
    }

    if (!this.DoctorsList)
      this.DoctorsList = [];

    let currentUserInDoctorList = this.DoctorsList.find(doctor => doctor.EmployeeId === logedInUser.EmployeeId);
    if (!currentUserInDoctorList) {
      this.LockDepartment = true;
      this.LockDoctor = true;
      return;
    }

    let ClinicalPatientListConfigValue;
    let ClinicalPatientListConfig = this._coreService.Parameters.find(a => a.ParameterGroupName === 'Clinical' && a.ParameterName === 'ClinicalPatientListConfig');
    if (ClinicalPatientListConfig && ClinicalPatientListConfig.ParameterValue) {
      ClinicalPatientListConfigValue = JSON.parse(ClinicalPatientListConfig.ParameterValue);
    }

    if (ClinicalPatientListConfigValue) {
      if (ClinicalPatientListConfigValue.LockByDoctor) {
        //Both the 'Doctor' and 'Department' dropdowns will be locked to the current logged-in doctor's values, irrespective of the LockByDepartment setting
        this.LockDepartment = true;
        this.LockDoctor = true;
        let selectedDepartmentId = currentUserInDoctorList.DepartmentId;
        if (selectedDepartmentId && this.DoctorsList && this.DoctorsList.length > 0) {
          let department = this.FilteredDepartment.find(dept => dept.DepartmentId === selectedDepartmentId);
          this.LockedDepartmentId = department.DepartmentId;
          this.Pat_Visit_Filter_DTO.FilterFormGroup.patchValue({ 'SelectedDepartment': this.FormatSelectedDepartment(department) });
          this.FilteredDoctorList = this.DoctorsList.filter(a => a.DepartmentId === selectedDepartmentId);
        }
        else {
          this.FilteredDoctorList = this.DoctorsList;
        }
        let selectedDoctor = this.FilteredDoctorList.find(doc => doc.EmployeeId === currentUserInDoctorList.EmployeeId);
        if (selectedDoctor) {
          this.LockedDoctorId = selectedDoctor.EmployeeId;
          this.Pat_Visit_Filter_DTO.FilterFormGroup.patchValue({ 'SelectedEmployee': selectedDoctor.FullName });
        }

      } else if (!ClinicalPatientListConfigValue.LockByDoctor && ClinicalPatientListConfigValue.LockByDepartment) {
        //the 'Department' filter will be locked to the doctor's department, but the 'Doctor' dropdown will be accessible for selecting any active doctor within that department.
        this.LockDepartment = true;
        this.LockDoctor = false;
        let selectedDepartmentId = currentUserInDoctorList.DepartmentId;
        if (selectedDepartmentId && this.DoctorsList && this.DoctorsList.length > 0) {
          let department = this.FilteredDepartment.find(dept => dept.DepartmentId === selectedDepartmentId);
          this.LockedDepartmentId = department.DepartmentId;
          this.Pat_Visit_Filter_DTO.FilterFormGroup.patchValue({ 'SelectedDepartment': this.FormatSelectedDepartment(department) });
          this.FilteredDoctorList = this.DoctorsList.filter(a => a.DepartmentId === selectedDepartmentId);
        }
        else {
          this.FilteredDoctorList = this.DoctorsList;
        }
      } else {
        //both 'Doctor' and 'Department' filters will be fully accessible, allowing the user to select any available option.
        this.LockDepartment = false;
        this.LockDoctor = false;
      }
    }

  }

  IsDateCheck() {
    this.ShowDate = !this.ShowDate;
  }
  PatientFilter() {
    if (this.Pat_Visit_Filter_DTO.FilterFormGroup && this.Pat_Visit_Filter_DTO.FilterFormGroup.value) {
      this.Pat_Visit_SelectedFilter_DTO.SelectedDepartmentId = null;
      this.Pat_Visit_SelectedFilter_DTO.SelectedEmployeeId = null;
      this.Pat_Visit_SelectedFilter_DTO.FromDate = null;
      this.Pat_Visit_SelectedFilter_DTO.ToDate = null;
      if (this.LockDepartment)
        this.Pat_Visit_SelectedFilter_DTO.SelectedDepartmentId = this.LockedDepartmentId;
      else
        if (typeof (this.Pat_Visit_Filter_DTO.FilterFormGroup.value.SelectedDepartment) === ENUM_Data_Type.Object) {
          this.Pat_Visit_SelectedFilter_DTO.SelectedDepartmentId = + this.Pat_Visit_Filter_DTO.FilterFormGroup.value.SelectedDepartment.DepartmentId;
        }
        else if (typeof (this.Pat_Visit_Filter_DTO.FilterFormGroup.value.SelectedDepartment) === ENUM_Data_Type.String) {
          let selectedDepartmentString = this.Pat_Visit_Filter_DTO.FilterFormGroup.value.SelectedDepartment;
          if (selectedDepartmentString && this.DepartmentList && this.DepartmentList.length > 0) {
            let selectedDepartmentObj = this.DepartmentList.find(a => a.DepartmentName === selectedDepartmentString);
            if (selectedDepartmentObj) {
              this.Pat_Visit_SelectedFilter_DTO.SelectedDepartmentId = selectedDepartmentObj.DepartmentId;
            }
            else {
              this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['There is no department associated with that selected Doctor.']);
            }
          }
        }
      if (this.LockDoctor)
        this.Pat_Visit_SelectedFilter_DTO.SelectedEmployeeId = this.LockedDoctorId;
      else
        this.Pat_Visit_SelectedFilter_DTO.SelectedEmployeeId = + this.Pat_Visit_Filter_DTO.FilterFormGroup.value.SelectedEmployee.EmployeeId;
      this.Pat_Visit_SelectedFilter_DTO.FromDate = this.Pat_Visit_Filter_DTO.FilterFormGroup.value.FromDate;
      this.Pat_Visit_SelectedFilter_DTO.ToDate = this.Pat_Visit_Filter_DTO.FilterFormGroup.value.ToDate;
      this.HospitalNumber = '';
      this.IsHospitalNoSearch = false;
      this.GetPatientVisitsList();

    } else {
      console.error("filterFormGroup is undefined");
    }

  }

  GetPatientVisitsList() {

    let SearchText = {
      SelectedDepartmentId: this.Pat_Visit_SelectedFilter_DTO.SelectedDepartmentId,
      SelectedEmployeeId: this.Pat_Visit_SelectedFilter_DTO.SelectedEmployeeId,
      FromDate: this.ShowDate ? this.Pat_Visit_SelectedFilter_DTO.FromDate : null,
      ToDate: this.ShowDate ? this.Pat_Visit_SelectedFilter_DTO.ToDate : null
    };

    this._clinicalNoteDLSerivce.GetPatientVisitsList(this.HospitalNumber, this.IsHospitalNoSearch, SearchText.SelectedDepartmentId, SearchText.SelectedEmployeeId, SearchText.FromDate, SearchText.ToDate).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.OPDPatVisitList = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['The List Is Empty.']);
            this.OPDPatVisitList = [];
          }
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get Patient Visits list']);
        }
      },
      (err) => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable To Get  Patient Visits List Please Check The Console.`]);
        console.log(err);
      }
    );
  }

  DepartmentListFormatter(data: any): string {
    return data["DepartmentName"];
  }
  DoctorListFormatter(data: any): string {
    return data["FullName"];
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
  AssignFilteredDepartment() {
    let selectedDoctor = this.Pat_Visit_Filter_DTO.FilterFormGroup.get('SelectedEmployee').value;
    if (selectedDoctor && this.DepartmentList && this.DepartmentList.length > 0) {
      let FilteredDepartment = this.DepartmentList.find(a => a.DepartmentId === selectedDoctor.DepartmentId);
      if (FilteredDepartment) {
        const formattedDepartment = this.FormatSelectedDepartment(FilteredDepartment);
        this.Pat_Visit_Filter_DTO.FilterFormGroup.get('SelectedDepartment').setValue(formattedDepartment);
      } else {
        this.Pat_Visit_Filter_DTO.FilterFormGroup.get('SelectedDepartment').setValue('');
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['The selected doctor has no department.']);
      }
    }
  }
  AssignFilteredDoctorList() {
    let selectedDepartment = this.Pat_Visit_Filter_DTO.FilterFormGroup.get('SelectedDepartment').value;
    if (selectedDepartment && selectedDepartment.DepartmentId && this.DoctorsList && this.DoctorsList.length > 0) {
      this.FilteredDoctorList = this.DoctorsList.filter(a => a.DepartmentId === selectedDepartment.DepartmentId);
    }
    else {
      this.FilteredDoctorList = this.DoctorsList;
    }
  }

  isStringJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  serverSearchTxt(SearchTxt) {
    let SearchTextData = SearchTxt;
    if (this.isStringJson(SearchTextData)) {
      SearchTextData = JSON.parse(SearchTextData);
      this.HospitalNumber = SearchTextData.text || '';
      this.IsHospitalNoSearch = SearchTextData.searchUsingHospitalNo || false;
    } else {
      this.HospitalNumber = SearchTextData || '';
      this.IsHospitalNoSearch = false;
    }
    this.GetPatientVisitsList();
  }

  getParamter() {
    let parameterToSearchUsingHospNo = this._coreService.Parameters.find(a => a.ParameterGroupName == "Appointment" && a.ParameterName == "SearchPatientUsingHospitalNo");
    if (parameterToSearchUsingHospNo) {
      let obj = JSON.parse(parameterToSearchUsingHospNo.ParameterValue);
      this.SearchPatientUsingHospitalNo = obj.SearchPatientUsingHospitalNumber;
      this.IsHospitalNoSearch = false;
    }
  }

  onDateChange($event) {
    this.Pat_Visit_SelectedFilter_DTO.FromDate = $event.fromDate;
    this.Pat_Visit_SelectedFilter_DTO.ToDate = $event.toDate;
    this.Pat_Visit_Filter_DTO.FilterFormGroup.controls["FromDate"].setValue(this.Pat_Visit_SelectedFilter_DTO.FromDate);
    this.Pat_Visit_Filter_DTO.FilterFormGroup.controls["ToDate"].setValue(this.Pat_Visit_SelectedFilter_DTO.ToDate);
    this.Pat_Visit_Filter_DTO.FilterFormGroup.updateValueAndValidity();
    this.ValidDate = false;
  }

  OpdPatientsVisitsGridActions($event: GridEmitModel) {
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
  GetTodayVisits() {
    const fromDate = moment().startOf('day').format('YYYY-MM-DD');
    const toDate = moment().endOf('day').format('YYYY-MM-DD');
    this.Pat_Visit_Filter_DTO.FilterFormGroup.patchValue({
      FromDate: fromDate,
      ToDate: toDate
    });
    this.PatientFilter();
  }

  /**
* @summary Handles the change event for the Visit Date dropdown.
* Toggles the visibility of the custom date range picker based on the selected value.
* If "Today" is selected, it fetches today's visits.
* If "Custom" is selected, it resets the custom date range fields.
* @param event The change event triggered by selecting an option in the Visit Date dropdown.
*/
  OnVisitDateChange(event) {
    const selectedValue = event.target.value;
    this.ShowCustomDateRange = selectedValue === ENUM_VisitDateFilter.Custom;
    if (selectedValue === ENUM_VisitDateFilter.Today) {
      this.GetTodayVisits();
    }
    else if (selectedValue === ENUM_VisitDateFilter.Custom) {
      this.Pat_Visit_Filter_DTO.FilterFormGroup.patchValue({
        FromDate: null,
        ToDate: null,
      });
    }
  }

  LoadData() {
    const departmentList$ = this._clinicalNoteDLSerivce.GetDepartmentsList();
    const doctorsList$ = this._clinicalNoteDLSerivce.GetDoctorsList();

    forkJoin([departmentList$, doctorsList$]).subscribe(
      ([departmentRes, doctorsRes]: [DanpheHTTPResponse, DanpheHTTPResponse]) => {
        // Handle departments
        if (departmentRes.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepartmentList = departmentRes.Results;
          this.FilteredDepartment = this.DepartmentList;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Department list']);
        }

        // Handle doctors
        if (doctorsRes.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DoctorsList = doctorsRes.Results;
          this.FilteredDoctorList = this.DoctorsList;
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Doctors list']);
        }

        this.FilterBasedOnClinicalPatientListConfig();
        this.GetTodayVisits();
      },
      (err) => {
        // Handle errors
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to load data. Please check the console.`]);
        console.log(err);
      }
    );
  }
}
