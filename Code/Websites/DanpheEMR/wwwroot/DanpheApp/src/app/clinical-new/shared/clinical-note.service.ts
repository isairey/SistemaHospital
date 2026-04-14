import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Patient_DTO } from "../../claim-management/shared/DTOs/patient.dto";
import { SecurityService } from '../../security/shared/security.service';
import GridColumnSettings from "../../shared/danphe-grid/grid-column-settings.constant";

@Injectable()
export class ClinicalNoteService {
  public settingsGridCols: GridColumnSettings;
  private selectedPatientSource = new BehaviorSubject<Patient_DTO>(new Patient_DTO());
  private RefreshMedicationListSource = new Subject<void>();

  selectedPatient$ = this.selectedPatientSource.asObservable();
  RefreshMedicationList$ = this.RefreshMedicationListSource.asObservable();

  constructor(private _securityService: SecurityService) {
    this.settingsGridCols = new GridColumnSettings(this._securityService);
  }
  setSelectedPatient(patient: Patient_DTO) {
    this.selectedPatientSource.next(patient);
  }
  TriggerRefreshMedicationList() {
    this.RefreshMedicationListSource.next();
  }

}
