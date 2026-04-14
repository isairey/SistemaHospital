import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';


import { AuthGuardService } from '../../security/shared/auth-guard.service';
import { AccountingFiscalYearComponent } from './accounting-fiscal-year/accounting-fiscal-year.component';
import { BillingFiscalYearComponent } from './billing-fiscal-year/billing-fiscal-year.component';
import { FiscalYearSettingsMainComponent } from './fiscal-year-settings-main.component';
import { InventoryFiscalYearComponent } from './inventory-fiscal-year/inventory-fiscal-year.component';
import { PharmacyFiscalYearComponent } from './pharmacy-fiscal-year/pharmacy-fiscal-year.component';


export const fiscalYearSettingsRoutes =
  [
    {
      path: '', component: FiscalYearSettingsMainComponent,
      children: [
        { path: '', redirectTo: 'BillingFiscalYear', pathMatch: 'full' },
        { path: 'BillingFiscalYear', component: BillingFiscalYearComponent, canActivate: [AuthGuardService] },
        { path: 'PharmacyFiscalYear', component: PharmacyFiscalYearComponent, canActivate: [AuthGuardService] },
        { path: 'InventoryFiscalYear', component: InventoryFiscalYearComponent, canActivate: [AuthGuardService] },
        { path: 'AccountingFiscalYear', component: AccountingFiscalYearComponent, canActivate: [AuthGuardService] },

      ]
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
    DanpheAutoCompleteModule,
    RouterModule.forChild(fiscalYearSettingsRoutes),
  ],
  declarations: [
    FiscalYearSettingsMainComponent,
    BillingFiscalYearComponent,
    PharmacyFiscalYearComponent,
    InventoryFiscalYearComponent,
    AccountingFiscalYearComponent
  ],


  bootstrap: []
})
export class FiscalYearSettingsModule {

}
