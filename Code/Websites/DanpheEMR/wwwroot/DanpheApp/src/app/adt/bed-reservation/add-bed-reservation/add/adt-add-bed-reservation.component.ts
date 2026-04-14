import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as moment from "moment";
import { AddBedReservation_DTO } from "../../../../adt/shared/DTOs/adt-add-bed-reservation.dto";
import { ADT_BedReservationAdmittedPatientInformation_DTO } from "../../../../adt/shared/DTOs/adt-bed-reservation-admitted-patient-information.dto";
import { ADTPatientCareTakerInformation_DTO } from "../../../../adt/shared/DTOs/adt-patient-care-taker-info.dto";
import { ADT_BLService } from "../../../../adt/shared/adt.bl.service";
import { Bed } from "../../../../adt/shared/bed.model";
import { BedFeature } from "../../../../adt/shared/bedfeature.model";
import { BedInformation } from "../../../../adt/shared/bedinformation.model";
import { Ward } from "../../../../adt/shared/ward.model";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";

@Component({
  selector: 'adt-create-bed-reservation',
  templateUrl: './adt-add-bed-reservation.component.html',
  styleUrls: ['./adt-add-bed-reservation.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' },
})
export class AdtCreateNewBedReservationComponent {

  @Input("admitted-patient")
  AdmittedPatientInformation = new ADT_BedReservationAdmittedPatientInformation_DTO();
  WardList = new Array<Ward>();
  BedFeatureList = new Array<BedFeature>();
  BedList = new Array<Bed>();
  PriceCategoryId: number = 0;
  SelectedWardId: number = 0;
  SelectedBedFeatureId: number = 0;
  SelectedBedId: number = 0;
  AddBedReservation = new AddBedReservation_DTO();

  ConfirmationTitle: string = "Confirm !";
  ConfirmationMessage: string = "Are You Sure You Want To Reserve a Bed?";
  Loading: boolean = false;

  @Output("bed-reservation-callback")
  BedReservationCallback = new EventEmitter<object>()

  constructor(
    private _admissionBlService: ADT_BLService,
    private _msgBoxService: MessageboxService
  ) {
    this.GetWards();
  }

  ngOnInit(): void {

    this.GetCareTakerInformation();

    const currentBedInfo = this.AdmittedPatientInformation ? this.AdmittedPatientInformation.BedInformation as BedInformation : null;
    if (currentBedInfo) {
      const ward = currentBedInfo.Ward;
      const bed = currentBedInfo.BedCode;
      this.AdmittedPatientInformation.CurrentWardBed = `${ward}/${bed}`;
      this.AdmittedPatientInformation.AgeSex = this.GetAgeFromDateOfBirth(this.AdmittedPatientInformation.DateOfBirth, this.AdmittedPatientInformation.AdmittedDate, this.AdmittedPatientInformation.Gender);
    }

  }
  GetAgeFromDateOfBirth(dateOfBirth: string, admittedDate: string, gender: string): string {
    if (dateOfBirth && admittedDate && gender) {
      let genderShortForm = "";
      if (gender.toLowerCase() === 'male') {
        genderShortForm = "M";
      } else if (gender.toLowerCase() === 'female') {
        genderShortForm = "F";
      } else {
        genderShortForm = "O";
      }
      let years = moment(admittedDate).diff(moment(dateOfBirth).format('YYYY-MM-DD'), 'years');
      let totMonths = moment(admittedDate).diff(moment(dateOfBirth).format('YYYY-MM-DD'), 'months');
      let totDays = moment(admittedDate).diff(moment(dateOfBirth).format('YYYY-MM-DD'), 'days');
      //show years if it's above 1.
      if (years >= 1) {
        return `${years.toString()} Y/${genderShortForm}`;
      }
      //show days for less than 1 month.
      else if (totMonths < 1) {
        if (Number(totDays) == 0)
          totDays = 1;
        return `${totDays.toString()} D/${genderShortForm}`;
      }
      //else show only months for 1 to 35 months (other cases are checked in above conditions).
      else {
        return `${totMonths.toString()} M/${genderShortForm}`;
      }
    } else {
      return "";
    }
  }


  GetCareTakerInformation() {
    this._admissionBlService.GetCareTakerInformation(this.AdmittedPatientInformation.PatientId, this.AdmittedPatientInformation.PatientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results) {
          const careTakerInformation = res.Results as ADTPatientCareTakerInformation_DTO;
          this.AddBedReservation.CareTakerId = careTakerInformation.PrimaryCareTakerId;
          this.AddBedReservation.PrimaryCareTakerName = careTakerInformation.PrimaryCareTakerName;
          this.AddBedReservation.PrimaryCareTakerContact = careTakerInformation.PrimaryCareTakerContact;
        }
      } else {
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to load the Care Taker information, ${res.ErrorMessage}`]);
      }
    }, err => {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error fetching CareTaker information for the patient, ${err}`]);
    });
  }

  public GetWards() {
    this._admissionBlService.GetWards().subscribe(
      (res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.WardList = res.Results;
          }
        } else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
      (err) => {
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
      }
    );
  }


  public WardChanged($event) {
    if ($event) {
      const wardId = +$event.target.value;
      this.SelectedWardId = wardId;
      if (wardId) {
        this.BedFeatureList = null;
        this.BedList = null;
        this._admissionBlService.GetWardBedFeatures(wardId, this.PriceCategoryId).subscribe((res) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results.length) {
              this.BedFeatureList = res.Results;
            }
          }
        });
      }
    }
  }

  public GetAvailableBeds($event) {
    if ($event) {
      const bedFeatureId = +$event.target.value;
      const wardId = this.SelectedWardId;
      this.SelectedBedFeatureId = bedFeatureId;
      if (wardId && bedFeatureId) {
        this._admissionBlService.GetAvailableBeds(wardId, bedFeatureId).subscribe(
          (res) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              if (res.Results.availableBeds.length) {
                this.BedList = res.Results.availableBeds;
              } else {
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["No beds are available for this type.",]);
              }
            } else {
              this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
            }
          },
          (err) => {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
          }
        );
      }
    }
  }

  BedChanged($event) {
    if ($event) {
      const bedId = +$event.target.value;
      this.SelectedBedId = bedId;
    }
  }

  Close(): void {
    this.BedReservationCallback.emit({ action: 'close' });
  }

  handleConfirm() {
    this.Loading = true;
    this.ReserveBed();
  }

  handleCancel() {
    this.Loading = false;
  }
  ReserveBed(): void {
    const addBedReservation = this.PrepareBedReservationObject();
    if (addBedReservation && addBedReservation.BedId && addBedReservation.BedFeatureId && addBedReservation.WardId && addBedReservation.PrimaryCareTakerName && addBedReservation.PrimaryCareTakerContact) {
      this._admissionBlService.ReserveBed(addBedReservation)
        .finally(() => this.Loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Bed is successfully reserved!`]);
            this.AddBedReservation = new AddBedReservation_DTO();
            this.Close();
          } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to reserve the bed, ${res.ErrorMessage}`]);
          }
        }, err => {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`${err}`]);
          console.error(err);
        })
    } else {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`You are missing to select either Ward or Bed Feature or Bed or PrimaryCareTaker Details!`]);
    }
  }
  PrepareBedReservationObject(): AddBedReservation_DTO {
    let bedReservation = new AddBedReservation_DTO();
    bedReservation.WardId = this.SelectedWardId;
    bedReservation.BedFeatureId = this.SelectedBedFeatureId;
    bedReservation.BedId = this.SelectedBedId;
    bedReservation.PatientId = this.AdmittedPatientInformation.PatientId;
    bedReservation.PatientVisitId = this.AdmittedPatientInformation.PatientVisitId;
    bedReservation.CareTakerId = this.AddBedReservation.CareTakerId;
    bedReservation.PrimaryCareTakerName = this.AddBedReservation.PrimaryCareTakerName;
    bedReservation.PrimaryCareTakerContact = this.AddBedReservation.PrimaryCareTakerContact;
    bedReservation.SecondaryCareTakerName = this.AddBedReservation.SecondaryCareTakerName;
    bedReservation.SecondaryCareTakerContact = this.AddBedReservation.SecondaryCareTakerContact;
    return bedReservation;
  }

  Discard(): void {
    if (window.confirm("Do you want to discard the changes? You will loose the details you have changed if discarded.")) {
      this.Close();
    }
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.Close();
    }
  }

}
