import { Component, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { ReservedBedDetail_DTO } from '../shared/DTOs/adt-reserved-bed-detail.dto';
import { PatientBedInfoVM } from '../shared/admission.view.model';
import { ADT_BLService } from '../shared/adt.bl.service';

@Component({
  selector: "patient-admission-history",
  templateUrl: "./admitted-patient-history.html"
})
export class AdmittedPatientHistory {

  public patWardList: Array<PatientBedInfoVM> = new Array<PatientBedInfoVM>();
  public showDatePicker: Array<boolean> = [];
  public prevStartedOn: string = null;
  public prevEndedOn: string = null;
  public validDate: boolean = true;
  public showEdit: boolean = true;
  @Input('ipPatientVisitId') IPPatientVisitId: number;
  @Input('ipPatientId') IPPatientId: number;
  ReservedBedDetail = new ReservedBedDetail_DTO();
  ShowActiveBedReservation: boolean = false;
  public AdmissionDateValidator: FormGroup = null;
  constructor(public admissionBLService: ADT_BLService,
    public msgBoxServ: MessageboxService) {
    this.SetValidators();
  }
  ngOnInit() {
    if (this.IPPatientVisitId) {
      this.GetPatientWardInfo(this.IPPatientVisitId);
      if (this.IPPatientId) {
        this.GetReservedBedDetail(this.IPPatientId, this.IPPatientVisitId);
      }
      this.validDate = true;
    }
  }

  GetReservedBedDetail(patientId: number, patientVisitId: number): void {
    this.admissionBLService.GetReservedBedDetail(patientId, patientVisitId)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results) {
            this.ReservedBedDetail = res.Results;
            this.ShowActiveBedReservation = true;
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err): void => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  public GetPatientWardInfo(PatVisitId: number) {
    this.admissionBLService.GetAdmittedPatientInfo(PatVisitId)
      .subscribe(res => {
        if (res.Status == 'OK') {
          if (res.Results.length) {
            this.patWardList = res.Results;
            this.patWardList.forEach(a => {
              this.showDatePicker.push(false);
            });
            this.patWardList = this.patWardList.slice();

          }
        }
        else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
        });
  }
  EditSelectedInfoOnClick(index: number) {
    this.showEdit = false;
    this.showDatePicker[index] = true;
    this.prevStartedOn = this.patWardList[index].StartedOn;
    this.prevEndedOn = this.patWardList[index].EndedOn;
    this.UpdateValidator(index);

  }
  CloseDateChange(index: number) {
    this.showEdit = true;
    this.showDatePicker[index] = false;
    this.patWardList[index].StartedOn = this.prevStartedOn;
    this.patWardList[index].EndedOn = this.prevEndedOn;
  }

  SaveChanges(index: number) {
    for (var i in this.AdmissionDateValidator.controls) {
      this.AdmissionDateValidator.controls[i].markAsDirty();
      this.AdmissionDateValidator.controls[i].updateValueAndValidity();
    }
    if (this.IsValidCheck(undefined, undefined)) {
      this.admissionBLService.UpdateAdmittedPatientInfo(this.patWardList[index])
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status == "OK") {
            this.msgBoxServ.showMessage("success", ["Dates changed successfully."]);
            this.GetPatientWardInfo(this.IPPatientVisitId);
            this.showDatePicker[index] = false;
            this.showEdit = true;
          }
          else {
            this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
          }
        });
    }


  }

  public SetValidators() {
    var _formBuilder = new FormBuilder();
    this.AdmissionDateValidator = _formBuilder.group({
      'StartedOn': ['', Validators.compose([Validators.required])],
      'EndedOn': ['', Validators.compose([])]
    });
  }

  public UpdateValidator(index) {
    if (this.patWardList[index].EndedOn) {
      this.AdmissionDateValidator.controls['EndedOn'].validator = Validators.compose([Validators.required]);
    }
    else {
      this.AdmissionDateValidator.controls['EndedOn'].validator = Validators.compose([]);
    }
    this.AdmissionDateValidator.controls['EndedOn'].updateValueAndValidity();
  }

  public IsDirty(controlname): boolean {
    if (controlname == undefined) {
      return this.AdmissionDateValidator.dirty;
    }
    else {
      return this.AdmissionDateValidator.controls[controlname].dirty;
    }
  }

  public IsValidCheck(controlname, typeofvalidation): boolean {
    if (this.AdmissionDateValidator.valid) {
      return true;
    }
    if (controlname == undefined) {
      return this.AdmissionDateValidator.valid;
    }
    else {
      return !(this.AdmissionDateValidator.controls[controlname].hasError(typeofvalidation));
    }
  }


}

