import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PageNotFound } from "../404-error/404-not-found.component";
import { AuthGuardService } from "../security/shared/auth-guard.service";
import { ChiefComplainsComponent } from "./clinical-components/chief-complains/chief-complains.component";
import { ClinicalComponentsListComponent } from "./clinical-components/clinical-components-list.component";
import { ClinicalFieldMappingComponent } from "./clinical-field-mapping/clinical-field-mapping.component";
import { ClinicalHeadingFieldsComponent } from "./clinical-heading-setup/clinical-heading-fields/clinical-heading-fields.component";
import { ClinicalHeadingSetupComponent } from "./clinical-heading-setup/clinical-heading-setup-component";
import { ClinicalHeadingSetupListComponent } from "./clinical-heading-setup/clinical-heading-setup-list/clinical-heading-setup-list.component";
import { ClinicalNotesComponent } from "./clinical-notes/clinical-notes.component";
import { ManageClinicalNotesComponent } from "./clinical-notes/manage-clinical-notes/manage-clinical-notes.component";
import { ClinicalQuickPhrasesComponents } from "./clinical-quick-phrases/clinical-quick-phrases.component";
import { PersonalPhrasesComponent } from "./clinical-quick-phrases/personal-phrases/personal-phrases.component";
import { SharedPhrasesComponent } from "./clinical-quick-phrases/shared-phrases/shared-phrases.component";
import { ClinicalSettingsComponent } from "./clinical-settings.component";
import { ClinicalTemplateComponent } from "./clinical-template/clinical-template.component";
import { ManageTemplateComponent } from "./clinical-template/manage-template/manage-template/manage-template.component";
import { ClinicalVariablesComponent } from "./clinical-variables/clinical-variables.component";
import { IntakeTimingComponent } from "./clinical-variables/intake-timing/intake-timing.component";
import { IntakeOutputTypeListComponent } from "./clinical-variables/intakeoutput/intake-output-type.component";
import { ICDGroupListComponent } from "./icd-groups/icd-group-list.component";
import { ReactionListComponent } from "./reactions/reaction-list.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '', component: ClinicalSettingsComponent, canActivate: [AuthGuardService],
        children: [
          { path: '', redirectTo: 'ClinicalHeadingSetup', pathMatch: 'full' },
          {
            path: 'ClinicalHeadingSetup', component: ClinicalHeadingSetupComponent, canActivate: [AuthGuardService], children: [
              {
                path: "",
                redirectTo: "HeadingSetupList",
                pathMatch: "full",
              },
              {
                path: "HeadingSetupList",
                component: ClinicalHeadingSetupListComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "HeadingFields",
                component: ClinicalHeadingFieldsComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },
          { path: 'ManageReaction', component: ReactionListComponent, canActivate: [AuthGuardService] },
          { path: 'ICDGroups', component: ICDGroupListComponent, canActivate: [AuthGuardService] },
          { path: 'FieldMapping', component: ClinicalFieldMappingComponent, canActivate: [AuthGuardService] },
          {
            path: 'QuickPhrases',
            component: ClinicalQuickPhrasesComponents,
            canActivate: [AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "PersonalPhrases",
                pathMatch: "full",
              },
              {
                path: "PersonalPhrases",
                component: PersonalPhrasesComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "SharedPhrases",
                component: SharedPhrasesComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },
          {
            path: "ClinicalComponents",
            component: ClinicalComponentsListComponent,
            canActivate: [AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "ChiefComplains",
                pathMatch: "full",
              },
              {
                path: "ChiefComplains",
                component: ChiefComplainsComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },
          {
            path: "Templates",
            component: ClinicalTemplateComponent,
            canActivate: [AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "ManageTemplates",
                pathMatch: "full",
              },
              {
                path: "ManageTemplates",
                component: ManageTemplateComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },
          {
            path: 'ClinicalVariables', component: ClinicalVariablesComponent, canActivate: [AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "IntakeOutput",
                pathMatch: "full",
              },
              {
                path: "IntakeOutput",
                component: IntakeOutputTypeListComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "IntakeTiming",
                component: IntakeTimingComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },
          {
            path: 'ClinicalNotes', component: ClinicalNotesComponent, canActivate: [AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "ManageClinicalNotes",
                pathMatch: "full",
              },
              {
                path: "ManageClinicalNotes",
                component: ManageClinicalNotesComponent,
                canActivate: [AuthGuardService],
              },
              { path: "**", component: PageNotFound },
            ],
          },


        ]
      },
      { path: "**", component: PageNotFound }
    ])
  ],
  exports: [
    RouterModule
  ]

})
export class ClinicalSettingsRoutingModule { }
