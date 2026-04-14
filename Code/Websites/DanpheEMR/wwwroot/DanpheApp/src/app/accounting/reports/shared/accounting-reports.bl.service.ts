import { Injectable } from '@angular/core';
import { LedgerReportRequest_DTO } from './DTOs/ledger-report-request.dto';
import { SubLedgerReportRequest_DTO } from './DTOs/subledger-report-request.dot';
import { AccountingReportsDLService } from './accounting-reports.dl.service';



@Injectable()
export class AccountingReportsBLService {
    constructor(public accountReportDlService: AccountingReportsDLService) {

    }


    //START: GET Report Data
    public GetBalanceSheetReportData(selectedDate, fiscalYearId, hospitalId) {
        try {
            return this.accountReportDlService.GetBalanceSheetReportData(selectedDate, fiscalYearId, hospitalId)
                .map((responseData) => {
                    return responseData;
                });
        } catch (exception) {
            throw exception;
        }
    }

    public GetTrailBalanceReport(fromDate: string, toDate: string, fiscalYearId, hospitalId) {
        return this.accountReportDlService.GetTrailBalanceReport(fromDate, toDate, fiscalYearId, hospitalId).map(res => {
            return res;
        });
    }

    public GetGroupStatementReport(fromDate: string, toDate: string, fiscalYearId: number, ledgerGroupId: number, hospitalId: number) {
        return this.accountReportDlService.GetGroupStatementReport(fromDate, toDate, fiscalYearId, ledgerGroupId, hospitalId).map(res => {
            return res;
        });
    }

    public GetProfitLossReport(fromDt, toDt, fiscalYearId, hospitalId) {
        return this.accountReportDlService.GetProfitLossReport(fromDt, toDt, fiscalYearId, hospitalId).map(res => {
            return res;
        });
    }

    // public GetFiscalYearsList() {
    //     return this.accountReportDlService.GetFiscalYearsList().map(res=>
    //         { return res}

    //         );
    // }

    public GetVoucherReport(fromDate: string, toDate: string, sectionId, fiscalYearId, hospitalId) {
        return this.accountReportDlService.GetVoucherReport(fromDate, toDate, sectionId, fiscalYearId, hospitalId)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetSystemAuditReport(fromDate: string, toDate: string, voucherType: string, sectionId: number, hospitalId: number) {
        return this.accountReportDlService.GetSystemAuditReport(fromDate, toDate, voucherType, sectionId, hospitalId)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetReverseTransactionDetail(reverseTxnId: number) {
        return this.accountReportDlService.GetReverseTransactionDetail(reverseTxnId)
            .map((responseData) => {
                return responseData;
            });
    }
    public GetDayWiseVoucherReport(fromDate: string, toDate: string, sectionId) {
        return this.accountReportDlService.GetDayWiseVoucherReport(fromDate, toDate, sectionId)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetLedgers() {

        return this.accountReportDlService.GetLedgerList()
            .map((responseData) => {
                return responseData;
            });
    }
    public GetLedgerReport(ledgerId: number, fromDate: string, toDate: string, fiscalYearId, hospitalId) {
        return this.accountReportDlService.GetLedgerReport(ledgerId, fromDate, toDate, fiscalYearId, hospitalId)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetLedgerListReport(data: LedgerReportRequest_DTO) {
        return this.accountReportDlService.GetLedgerListReport(data)
            .map(res => {
                return res;
            })
    }
    public GetCashFlowReportData(fromDt, toDt, fiscalYearId, hospitalId) {
        try {
            return this.accountReportDlService.GetCashFlowReportData(fromDt, toDt, fiscalYearId, hospitalId)
                .map((responseData) => {
                    return responseData;
                });
        } catch (exception) {
            throw exception;
        }
    }
    public GetDailyTxnReport(frmDt: string, toDt: string, hospitalid: number) {
        return this.accountReportDlService.GetDailyTxnReport(frmDt, toDt, hospitalid).map(res => {
            return res
        });
    }

    public GetTxnOriginDetails(txnId) {
        return this.accountReportDlService.GetTxnOriginDetails(txnId).map(res => {
            return res;
        });
    }
    public GetDaywiseVoucherDetailsbyDayVoucherNo(dayVoucherNumber: number, voucherId: number, sectionId) {
        try {
            return this.accountReportDlService.GetDaywiseVoucherDetailsbyDayVoucherNo(dayVoucherNumber, voucherId, sectionId)
                .map((responseData) => {
                    return responseData;
                });
        } catch (ex) {
            throw ex;
        }
    }

    //Get LedgerGroup data list
    public GetLedgerGroup() {
        return this.accountReportDlService.GetLedgerGroup()
            .map((responseData) => {
                return responseData;
            });
    }

    //END: GET Report Data
    public GetBankReconcillationReport(ledgerId: number, fromDate: string, toDate: string, fiscalYearId, voucherTypeId: number, status: number, subLedgerId: number) {
        return this.accountReportDlService.GetBankReconcillationReport(ledgerId, fromDate, toDate, fiscalYearId, voucherTypeId, status, subLedgerId)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetReconciliationCategory() {
        return this.accountReportDlService.GetReconciliationCategory()
            .map((responseData) => {
                return responseData;
            });
    }
    public GetReconciliationHistory(VoucherNumber: String, secId, fsYearId) {

        return this.accountReportDlService.GetReconciliationHistory(VoucherNumber, secId, fsYearId).map((res) => res);
    }

    public PostReconciliation(bankrecobj) {
        var data = JSON.stringify(bankrecobj);
        return this.accountReportDlService.PostReconciliation(data)
            .map((responseData) => {
                return responseData;
            });
    }

    public GetCashBankBookReport(fromDate: string, toDate: string, fiscalYearId, lederIds: Array<Number>, hospitalId: number) {
        return this.accountReportDlService.GetCashBankBookReport(fromDate, toDate, fiscalYearId, lederIds.toString(), hospitalId)
            .map(res => {
                return res;
            })
    }

    public GetDayBookReport(fromDate: string, toDate: string, fiscalYearId, ledgerId: number, HospitalId: number) {
        return this.accountReportDlService.GetDayBookReport(fromDate, toDate, fiscalYearId, ledgerId, HospitalId)
            .map(res => {
                return res;
            })
    }

    public GetSubLedgerReport(data: SubLedgerReportRequest_DTO) {
        return this.accountReportDlService.GetSubLedgerReport(data)
            .map(res => {
                return res;
            })
    }

    public GetVoucherForVerification(fromDate: string, toDate: string, sectionId) {
        return this.accountReportDlService.GetVoucherForVerification(fromDate, toDate, sectionId)
            .map((responseData) => {
                return responseData;
            });
    }
    public GetAccountHeadDetailReport(hospitalId: number) {
        return this.accountReportDlService.GetAccountHeadDetailReport(hospitalId)
            .map(res => { return res });
    }
    public GetAllLedgerGroups() {
        return this.accountReportDlService.GetAllLedgerGroups()
            .map(res => { return res });
    }
    public GetAllLedgers() {
        return this.accountReportDlService.GetAllLedgers()
            .map(res => { return res });
    }
    public GetAllSubLedger() {
        return this.accountReportDlService.GetAllSubLedger()
            .map(res => { return res });
    }
    public GetAllCodeDetails() {
        return this.accountReportDlService.GetAllCodeDetails()
            .map(res => { return res });
    }
    public GetAllSections() {
        return this.accountReportDlService.GetAllSections()
            .map(res => { return res });
    }
    public GetAgeingReport(numberOfInterval: number, intervalDuration: number, sectionIds: string, isVendorBillWiseTxn: boolean) {
        return this.accountReportDlService.GetAgeingReport(numberOfInterval, intervalDuration, sectionIds, isVendorBillWiseTxn)
            .map(res => { return res });
    }
    public GetAgeingReportDetailView(SectionId: number, FromDate: string, ToDate: string, SupplierId: number, isVendorBillWiseTxn: boolean) {
        return this.accountReportDlService.GetAgeingReportDetailView(SectionId, FromDate, ToDate, SupplierId, isVendorBillWiseTxn)
            .map(res => { return res });
    }
    GetTransactionWiseAgeingReportView() {
        return this.accountReportDlService.GetTransactionWiseAgeingReportView().map(res => {
            return res;
        });
    }

}