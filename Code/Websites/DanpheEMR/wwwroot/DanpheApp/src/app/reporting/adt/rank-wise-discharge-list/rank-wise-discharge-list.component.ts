import { Component } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BillingBLService } from '../../../billing/shared/billing.bl.service';
import { CoreService } from '../../../core/shared/core.service';
import { SettingsBLService } from '../../../settings-new/shared/settings.bl.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { RankWiseDischargePatient_DTO } from '../../shared/dto/rank-wise-discharged-patient-list.dto';
import { Rank_DTO } from '../../shared/dto/rank.dto';
import { RPT_SchemeDTO } from '../../shared/dto/scheme.dto';
import { ReportingService } from '../../shared/reporting-service';
@Component({
  selector: 'rank-wise-discharged-patient-list',
  templateUrl: './rank-wise-discharge-list.component.html',
  styleUrls: ['./rank-wise-discharge-list.component.css']
})
export class RankWiseDischargeListComponent {
  FromDate: string = "";
  ToDate: string = "";
  DateRange: string = "";
  TotalDischargedPatientReport = new Array<RankWiseDischargePatient_DTO>();
  TotalDischargedPatientReportGridColumns: Array<any> = null;
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  Schemes: string | any = "";
  Ranks: string | any = "";
  loading = false;
  AllSchemes = new Array<RPT_SchemeDTO>();
  PreSelectedSchemes = [];
  AllRanks = new Array<Rank_DTO>();
  PreSelectedRanks = [];
  ShowGrid: boolean = false;
  FooterContent = "";
  FilterParameters: IGridFilterParameter[] = [];
  SchemeNames: string | any = "";
  MembershipSchemeSettings: { ShowCommunity: boolean, IsMandatory: boolean, CommunityLabel: string, SchemeLabel: string };
  gridExportOptions = {
    fileName: 'RankMembershipWiseDischargePatientReport' + moment().format('YYYY-MM-DD') + '.xls',
  };

  constructor(
    private _dlService: DLService,
    private _coreService: CoreService,
    private _reportingService: ReportingService,
    private _messageBoxService: MessageboxService,
    private _settingsBLService: SettingsBLService,
    private _billingBLService: BillingBLService,
  ) {
    this.TotalDischargedPatientReportGridColumns = this._reportingService.reportGridCols.RankMembershipWiseDischargePatientCols;
    let param = this._coreService.Parameters.find(p => p.ParameterGroupName === "Billing" && p.ParameterName === "MembershipSchemeSettings");
    if (param) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.MembershipSchemeSettings = paramValue;
    }
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("AdmissionDate", false), new NepaliDateInGridColumnDetail("DischargedDate", false));
    this.LoadSchemes();
    this.LoadRanks();
  }

  ngOnInit() {

  }

  OnFromToDateChange($event) {
    this.FromDate = $event ? $event.fromDate : this.FromDate;
    this.ToDate = $event ? $event.toDate : this.ToDate;
    this.DateRange = this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
  }

  LoadReport() {
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

    this._dlService.Read(`/Reporting/RankMembershipWiseDischargePatientReport?fromDate=${this.FromDate}&toDate=${this.ToDate}&schemeIds=${this.Schemes}&ranks=${this.Ranks}`).map(res => res).subscribe(res => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.TotalDischargedPatientReport = res.Results;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed To Load Data']);
      }
    },
      err => {
        console.log(err);
      })

  }

  MapPreSelectedSchemes(preSelectedSchemes): void {
    let defSchemes = [];
    preSelectedSchemes.forEach((x) => {
      defSchemes.push(x.SchemeId);
    });
    let schemeList = defSchemes.join(",");
    this.Schemes = schemeList;
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


  LoadSchemes(): void {
    this._settingsBLService.GetSchemesForReport()
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

  MapPreSelectedRanks(preSelectedRanks): void {
    let defRanks = [];
    preSelectedRanks.forEach(x => {
      defRanks.push(x.RankName);
    });
    let rankList = defRanks.join(",");
    this.Ranks = rankList;
  }

}