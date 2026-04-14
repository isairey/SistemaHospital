import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SettingsSharedModule } from '../settings-shared.module';
import { PrintTemplateSettingsComponent } from './add-new/add-update-print-template.component';
import { ListPrintTemplateComponent } from './list/list-print-templates-settings.component';


export const printTemplateSettingsRoutes =
    [
        {
            path: '', component: ListPrintTemplateComponent
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
        RouterModule.forChild(printTemplateSettingsRoutes),
        SettingsSharedModule
    ],
    declarations: [
        PrintTemplateSettingsComponent,
        ListPrintTemplateComponent
    ],
    bootstrap: []
})

export class PrintTemplateSettingsModule {

}
