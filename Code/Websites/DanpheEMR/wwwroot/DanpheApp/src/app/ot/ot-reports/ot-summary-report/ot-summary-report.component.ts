import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { OTPrescriber_DTO } from '../../shared/dto/ot-prescriber-dto';
import { OTSummaryReport_DTO } from '../../shared/dto/ot-summary-report.dto';
import { OTGridColumnSettings } from '../../shared/ot-grid-column-settings';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';


@Component({
  selector: 'app-ot-summary-report',
  templateUrl: './ot-summary-report.component.html',
  styleUrls: ['./ot-summary-report.component.css'],
})
export class OTSummaryReportComponent implements OnInit {

  FromDate: string = "";
  ToDate: string = "";
  PrescribedBy: number = 0;
  loading: boolean = false;
  OTSummaryReportData = new Array<OTSummaryReport_DTO>();
  gridExportOptions: any;
  ReportHeader: string = "";
  CurrentPrescriber = new OTPrescriber_DTO();
  DateRange: string = "";
  OTPrescriberList = new Array<OTPrescriber_DTO>();
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  OTSummaryReportColumns = new Array<any>();
  OTGridColumns = new OTGridColumnSettings();
  TotalSurgeryCompleted: number = 0;
  TotalSurgeryAmount: number = 0;
  FooterContent: string = "";
  ShowSummaryTable: boolean = false;
  PrescriberListSubscription: Subscription;
  IsOTStartDate: boolean = true;
  constructor
    (
      private _otBlService: OperationTheatreBLService,
      private _messageBoxService: MessageboxService,
      private _otService: OTService
    ) {
    this.OTSummaryReportColumns = this.OTGridColumns.OTSummaryReportCols;
    this.NepaliDateInGridSettings = new NepaliDateInGridParams();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('OTStartTime', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('OTConcludeDateTime', true));
  }

  ngOnInit(): void {
    this.GetOTPrescriberList();
    this.LoadExportOptions();

    /* When browser is directly reload on this page (OT Summary Report), this.GetOTPrescriberList(); does not assign any values to OTPrescriberList because the data is not loaded in service.
    We could make the method async in service but that impacts on performance. OR We could call that method in this component,
    but frequent switching between navigation tab call the API unnecessarily.
    */
    this.PrescriberListSubscription = this._otService.prescriberList.subscribe((message: string) => {
      if (message === 'Prescriber List Loaded') {
        this.GetOTPrescriberList();
      }
    });
  }

  ngAfterViewChecked() {
    if (document.getElementById("ot_summary") !== null)
      this.FooterContent = document.getElementById("ot_summary").innerHTML;
  }

  GetOTSummaryReport(): void {
    let fromDate = this.FromDate;
    let toDate = this.ToDate;
    this.loading = true;
    this.ShowSummaryTable = false;
    this._otBlService.GetOTSummaryReport(this.IsOTStartDate, fromDate, toDate, this.PrescribedBy)
      .finally(() => {
        this.loading = false;
        this.ReportHeader = `${this.CurrentPrescriber && this.CurrentPrescriber.PrescriberName ? `<b>Surgeon:</b>&nbsp;${this.CurrentPrescriber.PrescriberName}<br>` : ''}`;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.OTSummaryReportData = res.Results;
            let totalSurgeryAmount = this.OTSummaryReportData.reduce((total, current) => total + current.SurgeryAmount, 0);
            this.TotalSurgeryAmount = totalSurgeryAmount;
            this.TotalSurgeryCompleted = this.OTSummaryReportData.length;
            this.ShowSummaryTable = true;
            this.LoadExportOptions();
            // this.ConvertOTBillingItemsFromJsonToSerializedString();    //! Sanjeev'  BillingItems are already coming in Coma separated string
            this.ConvertAnaesthesiasFromJsonToSerializedString();
          }
          else {
            this.OTSummaryReportData = new Array<OTSummaryReport_DTO>();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Data Available.`]);
          }
        }
      })
  }

  LoadExportOptions() {
    this.gridExportOptions = {
      fileName: 'OT_Summary_Report' + ((this.FromDate && this.ToDate) ? '_' + (moment(this.FromDate).format('YYYY-MM-DD') + '_' + moment(this.ToDate).format('YYYY-MM-DD') + '_') : '') + '.xls',
    };
  }

  ConvertOTBillingItemsFromJsonToSerializedString(): void {
    this.OTSummaryReportData.forEach(book => {
      if (book.BillingItems && book.BillingItems.trim().length) {
        let stringifiedBillingItems = "";
        let serializedBillingItems: string = book.BillingItems;
        try {
          const jsonBillingItems = JSON.parse(serializedBillingItems);
          if (jsonBillingItems.length) {
            jsonBillingItems.forEach((a, index): void => {
              stringifiedBillingItems += a.ItemName;
              if (index < jsonBillingItems.length - 1) {
                stringifiedBillingItems += ", ";
              }
            });
          }
        }
        catch (error) {
          console.error('Error parsing Billing Items to JSON:', error);
        }
        finally {
          book.BillingItems = stringifiedBillingItems;
        }
      }
    });
  }

  ConvertAnaesthesiasFromJsonToSerializedString(): void {
    this.OTSummaryReportData.forEach(book => {
      if (book.Anaesthesias && book.Anaesthesias.trim().length) {
        let stringifiedAnaesthesias = "";
        let serializedBillingItems: string = book.Anaesthesias;
        try {
          const jsonBillingItems = JSON.parse(serializedBillingItems);
          if (jsonBillingItems.length) {
            jsonBillingItems.forEach((a, index): void => {
              stringifiedAnaesthesias += a.ItemName;
              if (index < jsonBillingItems.length - 1) {
                stringifiedAnaesthesias += ", ";
              }
            });
          }
        }
        catch (error) {
          console.error('Error parsing Billing Items to JSON:', error);
        }
        finally {
          book.Anaesthesias = stringifiedAnaesthesias;
        }
      }
    });
  }

  OnFromToDateChange($event): void {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
      this.DateRange = ("<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate);
    }
  }

  GetOTPrescriberList(): void {
    let otPrescriberList = this._otService.getOTPrescriberList();
    if (otPrescriberList && otPrescriberList.length) {
      this.OTPrescriberList = otPrescriberList;
    }
  }

  OnPrescriberSelect(): void {
    if (this.CurrentPrescriber && typeof (this.CurrentPrescriber) === "object" && this.CurrentPrescriber.PrescriberId) {
      this.PrescribedBy = this.CurrentPrescriber.PrescriberId;
    }
    else {
      this.CurrentPrescriber = new OTPrescriber_DTO();
      this.PrescribedBy = 0;
    }
  }

  OTBookingListGidActions($event) {

  }

  PrescriberFormatter(data: any): string {
    let html = data["PrescriberName"];
    return html;
  }

}
