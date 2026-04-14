import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import * as moment from "moment";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { IGridFilterParameter } from "../../../shared/danphe-grid/grid-filter-parameter.interface";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { MarketingReferralDetailedReport_DTO } from "../../Shared/DTOs/maketing-referral-detailed-report.dto";
import { MarketingReferralSummaryReport_DTO } from "../../Shared/DTOs/marketing-referral-summary-report.dto";
import { ReferralParty_DTO } from "../../Shared/DTOs/referral-party.dto";
import { ReferralReportsFilterData_DTO } from "../../Shared/DTOs/referral-report-filter-data.dto";
import { MarketingReferralBLService } from "../../Shared/marketingreferral.bl.service";
import { MarketingReferralService } from "../../Shared/marketingreferral.service";

@Component({
  selector: 'mktreferral-reports',
  templateUrl: './mktreferral-reports.component.html',
})

export class MarketingReferralDetailReportsComponent implements OnInit {

  public MarketingReferralDetailReportGridColumns: Array<any> = null;
  public MarketingReferralDetailedReport = new Array<MarketingReferralDetailedReport_DTO>();
  public MarketingReferralSummaryGridColumns: Array<any> = null;
  public MarketingReferralSummaryReport = new Array<MarketingReferralSummaryReport_DTO>();
  public fromDate: string = "";
  public toDate: string = "";
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  loading: boolean;
  public mktReferralDetailReportValidator: FormGroup = null;
  ReferringPArtyFormControl: FormControl;
  RefPartyObj: any
  public referringPartyList: ReferralParty_DTO[] = [];
  showSummary: boolean;
  public selectedReferringParty: ReferralParty_DTO = new ReferralParty_DTO();
  public footerContent = '';
  public isReportLoaded: boolean = false;
  public TotalReferralAmount: number = 0;
  public dateRange: string = "";
  public FilterParameters: IGridFilterParameter[] = [];

  public ShowSummaryView: boolean = true;
  public SummaryFooterContent: string = "";


  public Summary_detailedView = {
    TotalReferralAmount: 0
  };

  public Summary_summaryView = {
    TotalReferralAmount: 0,
    NetInvoiceAmount: 0
  };

  public ReferralReportsFilterData = new ReferralReportsFilterData_DTO();
  public ReferringGroupObj: any;
  public ReferringOrganizationObj: any;
  public AreaCode: string = null;
  constructor(public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public mktReferralBLService: MarketingReferralBLService,


    public mktReferral: MarketingReferralService) {
    var _formBuilder = new FormBuilder();
    this.mktReferralDetailReportValidator = _formBuilder.group({
      'fromDate': ['', Validators.compose([Validators.required, this.dateValidatorsForPast])],
      'toDate': ['', Validators.compose([Validators.required, this.dateValidator])],
      'ReferringPartyId': [],
      'ReferringPartyGroupId': [],
      'AreaCode': [],
      'ReferringOrganizationId': []
    });
    this.ReferringPArtyFormControl = this.mktReferralDetailReportValidator.get('ReferringPartyId') as FormControl; // Assign the FormControl
    this.MarketingReferralDetailReportGridColumns = this.mktReferral.settingsGridCols.MarketingReferralDetailedReportGridCols;
    this.MarketingReferralSummaryGridColumns = this.mktReferral.settingsGridCols.MarketingReferralSummaryReportGridCols;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('InvoiceDate', false));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('EnteredOn', false));
  }

  ngOnInit() {
    this.GetReferringParty();

    this.GetMasterDataForFilters();
  }

  GetMasterDataForFilters(): void {
    this.mktReferralBLService.GetMasterDataForFilter().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.ReferralReportsFilterData = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
        }
      },
      (err: DanpheHTTPResponse) => {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`,]);
      }
    );
  }
  ngAfterViewChecked() {
    if (document.getElementById("id_mkt_referral_report_detailed_footer") != null) {
      this.footerContent = document.getElementById("id_mkt_referral_report_detailed_footer").innerHTML;
    }

    if (document.getElementById("id_mkt_referral_report_summary_footer") != null) {
      this.SummaryFooterContent = document.getElementById("id_mkt_referral_report_summary_footer").innerHTML;
    }
  }
  ReferringPartiesListFormatter(data: any): string {
    let html: string = "";
    html = "<font color='blue'; size=02 >" + data["ReferringPartyName"] + "&nbsp;&nbsp;" + ":" + "&nbsp;" + data["GroupName"].toUpperCase() + "</font>" + "&nbsp;&nbsp;";
    html += "(" + data["VehicleNumber"] + ")" + "&nbsp;&nbsp;" + data["ReferringOrganizationName"] + "&nbsp;&nbsp;";
    return html;
  }

  ReferringGroupListFormatter(data): string {
    return data['GroupName'];
  }
  ReferringOrganizationListFormatter(data): string {
    return data['ReferringOrganizationName'];
  }
  onReferringPartySelect(selectedReferringParty: ReferralParty_DTO) {
    this.ReferringPArtyFormControl.setValue(selectedReferringParty); // Set the selected value to the FormControl
  }
  dateValidatorsForPast(control: FormControl): { [key: string]: boolean } {
    //get current date, month and time
    var currDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    if (control.value) {
      //if positive then selected date is of future else it of the past
      if ((moment(control.value).diff(currDate) > 0) ||
        (moment(control.value).diff(currDate, 'years') < -200)) // this will not allow the age diff more than 200 is past
        return { 'wrongDate': true };
    }
    else
      return { 'wrongDate': true };
  }

  Load() {
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
    this.FilterParameters = [
      { DisplayName: "DateRange:", Value: this.dateRange }
    ]
    this.showSummary = false;
    this.changeDetector.detectChanges();

    if (this.fromDate && this.toDate) {

      const referringPartyId = this.RefPartyObj ? this.RefPartyObj.ReferringPartyId : null;
      const referringGroupId = this.ReferringGroupObj ? this.ReferringGroupObj.ReferringPartyGroupId : null;
      const areaCode = this.AreaCode ? this.AreaCode.trim() : null;
      const referringOrganizationId = this.ReferringOrganizationObj ? this.ReferringOrganizationObj.ReferringOrganizationId : null;
      this.LoadMarketingReferralReport(this.fromDate, this.toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId);
    }
  }
  dateValidator(control: FormControl): { [key: string]: boolean } {
    let currDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    if (control.value) { // gets empty string for invalid date such as 30th Feb or 31st Nov)
      if ((moment(control.value).diff(currDate) > 0)
        || (moment(currDate).diff(control.value, 'years') > 200)) //can select date upto 200 year past from today.
        return { 'wrongDate': true };
    }
    else
      return { 'wrongDate': true };
  }
  GetReferringParty() {
    this.mktReferralBLService.GetReferringParty().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.referringPartyList = res.Results;
          } else {
            this.referringPartyList = [];
          }
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
            `Error: ${res.ErrorMessage}`,
          ]);
        }
      },
      (err: DanpheHTTPResponse) => {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
          `Error: ${err.ErrorMessage}`,
        ]);
      }
    );
  }
  LoadMarketingReferralReport(fromDate, toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId) {
    this.isReportLoaded = false;
    this.loading = true;
    this.Summary_detailedView.TotalReferralAmount = 0;
    this.Summary_summaryView.TotalReferralAmount = 0;
    this.Summary_summaryView.NetInvoiceAmount = 0;
    this.mktReferralBLService
      .GetMarketingReferralDetailReport(fromDate, toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.MarketingReferralDetailedReport = res.Results.MarketingReferralDetailedReport;
            this.MarketingReferralSummaryReport = res.Results.MarketingReferralSummaryReport;
            this.loading = false;
            if (this.MarketingReferralDetailedReport && this.MarketingReferralDetailedReport.length > 0) {
              this.isReportLoaded = true;
              this.CalculateDetailedSummary();
            }

            if (this.MarketingReferralSummaryReport && this.MarketingReferralSummaryReport.length > 0) {
              this.isReportLoaded = true;
              this.CalculateSummaryViewSummary();
            }

          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              res.ErrorMessage,
            ]);
            this.isReportLoaded = true;
            this.loading = false;
          }
        },
        (err) => {
          this.logError(err);
          this.loading = false;
        }
      );
  }
  logError(err: DanpheHTTPResponse) {
    throw new Error("Something went wrong, please debug for more information.");
  }
  OnDateRangeChange($event) {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;

    }
  }
  gridExportOptions = {
    fileName: 'MarketingReferralDetailReport' + moment().format('YYYY-MM-DD') + '.xls'
  };
  GridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "Yes": {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["All items are Already returned from this invoice. You’re not allowed to enter the Commission Details",]);

        break;
      }

      default:
        break;
    }
  }
  CalculateDetailedSummary() {
    this.Summary_detailedView.TotalReferralAmount = this.MarketingReferralDetailedReport.reduce((total, itm) => {
      return total + itm.ReferralAmount;
    }, 0);
  }

  CalculateSummaryViewSummary() {
    this.Summary_summaryView.NetInvoiceAmount = this.MarketingReferralSummaryReport.reduce((total, itm) => {
      return total + itm.InvoiceNetAmount;
    }, 0);

    this.Summary_summaryView.TotalReferralAmount = this.MarketingReferralSummaryReport.reduce((total, itm) => {
      return total + itm.ReferralAmount;
    }, 0);
  }

  SwitchView(): void {
    this.ShowSummaryView = !this.ShowSummaryView;
  }
}

