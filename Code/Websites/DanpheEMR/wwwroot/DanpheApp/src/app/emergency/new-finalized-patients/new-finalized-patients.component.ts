import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { Visit } from '../../appointments/shared/visit.model';
import { VisitService } from '../../appointments/shared/visit.service';
import { ClinicalPatientService } from '../../clinical-new/shared/clinical-patient.service';
import { PatientDetails_DTO } from '../../clinical-new/shared/dto/patient-cln-detail.dto';
import { Patient } from '../../patients/shared/patient.model';
import { PatientService } from '../../patients/shared/patient.service';
import { SecurityService } from '../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { GridEmitModel } from '../../shared/danphe-grid/grid-emit.model';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_Emergency_DateFilter_Type, ENUM_Emergency_Finalized_Status_Type, ENUM_EscapeKey, ENUM_Genders, ENUM_MessageBox_Status, ENUM_VisitType } from '../../shared/shared-enums';
import { FinalizedPatientStatus } from '../shared/emergency-custom-data-types';
import EmergencyGridColumnSettings from '../shared/emergency-gridcol-settings';
import { EmergencyPatientModel } from '../shared/emergency-patient.model';
import { EmergencyBLService } from '../shared/emergency.bl.service';

@Component({
  selector: 'new-finalized-patients',
  templateUrl: './new-finalized-patients.component.html',
  styleUrls: ['./new-finalized-patients.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }

})
export class NewFinalizedPatientsComponent {
  SelectedERPatientToEdit: EmergencyPatientModel = new EmergencyPatientModel();
  SelectedEmergencyPatient: EmergencyPatientModel = new EmergencyPatientModel();
  EmergencyDateFilterType = Object.values(ENUM_Emergency_DateFilter_Type);
  EmergencyPatientList: Array<EmergencyPatientModel> = new Array<EmergencyPatientModel>();
  FilteredEmergencyPatients: Array<EmergencyPatientModel> = new Array<EmergencyPatientModel>();
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  CaseIdList: Array<number> = new Array<number>();
  CasesList: Array<number> = new Array<number>();
  ERFinalizedPatientGridCol: any[] = [];
  FromDate: string = moment().format('YYYY-MM-DD');
  ToDate: string = moment().format('YYYY-MM-DD');
  VisitId: number = null;
  SelectedErStatusType: string = "";
  DateType: string = ENUM_Emergency_DateFilter_Type.FinalizedDate;
  ShowEmergencyPatientsGrid: boolean = false;
  ShowERPatRegistration: boolean = false;
  ShowOrderPopUp: boolean = false;
  ShowSummaryView: boolean = false;
  ShowSummaryAdd: boolean = false;
  ShowAddVitals: boolean = false;
  ShowGridList: boolean = true;
  ShowVitalsList: boolean = true;
  GlobalVisit = new Visit();
  GlobalPatient = new Patient();
  FinalizedPatientStatuses: FinalizedPatientStatus[] = [];
  EmergencyPatientStatus = Object.values(ENUM_Emergency_Finalized_Status_Type);
  FooterContent: string = "";
  TotalCount: number = 0;
  MaleCount: number = 0;
  FemaleCount: number = 0;
  OthersCount: number = 0;
  MedicoLegalCaseId: number = 6;
  IsPoliceCase: boolean = false;
  FinalizedPatientListGridExportOptions = {
    fileName: 'FinalizedPatientList_' + moment().format('YYYY-MM-DD') + '.xls'
  };
  ShowDischargeSummary: boolean = false;
  SelectedDischarge: any;
  ShowDateRangeAndFilers: boolean = false;
  ShowUploadConsent: boolean = false;
  public SelectedPatient = new EmergencyPatientModel();

  constructor(
    private _emergencyBLService: EmergencyBLService,
    private _msgBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef,
    private _router: Router,
    public _securityService: SecurityService,
    private _visitService: VisitService,
    private _patientService: PatientService,
    private _selectedPatientService: ClinicalPatientService,
  ) {
    let EmergencyGridColumnSetting = new EmergencyGridColumnSettings(this._securityService)
    this.ERFinalizedPatientGridCol = EmergencyGridColumnSetting.ERFinalizedPatientList;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('FinalizedOn', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('VisitDateTime', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('TriagedOn', true));
    this.ShowDateRangeAndFilers = true;
    this.InitializeFinalizedPatientStatuses();
  }
  ngAfterViewChecked() {
    if (document.getElementById("print-finalized-patients-summary"))
      this.FooterContent = document.getElementById("print-finalized-patients-summary").innerHTML;
  }


  /**
   * Initializes the FinalizedPatientStatuses array based on EmergencyPatientStatus.
   * Sets the Default status as selected by default if the array is not empty.
   */
  InitializeFinalizedPatientStatuses(): void {
    if (this.EmergencyPatientStatus && this.EmergencyPatientStatus.length > 0) {
      this.FinalizedPatientStatuses = this.EmergencyPatientStatus.map(status => ({
        IsSelected: false,
        Value: status
      }));
      const defaultStatusValue = ENUM_Emergency_Finalized_Status_Type.All;
      const defaultStatus = this.FinalizedPatientStatuses.find(status => status.Value === defaultStatusValue);
      if (defaultStatus) {
        defaultStatus.IsSelected = true;
        this.SelectedErStatusType = '';
      }
    }
  }
  /**
   * Handles changes in checkbox selection for patient statuses.
   * Updates the selected status and triggers the patient list refresh.
   *
   * @param changedStatus - The FinalizedPatientStatus that was changed
   */
  OnCheckboxChange(changedStatus: FinalizedPatientStatus): void {
    if (changedStatus.IsSelected) {
      this.FinalizedPatientStatuses.forEach(status => {
        status.IsSelected = (status.Value === changedStatus.Value);
      });

      this.SelectedErStatusType = changedStatus.Value;

      if (this.SelectedErStatusType === ENUM_Emergency_Finalized_Status_Type.All) {
        this.SelectedErStatusType = '';
      }
    } else {
      const defaultStatusValue = ENUM_Emergency_Finalized_Status_Type.All;
      const defaultStatus = this.FinalizedPatientStatuses.find(status => status.Value === defaultStatusValue);

      if (defaultStatus) {
        defaultStatus.IsSelected = true;
        this.SelectedErStatusType = '';
      } else {
        const firstAvailableStatus = this.FinalizedPatientStatuses.find(status => status.Value !== defaultStatusValue);
        if (firstAvailableStatus) {
          firstAvailableStatus.IsSelected = true;
          this.SelectedErStatusType = firstAvailableStatus.Value;
        } else {
          this.SelectedErStatusType = '';
        }
      }
    }
  }
  CallBackForClose(event): void {
    if (event && event.close) {
      this.ShowUploadConsent = false;
    }
  }
  CloseUpload() {
    this.ShowUploadConsent = false;
  }
  OnFromToDateChange($event) {
    this.FromDate = $event.fromDate;
    this.ToDate = $event.toDate;
  }
  PatientCasesOnChange($event) {
    if ($event.mainDetails && $event.mainDetails != 0) {
      this.CaseIdList = [];
      this.CasesList = [];
      this.CaseIdList.push($event.mainDetails);
      if ($event.nestedDetails && $event.nestedDetails.length >= 1) {
        this.CaseIdList.push(...$event.nestedDetails.map(v => v.Id));
        this.CasesList.push(...$event.nestedDetails);
      }
    }
    else {
      this.CaseIdList = [];
      this.CaseIdList.push($event.mainDetails);
    }
  }
  GetEmergencyFinalizedPatientList() {
    const caseIds = this.CaseIdList ? this.CaseIdList : null;
    this._emergencyBLService.GetEmergencyFinalizedPatientList(caseIds[0], this.SelectedErStatusType, this.DateType, this.FromDate, this.ToDate, this.IsPoliceCase)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.EmergencyPatientList = res.Results;
          this.FilteredEmergencyPatients = res.Results;
          this.ShowEmergencyPatientsGrid = true;
          if (this.CaseIdList[0] === this.MedicoLegalCaseId) {
            this.FilterNestedDetails();
          }
          if (this.FilteredEmergencyPatients && this.FilteredEmergencyPatients.length) {
            this.CalculatePatientsCounts();
          }
        }
        else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Get Emergency PatientList !!"]);
        }
      });
  }
  GridActionHandler(event: GridEmitModel) {
    switch (event.Action) {
      case "edit": {
        this.SelectedERPatientToEdit = new EmergencyPatientModel();
        this.ShowERPatRegistration = false;
        this._changeDetector.detectChanges();
        this.SelectedERPatientToEdit = Object.assign(this.SelectedERPatientToEdit, event.Data);
        this.ShowERPatRegistration = true;
      }
        break;
      case "add-summary": {
        this.AddSummary(event.Data);
        break;
      }
      case "view-summary": {
        this.ViewSummary(event.Data);
        break;
      }
      case "add-vitals": {
        this.ResetAllAndHideParentBodyScroll();
        this.SelectedEmergencyPatient = new EmergencyPatientModel();
        this._changeDetector.detectChanges();
        this.SelectedEmergencyPatient = Object.assign(this.SelectedEmergencyPatient, event.Data);
        const updatedPatient = new PatientDetails_DTO();
        updatedPatient.PatientId = this.SelectedEmergencyPatient.PatientId;
        updatedPatient.PatientVisitId = this.SelectedEmergencyPatient.PatientVisitId;
        this.VisitId = updatedPatient.PatientVisitId;
        this._selectedPatientService.SelectedPatient = updatedPatient;
        this.ShowAddVitals = true;
      }
        break;
      case "patientoverview": {
        let selectedPatient: PatientDetails_DTO = event.Data;
        this._selectedPatientService.SelectedPatient = selectedPatient;
        this._selectedPatientService.SelectedPatient.Name = selectedPatient.FullName;
        this._selectedPatientService.SelectedPatient.VisitType = ENUM_VisitType.emergency;
        this._selectedPatientService.SelectedPatient.AppointmentDate = selectedPatient.VisitDateTime;
        this._router.navigate(['/Emergency/Clinical-Overview']);
      }
        break;

      case "undo": {
        // this.UndoAction(event.Data);
        const confirmMessage = "Do you want to revert the patient to the Triaged Patient List?";
        if (window.confirm(confirmMessage)) {
          this.UndoAction(event.Data);
        } else {
          break;
        }
      }
        break;

      case "consent-file": {
        this.ShowAddVitals = false;
        this.SelectedPatient = new EmergencyPatientModel();
        this._changeDetector.detectChanges();
        this.SelectedPatient = event.Data;
        this.ShowUploadConsent = true;

      }
        break;

      default:
        break;
    }
  }
  UndoAction(undoData: any) {
    console.log("Undo data", undoData);
    this._emergencyBLService.UndoFinalizedpatient(undoData.ERPatientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Undo Successfully"]);
          this.GetEmergencyFinalizedPatientList();
        }
        else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Get Emergency PatientList !!"]);
        }
      });
  }
  CloseVitalsPopUp() {
    this.ShowAddVitals = false;
  }
  FilterNestedDetails() {
    if (this.EmergencyPatientList && this.EmergencyPatientList.length > 0) {
      this.CaseIdList.slice(1);
      this.FilteredEmergencyPatients = this.EmergencyPatientList.filter(a => this.CaseIdList.includes(a.SubCase));
    }
    else {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Patient List is Empty.']);
    }
  }
  public ResetAllAndHideParentBodyScroll() {
    this.ShowERPatRegistration = false;
    this.ShowOrderPopUp = false;
    this.ShowSummaryView = false;
    this.ShowSummaryAdd = false;
    var body = document.getElementsByTagName("body")[0];
    body.style.overflow = "hidden";
  }
  public ReturnFromPatRegistrationEdit($event) {
    this.CloseAllERPatientPopUp();
    if ($event.submit) {
      this.GetEmergencyFinalizedPatientList();
    }
  }
  CloseAllERPatientPopUp(): void {
    var body = document.getElementsByTagName("body")[0];
    body.style.overflow = "inherit";
    this._changeDetector.detectChanges();
    this.SelectedEmergencyPatient = new EmergencyPatientModel();
    this.SelectedERPatientToEdit = new EmergencyPatientModel();
    this.ShowOrderPopUp = false;
    this.ShowERPatRegistration = false;
    this.ShowSummaryView = false;
    this.ShowSummaryAdd = false;
    this.ShowAddVitals = false;
  }
  ParentOfPopUpClicked($event): void {
    var currentTarget = $event.currentTarget;
    var target = $event.target;
    if (target == currentTarget) {
      this.CloseAllERPatientPopUp();
    }
  }
  SetPatDataToGlobal(data): void {
    this.GlobalPatient = this._patientService.CreateNewGlobal();
    this.GlobalPatient.PatientId = data.PatientId;
    this.GlobalPatient.PatientCode = data.PatientCode;
    this.GlobalPatient.ShortName = data.Name;
    this.GlobalPatient.DateOfBirth = data.DateOfBirth;
    this.GlobalPatient.Gender = data.Gender;
    this.GlobalPatient.Age = data.Age;
    this.GlobalPatient.Address = data.Address;
    this.GlobalPatient.PhoneNumber = data.ContactNo;

    this.GlobalVisit = this._visitService.CreateNewGlobal();
    this.GlobalVisit.ERTabName = "finalized-admitted";
    this.GlobalVisit.PatientVisitId = data.PatientVisitId;
    this.GlobalVisit.PatientId = data.PatientId;
    this.GlobalVisit.PerformerId = data.ProviderId;
    this.GlobalVisit.VisitType = "emergency";
    this.GlobalVisit.PerformerName = data.ProviderName;
    this.GlobalVisit.VisitDate = moment(data.VisitDateTime).format("YYYY-MM-DD");
    this.GlobalVisit.VisitTime = moment(data.VisitDateTime).format("HH:MM");
  }
  Back() {
    this.ResetAllAndHideParentBodyScroll();
    this.CloseAllERPatientPopUp();
    this._changeDetector.detectChanges();
    this.GetEmergencyFinalizedPatientList();
    this.ShowGridList = true;
  }
  ReturnFromOrderAction() {
    this.CloseAllERPatientPopUp();
  }
  CalculatePatientsCounts() {
    this.TotalCount = this.FilteredEmergencyPatients.length;
    this.MaleCount = this.FilteredEmergencyPatients.filter(p => p.Gender.toLowerCase() === ENUM_Genders.Male).length;
    this.FemaleCount = this.FilteredEmergencyPatients.filter(p => p.Gender.toLowerCase() === ENUM_Genders.Female).length;
    this.OthersCount = this.TotalCount - this.MaleCount - this.FemaleCount;
  }
  LoadFinalizedPatients() {
    this.GetEmergencyFinalizedPatientList();
  }

  AddSummary(selPat: EmergencyPatientModel): void {
    this.SelectedDischarge = null;
    this._changeDetector.detectChanges();
    this.SelectedDischarge = selPat;
    this.ShowEmergencyPatientsGrid = false;
    this.ShowDateRangeAndFilers = false;
    this.ShowDischargeSummary = true;
  }
  ViewSummary(selPat: EmergencyPatientModel): void {
    this.SelectedDischarge = null;
    this._changeDetector.detectChanges();
    this.SelectedDischarge = selPat;
    this.ShowEmergencyPatientsGrid = false;
    this.ShowDateRangeAndFilers = false;
    this.ShowSummaryView = true;
  }
  HideDischargeSummary(): void {
    this.ShowDischargeSummary = false;
    this.ShowEmergencyPatientsGrid = true;
    this.ShowDateRangeAndFilers = true;
  }

  DischargeSummaryCallback(data) {
    if (data.Status === ENUM_DanpheHTTPResponses.OK) {
      this.HideDischargeSummary();
    }
  }

  CallBackFromAddEdit(data): void {
    this.ShowDischargeSummary = false;
    this.ShowEmergencyPatientsGrid = false;
    this._visitService.PatientVisitId = null;
    this.ShowDateRangeAndFilers = false;
    // this.GetEmergencyFinalizedPatientList();
    this.ShowSummaryView = true;
  }
  CallbackFromViewPage($event): void {
    this.ShowSummaryView = false;
    this.ShowDischargeSummary = true;
    this.ShowEmergencyPatientsGrid = false;
    this.ShowDateRangeAndFilers = false;

  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ShowAddVitals = false;
    }
  }
}
