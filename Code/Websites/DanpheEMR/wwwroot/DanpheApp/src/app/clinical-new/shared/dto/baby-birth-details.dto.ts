import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import * as moment from 'moment';

export class BabyBirthDetails {
  public BabyBirthDetailsId: number = 0;
  public CertificateNumber: number = 0;
  public Gender: string = null;
  public FathersName: string = null;
  public WeightOfBaby: number = 0;
  public BirthDate: string = moment().format("YYYY-MM-DD");
  public BirthTime: string = moment().format("HH:mm");
  public BirthType: string = null;
  public BirthNumberType: string = "single";
  public FiscalYearFormatted: string = null;
  public DischargeSummaryId: number = 0;
  public MedicalRecordsId: number = 0;
  public PrintCount: number = 0;
  public PrintedBy: number = 0;
  public CertifiedBy: number = 0;
  public IssuedBy: number = 0;
  public PatientVisitId: number = 0;
  public PatientId: number = 0;
  public CreatedBy: number = 0;
  public ModifiedBy: number = 0;
  public CreatedOn: string = null;
  public ModifiedOn: string = null;
  public IsActive: boolean = true;

  public MotherName: string = null;
  public Country: string = null;
  public CountrySubDivision: string = null;
  public Municipality: string = null;
  public Address: string = null;

  public BirthConditionId: number = 0;
  public BirthConditionType: string = null;
  public IsLiveBirthCase: boolean = true;

  public BabyBirthDetailsValidator: FormGroup = null;
  public NumberOfBabies: number = 0;

  public IssuedSignatory: number = 0;

  public ConditionAtBirth: string = null;
  public CertificateIssuedDate: string = null;

  constructor() {
    var _formBuilder = new FormBuilder();
    this.BabyBirthDetailsValidator = _formBuilder.group({
      'Gender': ['', Validators.compose([Validators.required])],
      'BirthDate': ['', Validators.compose([Validators.required])],
      'BirthTime': ['', Validators.compose([Validators.required])],
      'WeightOfBaby': ['', Validators.compose([Validators.required, Validators.min(1), Validators.pattern('^[0-9]*(?:\.[0-9]{0,4})?$')])],
      'BirthConditionId': ['', Validators.compose([Validators.required])],
    });
  }
  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.BabyBirthDetailsValidator.dirty;
    else
      return this.BabyBirthDetailsValidator.controls[fieldName].dirty;
  }

  public IsValid(): boolean {
    if (this.BabyBirthDetailsValidator.valid) { return true; } else { return false; }
  }

  public IsValidCheck(fieldName, validator): boolean {
    if (this.BabyBirthDetailsValidator.valid) {
      return true;
    }
    if (fieldName == undefined)
      return this.BabyBirthDetailsValidator.valid;
    else
      return !(this.BabyBirthDetailsValidator.hasError(validator, fieldName));
  }

}

