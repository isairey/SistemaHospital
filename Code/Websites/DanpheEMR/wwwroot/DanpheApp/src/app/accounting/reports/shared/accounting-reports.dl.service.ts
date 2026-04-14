import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { response } from '../../../core/response.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { LedgerReportRequest_DTO } from './DTOs/ledger-report-request.dto';
import { SubLedgerReportRequest_DTO } from './DTOs/subledger-report-request.dot';
@Injectable()
export class AccountingReportsDLService {
    public options = {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    };
    public optionJson = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

    constructor(public http: HttpClient) {
    }
    //START: GET Reporting DATA

    //GET Accounting Balance sheet report data
    public GetBalanceSheetReportData(selectedDate, fiscalYearId, hospitalId) {
        try {
            return this.http.get<any>(`/api/AccountingReport/BalanceSheetReport?selectedDate=${selectedDate}&FiscalYearId=${fiscalYearId}&HospitalId=${hospitalId}`);
        } catch (exception) {
            throw exception;
        }
    }

    public GetCashFlowReportData(frmDt, toDt, fiscalYearId, hospitalId) {
        try {
            return this.http.get<any>(`/api/AccountingReport/CashFlowReport?FromDate=${frmDt}&ToDate=${toDt}&FiscalYearId=${fiscalYearId}&HospitalId=${hospitalId}`);
        } catch (exception) {
            throw exception;
        }
    }
    public GetTrailBalanceReport(fromDate: string, toDate: string, fiscalYearId, hospitalId) {
        return this.http.get<any>(`/api/AccountingReport/TrailBalanceReport?FromDate=${fromDate}&ToDate=${toDate}&FiscalYearId=${fiscalYearId}&HospitalId=${hospitalId}`);
    }
    public GetGroupStatementReport(fromDate: string, toDate: string, fiscalYearId: number, ledgerGroupId: number, hospitalId: number) {
        return this.http.get<any>(`/api/AccountingReport/GroupStatementReport?FromDate=${fromDate}&ToDate=${toDate}&FiscalYearId=${fiscalYearId}&LedgerGroupId=${ledgerGroupId}&HospitalId=${hospitalId}`);
    }
    public GetProfitLossReport(frmDt, toDt, fiscalYearId, hospitalId) {
        return this.http.get<any>(`/api/AccountingReport/ProfitAndLossReport?FromDate=${frmDt}&ToDate=${toDt}&FiscalYearId=${fiscalYearId}&HospitalId=${hospitalId}`);

    }
    public GetVoucherReport(fromDate: string, toDate: string, sectionId, fiscalYearId, hospitalId) {
        return this.http.get<any>(`/api/AccountingReport/VoucherReport?FromDate=${fromDate}&ToDate=${toDate}&sectionId=${sectionId}&hospitalId=${hospitalId}`);
    }
    GetSystemAuditReport(fromDate: string, toDate: string, voucherType: string, sectionId: number, hospitalId: number) {
        return this.http.get<any>(`/api/AccountingReport/SystemAuditReport?FromDate=${fromDate}&ToDate=${toDate}&voucherReportType=${voucherType}&sectionId=${sectionId}&HospitalId=${hospitalId}`);
    };

    public GetReverseTransactionDetail(reverseTxnId: number) {
        return this.http.get<any>("/api/AccountingReport/ReverseTransactionDetail?ReverseTransactionId=" + reverseTxnId);
    }
    public GetDayWiseVoucherReport(fromDate: string, toDate: string, sectionId) {
        return this.http.get<any>("/api/AccountingReport/DayWiseVoucherReport?FromDate=" + fromDate + "&ToDate=" + toDate + "&sectionId=" + sectionId);
    }
    public GetLedgerReport(ledgerId: number, fromDate: string, toDate: string, fiscalYearId, hospitalId) {
        return this.http.get<response>(`/api/AccountingReport/LedgerReport?ledgerId=${ledgerId}&FromDate=${fromDate}&ToDate=${toDate}&FiscalYearId=${fiscalYearId}&hospitalId=${hospitalId}`);
    }

    public GetLedgerListReport(data: LedgerReportRequest_DTO) {
        return this.http.post<response>(`/api/AccountingReport/LedgerListReport`, data, this.optionJson);
    }

    public GetLedgerList() {
        return this.http.get<any>("/api/Accounting/Ledgers");
    }
    // public GetFiscalYearsList() {
    //     return this.http.get<any>("/api/Accounting?reqType=fiscalYearList");
    // }
    public GetDailyTxnReport(frmDt: string, toDt: string, hospitalId: number) {
        return this.http.get<any>("/api/AccountingReport/DailyTransactionReport?FromDate=" + frmDt + "&ToDate=" + toDt + "&HospitalId=" + hospitalId);
    }
    public GetTxnOriginDetails(txnId) {
        return this.http.get<any>("/api/AccountingReport/TransactionOriginDetail?transactionIds=" + txnId);
    }
    public GetDaywiseVoucherDetailsbyDayVoucherNo(dayVouchernumber: number, voucherId: number, sectionId) {
        try {
            return this.http.get<response>('/api/AccountingReport/DayWiseVoucherDetailsByVoucherNo?DayVoucherNumber=' + dayVouchernumber + '&voucherId=' + voucherId + "&sectionId=" + sectionId);
        } catch (ex) {
            throw ex;
        }
    }

    //get all ledgergroup list here (included IsActive=false also)
    public GetLedgerGroup() {
        return this.http.get<any>("/api/AccountingSettings/LedgerGroups");
    }
    public GetBankReconcillationReport(ledgerId: number, fromDate: string, toDate: string, fiscalYearId, voucherTypeId: number, status: number, subLedgerId: number) {
        return this.http.get<response>(`/api/AccountingReport/BankReconciliationReport?ledgerId=${ledgerId}&fromDate=${fromDate}&toDate= ${toDate}&fiscalYearId=${fiscalYearId}&voucherTypeId=${voucherTypeId}&status=${status}&subLedgerId=${subLedgerId}`);
    }
    public GetReconciliationCategory() {
        return this.http.get<response>('/api/Accounting/BankReconciliationCategories');
    }
    public GetReconciliationHistory(VoucherNumber, secId, fsYearId) {

        return this.http.get<any>(
            "/api/AccountingReport/BankReconciliationHistory?VoucherNumber=" + VoucherNumber + "&sectionId=" + secId + "&FiscalYearId=" + fsYearId,
            this.options
        );
    }
    public PostReconciliation(data) {
        try {
            return this.http.post<response>('/api/AccountingReport/PostReconciliation', data);
        } catch (ex) {
            throw ex;
        }
    }
    public GetCashBankBookReport(fromDate: string, toDate: string, fiscalYearId, lederIds: string, hospitalId: number) {
        return this.http.get<response>(`/api/AccountingReport/CashBankBookReport?fromDate=${fromDate}&toDate=${toDate}&fiscalYearId=${fiscalYearId}&ledgerIds=${lederIds}&HospitalId=${hospitalId}`);
    }

    public GetDayBookReport(fromDate: string, toDate: string, fiscalYearId: number, lederId: number, HospitalId: number) {
        return this.http.get<response>(`/api/AccountingReport/DayBookReport?fromDate=${fromDate}&toDate=${toDate}&fiscalYearId=${fiscalYearId}&ledgerId=${lederId}&HospitalId=${HospitalId}`);
    }

    public GetSubLedgerReport(data: SubLedgerReportRequest_DTO) {
        return this.http.post<response>(`/api/AccountingReport/SubLedgerReport`, data, this.optionJson);
    }

    public GetVoucherForVerification(fromDate: string, toDate: string, sectionId) {
        return this.http.get<response>(`/api/AccountingReport/VoucherVerification?FromDate=${fromDate}&ToDate=${toDate}&sectionId=${sectionId}`);
    }
    public GetAccountHeadDetailReport(HospitalId) {
        return this.http.get<response>(`/api/AccountingReport/AccountHeadDetailReport?HospitalId=${HospitalId}`, this.options);
    }
    public GetAllLedgerGroups() {
        return this.http.get<DanpheHTTPResponse>(`/api/AccountingSettings/AllLedgerGroups`, this.options);
    }
    public GetAllLedgers() {
        return this.http.get<DanpheHTTPResponse>(`/api/AccountingSettings/AllLedgers`, this.options);
    }
    public GetAllSubLedger() {
        return this.http.get<response>(`/api/AccountingSettings/AllSubLedger`, this.options);
    }
    public GetAllCodeDetails() {
        return this.http.get<response>(`/api/AccountingSettings/AllCodeDetails`, this.options);
    }
    public GetAllSections() {
        return this.http.get<response>(`/api/AccountingSettings/AllSections`, this.options);
    }

    public GetAgeingReport(numberOfInterval: number, intervalDuration: number, sectionIds: string, isVendorBillWiseTxn: boolean) {
        return this.http.get<response>(`/api/AccountingReport/AgeingReport?NumberOfInterval=${numberOfInterval}&IntervalDuration=${intervalDuration}&SectionIds=${sectionIds}&IsVendorBillWiseTxn=${isVendorBillWiseTxn}`);
    }

    public GetAgeingReportDetailView(SectionId: number, FromDate: string, ToDate: string, SupplierId: number, isVendorBillWiseTxn: boolean) {
        return this.http.get<response>(`/api/AccountingReport/AgeingReportDetail?SectionId=${SectionId}&FromDate=${FromDate}&ToDate=${ToDate}&SupplierId=${SupplierId}&IsVendorBillWiseTxn=${isVendorBillWiseTxn}`);
    }
    GetTransactionWiseAgeingReportView() {
        return this.http.get<DanpheHTTPResponse>(`/api/AccountingReport/TransactionWiseAgeingReport`, this.optionJson);
    }
}