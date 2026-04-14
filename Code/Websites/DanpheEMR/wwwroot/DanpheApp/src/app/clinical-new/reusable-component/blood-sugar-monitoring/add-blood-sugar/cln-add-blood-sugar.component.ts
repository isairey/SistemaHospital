import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { DanpheHTTPResponse } from '../../../../../../src/app/shared/common-models';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { CLN_BloodSugarMonitoring } from '../../../../clinical-new/shared/model/cln-blood-sugar-monitoring.model';
import { Cln_BloodSugar_Dto } from '../../../../clinical-new/shared/model/cln-blood-sugar.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { SecurityService } from '../../../../security/shared/security.service';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalPatientService } from '../../../shared/clinical-patient.service';
@Component({
    selector: 'cln-add-blood-sugar',
    templateUrl: './cln-add-blood-sugar.component.html'
})
export class CLN_AddBloodSugarComponent {
    @Input("updateBloodSugar")
    UpdateBloodSugar: boolean = false;

    @Input("selectedBloodSugar")
    SelectedBloodSugar: CLN_BloodSugarMonitoring = new CLN_BloodSugarMonitoring();
    @Input("showBloodSugarAddBox")
    showBloodSugarAddBox: boolean = false;

    @Input("selected-BloodSugar")
    CurrentBloodSugar: CLN_BloodSugarMonitoring = new CLN_BloodSugarMonitoring();

    @Output("callback-blood-sugar-update")
    callbackBloodSugarUpdate: EventEmitter<Object> = new EventEmitter<Object>();

    BloodSugarDto: Cln_BloodSugar_Dto = new Cln_BloodSugar_Dto();
    loading: boolean;
    patientVisitId: number = null;
    constructor(
        private _messageBoxService: MessageboxService,
        private _clinicalNoteBLService: ClinicalNoteBLService,
        private _selectedPatientService: ClinicalPatientService,
        private _securityService: SecurityService,
        public coreService: CoreService
    ) {
        this.patientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    }

    ngOnInit() {
        if (this.UpdateBloodSugar) {
            this.SetBloodSugarValue();
        } else {
            this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
        }
    }
    public Close(): void {
        this.showBloodSugarAddBox = false;
    }
    public SubmitForm(): void {
        if (this.CurrentBloodSugar.IsValidCheck(undefined, undefined) === true) {
            this.loading = true;
            this.AddInputOutput();
        }
        else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please fill the form!"]);
        }
    }

    public AddInputOutput(): void {
        this.CurrentBloodSugar.PatientVisitId = this.patientVisitId;
        this.CurrentBloodSugar.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
        this.CurrentBloodSugar.IsActive = true;
        this.CurrentBloodSugar.CreatedBy = this._securityService.GetLoggedInUser().EmployeeId;
        this.CurrentBloodSugar.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        this.CurrentBloodSugar.EntryDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
        this._clinicalNoteBLService.PostBloodSugar(this.CurrentBloodSugar)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.loading = false;
                    this.CallBackAddInputOutput();
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added Successfully"]);
                    this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
                }
            },
                err => { this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [err]); });
    }

    public CallBackAddInputOutput(): void {
        this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
        this.callbackBloodSugarUpdate.emit();
    }

    public Discard(): void {
        this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
    }

    public UpdateForm(): void {
        if (this.CurrentBloodSugar.IsValidCheck(undefined, undefined) === true) {
            this.BloodSugarDto.BloodSugarMonitoringId = this.SelectedBloodSugar.BloodSugarMonitoringId;
            this.BloodSugarDto.PatientVisitId = this.patientVisitId;
            this.BloodSugarDto.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
            this.BloodSugarDto.IsActive = true;
            this.BloodSugarDto.Insulin = this.CurrentBloodSugar.Insulin;
            this.BloodSugarDto.RbsValue = this.CurrentBloodSugar.RbsValue;
            this.BloodSugarDto.Remarks = this.CurrentBloodSugar.Remarks;
            this.loading = true;
            this._clinicalNoteBLService.UpdateBloodSugar(this.BloodSugarDto)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.loading = false;
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Updated Successfully"]);
                        this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
                        this.callbackBloodSugarUpdate.emit();
                    }
                }, err => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
                });
        } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please fill the form!"]);
        }
    }

    SetBloodSugarValue() {
        if (this.SelectedBloodSugar) {
            this.CurrentBloodSugar.RbsValue = this.SelectedBloodSugar.RbsValue || null
            this.CurrentBloodSugar.Insulin = this.SelectedBloodSugar.Insulin || null;
            this.CurrentBloodSugar.Remarks = this.SelectedBloodSugar.Remarks || '';
        }
    }

}
