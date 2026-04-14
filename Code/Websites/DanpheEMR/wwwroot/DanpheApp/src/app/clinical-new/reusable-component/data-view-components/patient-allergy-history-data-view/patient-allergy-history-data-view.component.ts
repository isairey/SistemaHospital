import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from '../../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';
import { Allergy } from '../../../shared/model/allergy.model';

@Component({
  selector: 'patient-allergy-history',
  templateUrl: './patient-allergy-history-data-view.component.html'
})
export class PatientAllergyHistoryDataViewComponent implements OnInit {
  Field: Field;
  AllergyLists: Array<Allergy> = new Array<Allergy>();
  ShowAllergyAddBox: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef) {


  }
  ngOnInit(): void {
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
      if (this.SelectedPatient && this.SelectedPatient.PatientId) {
        this.GetPatientAllergyList(this.SelectedPatient.PatientId);
      }
      else {
        this.AllergyLists = null;
      }
      let patientData = this.Field.FieldConfig.PreTemplatePatientDetail;
      this.SelectedPatient = new PatientDetails_DTO();
      Object.assign(this.SelectedPatient, patientData);
    }

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
          this.AllergyLists = res.Results.filter(res.Results.IsActive === true);
          this.SelectedPatient.Allergies = this.AllergyLists;
          this.SelectedPatient.FormatPatientAllergies();
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed. please check log for details."], res.ErrorMessage);
        }
      });
  }

}
