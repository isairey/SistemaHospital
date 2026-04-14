import { ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { VisitService } from '../../appointments/shared/visit.service';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { ClinicalPatientService } from '../../clinical-new/shared/clinical-patient.service';
import { PatientDetails_DTO } from '../../clinical-new/shared/dto/patient-cln-detail.dto';
import { CoreService } from '../../core/shared/core.service';
import { Patient } from '../../patients/shared/patient.model';
import { PatientService } from '../../patients/shared/patient.service';
import { PatientsBLService } from '../../patients/shared/patients.bl.service';
import { Municipality } from '../../shared/address-controls/municipality-model';
import { GridEmitModel } from '../../shared/danphe-grid/grid-emit.model';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_EscapeKey, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import EmergencyGridColumnSettings from '../shared/emergency-gridcol-settings';
import { EmergencyPatientCases } from '../shared/emergency-patient-cases.model';
import { EmergencyPatientModel } from '../shared/emergency-patient.model';
import { EmergencyBLService } from '../shared/emergency.bl.service';


@Component({
  selector: 'er-patient-list',
  templateUrl: './er-patients.html',
  host: { '(window:keydown)': 'hotkeys($event)' }

})

// App Component class
export class ERPatientListComponent {
  public loading: boolean = false;
  public showERPatRegistration: boolean = false;
  public showTriageOption: boolean = false;
  public showAddVitals: boolean = false;

  public selectedERPatientToEdit: EmergencyPatientModel = new EmergencyPatientModel();
  public ERPatients: Array<EmergencyPatientModel> = new Array<EmergencyPatientModel>();
  public allPatients: Array<Patient> = new Array<Patient>();
  public visitId: number = null;
  public showVitalsList: boolean = true;
  public filteredData: any;

  public ERPatientGridCol: Array<any> = null;
  public index: number = null;

  public showSearchPatient: boolean = false;
  public existingPatientSelected: boolean = false;

  public selectedExistingPatient: Patient = null;
  public caseIdList: Array<number> = new Array<number>();
  public casesList = [];
  public municipalities: Array<Municipality> = [];
  public allKeys: Array<string>;
  public showUploadConsent = {

    "upload_files": false,

    "remove": false,

  };
  public loadingScreen: boolean = false;
  public showNewRegistrationEmergency: boolean = false;
  ERPatientCases: EmergencyPatientCases = new EmergencyPatientCases();
  constructor(public changeDetector: ChangeDetectorRef, public msgBoxServ: MessageboxService,
    public patientServ: PatientService, public visitServ: VisitService,
    public patientBlService: PatientsBLService,
    public emergencyBLService: EmergencyBLService, public coreService: CoreService,
    public billingBLService: BillingBLService, private _selectedPatientService: ClinicalPatientService
  ) {
    this.ERPatientGridCol = EmergencyGridColumnSettings.ERPatientList;
    this.GetERPatientList();
    this.GetAddRegistraionEmergencyParameter();
    //this.GetAllExistingPatients();
  }
  ngOnInit() {
    this.allKeys = Object.keys(this.showUploadConsent);
  }

  public GetERPatientList() {
    this.loadingScreen = true;
    var id = this.caseIdList ? this.caseIdList : null;
    this.emergencyBLService.GetAllERPatients(id[0]).finally(() => { this.loadingScreen = false; })
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.ERPatients = res.Results;
          if (this.ERPatients && this.ERPatients.length > 0) {
            this.ERPatients.forEach((pat) => {
              pat.Age = this.coreService.CalculateAge(pat.DateOfBirth);
            });
          }
          this.filteredData = this.ERPatients;
          if (this.caseIdList[0] == 6) {
            this.filterNestedDetails();
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Get Emergency PatientList !!"]);
        }
      });
  }

  public GetAllExistingPatients() {
    this.emergencyBLService.GetAllExistingPatients()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.allPatients = res.Results;
          this.showSearchPatient = true;
        }
        else {
          this.msgBoxServ.showMessage("Failed", ["Cannot Get ExistingPatientList !!"]);
        }
      });
  }

  public NewERPatientRegistration() {
    this.HideParentBodyScroll();
    this.selectedERPatientToEdit = null;
    this.showERPatRegistration = true;
  }

  public HideParentBodyScroll() {
    var body = document.getElementsByTagName("body")[0];
    body.style.overflow = "hidden";
  }

  //Closes the Registration PopUp if clicked Outside popup window
  public ParentOfPopUpClicked($event) {
    var currentTarget = $event.currentTarget;
    var target = $event.target;
    if (target == currentTarget) {
      this.CloseERRegistrationPopUp();
    }
  }

  public ReturnFromAllERPatientActions($event) {
    this.CloseERRegistrationPopUp();
    if ($event.submit) {
      this.GetERPatientList();
      this.existingPatientSelected = false;
      this.showTriageOption = false;
    }
  }

  public AddNewDataToGrid(ERPatient: EmergencyPatientModel) {

  }

  public CloseERRegistrationPopUp() {
    var body = document.getElementsByTagName("body")[0];
    body.style.overflow = "inherit";
    this.changeDetector.detectChanges();
    this.showERPatRegistration = false;
    this.showTriageOption = false;
    this.existingPatientSelected = false;
    this.showAddVitals = false;
  }

  EditAction(event: GridEmitModel) {
    switch (event.Action) {
      case "edit": {
        this.HideParentBodyScroll();
        this.selectedERPatientToEdit = new EmergencyPatientModel();
        this.index = event.RowIndex;//assign index
        this.showERPatRegistration = false;
        this.changeDetector.detectChanges();
        this.selectedERPatientToEdit = Object.assign(this.selectedERPatientToEdit, event.Data);
        if (event.Data.ModeOfArrivalId) {
          this.selectedERPatientToEdit.ModeOfArrival = event.Data.ModeOfArrivalId;
        }
        this.GetErPatientCase(event.Data.ERPatientId).then(() => {
          this.showERPatRegistration = true;
          this.changeDetector.detectChanges();
        });
      }
        break;
      case "triage": {
        this.HideParentBodyScroll();
        this.selectedERPatientToEdit = new EmergencyPatientModel();
        this.showTriageOption = false;
        this.changeDetector.detectChanges();
        this.selectedERPatientToEdit = Object.assign(this.selectedERPatientToEdit, event.Data);
        this.showTriageOption = true;
      }
        break;
      case "add-vitals": {
        this.HideParentBodyScroll();
        this.selectedERPatientToEdit = new EmergencyPatientModel();
        this.showAddVitals = false;
        this.changeDetector.detectChanges();
        this.selectedERPatientToEdit = Object.assign(this.selectedERPatientToEdit, event.Data);
        const updatedPatient = new PatientDetails_DTO();
        updatedPatient.PatientId = this.selectedERPatientToEdit.PatientId;
        updatedPatient.PatientVisitId = this.selectedERPatientToEdit.PatientVisitId;
        this.visitId = updatedPatient.PatientVisitId;
        this._selectedPatientService.SelectedPatient = updatedPatient;
        this.showAddVitals = true;
      }
        break;
      case "consent": {
        this.HideParentBodyScroll();
        this.showUploadConsent.upload_files = true;
        this.selectedERPatientToEdit = new EmergencyPatientModel();
        this.selectedERPatientToEdit = Object.assign(this.selectedERPatientToEdit, event.Data);
        this.allKeys.forEach(k => this.showUploadConsent[k] = (k != "upload_files") ? false : true);
      }
      default:
        break;
    }
  }
  CloseVitalsPopUp() {
    this.showAddVitals = false;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {

    return this.billingBLService.GetPatientsWithVisitsInfo(keyword);

  };

  public AddCurrentExistingPatient() {
    this.selectedERPatientToEdit = new EmergencyPatientModel();

    this.selectedERPatientToEdit.EnableControl("FirstName", false);
    this.selectedERPatientToEdit.EnableControl("LastName", false);
    this.selectedERPatientToEdit.EnableControl("Gender", false);
    this.selectedERPatientToEdit.FirstName = this.selectedExistingPatient.FirstName;
    this.selectedERPatientToEdit.LastName = this.selectedExistingPatient.LastName;
    this.selectedERPatientToEdit.MiddleName = this.selectedExistingPatient.MiddleName;
    this.selectedERPatientToEdit.Gender = this.selectedExistingPatient.Gender;
    this.selectedERPatientToEdit.FullName = this.selectedExistingPatient.ShortName;
    this.selectedERPatientToEdit.EthnicGroup = this.selectedExistingPatient.EthnicGroup;
    this.selectedERPatientToEdit.Address = this.selectedExistingPatient.Address;
    this.selectedERPatientToEdit.Age = this.selectedExistingPatient.Age;
    this.selectedERPatientToEdit.ContactNo = this.selectedExistingPatient.PhoneNumber;
    this.selectedERPatientToEdit.CountryId = this.selectedExistingPatient.CountryId;
    this.selectedERPatientToEdit.CountrySubDivisionId = this.selectedExistingPatient.CountrySubDivisionId;
    this.selectedERPatientToEdit.MunicipalityId = this.selectedExistingPatient.MunicipalityId;
    this.selectedERPatientToEdit.WardNo = this.selectedExistingPatient.WardNumber;
    this.selectedERPatientToEdit.Email = this.selectedExistingPatient.Email;
    this.selectedERPatientToEdit.DateOfBirth = this.selectedExistingPatient.DateOfBirth;
    this.selectedERPatientToEdit.PatientId = this.selectedExistingPatient.PatientId;
    this.selectedERPatientToEdit.Salutation = this.selectedExistingPatient.Salutation;
    this.selectedERPatientToEdit.IsExistingPatient = true;
    this.changeDetector.detectChanges();
    this.existingPatientSelected = true;
    this.showERPatRegistration = true;
    this.selectedExistingPatient = null;
  }


  patientListFormatter(data: any): string {
    let html = data["ShortName"] + ' [ ' + data['PatientCode'] + ' ]' + ' - ' + data['Age'] + ' - ' + ' ' + data['Gender'] + ' - ' + ' ' + data['PhoneNumber'];
    return html;
  }

  SearchFromExisting() {
    alert("Search From Existing Patients");
  }


  PatientCasesOnChange($event) {
    if ($event && $event.IsMedicoLegalMultiSelect) {
      this.filterMedicoLegalPatients($event);
    } else {
      if ($event.mainDetails && $event.mainDetails != 0) {
        this.caseIdList = [];
        this.casesList = [];
        this.caseIdList.push($event.mainDetails);
        if ($event.nestedDetails && $event.nestedDetails.length >= 1) {
          $event.nestedDetails.forEach(v => {
            this.caseIdList.push(v.Id);
            this.casesList.push(v);
          });
        }
      } else {
        this.caseIdList = [];
        this.caseIdList.push($event.mainDetails);
      }
    }
  }

  filterMedicoLegalPatients($event): void {
    if ($event && $event.nestedDetails && $event.nestedDetails.length) {
      let subCaseIds = [];
      $event.nestedDetails.forEach(v => {
        subCaseIds.push(v.Id);
      });
      if (subCaseIds && subCaseIds.length) {
        const filteredData = this.ERPatients.filter(a => subCaseIds.includes(a.PatientCases.SubCase));
        this.filteredData = filteredData;
        this.filteredData.splice();
      }

    } else {
      this.filteredData = [];
    }
  }
  CallBackForClose(event) {
    if (event && event.close) {
      this.allKeys.forEach(k => this.showUploadConsent[k] = false);

    }
  }

  CloseUpload() {
    this.allKeys.forEach(k => this.showUploadConsent[k] = false);
    this.showUploadConsent.upload_files = false;
    this.GetERPatientList();
    let body = document.getElementsByTagName("body")[0];
    body.style.overflow = "inherit";
  }

  filterNestedDetails() {
    this.caseIdList.slice(1);
    this.filteredData = this.ERPatients.filter(a => this.caseIdList.includes(a.PatientCases.SubCase));
  }
  //Display Add registration Button
  GetAddRegistraionEmergencyParameter() {
    const btnParam = this.coreService.Parameters.find(p => p.ParameterName === "ShowNewRegistrationInEmergency" && p.ParameterGroupName === "Emergency");
    if (btnParam != null) {
      const ErRegParam = JSON.parse(btnParam.ParameterValue);
      this.showNewRegistrationEmergency = ErRegParam;
    }
  }
  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.showAddVitals = false;
    }
  }

  GetErPatientCase(ERPatientId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emergencyBLService.GetERPatientCaseDetails(ERPatientId)
        .subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.ERPatientCases = res.Results;
            if (this.ERPatientCases != null) {
              this.selectedERPatientToEdit.PatientCases = { ...this.ERPatientCases };
            }
            this.changeDetector.detectChanges();
            resolve();
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Cases Of Patient"]);
            reject();
          }
        });
    });
  }

}
