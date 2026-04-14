import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyBLService } from '../../shared/pharmacy.bl.service';
import PHRMReportsGridColumns from '../../shared/phrm-reports-grid-columns';

@Component({
  selector: 'provisional-sales-report',
  templateUrl: './provisional-sales-report.component.html',
  styleUrls: ['./provisional-sales-report.component.css']
})
export class ProvisionalSalesReportComponent implements OnInit {

  ProvisionalSalesReportData: ProvisionalSalesReportData[] = [];
  ProvisionalSalesDetailReportData: ProvisionalSalesDetailReportData[] = [];
  ProvisionalSalesReportColumns: any[] = [];
  ProvisionalSalesDetailReportColumns: any[] = [];
  Loading: boolean;
  PatientId: number = null;
  VisitType: string = '';
  Patients: PatientInfo[] = [];
  SelectedPatient: PatientInfo = new PatientInfo();
  PatientDetail: PatientInfo = new PatientInfo();

  VisitTypes: { Value: string, Label: string }[] = [
    { Value: '', Label: 'All' },
    { Value: 'inpatient', Label: 'inpatient' },
    { Value: 'outpatient', Label: 'outpatient' },
    { Value: 'emergency', Label: 'emergency' }
  ];
  ShowSalesDetailReport: boolean = false;
  SummaryData: SummaryAmountInfo = new SummaryAmountInfo();
  SalesDetailSummaryData: SummaryAmountInfo = new SummaryAmountInfo();
  FooterContent: string;
  FooterContentForDetailReport: string;
  SalesReportFilterParameters: IGridFilterParameter[] = [];
  SalesDetailReportFilterParameters: IGridFilterParameter[] = [];
  PatientName: string = '';



  constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService) {
    this.ProvisionalSalesReportColumns = PHRMReportsGridColumns.PharmacyProvisionalSalesReportColumns;
    this.ProvisionalSalesDetailReportColumns = PHRMReportsGridColumns.PharmacyProvisionalSalesDetailReportColumns;
    this.GetPatientsWithProvisional();
  }
  PatientListFormatter(data: PatientInfo): string {
    return data["PatientCode"] + "|" + data["PatientName"];
  }
  gridExportOptions = {
    fileName: 'Dispensary Provisional Sales Report' + moment().format('YYYY-MM-DD') + '.xls',
  };

  gridExportOptionsForSalesDetailReport = {
    fileName: 'Dispensary Provisional Sales Detail Report' + moment().format('YYYY-MM-DD') + '.xls',
  };

  ngOnInit() {
  }

  OnPatientSelect() {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.PatientId = this.SelectedPatient.PatientId;
      this.PatientName = this.SelectedPatient.PatientName;
    }
    else {
      this.PatientId = null;
      this.PatientName = '';
    }
  }

  GetProvisionalSalesReport() {
    this.Loading = true;
    this.SummaryData = new SummaryAmountInfo();
    this.SalesReportFilterParameters = [
      { DisplayName: "Patient Name:", Value: this.PatientName == '' ? 'All' : this.PatientName },
      { DisplayName: "Visit Type:", Value: this.VisitType == '' ? 'All' : this.VisitType }
    ];
    this.pharmacyBLService.GetProvisionalSalesReport(this.PatientId, this.VisitType, null)
      .finally(() => {
        this.Loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ProvisionalSalesReportData = res.Results;
          if (this.ProvisionalSalesReportData && this.ProvisionalSalesReportData.length) {
            this.SummaryData.SubTotal = this.ProvisionalSalesReportData.reduce((a, b) => a + b.SubTotal, 0);
            this.SummaryData.DiscountAmount = this.ProvisionalSalesReportData.reduce((a, b) => a + b.DiscountAmount, 0);
            this.SummaryData.VATAmount = this.ProvisionalSalesReportData.reduce((a, b) => a + b.VATAmount, 0);
            this.SummaryData.TotalAmount = this.ProvisionalSalesReportData.reduce((a, b) => a + b.TotalAmount, 0);
          }
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get data. <br>' + res.ErrorMessage]);
        }
      },
        err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get data. <br>' + err.error]);
          console.log(err);
        });
  }

  GetProvisionalSalesDetailReport(ProvisionalInfo: any) {
    this.Loading = true;
    this.SalesDetailSummaryData = new SummaryAmountInfo();
    this.SalesDetailReportFilterParameters = [
      { DisplayName: "Patient Name:", Value: ProvisionalInfo.ShortName == '' ? 'All' : ProvisionalInfo.ShortName },
      { DisplayName: "Contact No:", Value: ProvisionalInfo.PhoneNumber == '' ? '-' : ProvisionalInfo.PhoneNumber },
      { DisplayName: "Scheme:", Value: ProvisionalInfo.SchemeName == '' ? 'All' : ProvisionalInfo.SchemeName },
      { DisplayName: "Visit Type:", Value: ProvisionalInfo.VisitType == '' ? 'All' : ProvisionalInfo.VisitType }
    ];
    this.pharmacyBLService.GetProvisionalSalesDetailReport(ProvisionalInfo.PatientId, ProvisionalInfo.VisitType, ProvisionalInfo.SchemeId, ProvisionalInfo.StoreId)
      .finally(() => {
        this.Loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ProvisionalSalesDetailReportData = res.Results;
          this.ProvisionalSalesDetailReportData.forEach((a, i) => {
            a.SN = i + 1;
          });
          if (this.ProvisionalSalesDetailReportData && this.ProvisionalSalesDetailReportData.length) {
            this.SalesDetailSummaryData.SubTotal = this.ProvisionalSalesDetailReportData.reduce((a, b) => a + b.SubTotal, 0);
            this.SalesDetailSummaryData.DiscountAmount = this.ProvisionalSalesDetailReportData.reduce((a, b) => a + b.DiscountAmount, 0);
            this.SalesDetailSummaryData.VATAmount = this.ProvisionalSalesDetailReportData.reduce((a, b) => a + b.VATAmount, 0);
            this.SalesDetailSummaryData.TotalAmount = this.ProvisionalSalesDetailReportData.reduce((a, b) => a + b.TotalAmount, 0);
          }
          this.ShowSalesDetailReport = true;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get data. <br>' + res.ErrorMessage])
        }
      },
        err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get data. <br>' + err.error]);
          console.log(err);
        });
  }
  GetPatientsWithProvisional() {
    this.pharmacyBLService.GetPatientsWithProvisional()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.Patients = res.Results;
        }
        else {
          console.log(res.ErrorMessage);
        }
      },
        err => {
          console.log(err);
        });
  }

  ProvisionalSalesReportGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "detail": {
        let provisionalInfo = $event.Data;
        this.PatientDetail = provisionalInfo;
        this.PatientDetail.PatientName = $event.Data.ShortName;
        this.GetProvisionalSalesDetailReport(provisionalInfo)
      }
    }
  }
  Close() {
    this.ShowSalesDetailReport = false;
  }

  ngAfterViewChecked() {
    if (document.getElementById("provisional_sales_report_print_summary") != null) {
      this.FooterContent = document.getElementById("provisional_sales_report_print_summary").innerHTML;
    }
    if (document.getElementById("provisional_sales_detail_report_print_summary") != null) {
      this.FooterContentForDetailReport = document.getElementById("provisional_sales_detail_report_print_summary").innerHTML;
    }
  }
}




class ProvisionalSalesReportData {
  PatientId: number = null;
  ShortName: string = '';
  PatientCode: string = '';
  PhoneNumber: string = '';
  SchemeName: string = '';
  PatientVisitId: number = null;
  VisitType: string = '';
  PolicyNo: number = 0;
  SubTotal: number = 0;
  DiscountAmount: number = 0;
  VATAmount: number = 0;
  TotalAmount: number = 0;
  ToDate: string = null;
  FromDate: string = null;
  SchemeId: number = 0;
  StoreName: string = '';
}

class ProvisionalSalesDetailReportData {
  PatientId: number = null;
  ShortName: string = '';
  PatientCode: string = '';
  PhoneNumber: string = '';
  SchemeName: string = '';
  PatientVisitId: number = null;
  VisitType: string = '';
  PolicyNo: number = null;
  ReceiptNo: number = null;
  TransactionType: string = '';
  TransactionDate: string = null;
  ItemName: string = '';
  BatchNo: string = '';
  ExpiryDate: string = '';
  SalePrice: number = 0;
  Quantity: number = 0;
  SubTotal: number = 0;
  DiscountAmount: number = 0;
  VATAmount: number = 0;
  TotalAmount: number = 0;
  SchemeId: number = 0;
  SN: number = 0;

}

class PatientInfo {
  PatientId: number = null;
  PatientCode: string = null;
  PatientName: string = '';
  SchemeName: string = '';
  VisitType: string = '';
  PhoneNumber: string = '';
}

class SummaryAmountInfo {
  SubTotal: number = 0;
  DiscountAmount: number = 0;
  VATAmount: number = 0;
  TotalAmount: number = 0;
}