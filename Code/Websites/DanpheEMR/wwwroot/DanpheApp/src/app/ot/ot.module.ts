import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ADT_BLService } from '../adt/shared/adt.bl.service';
import { ADT_DLService } from '../adt/shared/adt.dl.service';
import { AppointmentDLService } from '../appointments/shared/appointment.dl.service';
import { VisitDLService } from '../appointments/shared/visit.dl.service';
import { BillingBLService } from '../billing/shared/billing.bl.service';
import { OperationTheatreBLService } from '../ot-module/shared/ot.bl.service';
import { OperationTheatreDLService } from '../ot-module/shared/ot.dl.service';
import { SettingsSharedModule } from '../settings-new/settings-shared.module';
import { DanpheAutoCompleteModule } from '../shared/danphe-autocomplete/danphe-auto-complete.module';
import { SharedModule } from '../shared/shared.module';
import { OTMainComponent } from './ot-main.component';
import { OTRoutingModule } from './ot-routing.module';

@NgModule({

    imports: [OTRoutingModule,
        CommonModule,
        SharedModule,
        SettingsSharedModule,
        DanpheAutoCompleteModule,
        ReactiveFormsModule,
        FormsModule
    ],
    declarations: [
        OTMainComponent,
    ],
    providers: [
        OperationTheatreBLService,
        OperationTheatreDLService,
        ADT_BLService,
        VisitDLService,
        BillingBLService,
        AppointmentDLService,
        ADT_DLService
    ]

})
export class OperationTheatreModule { }