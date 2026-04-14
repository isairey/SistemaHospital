import { ChangeDetectorRef, Component } from "@angular/core";
import * as moment from 'moment/moment';
import { CoreService } from '../../core/shared/core.service';
import { SecurityService } from "../../security/shared/security.service";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { FiscalYearModel } from "../settings/shared/fiscalyear.model";
import { AccountingBLService } from "../shared/accounting.bl.service";
import { AccountingService } from "../shared/accounting.service";
@Component({
    templateUrl: './account-closure.html',
})
export class AccountClosureComponent {
    public activeFiscalYear: FiscalYearModel = new FiscalYearModel();
    public calType: string = "";

    public EnableEnglishCalendarOnly: boolean = false;
    public showAccountClosureUI: boolean = false;
    public showpopup: boolean = false;
    public disablebtn: boolean = false;
    public FiscalYearList: Array<FiscalYearModel> = new Array<FiscalYearModel>();
    public fiscalYearId: number = 0;
    public loadDetail: boolean = false;
    constructor(
        public msgBoxServ: MessageboxService,
        public accBLService: AccountingBLService, public nepaliCalendarServ: NepaliCalendarService,
        public securityService: SecurityService, public changeDetRef: ChangeDetectorRef, public coreService: CoreService,public accountingService:AccountingService) {
        this.disablebtn = false;
        this.GetCalendarParameter();
        this.getActiveFiscalYear();
        this.showAccountClosureUI = true;
        this.calType = coreService.DatePreference;
    }

    GetCalendarParameter(): void {
        const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "EnableEnglishCalendarOnly");
        if (param && param.ParameterValue) {
          const paramValue = JSON.parse(param.ParameterValue);
          this.EnableEnglishCalendarOnly = paramValue;
        }
      }
    getActiveFiscalYear() {
        try {
            if (!!this.accountingService.accCacheData.FiscalYearList && this.accountingService.accCacheData.FiscalYearList.length > 0) {//mumbai-team-june2021-danphe-accounting-cache-change
                if (this.accountingService.accCacheData.FiscalYearList.length) {//mumbai-team-june2021-danphe-accounting-cache-change
                    this.FiscalYearList = this.accountingService.accCacheData.FiscalYearList;//mumbai-team-june2021-danphe-accounting-cache-change
                    this.FiscalYearList = this.FiscalYearList.slice();//mumbai-team-june2021-danphe-accounting-cache-change
                    var today = new Date();
                    var currentData = moment(today).format(ENUM_DateTimeFormat.Year_Month_Day);
                    var currfiscyear = this.FiscalYearList.filter(f => f.FiscalYearId == this.securityService.AccHospitalInfo.CurrFiscalYear.FiscalYearId);
                    //var currfiscyear = this.FiscalYearList.filter(f => f.StartDate <= currentData && f.EndDate >= currentData);
                    if (currfiscyear.length > 0) {
                        this.fiscalYearId = currfiscyear[0].FiscalYearId;
                        this.activeFiscalYear = currfiscyear[0];
                        if (this.fiscalYearId != null) {
                            //this.disablebtn = (this.activeFiscalYear.IsClosed == true) ? true : false;   //old code
                            this.disablebtn = (this.activeFiscalYear.IsClosed == false && this.activeFiscalYear.EndDate > currentData) ? true : false;
                        }
                        else {
                            this.disablebtn = true;
                        }
                    }
                    if (!!this.accountingService.accCacheData.FiscalYearList && this.accountingService.accCacheData.FiscalYearList.length > 0) {//mumbai-team-june2021-danphe-accounting-cache-change
                        this.coreService.SetFiscalYearList(this.accountingService.accCacheData.FiscalYearList);//mumbai-team-june2021-danphe-accounting-cache-change
                    }
                }
            }
        }
        catch (ex) {
            console.log(ex);
        }
    }
    AssignAccountingTenantAfterClosure(tenantId) {

        if (tenantId) {
            this.accBLService.ActivateAccountingTenant(tenantId)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.securityService.SetAccHospitalInfo(res.Results);
                        this.coreService.GetFiscalYearList().subscribe(res => {
                            this.coreService.SetFiscalYearList(res);
                            this.FiscalYearList = res.Results;
                            for (var i = 0; i < this.FiscalYearList.length; i++) {
                                this.FiscalYearList[i].showreopen = (this.FiscalYearList[i].IsClosed == true) ? true : false;
                            }
                            this.accountingService.accCacheData.FiscalYearList.forEach(fy => {
                                let fiscalyear = this.FiscalYearList.filter(f => f.FiscalYearId == fy.FiscalYearId);
                                fy.IsClosed = (fiscalyear.length > 0) ? fiscalyear[0].IsClosed : true;
                                fy.showreopen = fy.IsClosed;
                            });
                        });
                    }

                }, err => {
                    console.log(err);
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['refresh once , and work continue . ']);
                });
        }
    }
    onFiscalYearChange() {
        var fs = this.FiscalYearList.filter(f => f.FiscalYearId == this.fiscalYearId);
        if (fs.length > 0) {
            this.activeFiscalYear = fs[0];
            this.fiscalYearId = fs[0].FiscalYearId;
            // this.disablebtn = (this.activeFiscalYear.IsClosed == true) ? true : false;  //old code
            var today = this.securityService.AccHospitalInfo.TodaysDate;
            var currentData = moment(today).format(ENUM_DateTimeFormat.Year_Month_Day);
            if (this.fiscalYearId != null) {
                if (this.activeFiscalYear.IsClosed == true && this.activeFiscalYear.EndDate < currentData)       //btn is desable when selected fs year is closed
                {
                    this.disablebtn = true;
                }
                else if (this.activeFiscalYear.IsClosed == false && this.activeFiscalYear.EndDate < currentData)      //btn is enable when selected fs year is not closed
                {
                    this.disablebtn = false;
                }
                else if (this.activeFiscalYear.IsClosed == false && this.activeFiscalYear.EndDate > currentData)      // btn is desable when selected(current) fs year is not closed  
                {
                    this.disablebtn = true;
                }
            }
            else {
                this.disablebtn = true;                            //btn desable when fs years is null
            }
        }
    }

    close() {
        this.showpopup = false;
    }
    openPopup() {
        this.showpopup = true;
    }
    postAccountClosure() {
        this.disablebtn = true;
        this.loadDetail = false;
        this.accBLService.PostAccountClosure(this.activeFiscalYear).subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.activeFiscalYear = res.Results;
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [`Fiscal Year is successfully closed.`]);
                this.showAccountClosureUI = false;
                this.showpopup = false;
                this.loadDetail = true;
                this.getActiveFiscalYear();
                this.AssignAccountingTenantAfterClosure(this.securityService.AccHospitalInfo.ActiveHospitalId);
            }
            else if (res.Status === ENUM_DanpheHTTPResponses.Failed) {
                this.showpopup = false;
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
                this.disablebtn = false;
            }
        });
    }
}
