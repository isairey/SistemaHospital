import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";

import { PageNotFound } from '../404-error/404-not-found.component';
import { AuthGuardService } from '../security/shared/auth-guard.service';
import { AccountingComponent } from './accounting.component';
import { ActivateAccountingHospitalComponent } from './activate-hospital/accounting-hospital-activate.component';
import { AddTenantComponent } from './add-tenant/add-tenant.component';
import { BankReconciliationMainComponent } from './bank-reconciliation/bank-reconciliation-main.component';
import { BankReconciliationComponent } from './bank-reconciliation/reconcile-bank-transactions/bank-reconciliation.component';
import { SuspenseAccountReconciliationComponent } from './bank-reconciliation/reconcile-suspense-account/suspense-reconciliation.component';
import { CashFlowReportComponent } from './reports/Cash-Flow/cash-flow-report.component';
import { DayBookReportComponent } from './reports/Day-Book-Report/day-book-report.component';
import { AccountHeadDetailReportComponent } from './reports/account-head-detail-report/account-head-detail-report.component';
import { AccountingReportsComponent } from './reports/accounting-reports.component';
import { AgeingReportComponent } from './reports/ageing-report/ageing-report.component';
import { InvoiceWiseAgeingReportComponent } from './reports/ageing-report/invoice-wiae-ageing-report/invoice-wise-ageing-report.component';
import { TransactionWiseAgeingReportComponent } from './reports/ageing-report/transaction-wise-ageing-report/transaction-wise-ageing-report.component';
import { BalanceSheetReportComponent } from './reports/balance-sheet/balance-sheet-report.component';
import { CashBankBookReportComponent } from './reports/cash-bank-book-report/cash-bank-book-report.component';
import { DailyTransactionReportComponent } from './reports/daily-transaction/daily-transaction-report.component';
import { DaywiseVoucherReportComponent } from './reports/daywise-voucher-report/daywise-voucher-report.component';
import { GroupStatementReportComponent } from './reports/group-statement-report/group-statement-report.component';
import { LedgerReportComponent } from './reports/ledger-report/ledger-report.component';
import { ProfitLossReportComponent } from './reports/profit-loss/profit-loss-report.component';
import { SubLedgerReportComponent } from './reports/subledger-report/subledger-report.component';
import { SystemAuditReportComponent } from './reports/system-audit/system-audit-report.component';
import { TrailBalanceReportComponent } from './reports/trail-balance/trail-balance.component';
import { VoucherReportComponent } from './reports/voucher-report/voucher-report.component';
import { AccHospitalSelectionGuardService } from './shared/hospital-selection.guard';
import { AccountClosureComponent } from './transactions/account-closure.component';
import { ManualVoucherEditComponent } from './transactions/manual-voucher-edit.component';
import { VoucherEntryNewComponent } from './transactions/new-voucher-entry/new-voucher-entry.component';
import { PaymentComponent } from './transactions/payment/account-payment.component';
import { TransactionsMainComponent } from './transactions/transactions-main.component';
import { TransferToAccountingComponent } from "./transactions/transfer-to-accounting.component";
import { VoucherVerificationComponent } from './voucher-verification/voucher-verification.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '', component: AccountingComponent, canActivate: [AuthGuardService],
                children: [
                    { path: '', redirectTo: 'Transaction/ActivateHospital', pathMatch: 'full' },
                    {

                        path: 'Transaction', component: TransactionsMainComponent, canActivate: [AuthGuardService],
                        children: [
                            { path: '', redirectTo: 'VoucherEntry', pathMatch: 'full' },
                            { path: 'VoucherEntry', component: VoucherEntryNewComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: 'TransferToACC', component: TransferToAccountingComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            //{ path: 'Sync', loadChildren: '/compiled-js/app/accounting/sync/accounting-sync.module#AccountingSyncModule' },
                            { path: 'AccountClosure', component: AccountClosureComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: 'EditManualVoucher', component: ManualVoucherEditComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: 'ActivateHospital', component: ActivateAccountingHospitalComponent, canActivate: [AuthGuardService] },
                            { path: 'Payment', component: PaymentComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: "**", component: PageNotFound },
                        ]
                    },

                    { path: 'Settings', loadChildren: './settings/accounting-settings.module#AccountingSettingsModule', canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },

                    // START: mumbai-team-june2021-danphe-accounting-cache-change*
                    { path: 'Reports', component: AccountingReportsComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/BalanceSheetReport', component: BalanceSheetReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/LedgerReport', component: LedgerReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/VoucherReport', component: VoucherReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/TrailBalanceReport', component: TrailBalanceReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/ProfitLossReport', component: ProfitLossReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/DailyTransactionReport', component: DailyTransactionReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/CashFlowReport', component: CashFlowReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/DaywiseVoucherReport', component: DaywiseVoucherReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/SystemAuditReport', component: SystemAuditReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/GroupStatementReport', component: GroupStatementReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    //{ path: 'Reports/BankReconciliation', component: BankReconciliationComponent, canActivate: [AuthGuardService] },
                    // END: mumbai-team-june2021-danphe-accounting-cache-change*
                    { path: 'Reports/Cash-BankBookReport', component: CashBankBookReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/DayBookReport', component: DayBookReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/SubLedgerReport', component: SubLedgerReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    { path: 'Reports/AccountHeadDetailReport', component: AccountHeadDetailReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    {
                        path: 'Reports/AgeingReport', component: AgeingReportComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService],
                        children: [
                            { path: '', redirectTo: 'TransactionWiseAgeingReport', pathMatch: 'full' },
                            { path: 'TransactionWiseAgeingReport', component: TransactionWiseAgeingReportComponent, canActivate: [AuthGuardService] },
                            { path: 'InvoiceWiseAgeingReport', component: InvoiceWiseAgeingReportComponent, canActivate: [AuthGuardService] },
                        ]
                    },
                    // {
                    //     path: 'Insurance', component: InsuranceMainComponent, canActivate: [AuthGuardService],
                    //     children: [
                    //         { path: '', redirectTo: 'Member', pathMatch: 'full' },
                    //         { path: 'Member', component: MedicareMemberComponent, canActivate: [AuthGuardService] },
                    //         { path: 'Dependent', component: DependentComponent, canActivate: [AuthGuardService] }
                    //     ]
                    // },
                    { path: 'Insurance', loadChildren: '../insurance/medicare/registration/medicare-registration.module#MedicareRegistrationModule', canActivate: [AuthGuardService] },
                    { path: 'VoucherVerification', component: VoucherVerificationComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                    {
                        path: 'BankReconciliation', component: BankReconciliationMainComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService],
                        children: [
                            { path: '', redirectTo: 'Reconcile', pathMatch: 'full' },
                            { path: 'Reconcile', component: BankReconciliationComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: 'SuspenseReconcile', component: SuspenseAccountReconciliationComponent, canActivate: [AuthGuardService, AccHospitalSelectionGuardService] },
                            { path: "**", component: PageNotFound },
                        ]
                    },
                    { path: "AddTenant", component: AddTenantComponent, canActivate: [AuthGuardService] },
                    { path: "**", component: PageNotFound },

                ]
            },

        ])
    ],
    exports: [
        RouterModule
    ]
})
export class AccountingRoutingModule {

}
