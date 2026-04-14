import { ChangeDetectorRef, Component } from "@angular/core";
import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { SettingsBLService } from "../../../settings-new/shared/settings.bl.service";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../../shared/routefrom.service";
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { Hospital_DTO } from "../../settings/shared/dto/hospitals.dto";
import { SectionModel } from "../../settings/shared/section.model";
import { AccountingBLService } from "../../shared/accounting.bl.service";
import { AccountingService } from '../../shared/accounting.service';
import { Voucher } from "../../transactions/shared/voucher";
import { AccountingReportsBLService } from "../shared/accounting-reports.bl.service";

@Component({
    selector: 'voucher-report',
    templateUrl: './voucher-report.html',
})
export class VoucherReportComponent {
    public txnList: Array<{ FiscalYear, TransactionDate, VoucherType }> = [];
    public txnListAll: Array<{ FiscalYear, TransactionDate, VoucherType }> = [];
    public txnGridColumns: Array<any> = null;
    public fromDate: string = null;
    public toDate: string = null;
    public voucherList: Array<Voucher> = new Array<Voucher>();
    public selVoucher: Voucher = new Voucher();
    public voucherNumber: string = null;
    btndisabled = false;
    public fiscalyearList: any;

    public sectionList: Array<SectionModel> = [];
    public sectionId: number = 0;
    public showExportbtn: boolean = false;
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();//sud:10Apr'20-this is temporary solution.
    public permissions: Array<any> = new Array<any>();
    public applicationList: Array<any> = new Array<any>();
    public SelectedHospital: number = 0;
    public HospitalList: Array<Hospital_DTO> = new Array<Hospital_DTO>();
    public HospitalId: number = 1;
    public ActiveHospital: number = 0;
    public AllSections: Array<SectionModel> = new Array<SectionModel>();

    constructor(public accReportBLService: AccountingReportsBLService, public msgBoxServ: MessageboxService,
        public accountingService: AccountingService,
        public accountingBLService: AccountingBLService,
        public changeDetector: ChangeDetectorRef,
        public coreService: CoreService,
        public routeFrom: RouteFromService,
        public securityService: SecurityService,
        public settingsBLService: SettingsBLService,
    ) {
        this.txnGridColumns = GridColumnSettings.VoucherTransactionList;
        this.fromDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
        this.toDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
        this.GetSection();
        this.GetVoucher();
        this.GetFiscalYearList();
        this.showExport();
        //this.LoadCalendarTypes();         
        this.calType = this.coreService.DatePreference;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('TransactionDate', false));//sud:10Apr'20--temporary solution.
        this.CheckAndAssignHospital();
        this.AllSections = this.accountingService.AllSections;

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

    public fiscalYearId: number = null;
    public validDate: boolean = true;
    selectDate(event) {
        if (event) {
            this.fromDate = event.fromDate;
            this.toDate = event.toDate;
            this.fiscalYearId = event.fiscalYearId;
            this.validDate = true;
        }
        else {
            this.validDate = false;
        }
    }

    public calType: string = "";
    //loads CalendarTypes from Paramter Table (database) and assign the require CalendarTypes to local variable.
    LoadCalendarTypes() {
        let Parameter = this.coreService.Parameters;
        Parameter = Parameter.filter(parms => parms.ParameterName == "CalendarTypes");
        let calendarTypeObject = JSON.parse(Parameter[0].ParameterValue);
        this.calType = calendarTypeObject.AccountingModule;
    }
    public GetFiscalYearList() {
        if (!!this.accountingService.accCacheData.FiscalYearList && this.accountingService.accCacheData.FiscalYearList.length > 0) { //mumbai-team-june2021-danphe-accounting-cache-change
            this.fiscalyearList = this.accountingService.accCacheData.FiscalYearList;//mumbai-team-june2021-danphe-accounting-cache-change
            this.fiscalyearList = this.fiscalyearList.slice();//mumbai-team-june2021-danphe-accounting-cache-change
        }
    }

    GetVoucher() {
        try {
            if (!!this.accountingService.accCacheData.VoucherType && this.accountingService.accCacheData.VoucherType.length > 0) {//mumbai-team-june2021-danphe-accounting-cache-change
                this.voucherList = this.accountingService.accCacheData.VoucherType;//mumbai-team-june2021-danphe-accounting-cache-change
                this.voucherList = this.voucherList.slice();//mumbai-team-june2021-danphe-accounting-cache-change
                this.selVoucher.VoucherId = -1;
                this.AssignVoucher();
            }

        } catch (ex) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['error ! console log for details.']);
            console.log(ex);
        }
    }

    public GetTxnList() {
        this.btndisabled = true;
        this.HospitalId = this.SelectedHospital;
        this.txnList = this.txnListAll = [];
        if (this.checkDateValidation()) {
            if (this.sectionId > 0) {
                this.accReportBLService.GetVoucherReport(this.fromDate, this.toDate, this.sectionId, this.fiscalYearId, this.HospitalId)
                    .subscribe(res => {
                        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                            this.btndisabled = false;
                            this.txnListAll = res.Results;
                            this.AssignVoucher();
                        }
                        else {
                            this.btndisabled = false;
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                            // alert("Failed ! " + res.ErrorMessage);
                        }
                    });
            }
            else {
                this.btndisabled = false;
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["please select module"]);
            }
        }
        else {
            this.btndisabled = false;
        }
    }

    checkDateValidation() {
        if (!this.validDate) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Select proper date.']);
            return false;
        }
        var frmdate = moment(this.fromDate, ENUM_DateTimeFormat.Year_Month_Day);
        var tdate = moment(this.toDate, ENUM_DateTimeFormat.Year_Month_Day);
        var flg = false;
        this.fiscalyearList.forEach(a => {
            if ((moment(a.StartDate, ENUM_DateTimeFormat.Year_Month_Day) <= frmdate) && (tdate <= moment(a.EndDate, ENUM_DateTimeFormat.Year_Month_Day))) {
                flg = true;
            }
        });
        if (flg == false) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Selected dates must be with in a fiscal year']);
            return flg;
        }
        let flag = true;
        flag = moment(this.fromDate, ENUM_DateTimeFormat.Year_Month_Day).isValid() == true ? flag : false;
        flag = moment(this.toDate, ENUM_DateTimeFormat.Year_Month_Day).isValid() == true ? flag : false;
        flag = (this.toDate >= this.fromDate) == true ? flag : false;
        //flag = (this.selVoucher.VoucherId > 0) ? flag : false;
        if (!flag) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['select proper date(FromDate <= ToDate)']);
        }
        if (!this.SelectedHospital) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please select Account Section']);
            return false;
        }
        return flag;
    }
    TransactionGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "view-detail": {
                //this.transactionId = null;
                //this.changeDetector.detectChanges();
                //this.transactionId = $event.Data.TransactionId;
                this.voucherNumber = null;
                this.changeDetector.detectChanges();
                this.voucherNumber = $event.Data.VoucherNumber;
                this.sectionId = $event.Data.SectionId;
                this.HospitalId = this.SelectedHospital;
                localStorage.setItem("SectionId", this.sectionId.toString())
                this.routeFrom.RouteFrom = "VoucherReport"
            }
            default:
                break;
        }
    }

    AssignVoucher() {
        try {
            this.selVoucher.VoucherName = (this.selVoucher.VoucherId == -1) ? "" : this.voucherList.find(v => v.VoucherId == this.selVoucher.VoucherId).VoucherName;
            this.txnList = [];
            this.txnList = (this.selVoucher.VoucherId == -1) ? this.txnListAll : this.txnListAll.filter(s => s.VoucherType == this.selVoucher.VoucherName);
        } catch (ex) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Please check console']);
            console.log(ex);
        }
    }

    //sud-nagesh: 21June'20--reusing sectionlist from current active hospital of security service.
    public GetSection() {
        this.settingsBLService.GetApplicationList()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.applicationList = res.Results;
                    let sectionApplication = this.applicationList.filter(a => a.ApplicationCode == "ACC-Section" && a.ApplicationName == "Accounts-Sections")[0];
                    if (sectionApplication != null || sectionApplication != undefined) {
                        this.permissions = this.securityService.UserPermissions.filter(p => p.ApplicationId == sectionApplication.ApplicationId);
                    }
                    let sList = this.accountingService.accCacheData.Sections; //mumbai-team-june2021-danphe-accounting-cache-change
                    sList.forEach(s => {
                        let sname = s.SectionName.toLowerCase();
                        let pp = this.permissions.filter(f => f.PermissionName.includes(sname))[0];
                        if (pp != null || pp != undefined) {
                            this.sectionList.push(s);
                            this.sectionList = this.sectionList.slice(); //mumbai-team-june2021-danphe-accounting-cache-change
                        }
                    })
                    let defSection = this.sectionList.find(s => s.IsDefault == true);
                    if (defSection) {
                        this.sectionId = defSection.SectionId;
                    }
                    else {
                        this.sectionId = this.sectionList.length > 0 ? this.sectionList[0].SectionId : 0;
                    }
                }
            });
    }
    gridExportOptions = {
        fileName: 'VoucherList_' + moment().format(ENUM_DateTimeFormat.Year_Month_Day) + '.xls',
    };

    public GetChangedSection() {
        try {
            if (this.txnList.length > 0) {
                this.txnList = [];
            }
            this.sectionId = this.sectionList.find(s => s.SectionId == this.sectionId).SectionId;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["click on show details for search records"]);
        }
        catch (ex) {

        }
    }
    showExport() {

        let exportshow = this.coreService.Parameters.find(a => a.ParameterName == "AllowSingleVoucherExport" && a.ParameterGroupName == "Accounting").ParameterValue;
        if (exportshow == "true") {
            this.showExportbtn = true;
        }
        else {
            this.showExportbtn = false;
        }
    }

    public CallBackTransactionClose($event) {
        if ($event) {
            this.voucherNumber = "";
            this.changeDetector.detectChanges();
            this.voucherNumber = $event.VoucherNumber;
            this.fiscalYearId = $event.FiscalyearId;
        }
    }

    OnHospitalChange() {
        this.txnList = [];
        let sectionIdForManualVoucher = 4;
        this.sectionList = this.AllSections.filter(a => a.HospitalId === this.SelectedHospital || a.SectionId === sectionIdForManualVoucher);
        this.sectionId = this.sectionList.length > 0 ? this.sectionList[0].SectionId : this.sectionId;
    }
}
