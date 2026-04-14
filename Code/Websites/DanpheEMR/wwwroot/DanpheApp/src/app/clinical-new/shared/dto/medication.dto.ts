import { FormControl, FormGroup } from "@angular/forms";
import * as moment from "moment";

export class Medication_DTO {
  PrescriptionItemId: number = 0;
  ItemId: number = 0;
  GenericId: number = 0;
  ItemName: string = '';
  GenericName: string = '';
  MedicationType: string = '';
  Dosage: string = '';
  Strength: string = '';
  Route: string = '';
  Frequency: number = 0;
  FrequencyAbbreviation: string = null;
  //public Intake: string = null;
  PRNNotes: string = null;
  IsPRN: boolean = false;
  LastTaken: string = '';
  Remarks: string = '';
  ItemListByGeneric: string = '';
  MedicationValidator: FormGroup = null;
  PatientId: number = null;
  HowManyDays: number = 0;
  Duration: number = 0;
  TimingOfMedicineTake: string = '';
  PatientVisitId: number = 0;
  IsDischargeRequest: boolean;
  IsAddedToPlan: boolean = false;
  OrderStatus: string = '';
  Notes: string = '';
  constructor(
  ) {

  }
  dateValidator(control: FormControl): { [key: string]: boolean; } {

    var currDate = moment().format('YYYY-MM-DD');
    if (control.value) { // gets empty string for invalid date such as 30th Feb or 31st Nov)
      if ((moment(control.value).diff(currDate) > 0)
        || (moment(currDate).diff(control.value, 'years') > 200)) //cannot make entry of 200 year before from today.
        return { 'wrongDate': true };
    }
    else
      return { 'wrongDate': true };
  }
  IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.MedicationValidator.dirty;
    else
      return this.MedicationValidator.controls[fieldName].dirty;
  }

  IsValid(): boolean { if (this.MedicationValidator.valid) { return true; } else { return false; } } public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined)
      return this.MedicationValidator.valid;
    else
      return !(this.MedicationValidator.hasError(validator, fieldName));
  }
}
