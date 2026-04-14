import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BillingSharedModule } from '../../billing/billing-shared.module';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';
import { OperationTheatreBLService } from '../shared/ot.bl.service';
import { OperationTheatreDLService } from '../shared/ot.dl.service';
import { OTFinancialReportComponent } from './ot-financial-report/ot-financial-report.component';
import { OTReportsMainComponent } from './ot-reports-main.component';
import { OTSummaryReportComponent } from './ot-summary-report/ot-summary-report.component';

export const otReportsRoutes =
    [
        {
            path: '',
            children: [
                { path: '', component: OTReportsMainComponent },
                { path: 'OTSummaryReport', component: OTSummaryReportComponent },
                { path: 'OTFinancialReport', component: OTFinancialReportComponent },
            ]
        }
    ]

@NgModule({
    providers: [
        OperationTheatreBLService,
        OperationTheatreDLService,
        {
            provide: LocationStrategy, useClass: HashLocationStrategy
        }
    ],

    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        SharedModule,
        DanpheAutoCompleteModule,
        BillingSharedModule,
        RouterModule.forChild(otReportsRoutes),
    ],
    declarations: [
        OTReportsMainComponent,
        OTSummaryReportComponent,
        OTFinancialReportComponent
    ],
    bootstrap: []
})


export class OTReportsModule {

}
