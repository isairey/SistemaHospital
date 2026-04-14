import { Component } from "@angular/core";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { ENUM_DanpheHTTPResponses } from "../../../../shared/shared-enums";
import { PreTemplatePatientDetailDTO } from "../../../shared/clinical-info-preview/dto/data-view-config";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { Field } from "../../../shared/dto/field.dto";
import { Medication_DTO } from "../../../shared/dto/medication.dto";

@Component({
    selector: 'medication-data-view',
    templateUrl: './medication-data-view.component.html'
})
export class MedicationDataViewComponent {
    Field: Field;
    IsAcrossVisitAvailability: boolean = false;
    SelectedPatient: PreTemplatePatientDetailDTO = new PreTemplatePatientDetailDTO();

    RequestedMedicationList: Medication_DTO;
    EditMedication: Medication_DTO;

    constructor(
        private _clinicalBlservice: ClinicalNoteBLService,
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
    /**
     * Fetches the list of medications for a specific patient and visit.
     * 
     * @param patientId - The ID of the patient whose medication list is to be fetched.
     * @param patientVisitId - The ID of the patient visit for which the medication list is required.
     */
    GetMedicationList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean): void {
        this._clinicalBlservice.GetMedicationList(patientId, patientVisitId, isAcrossVisitAvailability)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this.RequestedMedicationList = res.Results;
                }
            },
                err => {
                    console.log(err);
                }
            );
    }
}
