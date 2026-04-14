import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import * as moment from "moment";
import { Employee } from "../../../../employee/shared/employee.model";
import { SecurityService } from "../../../../security/shared/security.service";
import { User } from "../../../../security/shared/user.model";
import { Department } from "../../../../settings-new/shared/department.model";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import {
  ENUM_ConsultationRequestStatus,
  ENUM_DanpheHTTPResponses,
  ENUM_Data_Type,
  ENUM_MessageBox_Status,
} from "../../../../shared/shared-enums";

import { ConsultationRequestModel } from "../../../../nursing/shared/consultation-request.model";
import { ClinicalPatientService } from "../../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { ClinicalService } from "../../../shared/clinical.service";
import { ConsultationRequestGridDTO } from "../../../shared/dto/consultation-request-grid.dto";
import { PatientDetails_DTO } from "../../../shared/dto/patient-cln-detail.dto";


@Component({
  selector: "clinical-new-request",
  templateUrl: "./clinical-new-request.component.html",
  host: { "(window:keydown)": "hotkeys($event)" },
})
export class ClinicalNewRequestComponent implements OnInit {
  @Input("ShowAddNewRequestPopup")
  ShowAddNewRequestPopup: boolean = false;

  @Input("IsNewRequest")
  IsNewRequest: boolean = false;

  @Input("SelectedConsultationRequest")
  SelectedConsultationRequest: ConsultationRequestGridDTO = new ConsultationRequestGridDTO();

  @Output("OnAddNewRequestPopupClose")
  HideAddNewRequestPopup: EventEmitter<boolean> = new EventEmitter<boolean>();
  ConsultationRequest = new ConsultationRequestModel();
  DepartmentList = new Array<Department>();
  DoctorList = new Array<Employee>();
  FilteredConsultingDoctorList = new Array<Employee>();
  FilteredRequestingDoctorList = new Array<Employee>();
  SelectedRequestToDepartment = new Department();
  SelectedRequestToDoctor = new Employee();
  SelectedRequestingDepartment = new Department();
  SelectedRequestingDoctor = new Employee();
  SelectedConsultingDepartment = new Department();
  SelectedConsultingDoctor = new Employee();
  Loading: boolean = false;
  IsValid: boolean = false;
  ValidationMessage = Array<string>();
  CurrentUser: User = new User();
  SelectedPatient = new PatientDetails_DTO();
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    private _selectedPatientService: ClinicalPatientService,
    private _clinicalService: ClinicalService,
    public securityService: SecurityService
  ) { }

  ngOnInit() {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    this.DepartmentList = this._clinicalService.GetDepartmentList();
    this.DoctorList = this._clinicalService.GetDoctorList();
    this.FilteredConsultingDoctorList = this.DoctorList;
    this.FilteredRequestingDoctorList = this.DoctorList;
    this.ConsultationRequest.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
    this.ConsultationRequest.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    this.ConsultationRequest.WardId = Number(this._selectedPatientService.SelectedPatient.WardId);
    this.ConsultationRequest.BedId = this._selectedPatientService.SelectedPatient.BedId;

    if (this.IsNewRequest) {
      this.ConsultationRequest.RequestedOn = moment().format('YYYY-MM-DD hh:mm A');
      this.CurrentUser = this.securityService.GetLoggedInUser() as User;
      if (this.CurrentUser && this.CurrentUser.Employee) {
        this.SelectedRequestingDoctor = this.DoctorList.find(emp => emp.EmployeeId === this.CurrentUser.Employee.EmployeeId);
        this.SelectedRequestingDepartment = this.DepartmentList.find(dept => dept.DepartmentId === this.CurrentUser.Employee.DepartmentId);
      }
    }

    else if (!this.IsNewRequest) {
      this.SelectedRequestToDepartment = this.DepartmentList.find(d => d.DepartmentId === this.SelectedConsultationRequest.ConsultingDepartmentId);
      this.SelectedRequestToDoctor = this.DoctorList.find(d => d.EmployeeId === this.SelectedConsultationRequest.ConsultingDoctorId);
      this.SelectedRequestingDepartment = this.DepartmentList.find(d => d.DepartmentId === this.SelectedConsultationRequest.RequestingDepartmentId);
      this.SelectedRequestingDoctor = this.DoctorList.find(d => d.EmployeeId === this.SelectedConsultationRequest.RequestingConsultantId);
      this.SelectedConsultingDepartment = this.DepartmentList.find(d => d.DepartmentId === this.SelectedConsultationRequest.ConsultingDepartmentId);
      this.SelectedConsultingDoctor = this.DoctorList.find(d => d.EmployeeId === this.SelectedConsultationRequest.ConsultingDoctorId);
      this.ConsultationRequest.ConsultationRequestId = this.SelectedConsultationRequest.ConsultationRequestId;
      this.ConsultationRequest.PurposeOfConsultation = this.SelectedConsultationRequest.PurposeOfConsultation;
      this.ConsultationRequest.RequestedOn = this.SelectedConsultationRequest.RequestedOn;
      this.ConsultationRequest.ConsultingDepartmentId = this.SelectedConsultationRequest.ConsultingDepartmentId;
      this.ConsultationRequest.ConsultingDoctorId = this.SelectedConsultationRequest.ConsultingDoctorId;
      this.ConsultationRequest.RequestingDepartmentId = this.SelectedConsultationRequest.ConsultingDepartmentId;
      this.ConsultationRequest.RequestingConsultantId = this.SelectedConsultationRequest.ConsultingDoctorId;
      this.ConsultationRequest.ConsultedOn = moment().format('YYYY-MM-DD hh:mm');
    }
  }

  public logError(err: any): void {
    console.log(err);
  }

  public hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseAddNewRequestPopup();
    }
  }

  public CloseAddNewRequestPopup() {
    this.ConsultationRequest = new ConsultationRequestModel();
    this.ShowAddNewRequestPopup = false;
    this.HideAddNewRequestPopup.emit(true);
  }

  public AddNewRequest(): void {
    this.Loading = true;
    this.CheckValidationsForNewRequest();
    if (!this.IsValid) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, this.ValidationMessage);
      this.Loading = false;
      return;
    }
    this.ConsultationRequest.Status = ENUM_ConsultationRequestStatus.Requested;
    this.ConsultationRequest.IsActive = true;
    this._clinicalNoteBLService.AddNewConsultationRequest(this.ConsultationRequest)
      .finally(() => {
        this.Loading = false;
      })
      .subscribe((res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['New Consultation Request has been created successfully']);
          this.CloseAddNewRequestPopup();
        } else {
          if (res.ErrorMessage) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to create New Consultation Request.']);
          }
        }
      });
  }

  public ResponseConsultationRequest(): void {
    this.Loading = true;
    this.CheckValidationsForResponseRequest();
    if (!this.IsValid) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, this.ValidationMessage);
      this.Loading = false;
      return;
    }
    this.ConsultationRequest.Status = ENUM_ConsultationRequestStatus.Consulted;
    this._clinicalNoteBLService.ResponseConsultationRequest(this.ConsultationRequest)
      .finally(() => {
        this.Loading = false;
      })
      .subscribe((res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Consultation Response has been created successfully']);
          this.CloseAddNewRequestPopup();
        } else {
          if (res.ErrorMessage) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to response to Consultation Request.']);
          }
        }
      });
  }

  public DiscardChanges(): void {
    switch (this.IsNewRequest) {
      case true:
        this.SelectedRequestToDepartment = new Department();
        this.SelectedRequestToDoctor = new Employee();
        this.SelectedRequestingDepartment = new Department();
        this.SelectedRequestingDoctor = new Employee();
        this.ConsultationRequest.PurposeOfConsultation = null;
        break;

      case false:
        this.ConsultationRequest.ConsultantResponse = null;
        break;

      default:
        break;
    }
  }

  public DepartmentListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }

  public DoctorListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }

  public OnConsultingDoctorChange(data: Employee): void {
    if (data !== null && data.EmployeeId) {
      this.ConsultationRequest.ConsultingDoctorId = data.EmployeeId;
      if (this.IsNewRequest) {
        this.SelectedRequestToDepartment = this.DepartmentList.find(d => d.DepartmentId === data.DepartmentId);
        if (this.SelectedRequestToDepartment && this.SelectedRequestToDepartment.DepartmentId) {
          this.ConsultationRequest.ConsultingDepartmentId = this.SelectedRequestToDepartment.DepartmentId;
        }
      }
      else {
        this.SelectedConsultingDepartment = this.DepartmentList.find(d => d.DepartmentId === data.DepartmentId);
        if (this.SelectedConsultingDepartment && this.SelectedConsultingDepartment.DepartmentId) {
          this.ConsultationRequest.ConsultingDepartmentId = this.SelectedRequestToDepartment.DepartmentId;
        }
      }
    }
  }

  public OnConsultingDepartmentChange(data: Department): void {
    if (data !== null) {
      this.ConsultationRequest.ConsultingDepartmentId = data.DepartmentId;
    }
  }

  public OnRequestingDoctorChange(data: Employee): void {
    if (data !== null && data.EmployeeId) {
      this.ConsultationRequest.RequestingConsultantId = data.EmployeeId;
      this.SelectedRequestingDepartment = this.DepartmentList.find(d => d.DepartmentId === data.DepartmentId);
      if (this.SelectedRequestingDepartment && this.SelectedRequestingDepartment.DepartmentId) {
        this.ConsultationRequest.RequestingDepartmentId = this.SelectedRequestingDepartment.DepartmentId;
      }
    }
  }

  public OnRequestingDepartmentChange(data: Department): void {
    if (data !== null) {
      this.ConsultationRequest.RequestingDepartmentId = data.DepartmentId;
    }
  }

  public FilterConsultingDoctorList(): void {
    if ((typeof (this.SelectedConsultingDepartment) === ENUM_Data_Type.Object || typeof (this.SelectedRequestToDepartment) === ENUM_Data_Type.Object)
      && this.SelectedConsultingDepartment.DepartmentId || this.SelectedRequestToDepartment.DepartmentId) {
      let filteredDocList;
      if (this.SelectedConsultingDepartment.DepartmentId) {
        filteredDocList = this.DoctorList.filter(data => data.DepartmentId === this.SelectedConsultingDepartment.DepartmentId);
      }
      else {
        filteredDocList = this.DoctorList.filter(data => data.DepartmentId === this.SelectedRequestToDepartment.DepartmentId);
      }
      if (filteredDocList) {
        this.FilteredConsultingDoctorList = filteredDocList;
      }
      else {
        this.FilteredConsultingDoctorList = this.DoctorList;
      }
    }
    else {
      this.FilteredConsultingDoctorList = this.DoctorList;
      this.ConsultationRequest.ConsultingDepartmentId = 0;
    }
    if (this.IsNewRequest) {
      this.SelectedRequestToDoctor = null;
    }
    else {
      this.SelectedRequestingDoctor = null;
    }
    this.ConsultationRequest.ConsultingDoctorId = 0;
  }

  public FilterRequestingDoctorList(): void {
    if ((typeof (this.SelectedRequestingDepartment) === ENUM_Data_Type.Object) && this.SelectedRequestingDepartment.DepartmentId) {
      let filteredDocList = this.DoctorList.filter(data => data.DepartmentId === this.SelectedRequestingDepartment.DepartmentId);
      if (filteredDocList) {
        this.FilteredRequestingDoctorList = filteredDocList;
      }
      else {
        this.FilteredRequestingDoctorList = this.DoctorList;
      }
    }
    else {
      this.FilteredRequestingDoctorList = this.DoctorList;
      this.ConsultationRequest.RequestingDepartmentId = 0;
    }
    this.SelectedRequestingDoctor = null;
    this.ConsultationRequest.RequestingConsultantId = 0;
  }

  public CheckValidationsForNewRequest(): boolean {
    this.IsValid = true;
    this.ValidationMessage = new Array<string>();
    if (this.ConsultationRequest.ConsultingDoctorId
      && this.ConsultationRequest.RequestingConsultantId
      && this.ConsultationRequest.ConsultingDoctorId === this.ConsultationRequest.RequestingConsultantId) {
      this.IsValid = false;
      this.ValidationMessage.push("Consulting Doctor and Requesting Doctor can't be same.");
    }
    if (!this.ConsultationRequest.ConsultingDepartmentId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Consulting Department.");
    }
    if (!this.ConsultationRequest.ConsultingDoctorId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Consulting Doctor.");
    }
    if (!this.ConsultationRequest.PurposeOfConsultation || !this.ConsultationRequest.PurposeOfConsultation.trim()) {
      this.IsValid = false;
      this.ValidationMessage.push("Include Purpose of Consult.");
    }
    if (!this.ConsultationRequest.RequestingDepartmentId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Requesting Department.");
    }
    if (!this.ConsultationRequest.RequestingConsultantId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Requesting Doctor.");
    }
    return this.IsValid;
  }

  public CheckValidationsForResponseRequest(): boolean {
    this.IsValid = true;
    this.ValidationMessage = new Array<string>();
    if (!this.ConsultationRequest.ConsultingDepartmentId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Consulting Department.");
    }
    if (!this.ConsultationRequest.ConsultingDoctorId) {
      this.IsValid = false;
      this.ValidationMessage.push("Select Consulting Doctor.");
    }
    if (!this.ConsultationRequest.ConsultantResponse || !this.ConsultationRequest.ConsultantResponse.trim()) {
      this.IsValid = false;
      this.ValidationMessage.push("Include Consultant Response.");
    }
    return this.IsValid;
  }

  public CheckConsultingDoctor(): void {
    if (typeof (this.SelectedRequestToDoctor) === 'string') {
      // this.SelectedRequestToDoctor = null;
      this.ConsultationRequest.ConsultingDoctorId = 0;
    }
    let filteredDocList = this.DoctorList.filter(data => data.DepartmentId === this.SelectedRequestToDepartment.DepartmentId);
    if (filteredDocList) {
      this.FilteredConsultingDoctorList = filteredDocList;
    }
    else {
      this.FilteredConsultingDoctorList = this.DoctorList;
    }
  }
  public CheckRequestingDoctor(): void {
    if (typeof (this.SelectedRequestingDoctor) === 'string') {
      // this.SelectedRequestingDoctor = null;
      this.ConsultationRequest.RequestingConsultantId = 0;
    }
    let filteredDocList = this.DoctorList.filter(data => data.DepartmentId === this.SelectedRequestingDepartment.DepartmentId);
    if (filteredDocList) {
      this.FilteredRequestingDoctorList = filteredDocList;
    }
    else {
      this.FilteredRequestingDoctorList = this.DoctorList;
    }
  }
}
