import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ADT_BLService } from '../adt/shared/adt.bl.service';
import { ADT_DLService } from '../adt/shared/adt.dl.service';
import { AppointmentDLService } from '../appointments/shared/appointment.dl.service';
import { VisitDLService } from '../appointments/shared/visit.dl.service';
import { BillingSharedModule } from '../billing/billing-shared.module';
import { BillingDLService } from '../billing/shared/billing.dl.service';
import { PatientsDLService } from '../patients/shared/patients.dl.service';
import { SettingsSharedModule } from '../settings-new/settings-shared.module';
import { DanpheAutoCompleteModule } from '../shared/danphe-autocomplete/danphe-auto-complete.module';
import { SelectVisitCanActivateGuard } from '../shared/select-visit-canactivate-guard';
import { SharedModule } from "../shared/shared.module";
import { Rad_FileUploadComponent } from './file-upload/rad-file-upload.component';
import { Rad_AddReportComponent } from './rad-add-report/rad-add-report.component';
import { RadiologyEditDoctorsPopupComponent } from './rad-edit-doctors/rad-edit-doctors-popup.component';
import { RadiologyEditDoctorsComponent } from './rad-edit-doctors/rad-edit-doctors.component';
import { RadiologyMainComponent } from './radiology-main.component';
import { RadiologyRoutingModule } from './radiology-routing.module';
import { ImagingReportsListComponent } from "./reports-list/imaging-reports-list.component";
import { ImagingRequisitionListComponent } from "./requisition-list/imaging-requisition-list.component";
import { ImagingBLService } from './shared/imaging.bl.service';
import { ImagingDLService } from './shared/imaging.dl.service';
import { ImagingTypeSelectorComponent } from './shared/RadiologyTypeSelector/ImagingTypeSelector.component';
import { Rad_InpatientListComponent } from './ward-billing/rad-ip-list.component';
import { RadiologyWardBillingComponent } from './ward-billing/rad-wardbilling.component';


@NgModule({
  providers: [SelectVisitCanActivateGuard,
    ImagingBLService,
    ImagingDLService,
    BillingDLService,
    PatientsDLService,
    VisitDLService,
    ADT_DLService,
    ADT_BLService,
    AppointmentDLService
  ],
  imports: [RadiologyRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,
    SettingsSharedModule,
    BillingSharedModule
  ],
  declarations: [RadiologyMainComponent,
    ImagingRequisitionListComponent,
    ImagingReportsListComponent,
    Rad_InpatientListComponent,
    RadiologyWardBillingComponent,
    RadiologyEditDoctorsComponent,
    RadiologyEditDoctorsPopupComponent,
    ImagingTypeSelectorComponent,
    Rad_AddReportComponent,
    Rad_FileUploadComponent
  ],
  bootstrap: []
})
export class RadiologyModule { }

