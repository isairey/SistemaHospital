import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { FreeVisit_DTO } from '../../../billing/shared/dto/free-visit.dto';
import { PatientScheme_DTO } from '../../../billing/shared/dto/patient-scheme.dto';
import { RegistrationScheme_DTO } from '../../../billing/shared/dto/registration-scheme.dto';
import { PatientScheme } from '../../../billing/shared/patient-map-scheme';
import { CoreService } from '../../../core/shared/core.service';
import { PatientService } from '../../../patients/shared/patient.service';
import { PatientsBLService } from '../../../patients/shared/patients.bl.service';
import { CountrySubdivision } from '../../../settings-new/shared/country-subdivision.model';
import { Salutation } from '../../../settings-new/shared/DTOs/Salutation.Model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { DanpheCache, MasterType } from '../../../shared/danphe-cache-service-utility/cache-services';
import { GeneralFieldLabels } from '../../../shared/DTOs/general-field-label.dto';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_ServiceBillingContext } from '../../../shared/shared-enums';
import { PharmacyBLService } from '../../shared/pharmacy.bl.service';
import { PHRMPatient } from '../../shared/phrm-patient.model';

@Component({
  selector: 'phrm-op-patient-add',
  templateUrl: './phrm-op-patient-add.html',
  styleUrls: ['./phrm-op-patient-add.component.css'],
  styles: [`padding-7-tp{padding-top: 7px;}`],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PhrmOutpatientAddComponent {
  //master data for form filling
  public countryList: any = null;
  public districtList: Array<CountrySubdivision> = [];
  public districtListFiltered: Array<CountrySubdivision> = [];
  public selectedDistrict: CountrySubdivision | any = new CountrySubdivision(); // Incase of update to handle the [object] [object], here we have assigned type as CountrySubdivision and any. SO that at the time of update we can assign CountrySubdivisionName to this Object
  public olderAddressList: Array<any> = [];

  @Input("patient-info") public newPatient: PHRMPatient = new PHRMPatient();
  @Input("showPopUp") public showPopUp: any;

  @Output("call-back-close") callBackClose: EventEmitter<any> = new EventEmitter();
  @Output("call-back-add-update") callBackAddUpdate: EventEmitter<any> = new EventEmitter();

  public EditMode: boolean = false;
  public loading: boolean = false;

  public matchedPatientList: any;
  public showExstingPatientListPage: boolean = false;
  public showMunicipality: boolean = false;
  public serviceBillingContext: string = ENUM_ServiceBillingContext.OpPharmacy;
  public RegistrationSchemeDetail = new RegistrationScheme_DTO();
  public FreeVisit = new FreeVisit_DTO();
  public FreeVisitDepartmentId: number = 0;
  public PatientLastName: string = "";
  public ExistingPatientSearched: boolean = false;
  public PatientObj: any = null;
  public PatientSearchMinCharacterCount: number = 0;

  public GeneralFieldLabel = new GeneralFieldLabels();
  SalutationList = new Array<Salutation>();

  constructor(public changeDetector: ChangeDetectorRef, public coreService: CoreService, public patientService: PatientService, public pharmacyBLService: PharmacyBLService, public msgBoxServ: MessageboxService, public patientBlService: PatientsBLService) {
    this.SalutationList = this.coreService.SalutationData.filter(salutation => salutation.IsActive);
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();

    this.GetMasterData();
    this.showMunicipality = this.coreService.ShowMunicipality().ShowMunicipality;
    this.ReadFreeVisitDepartmentParameter();
    this.GetPatientSearchMinCharacterCountParameter();
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();

  }

  ngOnInit() {
    this.CheckForEditMode();
    this.AssignDefaultCountryAndSubDivision();
    this.ModifyValidatorsInPatientModel();
    this.setFocusById("newPatFirstName");
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

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.pharmacyBLService.GetPatients(keyword, false);
  }
  private AssignDefaultCountryAndSubDivision() {
    let country = this.coreService.GetDefaultCountry();
    let subDivision = this.coreService.GetDefaultCountrySubDivision();
    this.newPatient.CountryId = country ? country.CountryId : null;
    if (this.newPatient.CountrySubDivisionId != 0) {
      this.selectedDistrict.CountrySubDivisionId = this.newPatient.CountrySubDivisionId;
      this.selectedDistrict.CountrySubDivisionName = this.newPatient.CountrySubDivisionName;
    } else {
      this.selectedDistrict.CountrySubDivisionId = this.newPatient.CountrySubDivisionId = subDivision ? subDivision.CountrySubDivisionId : null;
      this.selectedDistrict.CountrySubDivisionName = this.newPatient.CountrySubDivisionName = subDivision ? subDivision.CountrySubDivisionName : null;
    }
  }

  private ModifyValidatorsInPatientModel() {
    this.newPatient.PHRMPatientValidator.addControl("CountryId", new FormControl("", Validators.required));
    this.newPatient.PHRMPatientValidator.addControl("CountrySubDivisionId", new FormControl("", Validators.required));
    this.newPatient.PHRMPatientValidator.markAsPristine();
    this.newPatient.PHRMPatientValidator.markAsUntouched();
  }

  private CheckForEditMode() {
    //First Name will be empty for the first time patient is being added.
    if (this.newPatient.FirstName != "" && this.newPatient.FirstName != 'Anonymous') {
      this.EditMode = true;
      this.DivideAgeAndAgeUnit();
    }
    else {
      this.newPatient = new PHRMPatient();
    }

  }

  private DivideAgeAndAgeUnit() {
    if (this.newPatient.Age) {
      var splitData = [];
      if (this.newPatient.Age.includes("Y")) {
        splitData = this.newPatient.Age.split("Y");
        this.newPatient.Age = splitData[0];
        this.newPatient.AgeUnit = "Y";
      }
      else if (this.newPatient.Age.includes("M")) {
        splitData = this.newPatient.Age.split("M");
        this.newPatient.Age = splitData[0];
        this.newPatient.AgeUnit = "M";
      }
      else if (this.newPatient.Age.includes("D")) {
        splitData = this.newPatient.Age.split("D");
        this.newPatient.Age = splitData[0];
        this.newPatient.AgeUnit = "D";
      }
    }
  }

  public GetMasterData() {
    this.countryList = DanpheCache.GetData(MasterType.Country, null);
    this.districtList = DanpheCache.GetData(MasterType.SubDivision, null);
    if (this.coreService.Masters.UniqueDataList && this.coreService.Masters.UniqueDataList.UniqueAddressList) {
      this.olderAddressList = this.coreService.Masters.UniqueDataList.UniqueAddressList;
    }
  }

  public districtListFormatter(data: any): string {
    let html = data["CountrySubDivisionName"];
    return html;
  }

  public OnDistrictChange() {
    if (this.selectedDistrict && this.selectedDistrict.CountrySubDivisionId) {
      this.newPatient.CountrySubDivisionId = this.selectedDistrict.CountrySubDivisionId;
      this.newPatient.CountrySubDivisionName = this.selectedDistrict.CountrySubDivisionName;
    }
  }

  public OnCountryChange() {
    this.districtListFiltered = this.districtList.filter(c => c.CountryId == this.newPatient.CountryId);
  }

  public CalculateDob() {
    this.newPatient.DateOfBirth = this.patientService.CalculateDOB(Number(this.newPatient.Age), this.newPatient.AgeUnit);
  }

  async CheckValidationsAndSave() {
    this.loading = false;
    for (let i in this.newPatient.PHRMPatientValidator.controls) {
      this.newPatient.PHRMPatientValidator.controls[i].markAsDirty();
      this.newPatient.PHRMPatientValidator.controls[i].updateValueAndValidity();
    }

    let messages = [];
    if (this.newPatient.FirstName.trim() === '') {
      messages.push("First Name is required.");
    }

    if (this.newPatient.LastName.trim() === '') {
      messages.push("Last Name is required.");
    }

    if (!this.newPatient.Gender) {
      messages.push("Gender is required");
    }

    if (!this.newPatient.Age) {
      messages.push("Age is required");
    }
    if (!this.newPatient.EthnicGroup) {
      messages.push("Ethnic Group is required");
    }

    if (!this.newPatient.CountryId) {
      messages.push("Country is required");
    }

    if (!this.newPatient.CountrySubDivisionId) {
      messages.push("District is required");
      return;
    }
    if (messages && messages.length > 0) {
      this.msgBoxServ.showMessage("error", messages);
      return;
    }



    //removing extra spaces typed by the users
    this.newPatient.FirstName = this.newPatient.FirstName.trim();
    this.newPatient.MiddleName = (this.newPatient.MiddleName == null) ? "" : this.newPatient.MiddleName.trim();
    this.newPatient.LastName = this.newPatient.LastName.trim();
    this.newPatient.ShortName = this.newPatient.FirstName + " " + ((this.newPatient.MiddleName != "") ? (this.newPatient.MiddleName + " ") : "") + this.newPatient.LastName;
    this.newPatient.CountrySubDivisionId = typeof (this.selectedDistrict) === 'object' ? (this.selectedDistrict.CountrySubDivisionId ? this.selectedDistrict.CountrySubDivisionId : null) : (this.newPatient.CountrySubDivisionId ? this.newPatient.CountrySubDivisionId : null);
    if (this.newPatient.CountrySubDivisionId == null) {
      this.msgBoxServ.showMessage("error", ["Please select valid district."]);
    }
    else {
      if ((await this.IsPatientExistInDb()) == false) {
        this.CreateFreeVisitAndSavePatient();
      }
    }
    // if (this.newPatient.IsValidCheck(undefined, undefined)) {
    //   //removing extra spaces typed by the users
    //   this.newPatient.FirstName = this.newPatient.FirstName.trim();
    //   this.newPatient.MiddleName = (this.newPatient.MiddleName == null) ? "" : this.newPatient.MiddleName.trim();
    //   this.newPatient.LastName = this.newPatient.LastName.trim();
    //   this.newPatient.ShortName = this.newPatient.FirstName + " " + ((this.newPatient.MiddleName != "") ? (this.newPatient.MiddleName + " ") : "") + this.newPatient.LastName;
    //   this.newPatient.CountrySubDivisionId = this.selectedDistrict ? this.selectedDistrict.CountrySubDivisionId : null;
    //   if (this.newPatient.CountrySubDivisionId == null) {
    //     this.msgBoxServ.showMessage("error", ["Please select valid district."]);
    //   }
    //   else {
    //     if ((await this.IsPatientExistInDb()) == false) {
    //       this.CreateFreeVisitAndSavePatient();
    //     }
    //   }
    // } else {
    //   this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["There is some issue with the data"]);
    // }
  }

  private CreateFreeVisitAndSavePatient() {
    this.ConcatenateAgeAndAgeUnit();

    //Save in database.
    //create visit and patient object
    this.FreeVisit = this.GenerateVisitObj(this.newPatient);
    this.pharmacyBLService.AddNewOutdoorPatientAndCreateFreeVisit(this.FreeVisit)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.loading = false;
          const freeVisitObj = res.Results;
          this.callBackAddUpdate.emit({ currentPatient: freeVisitObj });
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to add new Patient." + res.ErrorMessage]);
          this.persistPatientAge();
          this.loading = false;
        }
      }, (err) => {
        this.loading = false;
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to add new Patient. Please try later !"]);
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
    const ageWithUnit = this.newPatient.Age ? this.newPatient.Age.trim() : '';
    const numericAge = ageWithUnit.replace(/[a-zA-Z]/g, '').trim();
    this.newPatient.Age = numericAge ? numericAge : '0';
  }
  public IsPatientExistInDb(): Promise<boolean> {
    this.loading = true;
    //converting Observable to Promise in order to wait for the response from api call
    return this.pharmacyBLService.GetExistedMatchingPatientList(this.newPatient.FirstName, this.newPatient.LastName, this.newPatient.PhoneNumber)
      .toPromise()
      .then(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
          this.matchedPatientList = res.Results;
          this.showExstingPatientListPage = true;
          return true;
        }
        else {
          return false;
        }
      });
  }

  //we're storing Age and Age unit in a single column.
  public ConcatenateAgeAndAgeUnit() {
    //if age unit is already there in Age, do not concatenate again.
    if (this.newPatient.Age) {
      if (["Y", "M", "D"].includes(this.newPatient.Age.toString()) == false) {
        this.newPatient.Age = this.newPatient.Age + this.newPatient.AgeUnit;
      }

    }

  }
  public Close() {
    this.ResetPatient();
    this.showPopUp = false;
    this.callBackClose.emit();
  }
  public hotkeys(event) {
    //For ESC key => close the pop up
    if (event.keyCode == 27) {
      this.Close();
    }
  }

  private ResetPatient() {
    this.newPatient = new PHRMPatient();
  }

  //if the user selects any patient from the matched list of patient. assign it to current patient instead of creating a new patient.
  AssignMatchedPatientAndProceed(PatientId) {
    let existingPatient = this.matchedPatientList.find(a => a.PatientId == PatientId);
    existingPatient.CountrySubDivisionName = this.districtList.find(a => a.CountrySubDivisionId == existingPatient.CountrySubDivisionId).CountrySubDivisionName;
    this.callBackAddUpdate.emit({ currentPatient: existingPatient });
  }

  emitCloseAction($event) {
    var action = $event.action;
    var data = $event.data;

    if (action == "use-existing") {
      let patientId = data;
      this.AssignMatchedPatientAndProceed(patientId); //Match Existing Patient and process
    }
    else if (action == "add-new") {
      this.CreateFreeVisitAndSavePatient();
    }
    else if (action == "close") {
      this.showExstingPatientListPage = false;
    }
  }

  /**
    * @method setFocusById
    * @param {targetId} Id to be focused
    * @param {waitingTimeinMS} waititng time for the focus to be delayed
    * Set Focus to the id provided
  */
  setFocusById(targetId: string, waitingTimeinMS: number = 10) {
    this.coreService.FocusInputById(targetId);
  }

  public updateMunicipality(event) {
    if (event && event.data) {
      this.newPatient.MunicipalityId = event.data.MunicipalityId;
    }
    else {
      this.newPatient.MunicipalityId = null;
    }
  }

  OnRegistrationSchemeChanged(scheme: RegistrationScheme_DTO): void {
    this.RegistrationSchemeDetail = scheme;
  }

  GenerateVisitObj(newPatient: PHRMPatient): FreeVisit_DTO {
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
      freeVisit.Patient.CountryId = newPatient.CountryId;
      freeVisit.Patient.MunicipalityId = newPatient.MunicipalityId ? newPatient.MunicipalityId : null;
      freeVisit.Patient.PANNumber = newPatient.PANNumber;
      freeVisit.Patient.ShortName = newPatient.ShortName;
      freeVisit.Patient.EthnicGroup = newPatient.EthnicGroup;

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

  OnLastNameChanged($event): void {
    if ($event) {
      const lastName = $event.target.value;
      this.PatientLastName = lastName;
    }
  }

  OnEthnicGroupChangeCallBack(ethnicGroup): void {
    if (ethnicGroup) {
      this.newPatient.EthnicGroup = ethnicGroup.ethnicGroup;
    }
  }

  ClearEthnicGroup(): void {
    this.newPatient.EthnicGroup = "";
  }

  PatientInfoChanged() {
    if (this.PatientObj && typeof (this.PatientObj) == "object") {
      this.ExistingPatientSearched = true;
      this.newPatient.FirstName = this.PatientObj.FirstName;
      this.newPatient.MiddleName = this.PatientObj.MiddleName;
      this.newPatient.LastName = this.PatientObj.LastName;
      this.newPatient.DateOfBirth = this.PatientObj.DateOfBirth;
      this.newPatient.Age = this.PatientObj.Age ? this.PatientObj.Age.replace(/[a-zA-Z]/g, '') : 0;
      this.newPatient.AgeUnit = "Y";
      this.CalculateDob();
      this.newPatient.Gender = this.PatientObj.Gender;
      this.newPatient.EthnicGroup = this.PatientObj.EthnicGroup;
      this.PatientLastName = this.newPatient.LastName;
      this.newPatient.PhoneNumber = this.PatientObj.PhoneNumber;
      this.newPatient.CountryId = this.PatientObj.CountryId;
      this.newPatient.MunicipalityId = this.PatientObj.MunicipalityId;
      this.newPatient.CountrySubDivisionId = this.PatientObj.CountrySubDivisionId;
      this.newPatient.CountrySubDivisionName = this.PatientObj.CountrySubDivisionName;
      this.newPatient.Address = this.PatientObj.Address;
      this.newPatient.PatientId = this.PatientObj.PatientId;
      this.newPatient.PatientCode = this.PatientObj.PatientCode;
      this.newPatient.Salutation = this.PatientObj.Salutation;
      this.AssignSubDivision();
      this.DisableInputFields();
    }
  }

  AssignSubDivision(): void {
    if (this.newPatient.CountrySubDivisionId) {
      let selectedCountrySubDivision = this.districtList.find(d => d.CountrySubDivisionId === this.newPatient.CountrySubDivisionId);
      if (selectedCountrySubDivision) {
        this.selectedDistrict = selectedCountrySubDivision.CountrySubDivisionName;
        this.selectedDistrict = selectedCountrySubDivision.CountrySubDivisionName;
      }
      else {
        this.AssignDefaultCountryAndSubDivision();
      }
    }
  }


  DisableInputFields() {
    if (this.ExistingPatientSearched) {
      this.newPatient.EnableControl("FirstName", false);
      this.newPatient.EnableControl("LastName", false);
      this.newPatient.EnableControl("MiddleName", false);
      this.newPatient.EnableControl("Age", false);
      this.newPatient.EnableControl("DateOfBirth", false);
      this.newPatient.EnableControl("Gender", false);
      this.newPatient.EnableControl("ItemName", false);
      this.newPatient.EnableControl("CountrySubDivisionId", false);
      this.newPatient.EnableControl("Email", false);
      if (this.newPatient.PhoneNumber) {
        this.newPatient.EnableControl("PhoneNumber", false);
      }
      this.newPatient.EnableControl("CountryId", false);
      this.newPatient.EnableControl("Address", false);
      this.newPatient.EnableControl("PANNumber", false);
      this.newPatient.EnableControl("MembershipTypeId", false);
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
