import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SecurityService } from '../../../security/shared/security.service';
import { User } from '../../../security/shared/user.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { Allergy } from '../../shared/model/allergy.model';

@Component({
  selector: 'patient-allergy-history',
  templateUrl: './patient-allergy-history.component.html'
})
export class PatientAllergyHistoryComponent implements OnInit {
  AllergyLists: Array<Allergy> = new Array<Allergy>();
  ShowAllergyAddBox: boolean = false;
  SelectedAllergy: Allergy = new Allergy();
  RemoveSelectedAllergy: Allergy = new Allergy();
  SelectedIndex: number = 0;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientId: number = 0;
  CurrentUser: User = new User();
  IsEditRemove: boolean = false;
  constructor(
    private _selectedPatientService: ClinicalPatientService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
    private _securityService: SecurityService,
    public changeDetector: ChangeDetectorRef) {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.GetPatientAllergyList(this.SelectedPatient.PatientId);
    }
    else {
      this.AllergyLists = null;
    }
  }
  ngOnInit(): void {
    let patientData = this._selectedPatientService.SelectedPatient;
    this.SelectedPatient = new PatientDetails_DTO();
    Object.assign(this.SelectedPatient, patientData);
    this.CurrentUser = this._securityService.GetLoggedInUser() as User;
  }

/**
 * @summary Retrieves patient allergy list from clinical note BL service.
 * Updates local AllergyLists and SelectedPatient.Allergies if successful.
 * Shows error message if retrieval fails.
 * @param PatientId The ID of the patient to fetch allergies for.
 */  GetPatientAllergyList(PatientId: number): void {
    this._clinicalNoteBLService.GetPatientAllergyList(PatientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.AllergyLists = res.Results;
          this.SelectedPatient.Allergies = this.AllergyLists;
          this.SelectedPatient.FormatPatientAllergies();
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed. please check log for details."], res.ErrorMessage);
        }
      });
  }
  /**
   * @summary Prepares for editing a selected allergy by setting SelectedAllergy and SelectedIndex.
   * Displays the allergy edit form.
   * @param selectedAllergy The allergy object to edit.
   * @param index The index of the selected allergy in the AllergyLists array.
   */
  Edit(selectedAllergy: Allergy, index: number): void {
    this.ResetVariables();
    this.SelectedIndex = index;
    this.SelectedAllergy = selectedAllergy;
    if (this.CurrentUser && this.CurrentUser.Employee) {
      if (this.CurrentUser.Employee.EmployeeId === this.SelectedAllergy.CreatedBy) {
        this.IsEditRemove = true;
        this.ShowAllergyAddBox = true;
      }
    }
  }

  CanEditOrRemove(allergy: Allergy): boolean {
    return this.CurrentUser && this.CurrentUser.Employee &&
      this.CurrentUser.Employee.EmployeeId === allergy.CreatedBy;
  }
  /**
 * @summary Callback function invoked after adding or updating an allergy.
 * Refreshes the patient's allergy list.
 * Updates AllergyLists and triggers global allergy updates.
 * @param $event The event object containing the updated allergy information.
 */
  CallBackAddUpdate($event): void {
    this.GetPatientAllergyList(this.SelectedPatient.PatientId);
    if ($event && $event.allergy) {
      if (this.SelectedIndex != null) {
        this.AllergyLists.splice(this.SelectedIndex, 1, $event.allergy);
        this.AllergyLists.slice();
      }
      else {
        this.AllergyLists.push($event.allergy);
        let arr = [];
        arr.push($event.allergy);

      }
      this.UpdateGlobalAllergy();
    }
    this.ResetVariables();
  }


  ShowAddAllergyBox(): void {
    this.ResetVariables();
    this.ShowAllergyAddBox = true;
  }

  public ResetVariables(): void {
    this.SelectedAllergy = null;
    this.SelectedIndex = null;
    this.ShowAllergyAddBox = false;
    this.changeDetector.detectChanges();
  }

  public UpdateGlobalAllergy(): void {
    this.SelectedPatient.Allergies = this.AllergyLists;
    this.SelectedPatient.FormatPatientAllergies();
  }

  Remove(selectedAllergy: Allergy, index: number): void {
    this.SelectedIndex = index;
    this.RemoveSelectedAllergy = selectedAllergy;
    this.DeactivatePatientAllergy();
  }

  DeactivatePatientAllergy() {
    const message = "Are you sure you want to Remove this Allergy?";
    if (window.confirm(message)) {
      this._clinicalNoteBLService
        .DeactivatePatientAllergy(this.RemoveSelectedAllergy)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetPatientAllergyList(this.RemoveSelectedAllergy.PatientId);
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Patient Allergy Deactivated successfully']);

          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }
}
