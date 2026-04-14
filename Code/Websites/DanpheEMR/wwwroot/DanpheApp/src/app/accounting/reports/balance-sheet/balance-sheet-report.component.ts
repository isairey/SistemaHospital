import { ChangeDetectorRef, Component } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { FiscalYearModel } from '../../settings/shared/fiscalyear.model';
import { AccountingReportsBLService } from "../shared/accounting-reports.bl.service";
import { BalanceSheetReportVMModel } from "../shared/balance-sheet-reportVM.model";

import { SecurityService } from '../../../security/shared/security.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { Hospital_DTO } from '../../settings/shared/dto/hospitals.dto';
import { AccountingService } from "../../shared/accounting.service";
@Component({
  selector: 'my-app',
  templateUrl: "./balance-sheet-report.html"
})
export class BalanceSheetReportComponent {
  public fromDate: string = null;
  public toDate: string = null;
  public accBalanceSheetReportData: BalanceSheetReportVMModel = new BalanceSheetReportVMModel();
  public balanceSheetData: any;
  public AssetList: any = null;
  public LiabilityList: any = null;
  public fiscalYears: Array<FiscalYearModel> = new Array<FiscalYearModel>();
  public selFiscalYear: number = 0;
  public LiabilitiesData: any;
  public DisplayData: any;
  public AssetsData: any;
  public showResult: boolean = false;
  public netProfitLoss: number = 0;
  public assetTotal: number = 0;
  public liabilitiesTotal: number = 0;
  public isLedgerLevel: boolean = false;
  public showLedgerDetail: boolean = false;
  public ledgerId: number = 0;
  public ledgerName: string = '';
  public dateRange: string = null;
  public IsDataLoaded: boolean = false;
  public showExportbtn: boolean = false;
  public ledgerCode: any;
  public todaysDate: string = "";
  btndisabled = false;
  public showPrint: boolean = false;
  public printDetaiils: any;
  public DisplayLevel: string = "1";
  public HospitalList: Array<Hospital_DTO> = new Array<Hospital_DTO>();
  public SelectedHospital: number = 0;
  public HospitalId: number = 0;
  public ActiveHospital: number = 0;

  constructor(
    public messageBoxService: MessageboxService,
    public coreservice: CoreService,
    public securityService: SecurityService,
    public accReportBLService: AccountingReportsBLService, public accountingService: AccountingService
    , private changeDetector: ChangeDetectorRef) {
    this.fromDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);//default fromdate=today, it'll later be changed from loadfiscalyearlist function. 
    this.toDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.todaysDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);

    this.loadFiscalYearList();
    this.dateRange = "today";
    this.showExport();

    this.onDateChange();//Load today's data by default..
    this.accountingService.getCoreparameterValue();
    this.CheckAndAssignHospital();

  }
  CheckAndAssignHospital() {
    this.ActiveHospital = this.securityService.AccHospitalInfo.ActiveHospitalId;
    this.HospitalList = this.accountingService.accCacheData.Hospitals ? this.accountingService.accCacheData.Hospitals : [];
    if (this.HospitalList.length === 1) {
      this.SelectedHospital = this.HospitalList[0].HospitalId;
    } else {
      this.SelectedHospital = this.ActiveHospital;
    }
  }
  public selectedDate: string = "";
  public fiscalYearId: number = null;
  public validDate: boolean = true;
  selectDate(event) {
    if (event) {
      this.selectedDate = event.selectedDate;
      this.fiscalYearId = event.fiscalYearId;
      this.validDate = true;
      this.dateRange = "<b>Date:</b>&nbsp;" + this.selectedDate;
    }
    else {
      this.validDate = false;
    }
  }
  //event onDateChange
  onDateChange() {
    this.showResult = false;
    //this.fromDate = this.toDate;//sud:14June'20--fromdate is now set as start of fiscal year from loadFiscalyearList function.

    this.DisplayData = null;

    this.LoadData();

  }
  //Load balance sheet data
  LoadData() {
    this.btndisabled = true;
    this.HospitalId = this.SelectedHospital;

    // if (this.checkDateValidation() && this.checkValidFiscalYear()) {
    if (this.checkDateValidation() && this.selectedDate != null && this.fiscalYearId != null && this.HospitalId != 0 && this.HospitalId != null) {
      try {
        this.accReportBLService.GetBalanceSheetReportData(this.selectedDate, this.fiscalYearId, this.HospitalId)
          .subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
              this.btndisabled = false;
              this.balanceSheetData = null;
              this.DisplayData = null;
              this.netProfitLoss = 0;
              this.balanceSheetData = res.Results.result;
              this.netProfitLoss = res.Results.netProfit;
              let ProfitLossData = this.balanceSheetData.filter(a => a.PrimaryGroup == this.accountingService.getnamebyCode("001") || a.PrimaryGroup == this.accountingService.getnamebyCode("002"));
              //this.calNetProfitLoss(ProfitLossData);
              this.balanceSheetData = this.balanceSheetData.filter(a => a.PrimaryGroup == this.accountingService.getnamebyCode("008") || a.PrimaryGroup == this.accountingService.getnamebyCode("009")); //  "Assets" "Liabilities"
              this.CalculateTotalAmounts();
              this.LiabilityList = this.balanceSheetData.find(a => a.PrimaryGroup == this.accountingService.getnamebyCode("009"));
              this.AssetList = this.balanceSheetData.find(a => a.PrimaryGroup == this.accountingService.getnamebyCode("008"));
              this.formatDataforDisplay();
              this.showResult = true;
            }
            else {
              this.btndisabled = false;
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage])
            }
          });
      }
      catch (exception) {
        this.ShowCatchErrMessage(exception);
      }
    }
    else {
      this.btndisabled = false;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Select all mandatory field'])

    }
  }
  checkDateValidation() {
    if (!this.validDate) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Select proper date']);
      return false;
    }
    let flag = true;
    //flag = moment(this.fromDate, "YYYY-MM-DD").isValid() == true ? flag : false;
    flag = moment(this.toDate, ENUM_DateTimeFormat.Year_Month_Day).isValid() == true ? flag : false;
    var momentA = moment(this.toDate).format(ENUM_DateTimeFormat.Year_Month_Day);
    var momentB = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    flag = (momentA > momentB) ? false : true;
    //flag = (this.toDate >= this.fromDate) == true ? flag : false;
    if (!flag) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['select proper date']);
    }
    return flag;
  }
  checkValidFiscalYear() {
    return true;
  }
  //Export data grid options for excel file
  gridExportOptions = {
    fileName: 'AccountingBalanceSheetReport_' + moment().format(ENUM_DateTimeFormat.Year_Month_Day) + '.xls',
  };

  //This function only for show catch messages
  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  calNetProfitLoss(listData) {
    let expenseAmt = 0;
    let revenueAmt = 0;
    for (var i = 0; i < listData.length; i++) {
      var overallTotal = 0;
      for (var j = 0; j < listData[i].COAList.length; j++) {
        var tAmt = 0;
        for (var k = 0; k < listData[i].COAList[j].LedgerGroupList.length; k++) {
          for (var l = 0; l < listData[i].COAList[j].LedgerGroupList[k].LedgerList.length; l++)
            if (listData[i].PrimaryGroup == this.accountingService.getnamebyCode("002")) {
              tAmt = tAmt + listData[i].COAList[j].LedgerGroupList[k].LedgerList[l].DRAmount - listData[i].COAList[j].LedgerGroupList[k].LedgerList[l].CRAmount;
            }
            else {
              tAmt = tAmt + listData[i].COAList[j].LedgerGroupList[k].LedgerList[l].CRAmount - listData[i].COAList[j].LedgerGroupList[k].LedgerList[l].DRAmount;
            }
        }
        overallTotal = overallTotal + tAmt;
      }
      expenseAmt = listData[i].PrimaryGroup == this.accountingService.getnamebyCode("002") ? overallTotal : expenseAmt;
      revenueAmt = listData[i].PrimaryGroup == this.accountingService.getnamebyCode("001") ? overallTotal : revenueAmt;
    }
    this.netProfitLoss = revenueAmt - expenseAmt;
  }

  CalculateTotalAmounts() {
    let expenseAmt = 0;
    let revenueAmt = 0;


    for (var i = 0; i < this.balanceSheetData.length; i++) {
      var overallTotal = 0;
      for (var j = 0; j < this.balanceSheetData[i].COAList.length; j++) {
        var COAAmount = 0;
        for (var k = 0; k < this.balanceSheetData[i].COAList[j].LedgerGroupList.length; k++) {
          var LedgerGroupAmount = 0;

          if (this.balanceSheetData[i].COAList[j].COA == this.accountingService.getnamebyCode("010")) { // "Capital and Equity"

            if (this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerGroupName == this.accountingService.getnamebyCode("015")) {
              this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList.push({ "LedgerId": 0, "LedgerName": "Net Profit and Loss", "LedgerGroupAmount": this.netProfitLoss });

            }
          }
          for (var l = 0; l < this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList.length; l++) {
            var LedgerAmount = 0; var temp = 0;
            /// calculating amount..if assets then debit - credit , else liablities then credit - debit
            if (this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].LedgerName != "Net Profit and Loss") {

              if (this.balanceSheetData[i].PrimaryGroup == this.accountingService.getnamebyCode("008")) {
                temp = this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].DRAmount - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].CRAmount
                  + this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceDr - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceCr;
              }
              else {
                temp = this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].CRAmount - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].DRAmount
                  + this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceCr - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceDr;
              }
              //let temp = this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].DRAmount - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].CRAmount
              //    + this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceDr - this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].OpeningBalanceCr;
              this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].Amount = temp;
              LedgerGroupAmount = LedgerGroupAmount + temp;
            }
            else {
              //    LedgerAmount = LedgerAmount + this.netProfitLoss;
              this.balanceSheetData[i].COAList[j].LedgerGroupList[k].LedgerList[l].Amount = this.netProfitLoss;
              LedgerGroupAmount = LedgerGroupAmount + this.netProfitLoss;
            }
          }
          this.balanceSheetData[i].COAList[j].LedgerGroupList[k].Amount = LedgerGroupAmount;// CommonFunctions.parseAmount(LedgerGroupAmount);
          COAAmount = COAAmount + LedgerGroupAmount;
        }
        this.balanceSheetData[i].COAList[j].Amount = COAAmount;// CommonFunctions.parseAmount(COAAmount);
        overallTotal = overallTotal + COAAmount;

      }
      this.balanceSheetData[i].Amount = overallTotal;// CommonFunctions.parseAmount(overallTotal);
    }

  }




  loadFiscalYearList() {
    if (!!this.accountingService.accCacheData.FiscalYearList && this.accountingService.accCacheData.FiscalYearList.length > 0) { //mumbai-team-june2021-danphe-accounting-cache-change
      this.fiscalYears = this.accountingService.accCacheData.FiscalYearList; //mumbai-team-june2021-danphe-accounting-cache-change
      this.fiscalYears = this.fiscalYears.slice(); //mumbai-team-june2021-danphe-accounting-cache-change
      this.IsDataLoaded = true;

      //sud:14June'20--to assign Correct FromDate(fiscYearStartDate), otherwise it's not showing anytingin Reusable-Ledger Popup.
      let todayDate_Obj = moment(this.todaysDate);//taking from same variable, but we need moment() object for comparision.. so 
      //that year where 
      let currFiscYr = this.fiscalYears.find(x => x.IsActive == true && moment(x.StartDate) <= todayDate_Obj && todayDate_Obj <= moment(x.EndDate));
      if (currFiscYr) {
        this.fromDate = moment(currFiscYr.StartDate).format(ENUM_DateTimeFormat.Year_Month_Day);
      }
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to Load FiscalYearList']);
    }
  }

  formatDataforDisplay() {
    this.AssetsData = [];
    this.LiabilitiesData = [];
    this.DisplayData = [];
    let totAmt = 0;
    let nonCurrentAssetsAmount = 0;
    let currentAssetsAmount = 0;
    let lessLiabilitiesAmount = 0;
    //push Capital & Equity
    this.LiabilityList.COAList.forEach(a => {
      //if (a.COA == "Capital and Equity") {
      //    totAmt = a.Amount;
      //    this.DisplayData = this.pushToList(this.DisplayData, a.COA, "", "BoldCategory");
      //    a.LedgerGroupList.forEach(b => {
      //        if (b.LedgerGroupName == "Net Profit and Loss") {
      //            this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel");
      //        }
      //        else {
      //            this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel");
      //            b.LedgerList.forEach(c => {
      //                this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel");
      //            });
      //        }
      //    });
      //}
      if (a.COA == this.accountingService.getnamebyCode("010")) {
        totAmt = a.Amount;
        this.DisplayData = this.pushToList(this.DisplayData, a.COA, "", "BoldCategory", 0, [], 0);
        a.LedgerGroupList.forEach(b => {
          this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel", 0, [], 0);
          b.LedgerList.forEach(c => {
            this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel", c.LedgerId, c.Details, c.Code);
          });
        });
      }
    });

    //push Long Term Liabilities
    this.LiabilityList.COAList.forEach(a => {
      if (a.COA == this.accountingService.getnamebyCode("013")) { // "Long Term Liabilities"
        totAmt += a.Amount;
        this.DisplayData = this.pushToList(this.DisplayData, a.COA, "", "BoldCategory", 0, [], 0);
        a.LedgerGroupList.forEach(b => {
          this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel", 0, [], 0);
          b.LedgerList.forEach(c => {
            this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel", c.LedgerId, c.Details, c.Code);
          });
        });
      }
    });
    //push total amount of Capital & Equity's + Long Term Liabilities
    this.DisplayData = this.pushToList(this.DisplayData, "Total", totAmt, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

    //Assets
    this.DisplayData = this.pushToList(this.DisplayData, this.accountingService.getnamebyCode("008"), "", "BoldCategory", 0, [], 0);
    //push non current assets

    this.DisplayData = this.pushToList(this.DisplayData, this.accountingService.getnamebyCode("014"), 0, "BoldCategory", 0, [], 0); // "Non Current Assets"
    this.AssetList.COAList.forEach(a => {
      if (a.COA == this.accountingService.getnamebyCode("014")) {
        nonCurrentAssetsAmount = a.Amount;
        a.LedgerGroupList.forEach(b => {
          this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel", 0, [], 0);
          b.LedgerList.forEach(c => {
            this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel", c.LedgerId, c.Details, c.Code);
          });
        });
      }
    });
    //total non current asstes
    this.DisplayData = this.pushToList(this.DisplayData, "Total Non Current Assets", nonCurrentAssetsAmount, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

    //push current assets
    this.DisplayData = this.pushToList(this.DisplayData, this.accountingService.getnamebyCode("011"), 0, "BoldCategory", 0, [], 0); // "Current Assets"
    this.AssetList.COAList.forEach(a => {
      if (a.COA == this.accountingService.getnamebyCode("011")) {
        currentAssetsAmount = a.Amount;
        a.LedgerGroupList.forEach(b => {
          if (b.Amount != 0) {
            this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel", 0, [], 0);
            b.LedgerList.forEach(c => {
              this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel", c.LedgerId, c.Details, c.Code);
            });
          }
        });
      }
    });
    //total current assets
    this.DisplayData = this.pushToList(this.DisplayData, "Total Current Assets", currentAssetsAmount, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

    //less current liabiliteis
    this.LiabilityList.COAList.forEach(a => {
      if (a.COA == this.accountingService.getnamebyCode("012")) { // "Current Liabilities"
        lessLiabilitiesAmount = a.Amount
        this.DisplayData = this.pushToList(this.DisplayData, a.COA, 0, "BoldCategory", 0, [], 0);
        a.LedgerGroupList.forEach(b => {
          if (b.Amount != 0) {
            this.DisplayData = this.pushToList(this.DisplayData, b.LedgerGroupName, b.Amount, "ledgerGroupLevel", 0, [], 0);
            b.LedgerList.forEach(c => {
              this.DisplayData = this.pushToList(this.DisplayData, c.LedgerName, c.Amount, "ledgerLevel", c.LedgerId, c.Details, c.Code);
            });
          }
        });
      }
    });

    //total Current Liabilities
    this.DisplayData = this.pushToList(this.DisplayData, "Total Current Liabilities", lessLiabilitiesAmount, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

    //net current assets =(current assets) - (current liabilities)
    let netAmt = currentAssetsAmount - lessLiabilitiesAmount;
    this.DisplayData = this.pushToList(this.DisplayData, "Net Current Assets", netAmt, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

    //total =(non current asstes + net current)
    this.DisplayData = this.pushToList(this.DisplayData, "Total", nonCurrentAssetsAmount + netAmt, "BoldTotal", 0, [], 0);
    //blank entry
    //this.DisplayData = this.pushToList(this.DisplayData, "", 0, "BlankEntry",0);

  }

  //common function for foramtting
  //it takes source list, name, amount and style string then return by attaching obj to it.
  pushToList(list, name, amt, style, ledgerId, Details, code) {
    let Obj = new Object();
    Obj["Name"] = name;
    Obj["Amount"] = amt;
    Obj["Style"] = style;
    Obj["LedgerId"] = ledgerId;
    Obj["ShowLedgerGroup"] = false;
    Obj["ShowLedger"] = false;
    if (Details != undefined) {
      for (let i = 0; i < Details.length; i++) {
        if (Details[i].Dr >= Details[i].Cr) {
          Details[i].Dr = Details[i].Dr - Details[i].Cr;
          Details[i].Cr = 0;
        }
        else {
          Details[i].Cr = Details[i].Cr - Details[i].Dr;
          Details[i].Dr = 0;
        }
      }
    }
    Obj["Details"] = Details;
    Obj["Code"] = code;
    list.push(Obj);

    return list;
  }
  Print(tableId) {
    // let popupWinindow;
    // var headerContent = document.getElementById("headerForPrint").innerHTML;
    // var printContents = ""; // '<b>Report Date Range: ' + this.fromDate + ' To ' + this.toDate + '</b>';
    // printContents += '<style> table { border-collapse: collapse; border-color: black; } th { color:black; background-color: #599be0; } </style>';
    // printContents += document.getElementById("printpage_balanceSheet").innerHTML;
    // this.showPrint = false;
    // this.printDetaiils = null;
    // this.changeDetector.detectChanges();
    // this.showPrint = true;
    // this.printDetaiils = headerContent + printContents ; //document.getElementById("printpage");
    this.accountingService.Print(tableId, this.dateRange)

  }
  ExportToExcel(tableId) {
    // if (tableId) {
    //   let workSheetName = 'Balance Sheet Report';
    //   let Heading = 'Balance sheet Report';
    //   let filename = 'BalanceSheetReport';
    //   //NBB-send all parameters for now 
    //   //need enhancement in this function 
    //   //here from date and todate for show date range for excel sheet data
    //   CommonFunctions.ConvertHTMLTableToExcel(tableId, this.fromDate, this.toDate, workSheetName,
    //     Heading, filename);
    // }
    this.accountingService.ExportToExcel(tableId, this.dateRange);
  }

  SwitchViews(row) {
    if (row.Name != 'Net Profit and Loss') {
      this.ledgerId = row.LedgerId;
      this.ledgerName = row.Name;
      this.ledgerCode = row.Code;
      this.showLedgerDetail = true;
    }
  }
  ShowReport($event) {
    this.showLedgerDetail = false;
  }
  ShowChild(row, level) {
    let flag = 1;
    for (let i = 0; i < this.DisplayData.length; i++) {
      if (flag == 0) {
        if (level == 'COA') {
          this.DisplayData[i].ShowLedgerGroup = (this.DisplayData[i].ShowLedgerGroup == true) ? false : true;
          if (this.DisplayData[i].ShowLedgerGroup == false) {
            //set showledger=false for next item/row-- ShowLedger undefined issue was coming earlier.
            if (this.DisplayData[i + 1]) {
              this.DisplayData[i + 1].ShowLedger = false;
            }

          }
          if (this.DisplayData[i].Style == 'BoldCategory') {
            break;
          }
        }
        else {
          this.DisplayData[i].ShowLedger = (this.DisplayData[i].ShowLedger == true) ? false : true;
          if (this.DisplayData[i].Style == 'ledgerGroupLevel') {
            break;
          }
        }
      }
      if (this.DisplayData[i] == row) {
        flag = 0;
      }
    }
  }

  showExport() {

    let exportshow = this.coreservice.Parameters.find(a => a.ParameterName == "AllowOtherExport" && a.ParameterGroupName == "Accounting").ParameterValue;
    if (exportshow === "true") {
      this.showExportbtn = true;
    }
    else {
      this.showExportbtn = false;
    }
  }

  public OnDisplayLevelChange(event) {
    if (event) {
      if (this.DisplayData !== null) {
        let value = event.target.defaultValue;
        if (value === "2") {
          this.DisplayData.forEach(data => {
            data.ShowLedger = false;
          });
        }
        else if (value === "3") {
          this.DisplayData.forEach(data => {
            data.ShowLedgerGroup = false;
          });
        }
        else {
          this.DisplayData.forEach(data => {
            data.ShowLedgerGroup = false;
            data.ShowLedger = false;
          });
        }
      }
    }
  }
}
