import { FormBuilder, FormGroup } from "@angular/forms";

export class AdmFilterParam_DTO {
  public SelectedDepartmentId: number = 0;
  public SelectedEmployeeId: number = 0;
  public SelectedWardId: number = 0;
  public FilterFormGroup: FormGroup;
  constructor() {
    let _formBuilder = new FormBuilder();
    this.FilterFormGroup = _formBuilder.group({
      'SelectedDepartment': [''],
      'SelectedEmployee': [''],
      'SelectedWard': ['']
    });
  }
}
