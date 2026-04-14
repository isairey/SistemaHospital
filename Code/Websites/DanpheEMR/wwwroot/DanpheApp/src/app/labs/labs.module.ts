import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LabsRoutingModule } from './labs-routing.module';

import { BillingDLService } from '../billing/shared/billing.dl.service';
import { LabsBLService } from './shared/labs.bl.service';
import { LabsDLService } from './shared/labs.dl.service';

import { LabListRequisitionComponent } from '../labs/lab-tests/lab-requisition/lab-list-requisition.component';
import { LabsMainComponent } from './labs-main.component';
//import { LabTestsCollectSampleComponent } from '../labs/lab-tests/lab-tests-collect-sample.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { NgxPaginationModule } from 'ngx-pagination';
import { ADT_BLService } from '../adt/shared/adt.bl.service';
import { ADT_DLService } from '../adt/shared/adt.dl.service';
import { AppointmentDLService } from '../appointments/shared/appointment.dl.service';
import { VisitDLService } from '../appointments/shared/visit.dl.service';
import { BillingSharedModule } from '../billing/billing-shared.module';
import { BillingBLService } from '../billing/shared/billing.bl.service';
import { LabDashboardComponent } from "../dashboards/labs/lab-dashboard.component";
import { WardBillingComponent } from '../labs/billing/ward-billing.component';
import { PatientsDLService } from '../patients/shared/patients.dl.service';
import { SettingsSharedModule } from '../settings-new/settings-shared.module';
import { DanpheAutoCompleteModule } from '../shared/danphe-autocomplete';
import { SharedModule } from "../shared/shared.module";
import { ExternalLabsMainComponent } from './external-labs/external-labs-main.component';
import { ExternalTestListComponent } from './external-labs/tests-list/external-test-list.component';
import { InternalTestListComponent } from './external-labs/tests-list/internal-test-list.component';
import { VendorSelectComponent } from './external-labs/vendor-assignment/vendor-select.component';
import { LabRequestsListComponent } from './lab-requests/lab-request-list';
import { LabRequestsComponent } from './lab-requests/lab-requests.component';
import { LabTypeSelectionComponent } from './lab-selection/lab-type-selection.component';
import { LabTestsEmptyAddReportComponent } from './lab-tests/lab-collect-sample/lab-empty-report-template';
import { LabTestsCollectSampleComponent } from './lab-tests/lab-collect-sample/lab-tests-collect-sample.component';
import { UndoLabSampleCode } from './lab-tests/lab-collect-sample/undo-lab-samplecode.component';
import { LabTestsFinalReports } from './lab-tests/lab-final-reports/lab-tests-final-reports';
import { LabBarCodeComponent } from './lab-tests/lab-master/lab-barcode';
import { LabReportDispatchComponent } from './lab-tests/lab-master/lab-report-dispatch';
import { LabReportDispatchDetailComponent } from './lab-tests/lab-master/lab-report-dispatch-detail';
import { LabTestsPendingReports } from './lab-tests/lab-pending-reports/lab-tests-pending-reports';
import { LabTestsPendingResultsComponent } from './lab-tests/lab-pending-results/lab-tests-pending-results.component';
import { LabWorkListReportComponent } from './lab-tests/lab-pending-results/lab-worklist-report';
import { CovidSmsListComponent } from './notification/covid-sms/covid-sms-list.component';
import { LabImuUploadComponent } from './notification/imu/imu-upload.component';
import { LabReportSMSComponent } from './notification/lab-report-sms/lab-report-sms.component';
import { LabNotificationComponent } from './notification/notification-main.component';
import { LabCategorySelectComponent } from './shared/lab-select-category/lab-select-category.component';
import { LabSelectionGuardService } from './shared/lab-selection-guard.service';
import { LabStickerComponent } from './shared/lab-sticker.component';
import { LabTestChangeComponent } from './shared/lab-test-change';
import { LabTestResultService } from './shared/lab.service';
import { LabSampleReceiveComponent } from './lab-tests/lab-sample-receive/lab-sample-receive.component';


@NgModule({
  providers: [
    LabsBLService,
    LabsDLService,
    LabTestResultService,
    BillingDLService,
    PatientsDLService,
    BillingBLService,
    VisitDLService,
    AppointmentDLService,
    ADT_BLService,
    ADT_DLService,
    LabSelectionGuardService],
  imports: [LabsRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    AngularMultiSelectModule,
    SharedModule,
    DanpheAutoCompleteModule,
    BillingSharedModule,
    SettingsSharedModule,
    NgxPaginationModule,
    ScrollingModule
  ],
  declarations: [LabsMainComponent,
    LabListRequisitionComponent,
    LabTestsCollectSampleComponent,
    LabDashboardComponent,
    WardBillingComponent,
    LabTestsPendingReports,
    LabTestsFinalReports,
    LabTestsPendingResultsComponent,
    LabTestChangeComponent,
    LabRequestsComponent,
    LabRequestsListComponent,
    LabStickerComponent,
    LabBarCodeComponent,
    UndoLabSampleCode,
    ExternalLabsMainComponent,
    InternalTestListComponent,
    ExternalTestListComponent,
    VendorSelectComponent,
    LabReportDispatchComponent,
    LabReportDispatchDetailComponent,
    LabTestsEmptyAddReportComponent,
    LabTypeSelectionComponent,
    LabCategorySelectComponent,
    LabWorkListReportComponent,
    CovidSmsListComponent,
    LabNotificationComponent,
    LabImuUploadComponent,
    LabReportSMSComponent,
    LabSampleReceiveComponent
  ],
  bootstrap: []

})
export class LabsModule { }
