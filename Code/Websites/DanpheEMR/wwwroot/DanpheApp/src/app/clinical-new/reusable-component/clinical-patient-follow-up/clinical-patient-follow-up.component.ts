import { Component } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { PatientFollowUpDto } from './dto/patient-follow-up.dto';
import { PatientFollowUp } from './dto/patient-follow-up.model';
@Component({
    selector: 'clinical-patient-follow-up',
    templateUrl: './clinical-patient-follow-up.component.html'
})
export class ClinicalPatientFollowUpMainComponent {

    Field: Field;
    IsAcrossVisitAvailability: boolean = false;
    Patient_Follow_Up_Dto: PatientFollowUp = new PatientFollowUp();
    Follow_Up: PatientFollowUp = new PatientFollowUp();
    SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
    FollowUpPatient: PatientFollowUpDto = new PatientFollowUpDto();
    CalculatedFollowUpDate: string = '';
    constructor(
        private _clinicalNoteBLService: ClinicalNoteBLService,
        public msgBoxServ: MessageboxService,
        private _selectedPatient: ClinicalPatientService,
        public coreService: CoreService,
    ) { }

    ngOnInit() {
        if (this.Field) {
            this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
        } else {
            this.IsAcrossVisitAvailability = false;
        }
        this.SelectedPatient = this._selectedPatient.SelectedPatient;
        this.GetPatientFollowUpDetails();
        this.OnFollowUpDaysChange();
    }
    /**
 * @summary Adds a follow-up entry for the selected patient and saves the follow-up details using a service call.
 * 
 * This method first checks if the `PatientFollowUpValidator` form is valid. If valid, it sets the `FollowUpPatient` object with relevant details such as the `PatientVisitId`, `FollowUpRemark`, 
 * and `FollowUpDays`. It then calls the `AddPatientFollowUpDays` method from the `_clinicalNoteBLService` to save these details. If the save operation is successful, a success message is displayed, 
 * and the follow-up details are re-fetched. If the save operation fails, appropriate error messages are shown.
 * 
 */
    AddFollowUp() {
        if (this.Patient_Follow_Up_Dto.PatientFollowUpValidator.valid) {
            this.FollowUpPatient.PatientVisitId = this.SelectedPatient.PatientVisitId;
            this.FollowUpPatient.FollowUpRemarks = this.Patient_Follow_Up_Dto.PatientFollowUpValidator.get('FollowUpRemarks').value;
            this.FollowUpPatient.FollowUpDays = this.Patient_Follow_Up_Dto.PatientFollowUpValidator.get('FollowUpDays').value;
            this._clinicalNoteBLService.AddPatientFollowUpDays(this.FollowUpPatient)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Added Successfully"])
                        this.GetPatientFollowUpDetails()
                    } else {
                        this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                    }
                },
                    err => {
                        this.msgBoxServ.showMessage("error", ['Failed to save..']);
                    });
        } else {
            this.msgBoxServ.showMessage("error", ["Follow up Days Field is Mandatory"]);
        }
    }

    /**
 * @summary Retrieves the follow-up details for the selected patient's visit and updates the form with the retrieved data.
 * 
 * This method calls the `GetPatientFollowUpDetails` service method from `_clinicalNoteBLService` 
 * using the `PatientVisitId` of the selected patient. If the response is successful and contains results,
 * it assigns the first follow-up detail to the `Follow_Up` object and calls the `SetValue()` 
 * method to update the form with the retrieved follow-up data.
 * */
    GetPatientFollowUpDetails() {
        this._clinicalNoteBLService.GetPatientFollowUpDetails(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.Follow_Up = res.Results[0] as PatientFollowUp;
                        this.SetValue();
                    }
                }
            });
    }

    SetValue() {
        if (this.Follow_Up && this.Follow_Up.PatientVisitId !== 0) {
            const followUpDate = this.Follow_Up.FollowUpDate ? moment(this.Follow_Up.FollowUpDate).format('YYYY-MM-DD') : '';
            const formattedDate = moment(followUpDate, 'YYYY-MM-DD', true).isValid() ? followUpDate : '';

            this.Patient_Follow_Up_Dto.PatientFollowUpValidator.patchValue({
                FollowUpDays: this.Follow_Up.FollowUpDays,
                FollowUpRemarks: this.Follow_Up.FollowUpRemarks,
                FollowUpDate: formattedDate
            });
            this.CalculatedFollowUpDate = formattedDate;
        }
    }

    OnFollowUpDaysChange() {
        this.Patient_Follow_Up_Dto.PatientFollowUpValidator.get('FollowUpDays').valueChanges.subscribe((Days: number) => {
            if (Days > 0) {
                this.CalculateFollowUpDate(Days);
            } else {
                this.CalculatedFollowUpDate = '';
            }
        });
    }

    CalculateFollowUpDate(followUpDays: number) {
        const currentDate = moment();
        const followUpDate = currentDate.add(followUpDays, 'days');
        this.CalculatedFollowUpDate = followUpDate.format('YYYY-MM-DD');
    }
}
