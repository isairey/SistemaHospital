import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DischargeSummaryConsultant } from './discharge-summary-consultant.model';
import { DischargeSummaryMedication } from "./discharge-summary-medication.model";

export class DischargeSummary {
  public DischargeSummaryId: number = 0;
  public PatientVisitId: number = null;
  public DischargeTypeId: number = null;
  public DoctorInchargeId: number = null;
  public OperativeProcedure: string = null;
  public OperativeFindings: string = null;
  public AnaesthetistsId: number = null;
  public Anaesthetists: string = null;
  public Anesthetists: string = null;
  public Diagnosis: string;
  public CaseSummary: string = null;
  public Condition: string = null;
  public Treatment: string = null;
  public HistologyReport: string = null;
  public SpecialNotes: string = null;
  public Medications: string = null;
  public Allergies: string = null;
  public Activities: string = null;
  public Diet: string = null;
  public RestDays: string = null;
  public FollowUp: string = null;
  public Others: string = null;
  public ResidenceDrId: number = null;

  public CreatedBy: number = null;
  public ModifiedBy: number = null;

  public CreatedOn: string = null;
  public ModifiedOn: string = null;
  public IsSubmitted: boolean = false;
  public DischargeSummaryValidator: FormGroup = null;
  public LabTests: string = null;
  public DischargeSummaryMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
  // public DischargeSummaryConsultants: Array<DischargeSummaryConsultant> = new Array<DischargeSummaryConsultant>();
  public DischargeSummaryConsultants: Array<DischargeSummaryConsultant> = new Array<DischargeSummaryConsultant>();
  //public BabyBirthDetails : Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  public DischargeConditionId: number = null;
  public DeliveryTypeId: number = null;
  //public BabyBirthConditionId: number = null;
  public DeathTypeId: number = null;
  //public BabysFathersName: string = null;
  //public DeathCertificateNumber: string =null;
  public PatientId: any;
  public FiscalYearName: string = null;
  //public DeathPeriod: string = null;

  public ChiefComplaint: string = null;
  public PendingReports: string = null;
  public HospitalCourse: string = null;
  public PresentingIllness: string = null;
  public ProcedureNts: string = null;
  public SelectedImagingItems: string = null;
  public DischargeType: string = null;
  public DischargeOrder: string = null;

  public ProvisionalDiagnosis: string;

  public DiagnosisFreeText: string;
  // public ConsultantId: Array<DischargeSummaryConsultant> = [];

  public BabyWeight: string; // Krishna, 17th,May'22, Fishtail Specific Changes
  // public CheckedBy: number; // Krishna, 17th,May'22, Fishtail Specific Changes
  public ClinicalFindings: string; //Rusha, 30th June'22, added for BIH specific changes
  public PastHistory: string = null; //Rohit, 18Nov'22, For Charak Memorial Hospital changes
  public PhysicalExamination: string = null; //Rohit, 18Nov'22, For Charak Memorial Hospital changes

  public DischargeSummaryTemplateId: number; //Bikesh 24th-july-2023 for DynamicDischargesummary
  public DischargeCondition: string;
  public DeathType: string;
  public BabyBirthCondition: string;
  public DeliveryType: string;
  public DoctorIncharge: string;
  public Age: number;
  public SelectedDiagnosis: string;
  public ResidenceDrName: string;
  public CheckedBy: string;
  public Consultants: string;
  public Consultant: string;
  public hospitalStayDate: string;
  public DrInchargeNMC: string;
  public ConsultantNMC: string;
  public CheckedByNMC: string;
  public ConsultantsSign: string;
  public ConsultantSignImgPath: string;
  public DrInchargeSignImgPath: string;
  public StayDays: number = 0;
  public HistoryOfPresentingIllness: string;
  public OtherDiagnosis: string;
  public HospitalReport: string;
  public TreatmentDuringHospitalStay: string;
  public ObstetricHistory: string;
  public RelevantMaternalHistory: string;
  public IndicationForAdmission: string;
  public RespiratorySystem: string;
  public CardiovascularSystem: string;
  public GastrointestinalAndNutrition: string;
  public Renal: string;
  public NervousSystem: string;
  public Metabolic: string;
  public Sepsis: string;
  public CongenitalAnomalies: string;
  public Reflexes: string;
  public MedicationsReceivedInNICUNursery: string;
  public Discussion: string;
  ConsultantDepartment: string;

  public ConfigureValidator(formControls: any) {
    formControls.forEach(control => {
      this.DischargeSummaryValidator.addControl(control, new FormControl('', Validators.required));
    });
  }

  constructor() {
    // public DischargeSummaryValidator: FormGroup = null;

    var _formBuilder = new FormBuilder();
    this.DischargeSummaryValidator = _formBuilder.group({
      'DischargeType': ['', Validators.compose([Validators.required])],
      // 'Consultant': ['', Validators.compose([Validators.required])],
      'DischargeCondition': ['', Validators.compose([Validators.required])],
      'DoctorIncharge': ['', Validators.compose([Validators.required])],
      'Anesthetists': [''],
      'ResidentDr': [''],
      'BabyWeight': [''],
      'SelectDiagnosis': [''],
      'ProvisonalDiagnosis': [''],
      'SelectedDiagnosis': [''],
      'OtherDiagnosis': [''],
      'ClinicalFindings': [''],
      'CheifComplain': [''],
      'HistoryOfPresentingIllness': [''],
      'PastHistory': [''],
      'CaseSummery': [''],
      'Procedure': [''],
      'OperativeFindings': [''],
      'HospitalReport': [''],
      'HospitalCourse': [''],
      'TreatmentDuringHospitalStay': [''],
      'ConditionOnDischarge': [''],
      'PendingReports': [''],
      'SpecialNotes': [''],
      'Allergies': [''],
      'Activities': [''],
      'Diet': [''],
      'RestDays': [''],
      'FollowUP': [''],
      'Others': [''],
      'CheckedBy': [''],
      'Investigations': [''],
      'LabTests': [''],
      'Imgaings': [''],
      'Medications': [''],
      'DischargeOrder': ['']
    });

  }
  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.DischargeSummaryValidator.dirty;
    else
      return this.DischargeSummaryValidator.controls[fieldName].dirty;
  }

  public IsValid(): boolean {
    if (this.DischargeSummaryValidator.valid) {
      return true;
    }
    else {
      return false;
    }
  }
  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined)
      return this.DischargeSummaryValidator.valid;
    else
      return !(this.DischargeSummaryValidator.hasError(validator, fieldName));
  }
  //Dynamically add validator
  public UpdateValidator(onOff: string, formControlName: string, validatorType: string) {
    let validator = null;
    if (validatorType == 'required' && onOff == "on") {
      validator = Validators.compose([Validators.required]);
    }
    else {
      validator = Validators.compose([]);
    }
    this.DischargeSummaryValidator.controls[formControlName].validator = validator;
    this.DischargeSummaryValidator.controls[formControlName].updateValueAndValidity();
  }
}
