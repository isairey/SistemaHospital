import { Component, OnInit } from '@angular/core';
import { PatientComplaints_DTO } from '../../../../clinical-new/shared/dto/patient-complaints.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from "../../../shared/dto/field.dto";
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: "chief-complaints-data-view",
  templateUrl: "./chief-complaints-data-view.html"
})

export class ChiefComplaintsDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
  PatientComplaintList = new Array<PatientComplaints_DTO>();

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
    this.GetPatientComplaint();
  }

  GetPatientComplaint(): void {
    this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.PatientId = this.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetPatientComplaint(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability)
      .subscribe(
        (res: DanpheHTTPResponse): void => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.PatientComplaintList = res.Results;
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! For Patient Complaints']);
            }
          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Patient Complaint, check log for details']);
          }

        });
  }

}
