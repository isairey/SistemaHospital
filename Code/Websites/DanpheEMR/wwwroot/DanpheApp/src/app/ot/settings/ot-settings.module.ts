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
import { OtManageAnaesthesiaTypeComponent } from './ot-manage-anaesthesia-and-type/ot-manage-anaesthesia-type.component';
import { AnaesthesiaTypeComponent } from './ot-manage-anaesthesia-and-type/ot-manage-anaesthesia-type/ot-manage-anaesthesia-type.component';
import { OtManageMapAnaesthesiaComponent } from './ot-manage-anaesthesia-and-type/ot-manage-map-anaesthesia/ot-manage-map-anaesthesia.component';
import { ManageCheckListComponent } from './ot-manage-checklist/ot-manage-checklist.component';
import { ManageMachinesComponent } from './ot-manage-machines/ot-manage-machines.component';
import { ManagePersonnelComponent } from './ot-manage-personnel-type/ot-manage-personnel-type.component';
import { ManageSurgeryComponent } from './ot-manage-surgery/ot-manage-surgery.component';
import { MapSurgeryCheckListComponent } from './ot-map-surgery-checklist/ot-map-surgery-checklist.component';
import { OTSettingsMainComponent } from './ot-settings-main.component';

export const otSettingsRoutes =
    [
        {
            path: '', component: OTSettingsMainComponent,
            children: [
                { path: '', redirectTo: 'ManageOTMachine', pathMatch: 'full' },
                { path: 'ManageOTMachine', component: ManageMachinesComponent },
                { path: 'ManagePersonnelType', component: ManagePersonnelComponent },
                { path: 'ManageOTCheckList', component: ManageCheckListComponent },
                { path: 'ManageOTSurgery', component: ManageSurgeryComponent },
                { path: 'MapSurgeryCheckList', component: MapSurgeryCheckListComponent },
                {
                    path: 'ManageAnaesthesiaTypes', component: OtManageAnaesthesiaTypeComponent,
                    children: [
                        { path: '', redirectTo: 'MapAnaesthesiaServiceItem', pathMatch: 'full' },
                        { path: 'MapAnaesthesiaServiceItem', component: OtManageMapAnaesthesiaComponent },
                        { path: 'AnaesthesiaType', component: AnaesthesiaTypeComponent },
                    ]
                }
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
        RouterModule.forChild(otSettingsRoutes),
    ],
    declarations: [
        OTSettingsMainComponent,
        ManageMachinesComponent,
        ManagePersonnelComponent,
        ManageCheckListComponent,
        ManageSurgeryComponent,
        MapSurgeryCheckListComponent,
        OtManageAnaesthesiaTypeComponent,
        AnaesthesiaTypeComponent,
        OtManageMapAnaesthesiaComponent
    ],
    bootstrap: []
})


export class OTSettingsModule {

}
