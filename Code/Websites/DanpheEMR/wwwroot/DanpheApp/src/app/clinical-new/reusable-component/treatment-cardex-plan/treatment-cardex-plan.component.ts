import { Component } from '@angular/core';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { ENUM_DanpheHTTPResponses, ENUM_Medication_Status_Filter, ENUM_VisitType } from '../../../shared/shared-enums';
import { ClinicalNoteService } from '../../shared/clinical-note.service';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { CardexPlan_DTO } from '../../shared/dto/cardex-plan.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { RequestedMedicationItemDto } from '../../shared/dto/requested-medication-item.dto';


@Component({
  selector: 'treatment-cardex-plan',
  templateUrl: './treatment-cardex-plan.component.html'
})
export class CLN_TreatmentCardexPlanComponent {
  Medication = new RequestedMedicationItemDto();
  SelectedPatient = new PatientDetails_DTO();
  CardexPlanList = new Array<CardexPlan_DTO>();
  FilteredCardexPlanList = new Array<CardexPlan_DTO>();
  SelectedPlan = new CardexPlan_DTO();
  MedicationStatus = Object.values(ENUM_Medication_Status_Filter);
  SelectedStatusFilter: string = ENUM_Medication_Status_Filter.NotInPlan;
  ShowAddCardplanPopUp: boolean = false;
  IsNewPlan: boolean = false;
  IsUpdate: boolean = false;
  ShoMedicationView: boolean = false;
  PrescriberId: number = 0;
  TempId: number = 0;

  constructor(
    private _clinicalBlservice: ClinicalNoteBLService,
    private _selectedPatientService: ClinicalPatientService,
    private _securityService: SecurityService,
    private _clinicalService: ClinicalNoteService

  ) {


    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      if (this.SelectedPatient.VisitType === ENUM_VisitType.inpatient) {
        this.TempId = this.SelectedPatient.AdmittingDoctorId;
      } else if (this.SelectedPatient.VisitType === ENUM_VisitType.outpatient) {
        this.TempId = this.SelectedPatient.PerformerId;
      }

      if (!this.TempId) {
        this.TempId = _securityService.loggedInUser.EmployeeId;
      }

      this.GetTreatmentCardexPlanList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
      // this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
    }
    else {
      this.FilteredCardexPlanList = null;
    }
    this._clinicalService.RefreshMedicationList$.subscribe(() => {
      if (this.SelectedPatient && this.SelectedPatient.PatientId && this.SelectedPatient.PatientVisitId) {
        this.GetTreatmentCardexPlanList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
      }
    });
  }
  GetTreatmentCardexPlanList(PatientId: number, PatientVisitId: number) {
    this._clinicalBlservice.GetTreatmentCardexPlanList(PatientId, PatientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.CardexPlanList = res.Results;
        if (this.CardexPlanList && this.CardexPlanList.length > 0) {
          this.CardexPlanList.forEach((plan: any) => {
            plan.PrescriberId = plan.PrescriberId1;
          });
          this.FilteredCardexPlanList = this.CardexPlanList.filter((plan: any) => !plan.IsDischargeRequest);
          this.OnStatusFilterChange();
          // this.TempId = res.Results[0].PrescriberId1;
        }
      }
    });
  }

  AddTreatmentCardexPlan(medication: RequestedMedicationItemDto) {
    this.ShowAddCardplanPopUp = true;
    this.Medication = medication;
    this.PrescriberId = this.TempId;
  }
  AddNewCardexPlan() {
    this.ShowAddCardplanPopUp = true;
    this.IsNewPlan = true;
    this.IsUpdate = false;
    this.PrescriberId = this.TempId;
  }
  ClosePopUp() {
    this.ShowAddCardplanPopUp = false;
    this.IsNewPlan = false;
    this.IsUpdate = false;
    this.ShoMedicationView = false;
  }
  CallBackAdd($event) {
    this.GetTreatmentCardexPlanList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
    this.ClosePopUp();
  }
  EditCardexPlan(selectedPlan: CardexPlan_DTO) {
    this.ShowAddCardplanPopUp = true;
    this.IsNewPlan = false;
    this.IsUpdate = true;
    this.SelectedPlan = selectedPlan;
    this.Medication = new RequestedMedicationItemDto();
  }
  OnStatusFilterChange() {
    if (this.SelectedStatusFilter) {
      this.FilteredCardexPlanList = this.CardexPlanList.filter(a => a.Status == this.SelectedStatusFilter);
    }
    else {
      this.FilteredCardexPlanList = this.CardexPlanList;
    }
  }
  ReloadRequestedMedicationList(): void {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.GetTreatmentCardexPlanList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
      this.SelectedStatusFilter = '';
    }
    else {
      this.FilteredCardexPlanList = null;
    }
  }
  ViewSelectedCardexPlan(selectedPlan: CardexPlan_DTO) {
    this.ShoMedicationView = true;
    this.SelectedPlan = selectedPlan;
  }
}
