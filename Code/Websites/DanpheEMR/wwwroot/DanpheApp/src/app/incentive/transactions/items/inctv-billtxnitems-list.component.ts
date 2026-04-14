import { ChangeDetectorRef, Component } from "@angular/core";
import * as moment from 'moment/moment';
import { Observable } from "rxjs";
import { BillingItemVM } from "../../../billing/shared/billing-item.view-model";
import { Patient_DTO } from "../../../claim-management/shared/DTOs/patient.dto";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { IncentiveBLService } from "../../shared/incentive.bl.service";
import { INCTVGridColumnSettings } from "../../shared/inctv-grid-column-settings";

@Component({
  templateUrl: './inctv-billtxnitems-list.html'
})
export class INCTV_BillTxnItemListComponent {

  public fromDate: string = moment().format('YYYY-MM-DD');
  public toDate: string = moment().format('YYYY-MM-DD');
  public dateRange: string = "last1Week";//by default show last 1 week data.
  public allBillTxnItemsList: Array<any> = [];
  public billTxnItmGridColumns: Array<any> = null;

  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public patientSearchMinCharacterCount: number = 0;

  public patientObj: Patient_DTO = new Patient_DTO();
  public ServiceItems: BillingItemVM[] = [];
  public SelectedItem: {
    ServiceItemId: 0,
    ItemName: string | null,
    ServiceDepartmentId: 0,
    ServiceDepartmentName: null,
    IsActive: true
  };
  public searchText: string = '';
  public itemName: string = '';
  constructor(public msgBoxServ: MessageboxService,
    public dlService: DLService,
    public securityService: SecurityService,
    public incentiveBLService: IncentiveBLService,
    public changeDetectorRef: ChangeDetectorRef,
    public coreService: CoreService,
  ) {

    this.billTxnItmGridColumns = INCTVGridColumnSettings.Incentive_BillTxnItemList_GridCols;
    // below two are needed so that we can send these data to edit-fraction component.
    this.LoadAllDocList();
    //this.LoadEmpProfileMap();
    this.GetEmpIncentiveInfo();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('TransactionDate', true));
    this.GetItemsList();
    this.GetPatientSearchMinCharacterCountParameter();
  }

  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
  }
  LoadIncentiveTxnItemsList() {
    this.dlService.Read(`/api/Incentive/TransactionItems?fromDate=${this.fromDate}&toDate=${this.toDate}&searchText=${this.searchText}&itemName=${this.itemName}`)
      .map(res => res).finally(() => {
        this.btndisabled = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.allBillTxnItemsList = res.Results;

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to get transaction items."]);
          console.log(res.ErrorMessage);
        }
      });

  }

  public showEditFraction: boolean = false;
  public selectedBillTxnItem: any = null;
  public btndisabled: boolean = false;
  LoadData() {
    this.LoadIncentiveTxnItemsList();
  }
  TxnItemGridActions($event: GridEmitModel) {

    switch ($event.Action) {

      case "edit":
        {
          this.showEditFraction = false;
          this.changeDetectorRef.detectChanges();
          //console.log($event.Data);
          this.selectedBillTxnItem = $event.Data;
          this.showEditFraction = true;

        }
        break;
      default:
        this.showEditFraction = false;
        this.selectedBillTxnItem = null;
        break;
    }

  }

  EditFractionOnClose($event) {
    if ($event && $event.action == "save") {
      //format of $event is : { action: "save", data: { TxnItemId: number, fractionItems: array<> } }
      //here we receive TxnItemId and array of fraction items from edit fraction component.


      console.log("edit component closed..")
      console.log($event.data);
      //Below section is to update the FractionCount of Current Row in the Source of the Grid
      if ($event.data) {
        let txnItemId = $event.data.TxnItemId;
        if (txnItemId) {
          //get the array lenth (count of fraciton items.)
          let frcCount = 0;
          if ($event.data.fractionItems && $event.data.fractionItems.length) {
            frcCount = $event.data.fractionItems.filter(frc => frc.IsActive == true).length;
          }

          // find the current item in grid source and update the fraction count.
          let currTxnItemInGrid = this.allBillTxnItemsList.find(a => a.BillingTransactionItemId == txnItemId);
          if (currTxnItemInGrid) {
            currTxnItemInGrid.FractionCount = frcCount;
            //slice reloads/resets the array, otherwise grid doesn't reload/refresh the data.
            this.allBillTxnItemsList = this.allBillTxnItemsList.slice();
          }


        }
      }
    }
    else {
      this.showEditFraction = false;
    }
  }

  //// this is needed as a global variable.
  //public EmpProfMap_All: Array<any> = [];

  //LoadEmpProfileMap() {
  //  this.incentiveBLService.GetEmpIncentiveInfo()
  //    .subscribe((res: DanpheHTTPResponse) => {
  //      if (res.Status == "OK") {
  //        this.EmpProfMap_All = res.Results;
  //      }
  //      else {
  //        this.msgBoxServ.showMessage("failed", ["Unable to get transaction items."]);
  //        console.log(res.ErrorMessage);
  //      }
  //    });
  //}


  public allEmpList: Array<any> = [];
  LoadAllDocList() {
    // this.dlService.Read("/BillingReports/GetReferralList")
    //   .map(res => res)
    //   .subscribe((res: DanpheHTTPResponse) => {
    //     if (res.Status == "OK") {
    //       let doclist: Array<any> = res.Results;
    //       this.allEmpList = doclist.map(a => {
    //         return { EmployeeId: a.EmployeeId, FullName: a.FullName }
    //       });
    //       this.allEmpList.unshift({ EmployeeId: 0, FullName: "--Select--" });

    //     }
    //     else {
    //       this.msgBoxServ.showMessage("failed", ["Unable to get transaction items."]);
    //       console.log(res.ErrorMessage);
    //     }
    //   });

    this.incentiveBLService.GetIncentiveApplicableDocterList()
      .map(res => res)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          let doclist: Array<any> = res.Results;
          this.allEmpList = doclist.map(a => {
            return { EmployeeId: a.EmployeeId, FullName: a.FullName }
          });
          this.allEmpList.unshift({ EmployeeId: 0, FullName: "--Select--" });

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to get transaction items."]);
          console.log(res.ErrorMessage);
        }
      });

  }
  public EmpIncentiveInfo: Array<any> = [];

  public GetEmpIncentiveInfo() {
    this.incentiveBLService.GetEmpIncentiveInfo()
      .map(res => res)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.EmpIncentiveInfo = res.Results;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to get Data."]);
          console.log(res.ErrorMessage);
        }
      });
  }

  gridExportOptions = {
    fileName: 'InvoiceItemLevelIncentive_' + moment().format('YYYY-MM-DD') + '.xls',
    displayColumns: ['TransactionDate', 'PatientName', 'ServiceDepartmentName', 'ItemName', 'InvoiceNo', 'ReferredByEmpName', 'AssignedToEmpName', 'TotalAmount', 'FractionCount']
  };

  public ExportAllIncentiveDate() {
    this.dlService.ReadExcel("/ReportingNew/ExportToExcel_INCTV_InvoiceItemLevel?FromDate="
      + this.fromDate + "&ToDate=" + this.toDate)
      .map(res => res)
      .subscribe(data => {
        let blob = data;
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "InvoiceItemLevelIncentive_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
        document.body.appendChild(a);
        a.click();
      },

        res => this.ErrorMsg(res));
  }
  ErrorMsg(err) {
    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }

  PatientInfoChanged() {
    if (this.patientObj && this.patientObj.ShortName) {
      this.searchText = this.patientObj.ShortName.trim();
    } else {
      this.searchText = '';
    }
  }


  OnItemSelected($event: any) {
    if ($event) {
      this.SelectedItem = $event;
      if (this.SelectedItem.ItemName) {
        this.itemName = this.SelectedItem.ItemName.trim();
      } else {
        this.itemName = '';
      }
    }
    else {
      this.SelectedItem = null;
      this.itemName = '';
    }
  }


  public SetFocusOn(idToSelect: string): void {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
    }
  }
  public GetPatientSearchMinCharacterCountParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Common' && a.ParameterName === 'PatientSearchMinCharacterCount');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.patientSearchMinCharacterCount = parseInt(obj.MinCharacterCount);
    }
  }
  GetItemsList() {
    this.incentiveBLService.GetMasterServiceItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ServiceItems = res.Results;
      } else {
        this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ['No items found']);
      }
    }, (error) => {
      console.log('Error retrieving items list:', error.message);
    });
  }
  ItemsListFormatter(data: any): string {
    let html: string = "";
    html = data["ItemName"].toUpperCase();
    html += "(<i>" + data["ServiceDepartmentName"] + "</i>)"; "</b>";
    return html;
  }
  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.incentiveBLService.GetPatientsWithVisitsInfo(keyword);
  }
  public PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }
}
