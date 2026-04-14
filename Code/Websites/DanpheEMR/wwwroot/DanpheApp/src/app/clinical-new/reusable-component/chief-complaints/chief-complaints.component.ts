import { ChangeDetectorRef, Component } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CoreService } from "../../../../app/core/shared/core.service";
import { SecurityService } from "../../../../app/security/shared/security.service";
import { GridEmitModel } from "../../../../app/shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../../app/shared/danphe-grid/settings-grid-column-settings";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_ChiefComplaint_Unit, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { ChiefComplaints_DTO } from "../../shared/dto/chief-complaints.dto";
import { Field } from "../../shared/dto/field.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";
import { PatientComplaints_DTO } from "../../shared/dto/patient-complaints.dto";

@Component({
  selector: "chief-complaints",
  templateUrl: "./chief-complaints.component.html",
})
export class ChiefComplaintsComponent {

  ChiefComplaintComponentGridColumns: typeof SettingsGridColumnSettings.prototype.ChiefComplaintGridColumns;
  SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;

  Update: boolean = false;
  SelectedComplaintId;
  Units = Object.values(ENUM_ChiefComplaint_Unit);
  CLNChiefComplainsList = new Array<ChiefComplaints_DTO>();
  PatientComplaint = new PatientComplaints_DTO();
  SelectedPatient = new PatientDetails_DTO();
  Complaints_DTO = new PatientComplaints_DTO();
  PatientComplaintForm: FormGroup = null;
  PatientComplaintList = new Array<PatientComplaints_DTO>();
  SelectedComplaint = new PatientComplaints_DTO();
  SelectedChiefComplaint: any;
  PatientId: number = 0;
  PatientVisitId: number = 0;
  SelectedItem = new PatientComplaints_DTO();
  IsComplaintSelected: boolean = false;
  IsFullscreen: boolean = false;
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;


  constructor(
    private formBuilder: FormBuilder,
    public coreService: CoreService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef,
    private _selectedPatientService: ClinicalPatientService,
    private _messageBoxService: MessageboxService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
  ) {
    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(
      this.coreService.taxLabel,
      this.securityService
    );
    this.ChiefComplaintComponentGridColumns = this.SetCLNHeadingGridColumns.ChiefComplaintGridColumns;
    this.GetChiefComplains();
  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.PatientComplaintForm = this.formBuilder.group({
      'ChiefComplainId': [null],
      'Duration': [''],
      'DurationType': [''],
      'Notes': ['']
    });

    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient) {
      this.PatientId = this.SelectedPatient.PatientId;
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    }
    this.GetPatientComplaint();

  }
  public GetChiefComplains() {
    this._clinicalNoteBLService.GetChiefComplains()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.CLNChiefComplainsList = res.Results;

            } else {
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! for chief complains']);
            }

          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Chief complains, check log for details']);
          }

        });
  }

  GetPatientComplaint(): void {
    this._clinicalNoteBLService.GetPatientComplaint(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability)
      .subscribe(
        (res: DanpheHTTPResponse): void => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.PatientComplaintList = res.Results;
            } else {
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! For Patient Complaints']);
            }

          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Patient Complaint, check log for details']);
          }

        });
  }

  OnComplaintSelected(selectedComplaint) {
    if (!selectedComplaint) {
      this.PatientComplaintForm.patchValue({
        ChiefComplainId: null,
        Duration: '',
        DurationType: '',
      });
      this.IsComplaintSelected = false;

    } else {
      this.PatientComplaintForm.patchValue({
        ChiefComplainId: selectedComplaint.ChiefComplainId,
      });
      this.IsComplaintSelected = true;
    }
    if (selectedComplaint.ChiefComplainId === null) {
      this.IsComplaintSelected = false;
    }

  }
  ChiefComplaintsComponentGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.Update = true;
        this.SelectedComplaint = $event.Data;
        this.SelectedChiefComplaint = this.CLNChiefComplainsList.find(
          x => x.ChiefComplainId === this.SelectedComplaint.ChiefComplainId
        );
        if (this.SelectedComplaint.ChiefComplainId === null) {
          this.IsComplaintSelected = false;
        }
        this.changeDetector.detectChanges();
        this.SelectedComplaintId = this.SelectedComplaint.ComplaintId;
        this.SetPatientComplaint();
        this.OnComplaintSelected(this.SelectedComplaint);

        break;
      }

      case "delete": {
        this.SelectedItem = $event.Data;
        this.DeactivatePatientComplaint(this.SelectedItem);
        break;
      }
      default:
        break;
    }
  }
  DeactivatePatientComplaint(selectedItem: PatientComplaints_DTO) {
    const message = "Are you sure you want to deactivate this patient complaint?";
    if (window.confirm(message)) {
      this._clinicalNoteBLService
        .DeactivatePatientComplaint(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetChiefComplains();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Complaint Deactivated successfully']);
            this.GetPatientComplaint();
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }
  ComplaintListFormatter(data: any): string {
    return data["ChiefComplain"];
  }
  SetPatientComplaint() {
    if (this.SelectedComplaint && this.SelectedComplaint.ComplaintId !== 0) {
      this.PatientComplaintForm.patchValue({
        ChiefComplainId: this.SelectedComplaint.ChiefComplainId,
        Duration: this.SelectedComplaint.Duration,
        DurationType: this.SelectedComplaint.DurationType,
        Notes: this.SelectedComplaint.Notes
      });
      this.IsComplaintSelected = false;

    }
  }
  AssignComplaintValue() {
    if (this.SelectedChiefComplaint) {
      this.Complaints_DTO.ChiefComplainId = this.SelectedChiefComplaint.ChiefComplainId;
    }
  }
  AddPatientComplaints() {
    let complaint = this.PatientComplaintForm.value;
    this.Complaints_DTO = complaint;
    this.AssignComplaintValue();
    this.Complaints_DTO.PatientId = this.SelectedPatient.PatientId;
    this.Complaints_DTO.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this._clinicalNoteBLService.AddPatientComplaints(this.Complaints_DTO).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.Complaints_DTO = res.Results;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Complaint Added Successfully.']);
        this.GetPatientComplaint();
        this.ResetForm();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    });
  }
  ResetForm() {
    this.PatientComplaintForm.reset();
    this.SelectedChiefComplaint = null;
    this.SelectedComplaintId = null;
    this.SelectedComplaint = null;
    this.IsComplaintSelected = false;

  }
  RefreshPatientComplaints() {
    this.ResetForm();
  }
  UpdatePatientComplaint() {
    let complaint = this.PatientComplaintForm.value;
    this.Complaints_DTO = complaint;
    this.AssignComplaintValue();

    this.Complaints_DTO.PatientId = this.SelectedPatient.PatientId;
    this.Complaints_DTO.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.Complaints_DTO.ComplaintId = this.SelectedComplaintId;

    this._clinicalNoteBLService.UpdatePatientComplaints(this.Complaints_DTO).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.Complaints_DTO = res.Results;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Complaint Updated Successfully.']);
        this.GetPatientComplaint();
        this.ResetForm();

      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    });

  }
  CancelPatientComplaint() {
    this.Update = false;
    this.ResetForm();
  }
  ToggleFullscreen() {
    this.IsFullscreen = !this.IsFullscreen;
  }


}
