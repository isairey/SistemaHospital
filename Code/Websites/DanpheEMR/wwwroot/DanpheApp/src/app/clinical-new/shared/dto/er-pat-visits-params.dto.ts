import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import * as moment from "moment";
import { ENUM_VisitDateFilter } from "../../../shared/shared-enums";

export class ERPatVisitsParam_DTO {
  SelectedEmployeeId: number;
  FromDate: Date;
  ToDate: Date;
  Today: string = "";
  IsDate: boolean = true;
  VisitDateFilter: string;
  public FilterFormGroup: FormGroup;
  constructor() {
    let _formBuilder = new FormBuilder();
    this.FilterFormGroup = _formBuilder.group({
      'VisitDateFilter': [ENUM_VisitDateFilter.Today],
      'SelectedEmployee': [''],
      'FromDate': [this.FromDate, Validators.compose([Validators.required, this.DateValidators])],
      'ToDate': [this.ToDate, Validators.compose([Validators.required, this.DateValidators])],
      'IsDate': [true],
    });
  }

  DateValidators(control: FormControl): { [key: string]: boolean; } {
    var currDate = moment().format('YYYY-MM-DD 23:59');
    if ((moment(control.value).diff(currDate) > 0) ||
      (moment(control.value).diff(currDate, 'years') < -10))
      return { 'wrongDate': true };
  }


}
