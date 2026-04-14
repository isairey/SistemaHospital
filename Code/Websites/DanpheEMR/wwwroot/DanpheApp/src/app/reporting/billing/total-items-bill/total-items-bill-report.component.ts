import { Component, Input } from '@angular/core';
import * as moment from 'moment/moment';
import { VisitBLService } from '../../../appointments/shared/visit.bl.service';
import { VisitService } from '../../../appointments/shared/visit.service';
import { BillingBLService } from '../../../billing/shared/billing.bl.service';
import { ServiceItemsDetailsForReport_DTO } from '../../../billing/shared/dto/bill-report-service-items-details.dto';
import { CoreService } from "../../../core/shared/core.service";
import { ReportingService } from "../../../reporting/shared/reporting-service";
import { SecurityService } from '../../../security/shared/security.service';
import { User } from '../../../security/shared/user.model';
import { BillingScheme_DTO } from '../../../settings-new/billing/shared/dto/billing-scheme.dto';
import { Department } from '../../../settings-new/shared/department.model';
import { ServiceDepartment } from '../../../settings-new/shared/service-department.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { AdvanceFilterType_DTO } from '../../shared/dto/advance-filter-type.dto';
import { RPT_BIL_TotalItemsBillModel } from "./total-items-bill-report.model";

@Component({
  templateUrl: "./total-items-bill-report.html"
})
export class RPT_BIL_TotalItemsBillComponent {
  public dlService: DLService = null;
  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = "";
  public billstatus: string = "";
  public ServiceDepartment: any = "";
  public SelectedDepartment: any = "";
  public itemname: any;
  public SelectedItem: any;
  public TotalItemsBillReportColumns: Array<any> = null;
  public TotalItemsBillReporttData: Array<any> = new Array<RPT_BIL_TotalItemsBillModel>();
  public CurrentTotalItem: RPT_BIL_TotalItemsBillModel = new RPT_BIL_TotalItemsBillModel();
  public Departments = new Array<Department>();
  public BillItemList: any;

  public selBillingTypeName: string = null;
  public IsInsuranceBilling: boolean = false;
  public TotalItemsBillReportAdvanceFilterType = new AdvanceFilterType_DTO();
  public loading: boolean = false;//sud:22Sep'21--to handle multiple clicks on show report button.

  public summary_new = {
    Cash: new BillSummaryFields(),
    CashReturn: new BillSummaryFields(),
    Credit: new BillSummaryFields(),
    CreditReturn: new BillSummaryFields(),
    GrossSales: 0,
    TotalDiscount: 0,
    TotalSalesReturn: 0,
    TotalReturnDiscount: 0,
    NetSales: 0,
    TotalSalesQty: 0,
    TotalReturnSalesQty: 0,
    NetQuantity: 0
  }

  public filteredDocList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;
  public selectedDoctor = { DepartmentId: 0, DepartmentName: "", PerformerId: null, PerformerName: "", ItemName: "", Price: 0, IsTaxApplicable: false, DepartmentLevelAppointment: false };
  public selectedPrescriber = { DepartmentId: 0, DepartmentName: "", PerformerId: null, PerformerName: "", ItemName: "", Price: 0, IsTaxApplicable: false, DepartmentLevelAppointment: false };
  public selectedPerformer = { DepartmentId: 0, DepartmentName: "", PerformerId: null, PerformerName: "", ItemName: "", Price: 0, IsTaxApplicable: false, DepartmentLevelAppointment: false };
  public doctorList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }> = [];
  public selectedDepartment = { DepartmentId: 0, DepartmentName: "" };
  public ServiceDepartments: ServiceDepartment[] = [];

  @Input("selected-scheme-priceCategory")
  selectedSchemePriceCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  @Input("disable-selection")
  disableSelection: boolean = false;
  public ServiceBillingContext: string = "";
  public ServiceItems = new Array<ServiceItemsDetailsForReport_DTO>();

  public SchemeList = new Array<BillingScheme_DTO>();
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();//sud:7June'20

  public footerContent = '';//sud:24Aug'21--For Summary.
  public AdvanceFilterPopup: boolean = false;
  public UserList: Array<User> = [];
  public selectedUser: User = null;
  public userList: Array<User> = new Array<User>();
  public CurrentUser = '';
  public EnableEnglishCalendarOnly: boolean = false;
  constructor(
    _dlService: DLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public billingBlService: BillingBLService,
    public visitService: VisitService,
    public visitBLService: VisitBLService,
    public reportServ: ReportingService) {
    this.dlService = _dlService;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('TransactionDate', false));
    this.LoadDepartments();
    //this.GetVisitDoctors();
    this.getDocts();
    this.GetServiceDepartments();
    this.GetItemsList();
    // this.LoadAllBillingItems();
    this.LoadAllUsersList();
    this.TotalItemsBillReportColumns = this.reportServ.reportGridCols.TotalItemsBillReport;
    this.SchemeList = this.coreService.SchemeList;

  }

  GetCalendarParameter(): void {
    const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "EnableEnglishCalendarOnly");
    if (param && param.ParameterValue) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.EnableEnglishCalendarOnly = paramValue;
    }
  }
  ngOnInit() {
    // this.getDocts();
    this.ItemListFormatter = this.ItemListFormatter.bind(this);//to use global variable in list formatter auto-complete

  }

  ngAfterViewChecked() {
    this.footerContent = document.getElementById("dvSummary_TotalItemBills").innerHTML;
  }

  gridExportOptions = {
    fileName: 'TotalItemBillList_' + moment().format('YYYY-MM-DD') + '.xls',
  };

  Load() {
    this.loading = true;//disable button until response comes back from api.
    this.TotalItemsBillReporttData = [];//empty the grid data after button is clicked..

    //* formatting itemName (Here some itemName contains special characters like '+').
    let formattedItemName = this.FormatItemName(this.CurrentTotalItem.itemname);
    this.dlService.Read("/BillingReports/TotalItemsBillAdvanceFilter?FromDate=" + this.fromDate + "&ToDate=" + this.toDate
      + "&billingType=" + this.selBillingTypeName)
      .map(res => res)
      .finally(() => { this.loading = false })//re-enable button after response comes back.
      .subscribe(res => this.Success(res),
        res => this.Error(res));
  }
  LoadAllUsersList() {
    this.dlService.GetUserList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.userList = res.Results;
          CommonFunctions.SortArrayOfObjects(this.userList, "EmployeeName");
          this.CurrentUser = this.securityService.loggedInUser.Employee.FullName;

        }
      });
  }
  UserListFormatter(data: any): string {
    return data["EmployeeName"];
  }

  TotalItemsBillReportAdvanceFilter() {
    this.loading = true; // disable button until response comes back from api.
    this.TotalItemsBillReporttData = []; // empty the grid data after button is clicked.
    this.dlService.TotalItemsBillReportAdvanceFilter(this.TotalItemsBillReportAdvanceFilterType.SchemeId, this.TotalItemsBillReportAdvanceFilterType.BillingType, this.TotalItemsBillReportAdvanceFilterType.VisitType, this.TotalItemsBillReportAdvanceFilterType.PerformerId, this.TotalItemsBillReportAdvanceFilterType.DepartmentId, this.TotalItemsBillReportAdvanceFilterType.ServiceDepartmentId, this.TotalItemsBillReportAdvanceFilterType.ServiceItemId, this.TotalItemsBillReportAdvanceFilterType.PrescriberId, this.TotalItemsBillReportAdvanceFilterType.EmployeeId, this.fromDate, this.toDate
    ).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.TotalItemsBillReporttData = res.Results;
          this.AdvanceFilterPopup = false;
          this.Success(res);
          this.CloseAdvanceSearch();
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Reports Found  by searched parameters"]);
        }
        this.TotalItemsBillReportAdvanceFilterType = new AdvanceFilterType_DTO();
        this.loading = false; // enable the button after the response is processed
      },
    );
  }

  Success(res) {
    if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length > 0) {

      this.TotalItemsBillReporttData = res.Results;
      this.CalculateSummaryofDifferentColoumnForSum();
      this.footerContent = document.getElementById("dvSummary_TotalItemBills").innerHTML;
    }
    else if (res.Status == "OK" && res.Results.length == 0)
      this.msgBoxServ.showMessage("notice-message", ['Data is Not Available Between Selected Parameters...Try Different']);
    else
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
  }
  Error(err) {
    this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
  }
  OnGridExport($event: GridEmitModel) {
    let jsonStrSummary = JSON.stringify(this.summary_new);//this.summary
    let summaryHeader = "Total Items Bill Report Summary";
    this.dlService.ReadExcel("/ReportingNew/ExportToExcelTotalItemsBill?FromDate="
      + this.fromDate + "&ToDate=" + this.toDate
      + "&BillStatus=" + this.CurrentTotalItem.billstatus + "&ServiceDepartmentName=" + this.CurrentTotalItem.servicedepartment +
      "&ItemName=" + this.CurrentTotalItem.itemname + "&SummaryData=" + jsonStrSummary + "&SummaryHeader=" + summaryHeader)
      .map(res => res)
      .subscribe(data => {
        let blob = data;
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "TotalItemsBill_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
        document.body.appendChild(a);
        a.click();
      },
        res => this.ErrorMsg(res));
  }
  ErrorMsg(err) {
    this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }

  FormatItemName(itemName: string): string {
    if (itemName) {
      let formattedItemName = itemName.split('+').join('^');
      return formattedItemName;
    } else {
      return "";
    }
  }

  CalculateSummaryofDifferentColoumnForSum() {
    this.summary_new.Cash = new BillSummaryFields();
    this.summary_new.CashReturn = new BillSummaryFields();
    this.summary_new.Credit = new BillSummaryFields();
    this.summary_new.CreditReturn = new BillSummaryFields();

    this.summary_new.GrossSales = this.summary_new.TotalDiscount = this.summary_new.TotalSalesReturn = this.summary_new.TotalReturnDiscount =
      this.summary_new.NetSales = this.summary_new.TotalSalesQty = this.summary_new.TotalReturnSalesQty = this.summary_new.NetQuantity = 0;


    if (this.TotalItemsBillReporttData && this.TotalItemsBillReporttData.length > 0) {

      this.TotalItemsBillReporttData.forEach(itm => {
        switch (itm.BillingType) {
          case "CashSales": {
            this.summary_new.Cash.TotalQty += itm.Quantity;
            this.summary_new.Cash.SubTotal += itm.SubTotal;
            this.summary_new.Cash.Discount += itm.DiscountAmount;
            this.summary_new.Cash.TotalAmount += itm.TotalAmount;
            break;
          }
          case "ReturnCashSales": {
            this.summary_new.CashReturn.TotalQty += itm.Quantity;
            this.summary_new.CashReturn.SubTotal += itm.SubTotal;
            this.summary_new.CashReturn.Discount += itm.DiscountAmount;
            this.summary_new.CashReturn.TotalAmount += itm.TotalAmount;
            break;
          }
          case "CreditSales": {
            this.summary_new.Credit.TotalQty += itm.Quantity;
            this.summary_new.Credit.SubTotal += itm.SubTotal;
            this.summary_new.Credit.Discount += itm.DiscountAmount;
            this.summary_new.Credit.TotalAmount += itm.TotalAmount;
            break;
          }
          case "ReturnCreditSales": {
            this.summary_new.CreditReturn.TotalQty += itm.Quantity;
            this.summary_new.CreditReturn.SubTotal += itm.SubTotal;
            this.summary_new.CreditReturn.Discount += itm.DiscountAmount;
            this.summary_new.CreditReturn.TotalAmount += itm.TotalAmount;
            break;
          }
          default:
            break;
        }
      });

      this.summary_new.GrossSales = this.summary_new.Cash.SubTotal + this.summary_new.Credit.SubTotal;
      this.summary_new.TotalDiscount = this.summary_new.Cash.Discount + this.summary_new.Credit.Discount;

      //! Bikesh: Adjusted 'CashReturn' and 'CreditReturn' to account for 'TotalSalesReturn' being negative.
      // Since 'CashReturn' and 'CreditReturn' is negative in the calculation, we need to handle it as a positive value in the formula to ensure the correct final result.
      this.summary_new.CashReturn.SubTotal = - this.summary_new.CashReturn.SubTotal;
      this.summary_new.CreditReturn.SubTotal = - this.summary_new.CreditReturn.SubTotal;
      this.summary_new.TotalSalesReturn = this.summary_new.CashReturn.SubTotal + this.summary_new.CreditReturn.SubTotal;
      this.summary_new.TotalReturnDiscount = this.summary_new.CashReturn.Discount + this.summary_new.CreditReturn.Discount;
      this.summary_new.TotalSalesQty = this.summary_new.Cash.TotalQty + this.summary_new.Credit.TotalQty;
      this.summary_new.TotalReturnSalesQty = this.summary_new.CashReturn.TotalQty + this.summary_new.CreditReturn.TotalQty;
      this.summary_new.NetQuantity = this.summary_new.TotalSalesQty - this.summary_new.TotalReturnSalesQty;
      this.summary_new.NetSales = this.summary_new.GrossSales - this.summary_new.TotalDiscount - this.summary_new.TotalSalesReturn + this.summary_new.TotalReturnDiscount;
    }

  }

  LoadDepartments() {
    this.dlService.Read("/BillingReports/GetDepartmentList")
      .map(res => res).subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.Departments = res.Results;
        }
      });
  }

  ServiceDepartmentListFormatter(data: any): string {
    let html = data["ServiceDepartmentName"];
    return html;
  }

  ItemListFormatter(data: any): string {
    let html = data["ItemName"];
    return html;
  }

  departmentChanged() {
    this.CurrentTotalItem.servicedepartment = this.ServiceDepartment ? this.ServiceDepartment.ServiceDepartmentName : "";
  }

  ItemNameChanged() {
    this.CurrentTotalItem.itemname = this.itemname.ItemName;
  }

  //sud:6June'20--reusable From-ToDate
  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
  }

  public LoadAllBillingItems() {

    this.billingBlService.GetBillItemList()
      .subscribe((res) => {
        if (res.Status == "OK") {
          this.BillItemList = res.Results;
        }
      });
  }

  AdvanceSearch() {
    this.AdvanceFilterPopup = true;
  }
  OnCheckboxChange($event) {
    if (this.IsInsuranceBilling === true) {
      this.selBillingTypeName = "Insurance";
    }
    else {
      this.selBillingTypeName = null;
    }
  }
  CloseAdvanceSearch() {
    this.AdvanceFilterPopup = false;
    // Reinitialize the values to the default state
    this.TotalItemsBillReportAdvanceFilterType = new AdvanceFilterType_DTO();
    this.selectedDepartment = null;
    this.ServiceDepartment = null;
    this.selectedDoctor = null;
    this.selectedPerformer = null;
    this.SelectedItem = null;
    this.selectedUser = null;
    this.selectedPrescriber = null;
    this.selectedSchemePriceCategory = null;
  }

  DepartmentListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }
  DocListFormatter(data: any): string {
    let html = data["PerformerName"];
    return html;
  }
  ItemsListFormatter(data: any): string {
    let html: string = "";
    html = data["ItemName"].toUpperCase();
    html += "(<i>" + data["ServiceDepartmentName"] + "</i>)"; "</b>";
    return html;
  }
  getDocts() {
    this.dlService.GetVisitDoctors()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.filteredDocList = res.Results;
        }
      });
  }

  // GetVisitDoctors() {
  //     this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
  // }
  GetServiceDepartments(): void {
    this.dlService.Read("/BillingReports/GetServiceDeptList")
      .map(res => res).subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.ServiceDepartments = res.Results;
        }
      });
  }
  public AssignSelectedPrescriber(selectedPrescriber: any) {
    if (selectedPrescriber)
      this.TotalItemsBillReportAdvanceFilterType.PrescriberId = selectedPrescriber.PerformerId;

  }
  public AssignSelectedDepartment(selectedDepartment: any): void {
    if (selectedDepartment) {
      this.TotalItemsBillReportAdvanceFilterType.DepartmentId = selectedDepartment.DepartmentId;
    }
  }
  public AssignSelectedServiceDepartment(selectedServiceDepartment: any) {
    if (selectedServiceDepartment) {
      this.TotalItemsBillReportAdvanceFilterType.ServiceDepartmentId = selectedServiceDepartment.ServiceDepartmentId;
    }
  }
  AssignSelectedItem(selectedItem: any): void {
    if (selectedItem) {
      this.TotalItemsBillReportAdvanceFilterType.ServiceItemId = selectedItem.ServiceItemId;
    }
  }
  AssignSelectedPerformer(selectedPerformer: any) {
    if (selectedPerformer)
      this.TotalItemsBillReportAdvanceFilterType.PerformerId = selectedPerformer.PerformerId;
  }
  AssignScheme(selectedSchemePriceCategory: any) {
    if (selectedSchemePriceCategory) {
      const scheme = this.SchemeList.find(s => s.SchemeName === selectedSchemePriceCategory);
      if (scheme) {
        this.TotalItemsBillReportAdvanceFilterType.SchemeId = scheme.SchemeId;
      }
    }
  }
  AssignUser(selectedUser: any) {
    if (selectedUser)
      this.TotalItemsBillReportAdvanceFilterType.EmployeeId = selectedUser.EmployeeId;
  }
  GetItemsList() {
    this.billingBlService.GetMasterServiceItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ServiceItems = res.Results;
      } else {
        this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ['No items found']);
      }
    }, (error) => {
      console.log('Error retrieving items list:', error.message);
    });
  }


}

//for internal use (inside this report) only.
//sud:10Aug'20
export class BillSummaryFields {
  TotalQty: number = 0;
  SubTotal: number = 0;
  Discount: number = 0;
  TotalAmount: number = 0;
}
