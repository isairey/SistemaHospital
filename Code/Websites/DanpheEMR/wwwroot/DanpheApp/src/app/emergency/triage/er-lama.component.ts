import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CoreService } from '../../core/shared/core.service';
import { PatientService } from '../../patients/shared/patient.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { EmergencyPatientModel } from '../shared/emergency-patient.model';
import { EmergencyBLService } from '../shared/emergency.bl.service';
import { EmergencyDLService } from '../shared/emergency.dl.service';

@Component({
    selector: 'er-patient-lama',
    templateUrl: './er-lama.html'
})

// App Component class
export class ERLamaComponent {
    public loading: boolean = false;

    public ERPatient: EmergencyPatientModel = new EmergencyPatientModel();

    @Output("sendBackERPatientLamaData") sendERPatientData: EventEmitter<object> = new EventEmitter<object>();
    @Input("currentPatientToLeave") currentERPatient: EmergencyPatientModel = null;
    @Input("action") action: string = null;
    dischargeErAction: boolean = false;

    constructor(public changeDetector: ChangeDetectorRef,
        public msgBoxServ: MessageboxService, public emergencyBLService: EmergencyBLService,
        public emergencyDLService: EmergencyDLService, public patientService: PatientService,
        public coreService: CoreService) {
    }

    ngOnInit() {
        this.ERPatient = this.currentERPatient;
        // if (this.action == "discharged") {
        //     this.dischargeErAction = true;
        // }
    }

    public PutLamaOfERPatient(actionString: string) {
        this.loading = true;

        if (this.loading) {
            if (this.ERPatient.FinalizedRemarks && this.ERPatient.FinalizedRemarks.trim() != "") {
                this.ERPatient.FinalizedRemarks = this.ERPatient.FinalizedRemarks.trim();
                this.emergencyBLService.PutLamaOfERPatient(this.ERPatient, actionString)
                    .subscribe((res: DanpheHTTPResponse) => {
                        if (res.Status == "OK") {
                            this.sendERPatientData.emit({ submit: true, callBackFrom: 'lama', ERPatient: res.Results });
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [this.ERPatient.FullName + 'is successfully' + res.Results.FinalizedStatus]);
                            this.loading = false;
                        } else {
                            this.sendERPatientData.emit({ submit: false, ERPatient: null });
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Cannot update your Medical Request now. Please Try again Later']);
                            this.loading = false;
                        }
                    });
            }
            else {
                this.msgBoxServ.showMessage("Failed", ["Please write the Medical Advice. "]);
                this.ERPatient.FinalizedRemarks = "";
                this.loading = false;
            }

        }
    }


    public Close() {
        this.sendERPatientData.emit({ submit: false, erPatient: null });
    }
}
