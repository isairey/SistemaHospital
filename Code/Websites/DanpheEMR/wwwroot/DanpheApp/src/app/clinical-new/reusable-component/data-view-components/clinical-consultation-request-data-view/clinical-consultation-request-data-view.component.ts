import { Component, OnInit } from '@angular/core';
import { ConsultationRequestGridDTO } from '../../../../clinical-new/shared/dto/consultation-request-grid.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from "../../../shared/dto/field.dto";
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: "cln-consultation-request-data-view",
  templateUrl: "./clinical-consultation-request-data-view.component.html"
})

export class CLNConsultationRequestDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  ConsultationRequestList = new Array<ConsultationRequestGridDTO>();
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
  ) { }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
      this.PatientId = this.SelectedPatient.PatientId;
    }
    this.GetConsultationRequestsByPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
  }

  public GetConsultationRequestsByPatientVisitId(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean): void {
    this._clinicalNoteBLService
      .GetConsultationRequestsByPatientVisitId(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.ConsultationRequestList = res.Results;
          }
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Consultation Request List.",]);
        }
      });

  }
}
