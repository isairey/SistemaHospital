import { Component } from '@angular/core';
import { AccountingBLService } from '../../../../accounting/shared/accounting.bl.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { AccountingService } from '../../../shared/accounting.service';
import { AccountingReportsBLService } from '../../shared/accounting-reports.bl.service';
import { SupplierDto } from '../../shared/DTOs/supplier-report.dto';
import { TransactionWiseAgeingReportDTO } from '../../shared/DTOs/transaction-wise-ageing-report.dto';

@Component({
  selector: 'app-transaction-wise-ageing-report',
  templateUrl: './transaction-wise-ageing-report.component.html',
  styleUrls: ['./transaction-wise-ageing-report.component.css']
})
export class TransactionWiseAgeingReportComponent {
  Suppliers = new Array<SupplierDto>();
  Loading: boolean = false;
  LedgerId: number = -1;
  TransactionWiseAgeingReportList: TransactionWiseAgeingReportDTO[] = [];
  FilteredTransactionWiseAgeingReportList: TransactionWiseAgeingReportDTO[] = [];


  constructor(
    private _accountingBlService: AccountingBLService,
    private _accountingService: AccountingService,
    private _accountingReportBlService: AccountingReportsBLService,
    private _msgBoxServ: MessageboxService,

  ) {
    this._accountingService.getCoreparameterValue();
    this.GetLedgerList();
  }

  GetLedgerList(): void {
    this._accountingBlService.GetSupplierList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.Suppliers = res.Results;
        } else {
          this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Failed, 'Failed to fetch supplier list: Invalid response status'];
        }
      },
      (err: DanpheHTTPResponse) => {
        this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Error, 'Error occurred while fetching supplier list:', err.ErrorMessage];
      }
    );
  }

  ExportToExcel(tableId) {
    this._accountingService.ExportToExcel(tableId);
  }
  LoadTransactionWiseAgeingReport() {
    this.Loading = true;

    this._accountingReportBlService.GetTransactionWiseAgeingReportView().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results && res.Results.length > 0) {
          // Transform the data
          this.TransactionWiseAgeingReportList = res.Results.map(item => ({
            ...item, // Spread existing properties
            "0–30 days": Math.abs(item["0–30 days"] || 0),
            "31–60 days": Math.abs(item["31–60 days"] || 0),
            "61–90 days": Math.abs(item["61–90 days"] || 0),
            "91+ days": Math.abs(item["91+ days"] || 0)
          }));
          this.FilteredTransactionWiseAgeingReportList = [...this.TransactionWiseAgeingReportList];
        } else {
          this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Failed, 'Unable to get transaction wise ageing report.']
          this.TransactionWiseAgeingReportList = [];
          this.FilteredTransactionWiseAgeingReportList = [];
        }
        this.Loading = false;
      },
      (err) => {
        this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Error, "Error loading transaction-wise aging report:", err];
        this.TransactionWiseAgeingReportList = [];
        this.FilteredTransactionWiseAgeingReportList = [];
        this.Loading = false;
      }
    );
  }

  Print(tableId) {
    this._accountingService.Print(tableId)

  }
  OnSupplierChange() {
    if (this.LedgerId && this.LedgerId > 0) {
      this.FilterTransactionWiseAgeingReport();
    }
    else {
      this.FilteredTransactionWiseAgeingReportList = this.TransactionWiseAgeingReportList;
    }
  }
  FilterTransactionWiseAgeingReport() {
    if (this.TransactionWiseAgeingReportList && this.TransactionWiseAgeingReportList.length > 0) {
      this.FilteredTransactionWiseAgeingReportList = this.TransactionWiseAgeingReportList.filter(a => a.LedgerId == this.LedgerId);
    }
  }
}
