import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import * as moment from 'moment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/internal/operators/catchError';
import { EmployeeListDTO } from '../../../clinical-settings/shared/dto/employee-list.dto';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { DischargeInformation_DTO } from '../../shared/dto/discharge-information.dto';
import { DischargeConditionType_DTO, DischargeType_DTO, OperationType } from '../../shared/dto/discharge-type.dto';
import { Field } from '../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: 'discharge-information',
  templateUrl: './discharge-information.component.html',
  styleUrls: ['./discharge-information.component.css']
})
export class DischargeInformationComponent implements OnInit {
  DischargeTypeList = new Array<DischargeType_DTO>();
  DischargeConditionTypeList = new Array<DischargeConditionType_DTO>();
  FilteredDischargeConditionTypeList = new Array<DischargeConditionType_DTO>();
  selectedDischargeTypeId: number = 0;
  DoctorList = new Array<EmployeeListDTO>();
  NurseList = new Array<EmployeeListDTO>();
  ConsultantList = new Array<number>();
  OperationType = new Array<OperationType>();
  OTDateTime: string;
  SelectedConsultants = new Array<EmployeeListDTO>();
  PreConsultants = new Array<EmployeeListDTO>();
  DischargeInfo = new DischargeInformation_DTO();
  SelectedPatient = new PatientDetails_DTO();
  PatientId: number = 0;
  PatientVisitId: number = 0;
  IsOTChecked: boolean = false;
  DischargeInfoByPatientVisit = new DischargeInformation_DTO();
  IsConsultant: boolean = false;
  Anaesthetist = new Array<EmployeeListDTO>();
  IsAcrossVisitAvailability: boolean = false;
  Field: Field;

  constructor(
    private cdr: ChangeDetectorRef,
    private _selectedPatientService: ClinicalPatientService,
    private _messageBoxService: MessageboxService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
  ) {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient) {
      this.PatientId = this.SelectedPatient.PatientId;
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    }
    this.OTDateTime = moment().format('YYYY-MM-DDTHH:mm');
  }

  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    let request: Observable<any>[] = [];

    request.push(this._clinicalNoteBLService.GetDischargeType().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));

    request.push(this._clinicalNoteBLService.GetDischargeConditionType().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalNoteBLService.GetNursesListForSignatories().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalNoteBLService.GetOperationType().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalNoteBLService.GetAnaesthetist().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalNoteBLService.GetDoctorListForSignatories().pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalNoteBLService.GetDischargeInfoByPatientVisit(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    forkJoin(request).subscribe(
      result => {
        this.GetDischargeType(result[0]);
        this.GetDischargeConditionType(result[1]);
        this.GetNursesListForSignatories(result[2]);
        this.GetOperationType(result[3]);
        this.GetAnaesthetist(result[4]);
        this.GetDoctorListForSignatories(result[5]);
        this.GetDischargeInfoByPatientVisit(result[6]);


      }
    );

  }

  /**
  * @summary Retrieves the list of discharge types from the clinical note service.
  *
  * This method sends a request to the `_clinicalNoteBLService` to fetch the discharge types. On a successful response, it updates the `DischargeTypeList` with the retrieved data.
  */


  GetDischargeType(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.DischargeTypeList = res.Results;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Discharge Type List is empty.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get DischargeTypeList',
      ]);
    }
  }

  /**
 * @summary Updates the `ConsultantList` based on selected consultants.
 * This method clears the existing `ConsultantList` and populates it with the `EmployeeId` of each consultant passed in the `consult` array. It is typically used to refresh the list of selected consultants whenever a change occurs.
 * @param consult - An array of consultant objects, where each object contains an `EmployeeId`.
 */

  public ConsultantChkOnChange(consult): void {
    this.ConsultantList = [];
    consult.forEach(consult => {
      this.ConsultantList.push(consult.EmployeeId);
    });
  }


  /**
 * @summary Retrieves the list of discharge condition types from the clinical note service.
 * This method sends a request to the `_clinicalNoteBLService` to fetch the discharge condition types. Upon a successful response, it updates the `DischargeConditionTypeList` with the received data.
 */

  GetDischargeConditionType(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.DischargeConditionTypeList = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No discharge condition types found.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve discharge condition types.']);
    }
  }


  /**
 * @summary Filters the discharge condition types based on the selected discharge type and updates the form.
 * This method updates the `selectedDischargeTypeId` with the provided `dischargeTypeId`. It then filters the `DischargeConditionTypeList` to populate `FilteredDischargeConditionTypeList` with condition types that match the selected discharge type. If no matching condition types are found, it clears the value of the `SubDischargeType` control in the `DischargeInfo` form.
 * @param dischargeTypeId - The ID of the selected discharge type used to filter the discharge condition types.
 */

  OnDischargeTypeChange(dischargeTypeId: number) {
    this.selectedDischargeTypeId = Number(dischargeTypeId);
    this.FilteredDischargeConditionTypeList = this.DischargeConditionTypeList.filter(condition =>
      condition.DischargeTypeId === this.selectedDischargeTypeId
    );
    if (this.FilteredDischargeConditionTypeList.length === 0) {
      this.DischargeInfo.DischargeInfoValidator.controls['SubDischargeTypeId'].setValue(null);
    }
  }

  /**
 * @summary Retrieves the list of doctors for signatories and fetches discharge information.
 * This method sends a request to the `_clinicalNoteBLService` to get the list of doctors who can serve as signatories. On a successful response, it updates the `DoctorList` with the retrieved data and subsequently calls `GetDischargeInfoByPatientVisit` with the `PatientVisitId`.
 */


  GetDoctorListForSignatories(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.DoctorList = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No doctors found for signatories.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage || 'Failed to retrieve doctor list for signatories.']);
    }
  }




  /**
   * @summary Assigns pre-selected doctors based on discharge information and updates the consultant list.
   * This method checks if there is discharge information available for the patient visit and if it includes consultant data.
   * It parses the consultant data to retrieve a list of pre-selected consultant IDs. It then iterates through `DoctorList`, marks the doctors whose IDs are in the pre-selected list as selected, and adds their IDs to the `ConsultantList`.
   * Finally, it filters the `DoctorList` to populate `PreConsultants` with the selected doctors.
   */

  public AssignPreSelectedDoctor() {
    if (this.DischargeInfoByPatientVisit && this.DischargeInfoByPatientVisit.Consultant) {
      this.ConsultantList = new Array<number>();
      let consultantData = JSON.parse(this.DischargeInfoByPatientVisit.Consultant);
      let spcList: Array<number> = consultantData.consultants;
      this.DoctorList.forEach((sp) => {
        if (spcList.includes(sp.EmployeeId)) {
          sp.IsSelected = true;
          this.ConsultantList.push(sp.EmployeeId);
        }
      });
      this.PreConsultants = this.DoctorList.filter(a => a.IsSelected === true);

    }
  }

  /**
   * @summary Retrieves the list of nurses for signatories.
   *
   * This method sends a request to the `_clinicalNoteBLService` to get the list of nurses who can serve as signatories. On a successful response, it updates the `NurseList` with the retrieved data.
   */

  GetNursesListForSignatories(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.NurseList = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No nurses found for signatories.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve nurse list for signatories.']);
    }
  }


  /**
 * @summary Toggles the required validation for operation type and date based on the OT checkbox state.
 * This method updates the `IsOTChecked` property based on the state of the OT checkbox. If the checkbox is checked, it sets the `OperationType` and `OperationDate` controls in the `DischargeInfo` form as required validators.
 * If unchecked, it clears these validators. It then updates the validation state of these controls to ensure the form reflects the changes.
 * @param event - The event object from the checkbox change event, which contains the new checked state.
 */

  ToggleOTDetails(event: any) {
    this.IsOTChecked = event.target.checked;

    if (this.IsOTChecked) {
      this.DischargeInfo.DischargeInfoValidator.controls['OperationType'].setValidators([Validators.required]);
      this.DischargeInfo.DischargeInfoValidator.controls['OperationDate'].setValidators([Validators.required]);
    } else {
      this.DischargeInfo.DischargeInfoValidator.controls['OperationType'].clearValidators();
      this.DischargeInfo.DischargeInfoValidator.controls['OperationDate'].clearValidators();
    }

    this.DischargeInfo.DischargeInfoValidator.controls['OperationType'].updateValueAndValidity();
    this.DischargeInfo.DischargeInfoValidator.controls['OperationDate'].updateValueAndValidity();
  }


  /**
 * @summary Retrieves the list of operation types from the clinical note service.
 * This method sends a request to the `_clinicalNoteBLService` to fetch the available operation types. On a successful response, it updates the `OperationType` property with the retrieved data.
 */


  GetOperationType(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.OperationType = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No operation types found.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve operation types.']);
    }
  }

  /**
 * @summary Retrieves the list of anaesthetists from the clinical note service.
 * This method sends a request to the `_clinicalNoteBLService` to get the list of anaesthetists. On a successful response, it updates the `Anaesthetist` property with the retrieved data.
 */

  GetAnaesthetist(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.Anaesthetist = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No anaesthetists found.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve anaesthetists.']);
    }
  }

  /**
 * @summary Retrieves discharge information for a specific patient visit and updates the form state.
 *
 * This method sends a request to the `_clinicalNoteBLService` to fetch discharge information using the provided `PatientVisitId`.
 * On a successful response, it updates the `DischargeInfoByPatientVisit` property with the retrieved data. It also sets the `IsOTChecked` flag if the patient is an OT patient, filters the `DischargeConditionTypeList` based on the `SubDischargeType`, and invokes methods to set form values and assign pre-selected doctors.
 * The method also sets `IsConsultant` to true and triggers change detection.
 * @param PatientVisitId - The ID of the patient visit used to retrieve discharge information.
 */


  GetDischargeInfoByPatientVisit(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results) {
        this.DischargeInfoByPatientVisit = res.Results;
        if (this.DischargeInfoByPatientVisit.IsOtPatient === true) {
          this.IsOTChecked = true;
          this.DischargeInfo.DischargeInfoValidator.controls['IsOtPatient'].disable();
        }
        else {
          this.DischargeInfo.DischargeInfoValidator.controls['IsOtPatient'].enable();
        }

        if (this.DischargeInfoByPatientVisit.SubDischargeTypeId) {
          this.FilteredDischargeConditionTypeList = this.DischargeConditionTypeList.filter(condition =>
            condition.DischargeConditionId == this.DischargeInfoByPatientVisit.SubDischargeTypeId
          );
        }
        this.SetValue();
        this.AssignPreSelectedDoctor();
        this.IsConsultant = true;
        this.cdr.detectChanges();
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No discharge information found for the patient visit.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve discharge information.']);
    }
  }


  /**
 * @summary Updates the discharge information form with values from the discharge information by patient visit.
 * This method checks if `DischargeInfoByPatientVisit` is available and has a valid `DischargeInformationId`. If so, it updates the `DischargeInfo` form's validators with the corresponding values from `DischargeInfoByPatientVisit`.
 */
  SetValue() {
    if (this.DischargeInfoByPatientVisit && this.DischargeInfoByPatientVisit.DischargeInformationId !== 0) {
      this.DischargeInfo.DischargeInfoValidator.patchValue({
        DischargeTypeId: this.DischargeInfoByPatientVisit.DischargeTypeId,
        DoctorInchargeId: this.DischargeInfoByPatientVisit.DoctorInchargeId,
        CheckdById: this.DischargeInfoByPatientVisit.CheckdById,
        DischargeNurseId: this.DischargeInfoByPatientVisit.DischargeNurseId,
        SubDischargeTypeId: this.DischargeInfoByPatientVisit.SubDischargeTypeId,
        ResidentDrId: this.DischargeInfoByPatientVisit.ResidentDrId,
        OperationType: this.DischargeInfoByPatientVisit.OperationType,
        IsOtPatient: this.DischargeInfoByPatientVisit.IsOtPatient,
        AnaesthetistId: this.DischargeInfoByPatientVisit.AnaesthetistId,
        OperationDate: moment(this.DischargeInfoByPatientVisit.OperationDate).format('YYYY-MM-DDTHH:mm'),
      });
    }
  }

  /**
 * @summary Adds discharge information after validating the form and submitting the data.
 * This method marks all controls in the `DischargeInfo` form as dirty and updates their validation state. It then checks if the form data is valid using `IsValidCheck`.
 * If valid, it prepares an `updatedValue` object combining the form data with additional information.
 */

  AddDischargeInformation() {
    for (let i in this.DischargeInfo.DischargeInfoValidator.controls) {
      this.DischargeInfo.DischargeInfoValidator.controls[i].markAsDirty();
      this.DischargeInfo.DischargeInfoValidator.controls[i].updateValueAndValidity();
    }

    if (this.DischargeInfo.IsValidCheck(undefined, undefined)) {
      const updatedValue = {
        ...this.DischargeInfo.DischargeInfoValidator.value,
        SelectedConsultants: this.ConsultantList,
        PatientVisitId: this.PatientVisitId,
        PatientId: this.PatientId,
        DischargeInformationId: this.DischargeInfoByPatientVisit && this.DischargeInfoByPatientVisit.DischargeInformationId ? this.DischargeInfoByPatientVisit.DischargeInformationId : 0
      };


      this._clinicalNoteBLService.AddDischargeInformation(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [
              "Discharge Information Added",
            ]);
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
              "Discharge Information not Added",
            ]);
          }
        },
        (err) => {
          this.logError(err);
        }
      );
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
        "some data are invalid.",
      ]);
    }
  }
  logError(err: any) {
    this._messageBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, [err]);
  }
}
