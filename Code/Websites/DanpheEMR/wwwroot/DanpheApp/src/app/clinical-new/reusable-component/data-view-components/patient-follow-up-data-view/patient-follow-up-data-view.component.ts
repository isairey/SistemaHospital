import { Component, OnInit } from "@angular/core";

import { ClinicalNoteBLService } from "../../../../clinical-new/shared/clinical.bl.service";
import { PatientDetails_DTO } from "../../../../clinical-new/shared/dto/patient-cln-detail.dto";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses } from '../../../../shared/shared-enums';
import { Field } from "../../../shared/dto/field.dto";
import { PatientFollowUp } from "../../clinical-patient-follow-up/dto/patient-follow-up.model";


@Component({
    selector: "patient-follow-up-view",
    templateUrl: "./patient-follow-up-data-view.component.html"
})
export class PatientFollowUpDataViewComponent implements OnInit {
    Field: Field;
    IsAcrossVisitAvailability: boolean = false;
    FollowUpPatient: Array<PatientFollowUp> = new Array<PatientFollowUp>();
    SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
    PatientVisitId: number = 0;

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
        this.GetPatientFollowUpDetails();
    }

    GetPatientFollowUpDetails() {
        this.PatientVisitId = this.SelectedPatient.PatientVisitId;
        this._clinicalNoteBLService.GetPatientFollowUpDetails(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && Array.isArray(res.Results)) {
                        this.FollowUpPatient = res.Results;
                    } else if (res.Results && !Array.isArray(res.Results) && typeof res.Results === 'object') {
                        this.FollowUpPatient = [res.Results];
                    } else {
                        this.FollowUpPatient = [];
                    }
                } else {
                    this.msgBoxServ.showMessage("error", ["Failed to load follow-up details."]);
                }
            });
    }

}