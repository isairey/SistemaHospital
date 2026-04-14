import { CommonModule, DatePipe, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BillingSharedModule } from '../../billing/billing-shared.module';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';
import { DocumentUploadComponent } from '../shared/document-upload/document-upload.component';
import { OperationTheatreBLService } from '../shared/ot.bl.service';
import { OperationTheatreDLService } from '../shared/ot.dl.service';
import { OTBookingAddComponent } from './add-ot-booking/ot-booking-add.component';
import { OTBookingCheckListComponent } from './add-ot-checklist/ot-booking-checklist.component';
import { ConsentFormComponent } from './ot-booking-details/consent-form/consent-form.component';
import { OTBookingDetailsComponent } from './ot-booking-details/ot-booking-details.component';
import { OTBookingListComponent } from './ot-booking-list.component';
import { OTConcludeBookingComponent } from './ot-conclude-booking/ot-conclude-booking.component';
import { OTConcludeDetailComponent } from './ot-conclude-booking/ot-conclude-detail/ot-conclude-detail.component';

export const otSettingsRoutes =
    [
        {
            path: '', component: OTBookingListComponent
        }
    ]

@NgModule({
    providers: [
        OperationTheatreBLService,
        OperationTheatreDLService,
        {
            provide: LocationStrategy, useClass: HashLocationStrategy
        },
        DatePipe
    ],

    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        HttpClientModule,
        SharedModule,
        DanpheAutoCompleteModule,
        BillingSharedModule,
        RouterModule.forChild(otSettingsRoutes),
    ],
    declarations: [
        OTBookingListComponent,
        OTBookingAddComponent,
        OTBookingCheckListComponent,
        DocumentUploadComponent,
        OTBookingDetailsComponent,
        OTConcludeBookingComponent,
        OTConcludeDetailComponent,
        ConsentFormComponent
    ],
    bootstrap: []
})
export class OTBookingListModule {

}
