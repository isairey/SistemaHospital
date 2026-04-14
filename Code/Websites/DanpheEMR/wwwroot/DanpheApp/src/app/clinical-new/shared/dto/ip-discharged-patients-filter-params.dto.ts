import { FormBuilder, FormGroup } from "@angular/forms";

export class PatientFilterParam_DTO {
  public HospitalNumber: string = null;
  public ToDate: Date;
  public FromDate: Date;
  public DepartmentId: number;
  public FilterStatus: string;
  public WardId: number;

  public FilterFormGroup: FormGroup;

  constructor() {
    let _formBuilder = new FormBuilder();
    this.FilterFormGroup = _formBuilder.group({
      'HospitalNumber': [''],
      'DepartmentId': [''],
      'FilterStatus': [''],
      'SelectedWard': ['']
    });
  }
}
