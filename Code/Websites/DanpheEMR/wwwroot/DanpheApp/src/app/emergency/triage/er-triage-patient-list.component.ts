import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { Visit } from '../../appointments/shared/visit.model';
import { VisitService } from '../../appointments/shared/visit.service';
import { ClinicalPatientService } from '../../clinical-new/shared/clinical-patient.service';
import { PatientDetails_DTO } from '../../clinical-new/shared/dto/patient-cln-detail.dto';
import { CoreService } from '../../core/shared/core.service';
import { PatientService } from '../../patients/shared/patient.service';
import { SecurityService } from '../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status, ENUM_VisitType } from '../../shared/shared-enums';
import EmergencyGridColumnSettings from '../shared/emergency-gridcol-settings';
import { EmergencyPatientModel } from '../shared/emergency-patient.model';
import { EmergencyBLService } from '../shared/emergency.bl.service';
import { EmergencyTriagedPatient_DTO } from '../shared/er-triaged-patient-dto';

@Component({
  selector: 'triage-patient-list',
  templateUrl: './er-triage-patient-list.html',
  styleUrls: ['./triage-pat-list.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }

})

export class ERTriagePatientListComponent {
  public ShowOrderPopUp: boolean = false;
  public showLamaPopUp: boolean = false;
  public ShowAdmitPopUp: boolean = false;
  public ShowERPatRegistration: boolean = false;
  public ShowAssignDoctor: boolean = false;
  public ShowAddVitals: boolean = false;
  public ShowVitalsList: boolean = true;
  public VisitId: number = null;
  public DoctorsList: Array<any> = [];
  public TriagedERPatients = new Array<EmergencyTriagedPatient_DTO>();
  public TriagedERPatientGridCol: Array<any> = null;
  public SelectedTriagedPatientForOrder = new EmergencyPatientModel();
  public SelectedPatient = new EmergencyPatientModel();
  public SelectedERPatientToEdit = new EmergencyPatientModel();
  public Action: string = "";
  public SearchString: string = null;
  public CurrentDepartmentName: string = null;
  public GlobalVisit: any;
  public GlobalPatient: any;
  public CaseIdList = new Array<number>();
  public CasesList = [];
  public AllKeys: Array<string>;
  public ShowUploadConsent = { "upload_files": false, "remove": false };
  public FilteredData: Array<EmergencyTriagedPatient_DTO>;
  public AdmissionCases: { Name: string, Value: string; }[];
  public AdmissionCase: string = null;
  data: any = '';
  public currentVisit: Visit;
  public showDischargeSummaryView: boolean = false;
  public selectedPatient: EmergencyPatientModel = new EmergencyPatientModel();
  public hasViewSummaryPermission: boolean = false;
  @HostListener('AfterDischargedPatientSuccess', ['$event'])
  onCustomEventCaptured(event: any) {
    if (event && event.detail && event.detail.dischargeSummary) {
      const dischargedPatient = event.detail.dischargeSummary;
      let visitInfo = { PatientId: 0, PatientVisitId: 0 };
      visitInfo.PatientId = dischargedPatient.PatientId;
      visitInfo.PatientVisitId = dischargedPatient.PatientVisitId;

      let index = this.FilteredData.findIndex(a => a.PatientId == visitInfo.PatientId && a.PatientVisitId == visitInfo.PatientVisitId);
      this.FilteredData.splice(index, 1);
      this.FilteredData = this.FilteredData.slice();
    }
  }
  ShowTriagedPatientList: boolean = false;
  ShowDischargeSummary: boolean = false;
  ShowSummaryView = false;
  SelectedDischarge: any;

  constructor(
    private _changeDetector: ChangeDetectorRef,
    private _messageBoxService: MessageboxService,
    private _router: Router,
    private _emergencyBLService: EmergencyBLService,
    private _coreService: CoreService,
    private _securityService: SecurityService,
    private _patientService: PatientService,
    private _visitService: VisitService,
    private _selectedPatientService: ClinicalPatientService
  ) {
    this.TriagedERPatientGridCol = EmergencyGridColumnSettings.TriagedERPatientList;
    this.GetDoctorsList();
    this.hasViewSummaryPermission = this._securityService.HasPermission('emergency-Discharge-summary-view');

  }

  ngOnInit() {
    this.CurrentDepartmentName = this._coreService.GetERDepartmentName();
    this.AllKeys = Object.keys(this.ShowUploadConsent);
    this.AdmissionCases = this._coreService.GetAdmissionCases();
    this.ShowTriagedPatientList = true;

  }


  GetDoctorsList(): void {
    this._emergencyBLService.GetDoctorsList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.DoctorsList = res.Results;
          }
          else {
            console.log(res.ErrorMessage);
          }
        }
      },
        err => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["unable to get Doctors list.. check log for more details."]);
          console.log(err.ErrorMessage);
        });
  }

  GetERTriagedPatientList(): void {
    let id = this.CaseIdList ? this.CaseIdList : null;
    this._emergencyBLService.GetAllTriagedPatients(id[0])
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length > 0) {
            res.Results.forEach(element => {
              let jsonPatientCases = JSON.parse(element.PatientCases);
              if (jsonPatientCases) {
                element.PatientCases = jsonPatientCases;
              }
            });
          }
          this.TriagedERPatients = res.Results;
          this.TriagedERPatients.forEach(element => {
            if (element.PatientCases && element.PatientCases.MainCase) {
              switch (element.PatientCases.MainCase) {
                case 1: {
                  element.Case = "General";
                  break;
                }
                case 2: {
                  element.Case = "Dog Bite";
                  break;
                }
                case 3: {
                  element.Case = "Snake Bite";
                  break;
                }
                case 4: {
                  element.Case = "Animal Bite";
                  break;
                }
                case 5: {
                  element.Case = "Emergency Labor";
                  break;
                }
                case 6: {
                  element.Case = "Medico-legal";
                  break;
                }
                default: {
                  break;
                }
              }
            }
          });
          this.FilteredData = res.Results;
          if (this.CaseIdList[0] === 6) {
            this.FilterNestedDetails();
          }
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Get Triaged Patient List !!"]);
        }
      });
  }

  //Closes the Registration PopUp if clicked Outside popup window
  ParentOfPopUpClicked($event): void {
    var currentTarget = $event.currentTarget;
    var target = $event.target;
    if (target === currentTarget) {
      this.CloseAllERPatientPopUp();
    }
  }

  //Called each time just before any PopUp Opens
  ResetAllAndHideParentBodyScroll(): void {
    this.showLamaPopUp = false;
    this.ShowOrderPopUp = false;
    let body = document.getElementsByTagName("body")[0];
    body.style.overflow = "hidden";
  }

  //Called each time when any of the popUp needs to close or when clicked outside the parent div
  CloseAllERPatientPopUp(): void {
    var body = document.getElementsByTagName("body")[0];
    body.style.overflow = "inherit";
    this._changeDetector.detectChanges();
    //Resets Order PopUp
    this.SelectedTriagedPatientForOrder = new EmergencyPatientModel();
    this.SelectedPatient = new EmergencyPatientModel();
    this.ShowOrderPopUp = false;
    this.showLamaPopUp = false;
    this.ShowAdmitPopUp = false;
    this.ShowERPatRegistration = false;
    this.ShowAssignDoctor = false;
    this.ShowAddVitals = false;
  }


  EditPatInfo(selPat: EmergencyPatientModel): void {
    this.SelectedERPatientToEdit = new EmergencyPatientModel();
    this.ShowERPatRegistration = false;
    this._changeDetector.detectChanges();
    this.SelectedERPatientToEdit = Object.assign(this.SelectedERPatientToEdit, selPat);
    this.SelectedERPatientToEdit.IsExistingPatient = true;
    this.ShowERPatRegistration = true;
  }

  AssignDoctor(selPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedTriagedPatientForOrder = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedERPatientToEdit = Object.assign(this.SelectedERPatientToEdit, selPat);
    if (this.DoctorsList.length) {
      this.ShowAssignDoctor = true;
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please Try Later"]);
    }
  }


  AdmitERPatient(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "admitted";

    if (selectedPat.PatientCases && selectedPat.PatientCases.MainCase) {
      const mainCase = selectedPat.PatientCases.MainCase;
      if (mainCase === 0) {
        const generalAdmissionCase = this.AdmissionCases.find(item => item.Name === "General");
        if (generalAdmissionCase) {
          this.AdmissionCase = generalAdmissionCase.Name;
        } else {
          this.AdmissionCase = "General";
        }
      }
      else {
        const matchedAdmissionCase = this.AdmissionCases.find(item => Number(item.Value) === mainCase);
        if (matchedAdmissionCase) {
          this.AdmissionCase = matchedAdmissionCase.Name;
        } else {
          this.AdmissionCase = "General";
        }
      }
    }
    else {
      const generalAdmissionCase = this.AdmissionCases.find(item => item.Name === "General");
      if (generalAdmissionCase) {
        this.AdmissionCase = generalAdmissionCase.Name;
      } else {
        this.AdmissionCase = "General";
      }
    }
    this.ShowAdmitPopUp = true;
  }

  DeathCaseOfERPatient(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "death";
    this.showLamaPopUp = true;
  }

  TransferERPatient(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "transferred";
    this.showLamaPopUp = true;
  }

  DischargeERPatient(selectedPat: EmergencyPatientModel): void {
    // this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "discharged";
    this.showLamaPopUp = true;
    // this.SetPatDataToGlobal(this.SelectedPatient);
    // this.RouteToPatientOverview(this.SelectedPatient);
  }

  LeaveERPatOnMedicalAdvice(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "lama";
    this.showLamaPopUp = true;
  }

  DischargeERPatientOnRequest(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "dor";
    this.showLamaPopUp = true;
  }
  Absconded(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "Absconded";
    this.showLamaPopUp = true;
  }

  OrderForERPat(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedTriagedPatientForOrder = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedTriagedPatientForOrder = Object.assign(this.SelectedTriagedPatientForOrder, selectedPat);
    this.ShowOrderPopUp = true;
  }

  UndoTriage(selectedPat: EmergencyPatientModel): void {
    this.SelectedTriagedPatientForOrder = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedTriagedPatientForOrder = Object.assign(this.SelectedTriagedPatientForOrder, selectedPat);
    var undoTriage = window.confirm("Are You Sure You want to undo this triage ?");
    if (undoTriage) {
      this._emergencyBLService.UndoTriageOfERPatient(selectedPat)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            let itmIndex = this.TriagedERPatients.findIndex(tst => tst.ERPatientId === selectedPat.ERPatientId);
            this.TriagedERPatients.splice(itmIndex, 1);
            this.TriagedERPatients = this.TriagedERPatients.slice();
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Undo Triage code of a Patient Now."]);
          }
        });
    }
  }

  ReturnFromOrderAndLamaAction($event): void {
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      if ($event.callBackFrom === 'lama') {
        let itmIndex = this.TriagedERPatients.findIndex(tst => tst.ERPatientId === $event.ERPatient.ERPatientId);
        this.TriagedERPatients.splice(itmIndex, 1);
        this.TriagedERPatients = this.TriagedERPatients.slice();
      }
    }
  }

  ReturnFromPatRegistrationEdit($event): void {
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      let itmIndex = this.TriagedERPatients.findIndex(tst => tst.ERPatientId === $event.ERPatient.ERPatientId);
      if (itmIndex >= 0) {
        this.TriagedERPatients.splice(itmIndex, 1, $event.ERPatient);
        this.TriagedERPatients = this.TriagedERPatients.slice();
        this.GetERTriagedPatientList();
      } else {
        this.GetERTriagedPatientList();
      }
    }
  }

  ReturnFromAssignDoctor($event): void {
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      let itmIndex = this.TriagedERPatients.findIndex(tst => tst.ERPatientId === $event.ERPatient.ERPatientId);
      if (itmIndex >= 0) {
        this.TriagedERPatients[itmIndex].PerformerName = $event.ERPatient.PerformerName;
        this.TriagedERPatients = this.TriagedERPatients.slice();
        this.GetERTriagedPatientList();
      }
    }
  }

  ReturnFromPatBedReservation($event): void {
    let patId = this.SelectedPatient.PatientId;
    let visitId = this.SelectedPatient.PatientVisitId;
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      let itmIndex = this.TriagedERPatients.findIndex(tst => tst.PatientId === patId && tst.PatientVisitId === visitId);
      this.TriagedERPatients.splice(itmIndex, 1);
      this.TriagedERPatients = this.TriagedERPatients.slice();
    }
  }

  AddVitals(selPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedERPatientToEdit = Object.assign(this.SelectedERPatientToEdit, selPat);
    const updatedPatient = new PatientDetails_DTO();
    updatedPatient.PatientId = this.SelectedERPatientToEdit.PatientId;
    updatedPatient.PatientVisitId = this.SelectedERPatientToEdit.PatientVisitId;
    this._selectedPatientService.SelectedPatient = updatedPatient;
    if (this.DoctorsList.length) {
      this.ShowAddVitals = true;
      this.VisitId = this.SelectedERPatientToEdit.PatientVisitId;
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please Try Later"]);
    }
  }
  CloseVitalsPopUp() {
    this.ShowAddVitals = false;
  }


  AddSummary(selPat: EmergencyPatientModel): void {
    this.SelectedDischarge = null;
    this._changeDetector.detectChanges();
    this.SelectedDischarge = selPat;
    // this.showDischargedList = false;
    this.ShowTriagedPatientList = false;
    this.ShowDischargeSummary = true;
  }
  ViewSummary(selPat: EmergencyPatientModel): void {
    this.SelectedDischarge = null;
    this._changeDetector.detectChanges();
    this.SelectedDischarge = selPat;
    this.ShowTriagedPatientList = false;
    this.ShowSummaryView = true;
  }
  ReturnFromAllERPatientActions($event): void {
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      this.ShowAddVitals = false;
    }
  }

  GoToPatientOverview(pat): void {
    this.SetPatDataToGlobal(pat);
    // this._router.navigate(["/Emergency/PatientOverviewMain"]);
    pat['Name'] = `${pat.FirstName} ${pat.MiddleName ? pat.MiddleName : ''} ${pat.LastName}`;
    pat['VisitType'] = ENUM_VisitType.emergency;
    pat['AppointmentDate'] = pat.VisitDateTime;
    this._selectedPatientService.SelectedPatient = pat as PatientDetails_DTO;
    this._router.navigate(['/Emergency/Clinical-Overview']);
  }

  SetPatDataToGlobal(data): void {
    this.GlobalPatient = this._patientService.CreateNewGlobal();
    this.GlobalPatient.PatientId = data.PatientId;
    this.GlobalPatient.PatientCode = data.PatientCode;
    this.GlobalPatient.ShortName = data.Name ? data.Name : data.FullName;
    this.GlobalPatient.DateOfBirth = data.DateOfBirth;
    this.GlobalPatient.Gender = data.Gender;
    this.GlobalPatient.Age = data.Age;
    this.GlobalPatient.Address = data.Address;
    this.GlobalPatient.CountryName = data.CountryName;
    this.GlobalPatient.CountrySubDivisionName = data.CountrySubDivisionName;
    this.GlobalPatient.MunicipalityName = data.MunicipalityName;
    this.GlobalPatient.WardNumber = data.WardNumber;
    this.GlobalPatient.PhoneNumber = data.ContactNo;
    this.GlobalPatient.VisitCode = data.VisitCode;
    this.GlobalVisit = this._visitService.CreateNewGlobal();
    this.GlobalVisit.ERTabName = "triaged";
    this.GlobalVisit.PatientVisitId = data.PatientVisitId;
    this.GlobalVisit.PatientId = data.PatientId;
    this.GlobalVisit.PerformerId = data.PerformerId;
    this.GlobalVisit.VisitType = "emergency";
    this.GlobalVisit.PerformerName = data.PerformerName;
    this.GlobalVisit.VisitDate = moment(data.VisitDateTime).format("YYYY-MM-DD");
    this.GlobalVisit.VisitTime = moment(data.VisitDateTime).format("HH:MM");
    this.GlobalVisit.VisitCode = data.VisitCode;
  }

  PatientCasesOnChange($event): void {
    if ($event.mainDetails && $event.mainDetails !== 0) {
      this.CaseIdList = [];
      this.CasesList = [];
      this.CaseIdList.push($event.mainDetails);
      if ($event.nestedDetails && $event.nestedDetails.length >= 1) {
        $event.nestedDetails.forEach(v => {
          this.CaseIdList.push(v.Id);
          this.CasesList.push(v);
        });
      }
    } else {
      this.CaseIdList = [];
      this.CaseIdList.push($event.mainDetails);
    }
    this.GetERTriagedPatientList();
  }

  FilterNestedDetails(): void {
    this.CaseIdList.slice(1);
    this.FilteredData = this.TriagedERPatients.filter(a => this.CaseIdList.includes(a.PatientCases.SubCase));
  }

  UploadConsent(selectedPat: EmergencyPatientModel): void {
    this.ResetAllAndHideParentBodyScroll();
    this.SelectedPatient = new EmergencyPatientModel();
    this._changeDetector.detectChanges();
    this.SelectedPatient = Object.assign(this.SelectedPatient, selectedPat);
    this.Action = "consent";
    this.AllKeys.forEach(k => this.ShowUploadConsent[k] = (k !== "upload_files") ? false : true);
  }

  CallBackForClose(event): void {
    if (event && event.close) {
      this.AllKeys.forEach(k => this.ShowUploadConsent[k] = false);
    }
  }
  CloseUpload() {
    this.ShowUploadConsent.upload_files = false;
    this.AllKeys.forEach(k => this.ShowUploadConsent[k] = false);
  }
  RouteToPatientOverview(selectedVisit: EmergencyPatientModel) {
    this.SelectVisit(selectedVisit);
    this._router.navigate(["Emergency/PatientOverviewMain/DischargeSummary"]);
  }
  SelectVisit(selectedVisit: EmergencyPatientModel) {
    let currPatient = this._patientService.getGlobal();
    let visitGlobal = this._visitService.getGlobal();
    currPatient.PatientId = selectedVisit.PatientId;
    currPatient.PatientCode = selectedVisit.PatientCode;
    currPatient.Address = selectedVisit.Address;
    visitGlobal.PatientId = selectedVisit.PatientId;
    visitGlobal.PatientVisitId = selectedVisit.PatientVisitId;
    currPatient.FirstName = selectedVisit.FirstName;
    currPatient.LastName = selectedVisit.LastName;
    currPatient.Gender = selectedVisit.Gender;
    currPatient.DateOfBirth = selectedVisit.DateOfBirth;
    currPatient.Age = selectedVisit.Age;
    currPatient.VisitCode = selectedVisit.VisitCode;
    currPatient.ShortName = selectedVisit.ShortName ? selectedVisit.ShortName : selectedVisit.FullName;
    visitGlobal.PerformerId = selectedVisit.PerformerId;
    visitGlobal.PerformerName = selectedVisit.PerformerName;
    visitGlobal.VisitDate = selectedVisit.VisitDateTime;
    visitGlobal.VisitCode = selectedVisit.VisitCode;
    this.currentVisit = visitGlobal;
  }
  Close() {
    this.showDischargeSummaryView = false;
  }
  HideDischargeSummary() {
    this.ShowDischargeSummary = false;
    this.ShowSummaryView = false;
    this.ShowTriagedPatientList = true;
    this._visitService.PatientVisitId = null;
  }

  DischargeSummaryCallback(data) {
    if (data.Status === ENUM_DanpheHTTPResponses.OK) {
      this.HideDischargeSummary();
    }
  }

  CallBackFromAddEdit(data): void {
    this.ShowDischargeSummary = false;
    this.ShowTriagedPatientList = false;
    this._visitService.PatientVisitId = null;
    this.ShowSummaryView = true;
  }
  CallbackFromViewPage($event): void {
    this.ShowSummaryView = false;
    this.ShowDischargeSummary = true;
    this.ShowTriagedPatientList = false;
  }
  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ShowAddVitals = false;
    }
  }
}
