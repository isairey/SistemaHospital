import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthGuardService } from '../../security/shared/auth-guard.service';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';
import { RadDefSignatoriesComponent } from './def-signatories/rad-def-signatories.component';
import { ImagingTypeAddComponent } from './imaging-types/imaging-type-add.component';
import { ImagingTypeListComponent } from './imaging-types/imaging-type-list.component';
import { ImagingItemAddComponent } from './items/imaging-item-add.component';
import { ImagingItemListComponent } from './items/imaging-item-list.component';
import { RadiologySettingsMainComponent } from './radiology-settings.main.component';
import { RadiologyReportTemplateComponent } from './report-templates/radiology-report-template.component';
import { TemplateStyleSettingsComponent } from './template-style-settings/template-style-settings.component';


export const radSettingsRoutes =
  [
    {
      path: '', component: RadiologySettingsMainComponent,
      children: [
        { path: '', redirectTo: 'ManageImagingType', pathMatch: 'full' },
        { path: 'ManageImagingType', component: ImagingTypeListComponent, canActivate: [AuthGuardService] },
        { path: 'ManageImagingItem', component: ImagingItemListComponent, canActivate: [AuthGuardService] },
        { path: 'ManageRadiologyTemplate', component: RadiologyReportTemplateComponent, canActivate: [AuthGuardService] },
        { path: 'DefaultSignatories', component: RadDefSignatoriesComponent, canActivate: [AuthGuardService] },
        { path: 'TemplateStyle', component: TemplateStyleSettingsComponent, canActivate: [AuthGuardService] },

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
    RouterModule.forChild(radSettingsRoutes),

  ],
  declarations: [
    RadiologySettingsMainComponent,
    ImagingTypeAddComponent,
    ImagingTypeListComponent,
    ImagingItemAddComponent,
    ImagingItemListComponent,
    RadiologyReportTemplateComponent,
    RadDefSignatoriesComponent,
    TemplateStyleSettingsComponent
  ],
  bootstrap: []
})

export class RadiologySettingsModule {

}
