import { Component, OnInit } from "@angular/core";
import { Employee } from "../../../employee/shared/employee.model";
import { SecurityService } from "../../../security/shared/security.service";
import { Department } from "../../../settings-new/shared/department.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { ClinicalService } from "../../shared/clinical.service";
import { ConsultationRequestGridDTO } from "../../shared/dto/consultation-request-grid.dto";
import { Field } from "../../shared/dto/field.dto";
@Component({
  selector: "clinical-consultation-requests",
  templateUrl: "./clinical-consultation-requests.component.html"
})
export class ClinicalConsultationRequestsComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  PatientId: number = 0;
  ConsultationRequestGridColumns: typeof GridColumnSettings.prototype.ConsultationRequest;
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  ConsultationRequestList = new Array<ConsultationRequestGridDTO>();
  SelectedConsultationRequest = new ConsultationRequestGridDTO();
  ShowAddNewRequestPopup: boolean = false;
  ShowViewPrintPopup: boolean = false;
  IsNewRequest: boolean = false;
  PatientVisitId: number = 0;
  DepartmentList = new Array<Department>();
  DoctorList = new Array<Employee>();

  constructor(
    private _securityService: SecurityService,
    private _selectedPatientService: ClinicalPatientService,
    private _messageBoxService: MessageboxService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _clinicalService: ClinicalService
  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.ConsultationRequestGridColumns = colSettings.ConsultationRequest;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('RequestedOn', true), new NepaliDateInGridColumnDetail('ConsultedOn', true));
  }

  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    (async () => {
      this.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
      this.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
      this.GetConsultationRequestsByPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
      await this.GetDepartmentList();
      await this.GetDoctorList();
    })()
      .catch((error) => {
      });
  }

  public logError(err: any): void {
    console.log(err);
  }

  public async GetDepartmentList() {
    try {
      const res: DanpheHTTPResponse = await this._clinicalNoteBLService.GetAllApptDepartment().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DepartmentList = res.Results;
        this._clinicalService.SetDepartmentList(this.DepartmentList);
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DepartmentList.",
        ]);
      }
    } catch (error) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DepartmentList.",
      ]);
    }
  }

  public async GetDoctorList() {
    try {
      const res: DanpheHTTPResponse = await this._clinicalNoteBLService.GetAllAppointmentApplicableDoctor().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DoctorList = res.Results;
        this._clinicalService.SetDoctorList(this.DoctorList);
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DoctorList.",
        ]);
      }
    } catch (error) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DoctorList.",
      ]);
    }
  }

  public GetConsultationRequestsByPatientVisitId(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean): void {
    this._clinicalNoteBLService
      .GetConsultationRequestsByPatientVisitId(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.ConsultationRequestList = res.Results;
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Consultation Request List.",]);
        }
      }),
      (err) => {
        this.logError(err);
      };
  }

  public ConsultationRequestGridActions(event): void {
    switch (event.Action) {
      case "respond":
        this.SelectedConsultationRequest = event.Data;
        this.IsNewRequest = false;
        this.ShowAddNewRequestPopup = true;
        break;

      case "view":
        this.SelectedConsultationRequest = event.Data;
        this.ShowViewPrintPopup = true;
        break;

      default:
        break;
    }
  }

  public AddNewRequest(): void {
    this.IsNewRequest = true;
    this.ShowAddNewRequestPopup = true;
  }

  public AddNewRequestCallBack(data): void {
    if (data === true) {
      this.ShowAddNewRequestPopup = false;
      this.IsNewRequest = false;
      this.GetConsultationRequestsByPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
    }
  }

  public ViewPageCallBack(data): void {
    if (data === true) {
      this.ShowViewPrintPopup = false;
    }
  }

}
