import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PageNotFound } from "../404-error/404-not-found.component";
import { AuthGuardService } from "../security/shared/auth-guard.service";
import { ClinicalMainComponent } from "./clinical-main.component";
import { ClinicalOverviewWrapperComponent } from "./clinical-overview-wrapper/clinical-overview-wrapper.component";
import { ClinicalEmergencyMainComponent } from "./emergency/clinical-emergency-main.component";
import { EmergencyPatientVisit } from "./emergency/emergency-patients/emergency-patient-visit.component";
import { ClinicalIpdMainComponent } from "./ipd/clinical-ipd-main.component";
import { IPAdmittedPatient } from "./ipd/ipd-admitted-patient/ip-admitted-patient.component";
import { IPDischargedPatient } from "./ipd/ipd-discharged-patient/ip-discharged-patients.component";
import { ClinicalOpdMainComponent } from "./opd/clinical-opd-main.component";
import { OPDPatientVisit } from "./opd/opd-patient-visit/opd-patient-visit.component";
import { IntakeOutputListComponent } from "./reusable-component/intake-output/intake-output-list.component";
import { VitalsNewComponent } from "./reusable-component/vitals-new/vitals-new.component";
@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ClinicalMainComponent, canActivate: [AuthGuardService],
        // component: ClinicalComponent, canActivate: [AuthGuardService, ActivateBillingCounterGuardService],
        children: [

          // { path: '', redirectTo: 'ClinicalAssessmentAndPlan', pathMatch: 'full' },
          // { path: 'ClinicalAssessmentAndPlan', component: ClinicalAssessmentAndPlanMainComponent, canActivate: [AuthGuardService] },
          // { path: '', component: ChiefComplaintsComponent, canActivate: [AuthGuardService] },
          { path: '', redirectTo: 'OPD', pathMatch: 'full' },
          {
            path: 'Clinical-Overview',
            component: ClinicalOverviewWrapperComponent,
          },
          {
            path: 'OPD', component: ClinicalOpdMainComponent, canActivate: [AuthGuardService], children: [
              {
                path: "",
                redirectTo: "PatientVisits",
                pathMatch: "full",
              },
              {
                path: "PatientVisits",
                component: OPDPatientVisit,
                canActivate: [AuthGuardService],
              },
              {
                path: "**", component: PageNotFound,
              },
            ],
          },
          {
            path: 'IPD', component: ClinicalIpdMainComponent, canActivate: [AuthGuardService], children: [
              {
                path: "",
                redirectTo: "AdmittedPatient",
                pathMatch: "full",
              },
              {
                path: "AdmittedPatient",
                component: IPAdmittedPatient,
                canActivate: [AuthGuardService],
              },
              {
                path: "DischargedPatient",
                component: IPDischargedPatient,
                canActivate: [AuthGuardService],
              },
              {
                path: "**", component: PageNotFound,
              },
            ],
          },


          {
            path: 'Emergency', component: ClinicalEmergencyMainComponent, canActivate: [AuthGuardService], children: [
              {
                path: "",
                redirectTo: "ERPatient",
                pathMatch: "full",
              },
              {
                path: "ERPatient",
                component: EmergencyPatientVisit,
                canActivate: [AuthGuardService],
              },
              {
                path: "**", component: PageNotFound,
              },
            ],
          },



          { path: 'Vitals', component: VitalsNewComponent }, // add AuthGuardService later
          { path: 'IntakeOutput', component: IntakeOutputListComponent }, // add AuthGuardService later

        ]
      },
      { path: "**", component: PageNotFound }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class ClinicalNewRoutingModule { }
