import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageNotFound } from '../404-error/404-not-found.component';
import { OTMainComponent } from './ot-main.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: OTMainComponent,

                children: [
                    // { path: '', loadChildren: './ot-booking-list/ot-booking-list.module#OTBookingListModule', },
                    { path: '', redirectTo: 'BookingList', pathMatch: 'full' },
                    { path: 'BookingList', loadChildren: './ot-booking-list/ot-booking-list.module#OTBookingListModule', },
                    { path: 'Settings', loadChildren: './settings/ot-settings.module#OTSettingsModule', },
                    { path: 'Reports', loadChildren: './ot-reports/ot-reports.module#OTReportsModule', },
                ]
            },
            { path: "**", component: PageNotFound }

        ])
    ],
    exports: [
        RouterModule
    ]
})

export class OTRoutingModule { }