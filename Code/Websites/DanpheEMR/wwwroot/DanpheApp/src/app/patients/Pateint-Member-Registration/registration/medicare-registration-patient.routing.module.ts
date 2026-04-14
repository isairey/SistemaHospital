import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthGuardService } from "../../../security/shared/auth-guard.service";
import { MedicareDependentComponent } from "./dependent/medicare-dependent.component";
import { MedicareRegistrationMainPatientComponent } from "./medicare-registration-main-patient.component";
import { PatientMedicareMemberComponent } from "./member/patient-medicare-member.component";

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '', component: MedicareRegistrationMainPatientComponent,
                children: [
                    { path: '', redirectTo: 'Member', pathMatch: 'full' },
                    { path: 'Member', component: PatientMedicareMemberComponent, canActivate: [AuthGuardService] },
                    { path: 'Dependent', component: MedicareDependentComponent, canActivate: [AuthGuardService] },
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MedicareRegistrationRoutingPatientModule { }