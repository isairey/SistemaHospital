import { Component, OnInit } from '@angular/core';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { Field } from '../../../../clinical-new/shared/dto/field.dto';
import { PatientDetails_DTO } from '../../../../clinical-new/shared/dto/patient-cln-detail.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { CurrentData } from '../../diagnosis/final-diagnosis/shared/CurrentDiagnosis_DTO';

@Component({
  selector: 'app-final-diagnosis-data-view',
  templateUrl: './final-diagnosis-data-view.component.html',

})
export class FinalDiagnosisDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public FinalDiagnosisViewData: Array<CurrentData> = new Array<CurrentData>();
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
  public CombinedDiagnosisList: Array<{ DisplayDiagnosis: string; Remarks: string, IsCauseOfDeath: boolean }> = [];
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
  ) { }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
    }
    this.GetFinalDiagnosis();
  }

  /**
   * @summary Retrieves the list of final diagnosis for the selected patient's visit from the clinical note BL service.
   * @param PatientVisitId The ID of the patient's visit to fetch birth details for current visitt.
   */
  public GetFinalDiagnosis() {
    this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.PatientId = this.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetDiagnoses(this.PatientId, this.PatientVisitId, ENUM_DiagnosisType.FinalDiagnosis, this.IsAcrossVisitAvailability).
      subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.FinalDiagnosisViewData = res.Results;

          this.CombinedDiagnosisList = this.FinalDiagnosisViewData.map((diagnosis) => {
            return {
              DisplayDiagnosis: `(${diagnosis.DiagnosisCode}) ${diagnosis.DiagnosisCodeDescription}`,
              Remarks: diagnosis.Remarks,
              IsCauseOfDeath: diagnosis.IsCauseOfDeath
            };
          });

        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error Occured while getting Final Diagnosis. Please Try again Later']);
        }
      });
  }


}
