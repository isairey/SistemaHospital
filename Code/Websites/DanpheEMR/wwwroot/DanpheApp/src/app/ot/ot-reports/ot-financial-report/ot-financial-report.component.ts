import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_Data_Type, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { OTPrescriber_DTO } from '../../shared/dto/ot-prescriber-dto';
import { OTSummaryReport_DTO } from '../../shared/dto/ot-summary-report.dto';
import { OTGridColumnSettings } from '../../shared/ot-grid-column-settings';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'app-ot-financial-report',
  templateUrl: './ot-financial-report.component.html',
  styleUrls: ['./ot-financial-report.component.css']
})
export class OTFinancialReportComponent implements OnInit {
  OTGridColumns = new OTGridColumnSettings();
  OTFinancialReportColumns: typeof OTGridColumnSettings.prototype.OTFinancialReportCols;
  FromDate: string = "";
  ToDate: string = "";
  DateRange: string = "";
  IsOTStartDate: boolean = true;
  OTPrescriberList = new Array<OTPrescriber_DTO>();
  CurrentPrescriber = new OTPrescriber_DTO();
  SelectedPrescriberId: number = 0;
  Loading: boolean = false;
  GridExportOptions: any;
  OTFinancialReportData = new Array<OTSummaryReport_DTO>();
  ShowSummaryTable: boolean = false;
  PrescriberListSubscription: Subscription;

  constructor(
    private _otBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _otService: OTService
  ) {
    this.OTFinancialReportColumns = this.OTGridColumns.OTFinancialReportCols;
  }

  ngOnInit() {
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

  OnFromToDateChange($event): void {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
      this.DateRange = ("<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate);
    }
  }

  PrescriberFormatter(data: any): string {
    let html = data["PrescriberName"];
    return html;
  }

  OnPrescriberSelect(): void {
    if (this.CurrentPrescriber && typeof (this.CurrentPrescriber) === ENUM_Data_Type.Object && this.CurrentPrescriber.PrescriberId) {
      this.SelectedPrescriberId = this.CurrentPrescriber.PrescriberId;
    }
    else {
      this.CurrentPrescriber = new OTPrescriber_DTO();
      this.SelectedPrescriberId = 0;
    }
  }

  GetOTFinancialReport() {
    this._otBlService.GetOTFinancialReport(this.IsOTStartDate, this.FromDate, this.ToDate, this.SelectedPrescriberId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.OTFinancialReportData = res.Results;
        this.LoadExportOptions();
        this.FormatFinancialReportDataList();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to load financial report.'])
      }
    })

  }
  GetOTPrescriberList(): void {
    let otPrescriberList = this._otService.getOTPrescriberList();
    if (otPrescriberList && otPrescriberList.length) {
      this.OTPrescriberList = otPrescriberList;
    }
  }

  LoadExportOptions() {
    this.GridExportOptions = {
      fileName: 'OT_Financial_Report' + ((this.FromDate && this.ToDate) ? '_' + (moment(this.FromDate).format('YYYY-MM-DD') + '_' + moment(this.ToDate).format('YYYY-MM-DD') + '_') : '') + '.xls',
    };
  }

  FormatFinancialReportDataList(): void {
    this.OTFinancialReportData.forEach(item => {
      item.Anaesthesias = this.FormatAnaesthesias(item.Anaesthesias);
    });
  }


  /**
   * Formats a JSON string representing a list of anaesthesias into a readable, comma-separated string of their names.
   *
   * @param {string} anaesthesias - A JSON string representing an array of anaesthesia items.
   *                               Each item is expected to have an `ItemName` property.
   *                               Example: '[{"ItemName": "General"},{"ItemName": "Local"}]'.
   *
   * @returns {string} A comma-separated string of anaesthesia item names if parsing is successful.
   *                   Returns an empty string if the input is invalid or parsing fails.
   */
  FormatAnaesthesias(anaesthesias: string): string {
    try {
      const parsedAnaesthesias = JSON.parse(anaesthesias || "[]");
      return parsedAnaesthesias.map((item: any) => item.ItemName).join(", ");
    } catch (error) {
      return "";
    }
  }


}
