import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { LabListRequisitionComponent } from './lab-tests/lab-requisition/lab-list-requisition.component';
import { LabsMainComponent } from './labs-main.component';
//import { LabTestsCollectSampleComponent } from './lab-tests/lab-tests-collect-sample.component';
import { PageNotFound } from '../404-error/404-not-found.component';
import { LabDashboardComponent } from "../dashboards/labs/lab-dashboard.component";
import { WardBillingComponent } from '../labs/billing/ward-billing.component';
import { AuthGuardService } from '../security/shared/auth-guard.service';
import { ResetPatientcontextGuard } from '../shared/reset-patientcontext-guard';
import { ExternalLabsMainComponent } from './external-labs/external-labs-main.component';
import { ExternalTestListComponent } from './external-labs/tests-list/external-test-list.component';
import { InternalTestListComponent } from './external-labs/tests-list/internal-test-list.component';
import { LabTypeSelectionComponent } from './lab-selection/lab-type-selection.component';
import { LabTestsCollectSampleComponent } from './lab-tests/lab-collect-sample/lab-tests-collect-sample.component';
import { LabTestsFinalReports } from './lab-tests/lab-final-reports/lab-tests-final-reports';
import { LabBarCodeComponent } from './lab-tests/lab-master/lab-barcode';
import { LabReportDispatchComponent } from './lab-tests/lab-master/lab-report-dispatch';
import { LabTestsPendingReports } from './lab-tests/lab-pending-reports/lab-tests-pending-reports';
import { LabTestsPendingResultsComponent } from './lab-tests/lab-pending-results/lab-tests-pending-results.component';
import { LabTestsResults } from './lab-tests/lab-tests-results.component';
import { CovidSmsListComponent } from './notification/covid-sms/covid-sms-list.component';
import { LabImuUploadComponent } from './notification/imu/imu-upload.component';
import { LabReportSMSComponent } from './notification/lab-report-sms/lab-report-sms.component';
import { LabNotificationComponent } from './notification/notification-main.component';
import { LabSelectionGuardService } from './shared/lab-selection-guard.service';
import { LabSampleReceiveComponent } from './lab-tests/lab-sample-receive/lab-sample-receive.component';


@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: LabsMainComponent, canDeactivate: [ResetPatientcontextGuard],
        children: [
          { path: '', redirectTo: 'Dashboard', pathMatch: 'full' },
          {
            path: 'Dashboard',
            component: LabDashboardComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService]
          },
          { path: 'Requisition', component: LabListRequisitionComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'CollectSample', component: LabTestsCollectSampleComponent, canActivate: [AuthGuardService, LabSelectionGuardService] },
          { path: 'SampleReceive', component: LabSampleReceiveComponent, canActivate: [AuthGuardService, LabSelectionGuardService] },
          { path: 'AddResult', component: LabTestsResults, canActivate: [AuthGuardService, LabSelectionGuardService] },
          { path: 'PendingReports', component: LabTestsPendingReports, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'PendingLabResults', component: LabTestsPendingResultsComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'FinalReports', component: LabTestsFinalReports, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'WardBilling', component: WardBillingComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'BarCode', component: LabBarCodeComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          { path: 'ReportDispatch', component: LabReportDispatchComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService] },
          {
            path: 'Notification', component: LabNotificationComponent,
            children: [
              { path: '', redirectTo: 'LabReportSMS', pathMatch: 'full' },
              { path: 'LabReportSMS', component: LabReportSMSComponent, canActivate: [AuthGuardService] },
              { path: 'IMUUpload', component: LabImuUploadComponent, canActivate: [AuthGuardService] },
              { path: 'CovidSMS', component: CovidSmsListComponent },
              { path: "**", component: PageNotFound }
            ]
            , canActivate: [AuthGuardService, ResetPatientcontextGuard, LabSelectionGuardService]
          },
          { path: 'Settings', loadChildren: '../labs/lab-settings/lab-settings.module#LabSettingsModule', canActivate: [LabSelectionGuardService] },
          {
            path: 'ExternalLabs', component: ExternalLabsMainComponent,
            canActivate: [LabSelectionGuardService],
            children: [
              { path: '', redirectTo: 'TestList', pathMatch: 'full' },
              { path: 'TestList', component: InternalTestListComponent },
              { path: 'ExternalTestList', component: ExternalTestListComponent },
              { path: "**", component: PageNotFound }

            ]
          },
          { path: 'LabTypeSelection', component: LabTypeSelectionComponent },
          { path: 'Lis', loadChildren: '../labs/lab-lis/lis-module#LISModule', canActivate: [AuthGuardService, LabSelectionGuardService] },
          { path: "**", component: PageNotFound }

        ]
      },
      { path: "**", component: PageNotFound }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class LabsRoutingModule {

}
