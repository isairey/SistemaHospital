import { Component } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from "../../../security/shared/security.service";
import { SettingsBLService } from "../../../settings-new/shared/settings.bl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { AccountingBLService } from "../../shared/accounting.bl.service";
import { AccountingService } from '../../shared/accounting.service';
import { ReverseTransactionModel } from '../shared/reverse-transaction.model';
import { SectionModel } from "../shared/section.model";

@Component({
  selector: 'reverse-transaction',
  templateUrl: './reverse-transaction.html'
})

export class ReverseTransaction {
  public transaction: ReverseTransactionModel = new ReverseTransactionModel();
  public calType: string = "";
  public sectionList: Array<SectionModel> = [];
  public permissions: Array<any> = new Array<any>();
  public applicationList: Array<any> = new Array<any>();
  constructor(public msgBoxServ: MessageboxService,
    public router: Router,
    public accountingBLService: AccountingBLService,
    public coreService: CoreService, public settingsBLService: SettingsBLService,
    public securityService: SecurityService, public accountingService: AccountingService) {
    this.calType = this.coreService.DatePreference;
    this.GetSection();
  }
  public validDate: boolean = true;
  selectDate(event) {
    if (event) {
      this.transaction.TransactionDate = event.selectedDate;
      this.transaction.FiscalYearId = event.fiscalYearId;
      this.validDate = true;
    }
    else {
      this.validDate = false;
    }
  }
  UndoTransaction() {
    if (this.CheckValidDate()) {
      this.accountingBLService.UndoTransaction(this.transaction)
        .subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results == true) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Transaction is reversed successfully.']);
              this.Close();
            }
            else
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No records Found..Select Different Date..']);
          }
        },
          err => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['There is problem, please try again']);
          });
    }

  }

  //loads CalendarTypes from Paramter Table (database) and assign the require CalendarTypes to local variable.
  LoadCalendarTypes() {
    let Parameter = this.coreService.Parameters;
    Parameter = Parameter.filter(parms => parms.ParameterName == "CalendarTypes");
    let calendarTypeObject = JSON.parse(Parameter[0].ParameterValue);
    this.calType = calendarTypeObject.AccountingModule;
  }
  Close() {
    this.transaction = new ReverseTransactionModel();
    this.router.navigate(['/Accounting/Settings']);
  }
  public CheckValidDate() {
    if (!this.validDate) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Select proper date']);
      return false;
    }
    if (this.transaction.TransactionDate > moment().format(ENUM_DateTimeFormat.Year_Month_Day)) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Select Valid Date."]);
      return false;
    }
    else if (this.transaction.Reason == null || this.transaction.Reason.length < 20) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Reason of reverse transaction should be minimum 20 character long.'])
      return false;
    }
    else if (this.transaction.Section === 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, [`Please select at least one section from the dropdown and try again.`]);
      return false;
    }
    else return true;
  }

  public GetSection() {
    this.settingsBLService.GetApplicationList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.applicationList = res.Results;
          let sectionApplication = this.applicationList.filter(a => a.ApplicationCode == "ACC-Section" && a.ApplicationName == "Accounts-Sections")[0];
          if (sectionApplication != null || sectionApplication != undefined) {
            this.permissions = this.securityService.UserPermissions.filter(p => p.ApplicationId == sectionApplication.ApplicationId);
          }
          let sList = this.accountingService.accCacheData.Sections.filter(sec => sec.SectionId != 4); // 4 is Manual_Voucher (FIXED for DanpheEMR) //mumbai-team-june2021-danphe-accounting-cache-change
          sList.forEach(s => {
            let sname = s.SectionName.toLowerCase();
            let pp = this.permissions.filter(f => f.PermissionName.includes(sname))[0];
            if (pp != null || pp != undefined) {
              this.sectionList.push(s);
              this.sectionList = this.sectionList.slice();//mumbai-team-june2021-danphe-accounting-cache-change
            }
          })
          let defSection = this.sectionList.find(s => s.IsDefault == true);
          if (defSection) {
            this.transaction.Section = defSection.SectionId;
          }
          else {
            if (this.sectionList.length > 0) {
              this.transaction.Section = this.sectionList[0].SectionId;
            }
            else {
              this.transaction.Section = 0;
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, [`No Section is mapped with selected Account Division.`]);
            }
          }
        }

      });


  }
}
