import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillingSharedModule } from '../../../billing/billing-shared.module';
import { MedicareBLService } from '../../../insurance/medicare/shared/medicare.bl.service';
import { MedicareDLService } from '../../../insurance/medicare/shared/medicare.dl.service';
import { MedicareService } from '../../../insurance/medicare/shared/service/medicare.service';
import { DepartmentSettingsModule } from '../../../settings-new/departments/dept-settings.module';
import { EmpSettingsModule } from '../../../settings-new/employee/emp-settings.module';
import { DanpheAutoCompleteModule } from '../../../shared/danphe-autocomplete';
import { SharedModule } from '../../../shared/shared.module';
import { MedicareDependentComponent } from './dependent/medicare-dependent.component';
import { MedicareRegistrationMainPatientComponent } from './medicare-registration-main-patient.component';
import { MedicareRegistrationRoutingPatientModule } from './medicare-registration-patient.routing.module';
import { PatientMedicareMemberComponent } from './member/patient-medicare-member.component';


@NgModule({
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        MedicareBLService,
        MedicareDLService,
        MedicareService
    ],

    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        SharedModule,
        DanpheAutoCompleteModule,
        EmpSettingsModule,
        DepartmentSettingsModule,
        MedicareRegistrationRoutingPatientModule,
        BillingSharedModule

    ],
    declarations: [
        MedicareRegistrationMainPatientComponent,
        PatientMedicareMemberComponent,
        MedicareDependentComponent,

    ],
    exports: [
        PatientMedicareMemberComponent
    ],
    bootstrap: []
})
export class MedicareRegistrationPatientModule {

}
