import { Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { CallbackService } from "../../../shared/callback.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ADT_BedReservationAdmittedPatientInformation_DTO } from "../../shared/DTOs/adt-bed-reservation-admitted-patient-information.dto";
import { AdmissionModel } from "../../shared/admission.model";
import { ADTGridColumnSettings } from "../../shared/adt-grid-column-settings";
import { ADT_BLService } from "../../shared/adt.bl.service";

@Component({
  selector: 'adt-bed-reservation',
  templateUrl: './adt-bed-reservation.component.html',
  styleUrls: ['./adt-bed-reservation.component.css']
})
export class ADTAddBedReservationComponent {
  AdmittedPatientListGridColumns: typeof ADTGridColumnSettings.prototype.AdmittedPatientListForBedReservation;//! Krishna, instead of assigning any to grid columns type taking josn object as a type
  AdmittedPatientList = new Array<AdmissionModel>();
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  AdtGridColumns: ADTGridColumnSettings = null;
  ShowReserveBedPopup: boolean = false;
  AdmittedPatientInformation = new ADT_BedReservationAdmittedPatientInformation_DTO();
  constructor(
    private _admissionBLService: ADT_BLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private _callBackService: CallbackService,
    private _coreService: CoreService) {

    if (this._securityService.getLoggedInCounter().CounterId < 1) {
      this._callBackService.CallbackRoute = '/ADTMain/AdmittedList';
    } else {
      this.AdtGridColumns = new ADTGridColumnSettings(this._coreService, this._securityService);

      this.LoadAdmittedPatients();

      this.AdmittedPatientListGridColumns = this.AdtGridColumns.AdmittedPatientListForBedReservation;
      this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('AdmittedDate', true));
    }
  }

  LoadAdmittedPatients(): void {
    this._admissionBLService.GetAdmittedPatients()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.AdmittedPatientList = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      }, err => {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
      });
  }

  AdmittedPatientListGridActions($event: GridEmitModel) {

    switch ($event.Action) {
      case "reserve": {
        const data = $event.Data;
        if (data) {
          this.AdmittedPatientInformation.PatientId = data.PatientId;
          this.AdmittedPatientInformation.PatientVisitId = data.PatientVisitId;
          this.AdmittedPatientInformation.PatientCode = data.PatientCode;
          this.AdmittedPatientInformation.PatientName = data.Name;
          this.AdmittedPatientInformation.AdmittedDate = data.AdmittedDate;
          this.AdmittedPatientInformation.AgeSex = data.AgeSex;
          this.AdmittedPatientInformation.VisitCode = data.VisitCode;
          this.AdmittedPatientInformation.BedInformation = data.BedInformation;
          this.AdmittedPatientInformation.Gender = data.Gender;
          this.AdmittedPatientInformation.DateOfBirth = data.DateOfBirth;

          this.CheckAlreadyReservedBedAndAllowReservation(data.PatientId, data.PatientVisitId);

        }
      }
    }
  }
  CheckAlreadyReservedBedAndAllowReservation(patientId: number, patientVisitId: number) {
    this._admissionBLService.CheckAlreadyReservedBed(patientId, patientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results) {
          this.ShowReserveBedPopup = false;
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`There is already a bed reserved for the patient!`]);
        } else {
          this.ShowReserveBedPopup = true;
        }

      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to check the Reserved bed for the patient, ${res.ErrorMessage}`]);

      }
    }, err => {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error while checking the Reserved Bed, ${err}`]);
      console.error(err);

    });

  }

  ReserveBedCallBack($event) {
    if ($event) {
      if ($event.action === "close") {
        this.ShowReserveBedPopup = false;
        this.LoadAdmittedPatients();
      }
    }
  }
}
