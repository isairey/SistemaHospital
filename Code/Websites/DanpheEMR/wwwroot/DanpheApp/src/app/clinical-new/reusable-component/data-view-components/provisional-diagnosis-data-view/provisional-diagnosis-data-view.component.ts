import { Component, OnInit } from '@angular/core';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from '../../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';
import { CurrentData } from '../../diagnosis/final-diagnosis/shared/CurrentDiagnosis_DTO';

@Component({
  selector: 'app-final-diagnosis-data-view',
  templateUrl: './provisional-diagnosis-data-view.component.html',

})
export class ProvisionalDiagnosisDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public ProvisionalDiagnosisViewData: Array<CurrentData> = new Array<CurrentData>();
  public CombinedDiagnosisList: Array<{ DisplayDiagnosis: string; Remarks: string }> = [];

  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
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
    this._clinicalNoteBLService.GetDiagnoses(this.PatientId, this.PatientVisitId, ENUM_DiagnosisType.ProvisionalDiagnosis, this.IsAcrossVisitAvailability).
      subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.ProvisionalDiagnosisViewData = res.Results;
          this.CombinedDiagnosisList = this.ProvisionalDiagnosisViewData.map((diagnosis) => {
            return {
              DisplayDiagnosis: `(${diagnosis.DiagnosisCode}) ${diagnosis.DiagnosisCodeDescription}`,
              Remarks: diagnosis.Remarks
            };
          });
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error Occured while getting Provisional Diagnosis. Please Try again Later']);
        }
      });
  }


}
