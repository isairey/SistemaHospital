import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthGuardService } from '../../security/shared/auth-guard.service';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';
import { ClinicalNoteListComponent } from './clinical-notes/clinical-note-list.component';
import { ClinicalSettingsMainComponent } from './clinical-settings-main.component';
import { ICD10GroupListComponent } from './icd10-groups/icd10-group-list.component';
import { IntakeOutputAddComponent } from './intakeoutput/intake-output-add.component';
import { IntakeOutputTypeListComponent } from './intakeoutput/intake-output-type.component';

import { ReactionAddComponent } from './reactions/reaction-add.component';
import { ReactionListComponent } from './reactions/reaction-list.component';

export const clnSettingsRoutes =
  [
    {
      path: '', component: ClinicalSettingsMainComponent,
      children: [
        { path: '', redirectTo: 'ManageReaction', pathMatch: 'full' },
        { path: 'ManageReaction', component: ReactionListComponent, canActivate: [AuthGuardService] },
        { path: 'ICDGroups', component: ICD10GroupListComponent, canActivate: [AuthGuardService] },
        { path: 'ClinicalNote', component: ClinicalNoteListComponent, canActivate: [AuthGuardService] },
        { path: 'IntakeOutputVariables', component: IntakeOutputTypeListComponent, canActivate: [AuthGuardService] }
      ]
    }
  ]

@NgModule({
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy }],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,
    RouterModule.forChild(clnSettingsRoutes),
  ],
  declarations: [
    ClinicalSettingsMainComponent,
    ReactionAddComponent,
    ReactionListComponent,
    ICD10GroupListComponent,
    IntakeOutputTypeListComponent,
    IntakeOutputAddComponent,
    ClinicalNoteListComponent
  ],
  bootstrap: []
})
export class ClinicalSettingsModule {

}
