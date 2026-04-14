import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { NepaliCalendarService } from '../../../shared/calendar/np/nepali-calendar.service';
import { NepaliMonth } from '../../../shared/calendar/np/nepali-dates';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { DLService } from '../../../shared/dl.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ReportingService } from '../../shared/reporting-service';
// import { NepaliDatePipe } from '../../../shared/pipes/nepali-date.pipe';

@Component({
    selector: 'app-copayment-report',
    templateUrl: './copayment-report.component.html',
    styleUrls: ['./copayment-report.component.css']
})
export class CopaymentReportComponent implements OnInit {
    FromDate: string = null;
    ToDate: string = null;
    DateRange: string = '';
    Loading: boolean = false;
    CopaymentReportColumns: Array<any> = [];
    CoPaymentReportData: CopaymentReportData_DTO[] = [];
    public selectedDate: string = "";
    public fiscalYearId: number = null;
    public validDate: boolean = true;
    public todaysDate: string = null;
    public HospitalName: string = '';
    public HospitalAddress: string = '';
    public NepaliserviceType: { IPDService: string, LaboratoryService: string, OPDService: string, Others, Pharmacy: string, RadiologyService: string };
    public printDetails: string = "";
    public showPrint: boolean = false;
    // public nepDate: NepaliDatePipe;
    selectedMonth: string = '';
    selectedYear: string = '';
    showReport: boolean = false;
    public headerProperties: any;
    public headerDetail: any = null;
    public nepMonths: Array<NepaliMonth> = [];
    public SumPatientCount: number = 0;
    public sumCoPaymentCash: number = 0;
    public sumCoPaymentCredit: number = 0;


    constructor(public securityService: SecurityService,
        public reportServ: ReportingService,
        public dlService: DLService,
        public messageBoxService: MessageboxService,
        public coreService: CoreService,
        public nepaliCalender: NepaliCalendarService) {
        this.getParamter();
        this.nepMonths = NepaliMonth.GetNepaliMonths();

    }

    ngOnInit() {

    }
    getParamter() {
        let parameterData = this.coreService.Parameters.find(p => p.ParameterGroupName == "Common" && p.ParameterName == "CustomerHeader").ParameterValue;
        var data = JSON.parse(parameterData);
        if (data)
            this.HospitalName = data["hospitalName"];
        this.HospitalAddress = data["address"];
        let HeaderParms = this.coreService.Parameters.find(a => a.ParameterGroupName == "Common" && a.ParameterName == "CustomerHeader");
        if (HeaderParms) {
            this.headerDetail = JSON.parse(HeaderParms.ParameterValue);
            let header = this.coreService.Parameters.find(a => a.ParameterGroupName == 'BillingReport' && a.ParameterName == 'TableExportSetting');
            if (header) {
                this.headerProperties = JSON.parse(header.ParameterValue)["CopaymentReport"];
            }
        }
    }
    onDateSelect(event) {
        if (event) {
            this.selectedDate = "";
            this.FromDate = moment(event.fromDate).format('YYYY-MM-DD');
            this.ToDate = moment(event.toDate).format("YYYY-MM-DD");
            this.fiscalYearId = event.fiscalYearId;
            this.validDate = true;
            let npDate = this.nepaliCalender.ConvertEngToNepDate(this.FromDate);
            let yearString = npDate.Year.toString();
            let mthString = npDate.Month < 10 ? "0" + npDate.Month : npDate.Month.toString();
            let nepMonth = this.nepMonths.find(np => np.monthNumber === parseInt(mthString, 10));
            if (nepMonth) {
                this.selectedMonth = nepMonth.monthName;
            }
            this.selectedYear = yearString;
        }
        else {
            this.validDate = false;
            this.FromDate = null;
            this.todaysDate = null;
            this.fiscalYearId = 0;
        }
    }
    // public OnFromToDateChange(event: any) {
    //   if (event) {
    //     this.FromDate = event.fromDate;
    //     this.ToDate = event.toDate;
    //     this.DateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
    //   }
    // }

    LoadReport() {
        this.Loading = true;
        this.dlService.Read(`/BillingReports/CoPaymentReport?FromDate=${this.FromDate}&ToDate=${this.ToDate}`)
            .map(res => res)
            .finally(() => { this.Loading = false; })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.CoPaymentReportData = res.Results;
                    let services = ['IPD Service', 'Laboratory Service', 'OPD Service', 'Others', 'Pharmacy', 'Radiology Service', 'Emmergency Service'];
                    if (this.CoPaymentReportData && this.CoPaymentReportData.length) {
                        services.forEach(service => {
                            if (!this.CoPaymentReportData.some(s => s.ServiceType === service)) {
                                let tempService = new CopaymentReportData_DTO();
                                tempService.ServiceType = service;
                                tempService.CoPaymentCashAmount = 0;
                                tempService.CoPaymentCreditAmount = 0;
                                tempService.PatientCount = 0;
                                this.CoPaymentReportData.push(tempService);
                            } else {
                                let existingService = this.CoPaymentReportData.find(s => s.ServiceType === service);
                                if (existingService.PatientCount === null) {
                                    existingService.PatientCount = 0;
                                }
                                if (existingService.CoPaymentCashAmount === null) {
                                    existingService.CoPaymentCashAmount = 0;
                                }
                                if (existingService.CoPaymentCreditAmount === null) {
                                    existingService.CoPaymentCreditAmount = 0;
                                }
                            }
                            this.sumCoPaymentCash = this.CoPaymentReportData.reduce((sum, item) => sum + item.CoPaymentCashAmount, 0);
                            this.sumCoPaymentCredit = this.CoPaymentReportData.reduce((sum, item) => sum + item.CoPaymentCreditAmount, 0);
                            this.SumPatientCount = this.CoPaymentReportData.reduce((sum, item) => sum + item.PatientCount, 0);
                        });
                    }

                    this.showReport = true;
                    this.CoPaymentReportData.forEach((a, i) => {
                        a.SN = i + 1;

                    })
                    this.CoPaymentReportData = this.CoPaymentReportData.slice();
                    this.mapServiceTypeToNepali();
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get payment report']);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get payment report. See console for details']);
                    console.log(err);
                }
            )
    }
    mapServiceTypeToNepali() {
        this.CoPaymentReportData.forEach(row => {
            if (row.ServiceType === 'IPD Service') {
                row.ServiceType = 'आई.पी.डी सेवा';
            } else if (row.ServiceType === 'Laboratory Service') {
                row.ServiceType = 'प्रयोगशाला सेवा';
            } else if (row.ServiceType === 'OPD Service') {
                row.ServiceType = 'ओ.पि.डि सेवा';
            } else if (row.ServiceType === 'Others') {
                row.ServiceType = 'अन्य';
            } else if (row.ServiceType === 'Pharmacy') {
                row.ServiceType = 'फार्मेसी सेवा';
            } else if (row.ServiceType === 'Radiology Service') {
                row.ServiceType = 'इमेजिङ सेवा';
            }
            else if (row.ServiceType === 'Emmergency Service') {
                row.ServiceType = 'इमेर्जेनसी सेवा';
            }
        });
    }

    PrintReport() {
        if (this.showReport) {


            const printContent = document.getElementById("CopaymentReport");

            if (printContent) {
                this.printDetails += `<style>
      .container {
        background: white;
        margin: 20px;
      }
      
      .header-text {
        text-align: center !important;
        margin-top: 40px !important;
        font-weight: bold;
        font-size: 16px;
      }
      
      .page-body {
        margin-top: 20px;
      }
      
      .report-data {
        border: 1px solid black;
        border-collapse: collapse;
        width: 98%;
        margin-left: 30px !important;
        margin-top: 20px !important;
      }
      
      .report-data th,
      .report-data td {
        border: 1px solid black;
        text-align: center;
        height: 30px;
      }
      
      .signature {
        margin-left: 30px !important;
        margin-top: 20px !important;  }
      
      .table-cell {
        height: 30px;
      }
      .no-space{
        height: 80px;;
      }
      .no-spaces{
        height: 50px;;
      }
      .sign{
        // margin-top:40px !important;
      }
      </style>`
                this.printDetails += printContent.innerHTML;
                this.showPrint = true;
            } else {
                console.error('Element with id "CopaymentReport" not found.');
            }
        } else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Report to Print']);
        }
    }
    callBackPrint() {
        this.printDetails = '';
        this.showPrint = false;
    }
    ExportReport(tableId) {
        if (!this.showReport) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Report to Export']);
        } else {
            if (tableId) {
                let workSheetName = 'Copayment Report';
                let filename = 'CopaymentReport';

                var Heading;
                var phoneNumber
                var hospitalName;
                var address;
                if (this.headerProperties.HeaderTitle != null) {
                    Heading = this.headerProperties.HeaderTitle;
                } else {
                    Heading = 'COPAYMENT REPORT';
                }
                if (this.headerProperties.ShowHeader == true) {
                    hospitalName = this.headerDetail.hospitalName;
                    address = this.headerDetail.address;
                } else {
                    hospitalName = null;
                    address = null;
                }
                if (this.headerProperties.ShowPhone == true) {
                    phoneNumber = this.headerDetail.tel;
                } else {
                    phoneNumber = null;
                }

                CommonFunctions.ConvertHTMLTableToExcelForBilling(tableId, this.FromDate, this.ToDate, workSheetName,
                    Heading, filename, hospitalName, address, phoneNumber, this.headerProperties.ShowHeader, this.headerProperties.ShowDateRange);
            }
        }

    }
    gridExportOptions = {
        fileName: 'Copayment Report' + moment().format('YYYY-MM-DD') + '.xls'
    };

}

class CopaymentReportData_DTO {
    SN: number;
    ServiceType: string;
    PatientCount: number;
    CoPaymentCashAmount: number;
    CoPaymentCreditAmount: number;
}
