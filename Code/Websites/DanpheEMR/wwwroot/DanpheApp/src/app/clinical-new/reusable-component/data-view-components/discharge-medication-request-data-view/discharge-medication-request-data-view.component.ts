import { Component } from "@angular/core";
import { CoreService } from "../../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { ENUM_DanpheHTTPResponses } from "../../../../shared/shared-enums";
import { ClinicalPatientService } from "../../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { Field } from "../../../shared/dto/field.dto";
import { Medication_DTO } from "../../../shared/dto/medication.dto";
import { PatientDetails_DTO } from "../../../shared/dto/patient-cln-detail.dto";

@Component({
  selector: 'discharge-medication-request',
  templateUrl: './discharge-medication-request-data-view.component.html',
})
export class DischargeMedicationRequestDataViewComponent {

  Field: Field;
  IsAcrossVisitAvailability: boolean = false;

  SelectedPatient: PatientDetails_DTO;

  RequestedMedicationList: Medication_DTO[];
  FilteredMedicationList: Medication_DTO[];

  constructor(
    private _clinicalBlservice: ClinicalNoteBLService,
    public _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService
  ) {

  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.Field && this.Field.FieldConfig) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
      if (this.SelectedPatient && this.SelectedPatient.PatientId) {
        this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      }
      else {
        this.RequestedMedicationList = null;
      }
    }
  }

  GetMedicationList(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetMedicationList(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedMedicationList = res.Results;
          this.FilterMedicationList();
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  FilterMedicationList() {
    if (this.RequestedMedicationList && this.RequestedMedicationList.length > 0) {
      this.FilteredMedicationList = this.RequestedMedicationList.filter(item => item.IsDischargeRequest);
    }
  }

}
