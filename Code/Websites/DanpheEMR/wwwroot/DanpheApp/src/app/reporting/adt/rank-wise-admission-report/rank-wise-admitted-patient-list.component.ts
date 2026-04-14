import { Component } from "@angular/core";
import * as _ from "lodash";
import * as moment from "moment";
import { BillingBLService } from "../../../billing/shared/billing.bl.service";
import { CoreService } from "../../../core/shared/core.service";
import { SettingsBLService } from "../../../settings-new/shared/settings.bl.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { IGridFilterParameter } from "../../../shared/danphe-grid/grid-filter-parameter.interface";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { RankWiseAdmittedPatient_DTO } from "../../shared/dto/rank-wise-admitted-patient-list.dto";
import { Rank_DTO } from "../../shared/dto/rank.dto";
import { RPT_SchemeDTO } from "../../shared/dto/scheme.dto";
import { ReportingService } from "../../shared/reporting-service";

@Component({
  selector: "rank-wise-admitted-patient-list",
  templateUrl:
    "./rank-wise-admitted-patient-list.component.html",
  styleUrls: [
    "./rank-wise-admitted-patient-list.component.css",
  ],
})
export class RankWiseAdmittedPatientReportComponent {
  FromDate: string = "";
  ToDate: string = "";
  DateRange: string = "";
  TotalAdmittedPatientReport = new Array<RankWiseAdmittedPatient_DTO>();
  TotalAdmittedPatientReportGridColumns: Array<any> = null;
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  Schemes: string | any = "";
  Ranks: string | any = "";
  loading = false;
  AllSchemes = new Array<RPT_SchemeDTO>();
  PreSelectedSchemes = [];
  AllRanks = new Array<Rank_DTO>();
  PreSelectedRanks = [];
  ShowGrid: boolean = false;
  gridExportOptions = {
    fileName:
      "RankMembershipWiseAdmittedPatientReport" +
      moment().format("YYYY-MM-DD") +
      ".xls",
  };
  FooterContent = "";
  FilterParameters: IGridFilterParameter[] = [];
  SchemeNames: string | any = "";
  MembershipSchemeSettings: { ShowCommunity: boolean, IsMandatory: boolean, CommunityLabel: string, SchemeLabel: string };

  constructor(
    private _dlService: DLService,
    private _messageBoxService: MessageboxService,
    private _reportingService: ReportingService,
    private _settingsBLService: SettingsBLService,
    private _billingBLService: BillingBLService,
    private _coreService: CoreService
  ) {
    this.TotalAdmittedPatientReportGridColumns = this._reportingService.reportGridCols.RankMembershipwiseAdmittedPatientReport;
    let param = this._coreService.Parameters.find(p => p.ParameterGroupName === "Billing" && p.ParameterName === "MembershipSchemeSettings");
    if (param) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.MembershipSchemeSettings = paramValue;
    }
    this.LoadRanks();
    this.LoadSchemes();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AdmissionDate", false)
    );
  }

  LoadRanks(): void {
    this._billingBLService.GetRank().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        let ranks = [];
        ranks = res.Results;
        ranks.forEach((x) => {
          x["Rank"] = x.RankName;
        });
        ranks.forEach((p) => {
          let val = _.cloneDeep(p);
          this.PreSelectedRanks.push(val);
        });
        this.MapPreSelectedRanks(this.PreSelectedRanks);
        this.AllRanks = ranks;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [
          "Couldn't load Ranks",
        ]);
      }
    });
  }

  LoadSchemes(): void {
    this._settingsBLService
      .GetSchemesForReport()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          let schemes = [];
          schemes = res.Results;
          schemes.forEach((p) => {
            let val = _.cloneDeep(p);
            this.PreSelectedSchemes.push(val);
          });
          this.MapPreSelectedSchemes(this.PreSelectedSchemes);
          this.AllSchemes = schemes;
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [
            "Couldn't load Schemes",
          ]);
        }
      });
  }

  LoadReport(): void {
    this.loading = true;
    this.TotalAdmittedPatientReport = [];

    // setting the filter parameters for printing and exporting purpose
    this.FilterParameters = [
      {
        DisplayName: "Date Range",
        Value: `<strong>${this.FromDate}</strong> to <strong>${this.ToDate}</strong>`,
      },
      {
        DisplayName: "Schemes",
        Value: this.SchemeNames.replaceAll(",", ", "),
      },
      { DisplayName: "Ranks", Value: this.Ranks.replaceAll(",", ", ") },
    ];

    this._dlService
      .Read(
        `/Reporting/RankMembershipWiseAdmittedPatientReport?fromDate=${this.FromDate}&toDate=${this.ToDate}&schemes=${this.Schemes}&ranks=${this.Ranks}`
      )
      .map((res: DanpheHTTPResponse) => res)
      .finally(() => {
        this.loading = false;
      }) //re-enable button after response comes back.
      .subscribe(
        (res) => this.Success(res),
        (res) => this.Error(res)
      );
  }

  Success(res): void {
    if (
      res.Status === ENUM_DanpheHTTPResponseText.OK &&
      res.Results.length > 0
    ) {
      this.ShowGrid = true;
      this.TotalAdmittedPatientReport = res.Results;
    } else if (
      res.Status === ENUM_DanpheHTTPResponseText.OK &&
      res.Results.length === 0
    )
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [
        "Data is Not Available Between Selected Parameters...Try Different",
      ]);
    else
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
        res.ErrorMessage,
      ]);
  }
  Error(err): void {
    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
      err.ErrorMessage,
    ]);
  }

  OnFromToDateChange($event): void {
    this.FromDate = $event ? $event.fromDate : this.FromDate;
    this.ToDate = $event ? $event.toDate : this.ToDate;
    this.DateRange =
      "<b>Date:</b>&nbsp;" +
      this.FromDate +
      "&nbsp;<b>To</b>&nbsp;" +
      this.ToDate;
  }

  SchemesChanged($event): void {
    let defSchemes = [];
    let defSchemeNames = [];
    $event.forEach((x) => {
      defSchemes.push(x.SchemeId);
      defSchemeNames.push(x.SchemeName);
    });
    let schemeList = defSchemes.join(",");
    this.Schemes = schemeList;
    let schemeNames = defSchemeNames.join(",");
    this.SchemeNames = schemeNames;
  }

  RanksChanged($event): void {
    let defRanks = [];
    $event.forEach((x) => {
      defRanks.push(x.RankName);
    });
    let rankList = defRanks.join(",");
    this.Ranks = rankList;
  }

  MapPreSelectedRanks(preSelectedRanks): void {
    let defRanks = [];
    preSelectedRanks.forEach((x) => {
      defRanks.push(x.RankName);
    });
    let rankList = defRanks.join(",");
    this.Ranks = rankList;
  }

  MapPreSelectedSchemes(preSelectedSchemes): void {
    let defSchemes = [];
    preSelectedSchemes.forEach((x) => {
      defSchemes.push(x.SchemeId);
    });
    let schemeList = defSchemes.join(",");
    this.Schemes = schemeList;
  }
}
