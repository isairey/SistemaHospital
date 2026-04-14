import { Component, OnInit } from '@angular/core';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { BabyBirthDetails } from '../../../shared/dto/baby-birth-details.dto';
import { Field } from "../../../shared/dto/field.dto";
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: "birth-list-data-view",
  templateUrl: "./birth-list-data-view.html"
})

export class BirthListDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public BirthList: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
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
    this.GetAllTheBirthList();
  }

  /**
   * @summary Retrieves the list of births for the selected patient's visit from the clinical note BL service.
   * @param PatientVisitId The ID of the patient's visit to fetch birth details for current visitt.
   */
  public GetAllTheBirthList() {
    this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.PatientId = this.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetBirthList(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).
      subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.BirthList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error Occured while getting Birth List. Please Try again Later']);
        }
      });
  }

}
