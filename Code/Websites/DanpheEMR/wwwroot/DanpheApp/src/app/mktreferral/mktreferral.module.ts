import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DanpheAutoCompleteModule } from '../shared/danphe-autocomplete';
import { SharedModule } from '../shared/shared.module';
import { MarketingReferralBLService } from './Shared/marketingreferral.bl.service';
import { MarketingReferralDLService } from './Shared/marketingreferral.dl.service';
import { MarketingReferralService } from './Shared/marketingreferral.service';
import { MarketingreferralMainComponent } from './mktreferral-main.component';
import { MarketingReferralRoutingModule } from './mktreferral-routing.module';
import { MarketingReferralSettingsComponent } from './mktreferral-settings/mktreferral-settings.component';
import { MarketingReferralSchemeSettingsComponent } from './mktreferral-settings/referral-scheme/mktreferral-setting-referral-scheme.component';
import { MarketingReferralReferringOrganizationComponent } from './mktreferral-settings/referring-organization/mktreferral-setting-referring-organization.component';
import { MarketingReferralReferringPartyComponent } from './mktreferral-settings/referring-party/mktreferral-setting-referring-party.component';
import { MarketingReferralAddTransactionComponent } from './mktreferral-transaction/Entry-page/mktreferral-transaction-Add.component';
import { MarketingReferralTransactionComponent } from './mktreferral-transaction/List-page/mktreferral-transaction.component';
import { MarketingReferralPatientTransactionAddComponent } from './patient-transaction/entry-page/mktreferral-patient-transaction-add.component';
import { MarketingReferralPatientTransactionComponent } from './patient-transaction/list-page/mktreferral-patient-transaction.component';
import { MarketingReferralReportMainComponent } from './reports/mktreferral-report-main.component';
import { MarketingReferralDetailReportsComponent } from './reports/mktreferral-reports/mktreferral-reports.component';

@NgModule({
  providers: [
    MarketingReferralService,
    MarketingReferralBLService,
    MarketingReferralDLService,
    // MarketingreferralSharedModule,

  ],
  declarations: [
    MarketingreferralMainComponent,
    MarketingReferralDetailReportsComponent,
    MarketingReferralTransactionComponent,
    MarketingReferralSettingsComponent,
    MarketingReferralAddTransactionComponent,
    MarketingReferralReportMainComponent,
    MarketingReferralReferringOrganizationComponent,
    MarketingReferralReferringPartyComponent,
    MarketingReferralPatientTransactionComponent,
    MarketingReferralPatientTransactionAddComponent,
    MarketingReferralSchemeSettingsComponent

  ],
  imports: [
    CommonModule,
    MarketingReferralRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,

  ]
})
export class MktreferralModule { }
