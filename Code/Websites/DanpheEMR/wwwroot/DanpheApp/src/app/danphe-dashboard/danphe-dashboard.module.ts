import { CommonModule } from '@angular/common'; // Import CommonModule
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AgeWiseDetailsComponent } from './age-wise-details/age-wise-details.component';
import { CategoryWiseIncomeReportComponent } from './categorywiseincomereport/categorywiseincomereport.component';
import { CollectionDetailComponent } from './collectiondetail/collectiondetail.component';
import { DanpheDashboardRoutingModule } from './danphe-dashboard-routing.module';
import { DanpheDashboardComponent } from './danphe-dashboard.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FractionSummaryComponent } from './fractionsummary/fractionsummary.component';
import { LabReportsComponent } from './labreports/labreports.component';
import { LabTestsComponent } from './labtests/labtests.component';
import { RadiologyReportsComponent } from './radiologyreports/radiologyreports.component';
import { RadioTestsComponent } from './radiotests/radiotests.component';

@NgModule({
  declarations: [
    DanpheDashboardComponent,
    DashboardComponent,
    CollectionDetailComponent,
    FractionSummaryComponent,
    RadiologyReportsComponent,
    LabReportsComponent,
    CategoryWiseIncomeReportComponent,
    LabTestsComponent,
    RadioTestsComponent,
    AgeWiseDetailsComponent
  ],
  imports: [
    CommonModule,
    DanpheDashboardRoutingModule,
    RouterModule,
    MatTooltipModule,
    MatButtonModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [DanpheDashboardComponent]
})
export class DanpheDashboardModule { }
