import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { UnicodeService } from '../../common/unicode.service';
import { CoreService } from '../../core/shared/core.service';
import { PatientService } from '../../patients/shared/patient.service';
import { Salutation } from '../../settings-new/shared/DTOs/Salutation.Model';
import { CountrySubdivision } from '../../settings-new/shared/country-subdivision.model';
import { GeneralFieldLabels } from '../../shared/DTOs/general-field-label.dto';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { DanpheCache, MasterType } from '../../shared/danphe-cache-service-utility/cache-services';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_ServiceBillingContext } from '../../shared/shared-enums';
import { BillingBLService } from '../shared/billing.bl.service';
import { FreeVisit_DTO } from '../shared/dto/free-visit.dto';
import { PatientScheme_DTO } from '../shared/dto/patient-scheme.dto';
import { RegistrationScheme_DTO } from '../shared/dto/registration-scheme.dto';
import { PatientScheme } from '../shared/patient-map-scheme';
import { BillingOpPatientVM } from './bill-op-patientVM';

@Component({
  selector: 'bill-op-patient-add',
  templateUrl: './bill-op-patient-add.html',
  styles: [`padding-7-tp{padding-top: 7px;}`],
  styleUrls: ['./bill-op-patient-add.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})

// App Component class
export class BillOutpatientAddComponent {
  SalutationList = new Array<Salutation>();
  public NewPatient = new BillingOpPatientVM();
  public Country_All: any = null;
  public Districts_All: Array<CountrySubdivision> = [];
  public Districts_Filtered: Array<CountrySubdivision> = [];
  public SelectedDistrict: CountrySubdivision | any = new CountrySubdivision(); // Incase of update to handle the [object] [object], here we have assigned type as CountrySubdivision and any. SO that at the time of update we can assign CountrySubdivisionName to this Object
  public OlderAddressList: Array<any> = [];
  public loading: boolean = false;
  public GoToBilling: boolean = false;
  public IsPhoneMandatory: boolean = true;
  public ShowMunicipality: boolean = false;
  public PatientLastName: string = ""
  @Output() public CallBackAddClose: EventEmitter<Object> = new EventEmitter<Object>();
  public ShowLocalName: boolean = true;
  public MatchedPatientList: any;
  public ShowExistingPatientListPage: boolean = false;
  public serviceBillingContext: string = ENUM_ServiceBillingContext.OpBilling;

  public FreeVisit = new FreeVisit_DTO();
  public FreeVisitDepartmentId: number = 0;
  public RegistrationSchemeDetail = new RegistrationScheme_DTO();
  public PatientObj: any = null;
  public PatientSearchMinCharacterCount: number = 0;
  public ExistingPatientSearched: boolean = false;
  public showNam_Thar: boolean = true;
  public GeneralFieldLabel = new GeneralFieldLabels();
  constructor(
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _patientService: PatientService,
    private _billingBLService: BillingBLService,
    private _unicodeService: UnicodeService
  ) {
    this.SalutationList = this.coreService.SalutationData.filter(salutation => salutation.IsActive);
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
    this.showNam_Thar = this.GeneralFieldLabel.showNam_Thar;
    /*var Muncipalitylable = JSON.parse(coreService.Parameters.find(p => p.ParameterGroupName == "Patient" && p.ParameterName == "Municipality").ParameterValue);
    if (Muncipalitylable) {
      this.Muncipalitylable = Muncipalitylable.Municipality;
    }
     */
    this.Initialize();
    this.IsPhoneMandatory = this.coreService.GetIsPhoneNumberMandatory();
    this.ShowMunicipality = this.coreService.ShowMunicipality().ShowMunicipality;
    this.ShowLocalName = this.coreService.showLocalNameFormControl;
  }

  ngOnInit() {
    let country = this.coreService.GetDefaultCountry();
    let subDivision = this.coreService.GetDefaultCountrySubDivision();
    this.NewPatient.CountryId = country ? country.CountryId : null;
    this.SelectedDistrict.CountrySubDivisionId = this.NewPatient.CountrySubDivisionId = subDivision ? subDivision.CountrySubDivisionId : null;
    this.SelectedDistrict.CountrySubDivisionName = this.NewPatient.CountrySubDivisionName = subDivision ? subDivision.CountrySubDivisionName : null;
    this.setFocusById("newPatFirstName");
    this.PhoneNumberMandatory();
  }

  Initialize(): void {
    this.Country_All = DanpheCache.GetData(MasterType.Country, null);
    this.Districts_All = DanpheCache.GetData(MasterType.SubDivision, null);
    if (this.coreService.Masters.UniqueDataList && this.coreService.Masters.UniqueDataList.UniqueAddressList) {
      this.OlderAddressList = this.coreService.Masters.UniqueDataList.UniqueAddressList;
    }
    this.ReadFreeVisitDepartmentParameter();
    this.GetPatientSearchMinCharacterCountParameter();
  }
  ReadFreeVisitDepartmentParameter() {
    const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "FreeVisitDepartment");
    if (param) {
      const paramVal = JSON.parse(param.ParameterValue);
      if (paramVal) {
        this.FreeVisitDepartmentId = +paramVal.DepartmentId;
      }
    }
  }

  ClearEthnicGroup(): void {
    this.NewPatient.EthnicGroup = "";
  }

  DistrictListFormatter(data: any): string {
    let html = data["CountrySubDivisionName"];
    return html;
  }

  AssignSelectedDistrict(): void {
    if (this.SelectedDistrict && this.SelectedDistrict.CountrySubDivisionId) {
      this.NewPatient.CountrySubDivisionId = this.SelectedDistrict.CountrySubDivisionId;
      this.NewPatient.CountrySubDivisionName = this.SelectedDistrict.CountrySubDivisionName;
    }
  }

  CountryDDL_OnChange(): void {
    this.Districts_Filtered = this.Districts_All.filter(c => c.CountryId === +this.NewPatient.CountryId);
  }

  CalculateDob(): void {
    this.NewPatient.DateOfBirth = this._patientService.CalculateDOB(Number(this.NewPatient.Age), this.NewPatient.AgeUnit);
  }

  CheckValiadtionAndRegisterNewPatient(goToBilling: boolean): void {
    this.GoToBilling = goToBilling;
    if (this.loading) {
      this.NewPatient.CountrySubDivisionId = this.SelectedDistrict ? this.SelectedDistrict.CountrySubDivisionId : null;
      for (let i in this.NewPatient.OutPatientValidator.controls) {
        this.NewPatient.OutPatientValidator.controls[i].markAsDirty();
        this.NewPatient.OutPatientValidator.controls[i].updateValueAndValidity();
        if (this.NewPatient.OutPatientValidator.controls[i].invalid) {
          this.loading = false;
          return this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Field "${i}" is missing!`]);
        }
      }

      // Extract and validate PolicyNo from the PatientScheme object
      if (this.RegistrationSchemeDetail && this.RegistrationSchemeDetail.IsMemberNumberCompulsory) {
        const policyNo = this.RegistrationSchemeDetail.PatientScheme.PolicyNo;
        if (!policyNo || policyNo.trim() === "") {
          this.loading = false;
          return this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Member Number is required to register ${this.RegistrationSchemeDetail.SchemeName} Scheme's Patient!`]
          );
        }
      }

      // If all fields are valid, continue with your logic here

      if (this.NewPatient.IsValid(undefined, undefined) && (this.NewPatient.CountrySubDivisionId !== null || this.NewPatient.CountrySubDivisionId !== undefined)) {
        if (!this.NewPatient.EthnicGroup) {//!Bibek This logic is separately added to specify separate error message fro ethnic group 
          this.loading = false;
          return this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Field "Ethnic Group" is missing!`]);
        }
        //check if middlename exists or not to append to Shortname
        let midName = this.NewPatient.MiddleName;
        if (midName) {
          midName = this.NewPatient.MiddleName.trim() + " ";
        } else {
          midName = "";
        }
        //removing extra spaces typed by the users
        this.NewPatient.FirstName = this.NewPatient.FirstName.trim();
        this.NewPatient.MiddleName = this.NewPatient.MiddleName ? this.NewPatient.MiddleName.trim() : null;
        this.NewPatient.LastName = this.NewPatient.LastName.trim();
        this.NewPatient.ShortName = this.NewPatient.FirstName + " " + midName + this.NewPatient.LastName;
        this.CheckExistingPatientsAndSubmit();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Some of the inputs are invalid. Please check and try again. !"]);
        this.loading = false;//re-enable the buttons after showing the error message.
      }
    }
  }

  CheckExistingPatientsAndSubmit(): void {
    if (!this.NewPatient.PatientId) {
      let age = this.NewPatient.Age + this.NewPatient.AgeUnit;
      this._billingBLService.GetExistedMatchingPatientList(this.NewPatient.FirstName, this.NewPatient.LastName, this.NewPatient.PhoneNumber, age, this.NewPatient.Gender)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
            this.MatchedPatientList = res.Results;
            this.ShowExistingPatientListPage = true;
            this.loading = false;
          }
          else {
            this.RegisterNewPatientAndCreateFreeVisit();
          }
        }, (err) => {
          this.loading = false;
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to add new Patient. Please try later !"]);
        });
    }
    else {
      this.RegisterNewPatientAndCreateFreeVisit();
    }
  }

  RegisterNewPatientAndCreateFreeVisit(): void {
    this.ConcatenateAgeAndUnit();
    this.FreeVisit = this.GenerateVisitObj(this.NewPatient);
    this._billingBLService.AddNewOutdoorPatientAndCreateFreeVisit(this.FreeVisit)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.loading = false;
          if (this.GoToBilling) {
            this.CallBackAddClose.emit({ action: "register-and-billing", data: res.Results, close: true });
          }
          else {
            this.CallBackAddClose.emit({ action: "register-only", data: res.Results, close: true });
          }
        }
        else if (res.Status === ENUM_DanpheHTTPResponses.Failed) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          this.persistPatientAge();
          this.loading = false
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to add new Patient. Please try later !"]);
          this.loading = false;
        }
      }, (err) => {
        this.loading = false;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to add new Patient. Please try later !"]);
      });
  }
  /**
   * Validates and processes the age input by removing any non-numeric characters and ensuring that the `Age` field is a valid numeric string.
   * The method expects the `Age` field to be a string with potential alphabetic characters (e.g., "30 years").
   * It strips out the alphabetic characters and assigns the numeric part to the `Age` field. If the input is invalid or empty, it defaults to '0'.
   * 
   * @remarks
   * This method is part of the patient form validation process to ensure that only the numeric part of the age is stored in the `Age` field.
   * The method modifies the `NewPatient.Age` property directly.
   * 
   * @returns {void} This method does not return anything. It modifies the `NewPatient.Age` field in place.
   */
  persistPatientAge() {
    const ageWithUnit = this.NewPatient.Age ? this.NewPatient.Age.trim() : '';
    const numericAge = ageWithUnit.replace(/[a-zA-Z]/g, '').trim();
    this.NewPatient.Age = numericAge ? numericAge : '0';
  }


  GenerateVisitObj(newPatient: BillingOpPatientVM): FreeVisit_DTO {
    if (newPatient) {
      let freeVisit = new FreeVisit_DTO();
      //* build Patient object
      freeVisit.Patient.PatientId = newPatient.PatientId;
      freeVisit.Patient.PatientCode = newPatient.PatientCode;
      freeVisit.Patient.Salutation = newPatient.Salutation;
      freeVisit.Patient.FirstName = newPatient.FirstName;
      freeVisit.Patient.MiddleName = newPatient.MiddleName;
      freeVisit.Patient.LastName = newPatient.LastName;
      freeVisit.Patient.Address = newPatient.Address;
      freeVisit.Patient.PhoneNumber = newPatient.PhoneNumber;
      freeVisit.Patient.Gender = newPatient.Gender;
      freeVisit.Patient.CountrySubDivisionId = newPatient.CountrySubDivisionId;
      freeVisit.Patient.CountrySubDivisionName = newPatient.CountrySubDivisionName;
      freeVisit.Patient.Age = newPatient.Age;
      freeVisit.Patient.AgeUnit = newPatient.AgeUnit;
      freeVisit.Patient.DateOfBirth = newPatient.DateOfBirth;
      freeVisit.Patient.Email = newPatient.Email;
      freeVisit.Patient.EthnicGroup = newPatient.EthnicGroup;
      freeVisit.Patient.CountryId = newPatient.CountryId;
      freeVisit.Patient.MunicipalityId = newPatient.MunicipalityId;
      freeVisit.Patient.WardNumber = newPatient.WardNumber;
      freeVisit.Patient.PatientNameLocal = newPatient.PatientNameLocal;
      freeVisit.Patient.ShortName = newPatient.ShortName;

      //* build Visit obj
      freeVisit.Visit.PatientId = freeVisit.Patient.PatientId;
      freeVisit.Visit.PatientCode = freeVisit.Patient.PatientCode;
      freeVisit.Visit.DepartmentId = this.FreeVisitDepartmentId;
      freeVisit.Visit.SchemeId = this.RegistrationSchemeDetail.SchemeId;
      freeVisit.Visit.PriceCategoryId = this.RegistrationSchemeDetail.PriceCategoryId;
      freeVisit.Visit.ClaimCode = this.RegistrationSchemeDetail.ClaimCode;
      freeVisit.Patient.PatientScheme = this.GeneratePatientSchemeMap(this.RegistrationSchemeDetail.PatientScheme);
      return freeVisit;

    }
  }
  GeneratePatientSchemeMap(patientSchemeObj: PatientScheme_DTO): PatientScheme {
    const patientScheme = new PatientScheme();

    patientScheme.PatientId = patientSchemeObj.PatientId !== null ? patientSchemeObj.PatientId : 0;
    patientScheme.PatientCode = patientSchemeObj.PatientCode !== null ? patientSchemeObj.PatientCode : null;
    patientScheme.SchemeId = patientSchemeObj.SchemeId;
    patientScheme.PolicyNo = patientSchemeObj.PolicyNo;
    patientScheme.PatientSchemeValidator.get("PolicyNo").setValue(patientScheme.PolicyNo);
    patientScheme.PolicyHolderUID = patientSchemeObj.PolicyHolderUID;
    patientScheme.OpCreditLimit = patientSchemeObj.OpCreditLimit;
    patientScheme.IpCreditLimit = patientSchemeObj.IpCreditLimit;
    patientScheme.GeneralCreditLimit = patientSchemeObj.GeneralCreditLimit;
    patientScheme.PolicyHolderEmployerName = patientSchemeObj.PolicyHolderEmployerName;
    patientScheme.LatestClaimCode = patientSchemeObj.LatestClaimCode;
    patientScheme.OtherInfo = patientSchemeObj.OtherInfo;
    patientScheme.PolicyHolderEmployerID = patientSchemeObj.PolicyHolderEmployerID;
    patientScheme.SubSchemeId = patientSchemeObj.SubSchemeId;
    patientScheme.RegistrationCase = patientSchemeObj.RegistrationCase;

    return patientScheme;
  }

  //we're storing Age and Age unit in a single column.
  ConcatenateAgeAndUnit(): void {
    if (this.NewPatient.Age && this.NewPatient.AgeUnit) {
      this.NewPatient.Age = this.NewPatient.Age + this.NewPatient.AgeUnit;
    }
  }

  CloseAddNewPatPopUp(): void {
    this.CallBackAddClose.emit({ close: true });
  }

  Translate(language): void {
    this._unicodeService.translate(language);
    if (language === "english") {
      let localName = <HTMLInputElement>document.getElementById("patNameLocal");
      let ipLocalName = localName.value;
      this.NewPatient.PatientNameLocal = ipLocalName.length > 0 ? ipLocalName : "";
    }
  }
  //if the user selects any patient from the matched list of patient. assign it to current patient instead of creating a new patient.
  AssignMatchedPatientAndProceed(PatientId): void {
    let existingPatient = this.MatchedPatientList.find(a => a.PatientId === +PatientId);
    existingPatient.CountrySubDivisionName = this.Districts_All.find(a => a.CountrySubDivisionId === +existingPatient.CountrySubDivisionId).CountrySubDivisionName;
    this.CallBackAddClose.emit({ action: "register-and-billing", data: existingPatient, close: true });
    //this.billingBLService.GetPatientById(PatientId)
    //  .subscribe(res => {
    //    if (res.Status == 'OK') {
    //      //patient Service has Common SetPatient method For Setting Pattient Deatils
    //      //this common method is for Code reusability
    //      this.loading = false;
    //      this.patientService.setGlobal(res.Results),

    //        //this showExstingPatientList is false because popup window should be closed after navigate to /Patient/RegisterPatient/BasicInfo in set patient method of Patient service
    //        this.showExstingPatientListPage = false;

    //      //go to route if all the value are mapped with the patient service
    //      this.router.navigate(['/Patient/RegisterPatient/BasicInfo']);
    //    }
    //    else {
    //      // alert(res.ErrorMessage);
    //      this.msgBoxServ.showMessage("error", [res.ErrorMessage]);

    //    }
    //  },


    //    err => {
    //      this.msgBoxServ.showMessage("error", ["failed to get selected patient"]);
    //      //alert('failed to get selected patient');

    //    });

  }

  EmitCloseAction($event): void {
    let action = $event.action;
    let data = $event.data;
    if (action === "use-existing") {
      let patientId = data;
      this.AssignMatchedPatientAndProceed(patientId); //Match Existing Patient and process
    }
    else if (action === "add-new") {
      this.RegisterNewPatientAndCreateFreeVisit();
    }
    else if (action === "close") {
      this.ShowExistingPatientListPage = false;
    }
    this.loading = false;
  }

  //common function to set focus on  given Element.
  setFocusById(targetId: string, waitingTimeinMS: number = 10): void {
    this.coreService.FocusInputById(targetId);
  }

  PhoneNumberMandatory(): void {
    if (!this.IsPhoneMandatory) {
      this.NewPatient.UpdateValidator("off", "PhoneNumber");
    }
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CallBackAddClose.emit({ close: true });
    }
  }

  UpdateMunicipality(event): void {
    if (event) {
      this.NewPatient.MunicipalityId = event.data ? event.data.MunicipalityId : null;
    }
  }

  OnLastNameChanged($event): void {
    if ($event) {
      const lastName = $event.target.value;
      this.PatientLastName = lastName;
    }
  }

  OnEthnicGroupChangeCallBack(ethnicGroup): void {
    if (ethnicGroup) {
      this.NewPatient.EthnicGroup = ethnicGroup.ethnicGroup;
    }
  }

  OnRegistrationSchemeChanged(scheme: RegistrationScheme_DTO): void {
    this.RegistrationSchemeDetail = scheme;
    // Ensure PatientScheme is initialized if it doesn't exist
    if (!this.RegistrationSchemeDetail.PatientScheme) {
      this.RegistrationSchemeDetail.PatientScheme = new PatientScheme_DTO();
    }
  }

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this._billingBLService.GetPatientsWithVisitsInfo(keyword);
  }


  PatientInfoChanged() {
    if (this.PatientObj && typeof (this.PatientObj) == "object") {
      this.ExistingPatientSearched = true;
      this.NewPatient.FirstName = this.PatientObj.FirstName;
      this.NewPatient.MiddleName = this.PatientObj.MiddleName;
      this.NewPatient.LastName = this.PatientObj.LastName;
      this.NewPatient.DateOfBirth = this.PatientObj.DateOfBirth;
      this.NewPatient.Age = this.PatientObj.Age ? this.PatientObj.Age.replace(/[a-zA-Z]/g, '') : 0;
      this.NewPatient.AgeUnit = "Y";
      this.CalculateDob();
      this.NewPatient.Gender = this.PatientObj.Gender;
      this.NewPatient.EthnicGroup = this.PatientObj.EthnicGroup;
      this.PatientLastName = this.NewPatient.LastName;
      this.NewPatient.PhoneNumber = this.PatientObj.PhoneNumber;
      this.NewPatient.CountryId = this.PatientObj.CountryId;
      this.NewPatient.CountrySubDivisionId = this.PatientObj.CountrySubDivisionId;
      this.NewPatient.CountrySubDivisionName = this.PatientObj.CountrySubDivisionName;
      this.NewPatient.MunicipalityId = this.PatientObj.MunicipalityId;
      this.NewPatient.WardNumber = this.PatientObj.WardNumber;
      this.NewPatient.Address = this.PatientObj.Address;
      this.NewPatient.PatientNameLocal = this.PatientObj.PatientNameLocal;
      this.NewPatient.Email = this.PatientObj.Email;
      this.NewPatient.PatientId = this.PatientObj.PatientId;
      this.NewPatient.PatientCode = this.PatientObj.PatientCode;
      this.NewPatient.Salutation = this.PatientObj.Salutation;
      this.AssignDistrict();
      this.DisableInputFields();
    }
  }

  AssignDistrict(): void {
    if (this.NewPatient.CountrySubDivisionId) {
      let selectedDistrict = this.Districts_Filtered.find(d => d.CountrySubDivisionId === this.NewPatient.CountrySubDivisionId);
      if (selectedDistrict) {
        this.SelectedDistrict = selectedDistrict.CountrySubDivisionName;
      }
    }
  }

  DisableInputFields() {
    if (this.ExistingPatientSearched) {
      this.NewPatient.EnableControl("FirstName", false);
      this.NewPatient.EnableControl("LastName", false);
      this.NewPatient.EnableControl("MiddleName", false);
      this.NewPatient.EnableControl("Age", false);
      this.NewPatient.EnableControl("DateOfBirth", false);
      this.NewPatient.EnableControl("Gender", false);
      this.NewPatient.EnableControl("ItemName", false);
      this.NewPatient.EnableControl("CountrySubDivisionId", false);
      this.NewPatient.EnableControl("Email", false);
      if (this.NewPatient.PhoneNumber) {
        this.NewPatient.EnableControl("PhoneNumber", false);
      }
      this.NewPatient.EnableControl("CountryId", false);
      this.NewPatient.EnableControl("Address", false);
      this.NewPatient.EnableControl("PANNumber", false);
      this.NewPatient.EnableControl("MembershipTypeId", false);
    }
  }

  GetPatientSearchMinCharacterCountParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Common' && a.ParameterName === 'PatientSearchMinCharacterCount');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.PatientSearchMinCharacterCount = parseInt(obj.MinCharacterCount);
    }
  }
}
