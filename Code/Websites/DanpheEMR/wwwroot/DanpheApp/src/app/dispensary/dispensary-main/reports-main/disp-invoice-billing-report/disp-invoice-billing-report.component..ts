import { ChangeDetectorRef, Component } from "@angular/core";
import * as moment from "moment";
import { Observable } from "rxjs";
import { PharmacyBLService } from "../../../../pharmacy/shared/pharmacy.bl.service";
import { PHRMPatient } from "../../../../pharmacy/shared/phrm-patient.model";
import PHRMReportsGridColumns from "../../../../pharmacy/shared/phrm-reports-grid-columns";
import { PHRMReportsModel } from "../../../../pharmacy/shared/phrm-reports-model";
import { PHRMStoreModel } from "../../../../pharmacy/shared/phrm-store.model";
import { BillingScheme_DTO } from "../../../../settings-new/billing/shared/dto/billing-scheme.dto";
import { SettingsBLService } from "../../../../settings-new/shared/settings.bl.service";
import { IGridFilterParameter } from "../../../../shared/danphe-grid/grid-filter-parameter.interface";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_ServiceBillingContext } from "../../../../shared/shared-enums";
import { DispensaryService } from "../../../shared/dispensary.service";


@Component({
    selector: 'disp-invoice-billing-report',
    templateUrl: "./disp-invoice-billing-report.component.html"
})
export class DispensaryInvoiceBillingReportComponent {
    PHRMBillingReportColumns: Array<any> = null;
    PHRMBillingReportData: Array<any> = new Array<any>();
    public InvoiceNumber: number = null;
    public phrmReports: PHRMReportsModel = new PHRMReportsModel();
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();

    public footerContent = '';
    public dateRange: string = "";

    dispensaryList: any[] = [];
    storeWiseBillingSummary: { StoreName: string, SubTotal: number, Discount: number, TotalAmount: number, CreditAmount: number }[] = [];
    public loading: boolean = false;
    SalesTypes = [
        { value: 'CashSales', label: 'Cash Sales' },
        { value: 'CashSalesReturn', label: 'Cash Sales Return' },
        { value: 'CreditSales', label: 'Credit Sales' },
        { value: 'CreditSalesReturn', label: 'Credit Sales Return' },
    ];

    VisitTypes = [
        { value: null, label: 'All' },
        { value: 'Inpatient', label: 'Inpatient' },
        { value: 'Outpatient', label: 'Outpatient' },
        { value: 'Emergency', label: 'Emergency' }
    ];
    SalesType: string = null;
    public currentActiveDispensary: PHRMStoreModel;
    PatientId: number = null;
    VisitType: string = null;
    TransactionType: string = null;
    SelectedSalesTypes: { value: string, label: string }[] = [];
    SearchedPatient: PHRMPatient = null;
    FilterParameters: IGridFilterParameter[] = [];
    PatientName: string = '';
    StoreName: string = null;
    public membershipList: Array<BillingScheme_DTO> = new Array<BillingScheme_DTO>();
    selMembershipId: number = null;
    SchemeName: string = null;
    constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService,
        public changeDetector: ChangeDetectorRef, public dispensaryService: DispensaryService, public settingsBLService: SettingsBLService) {
        this.PHRMBillingReportColumns = PHRMReportsGridColumns.PHRMBillingReport;
        this.InvoiceNumber = null;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("InvoiceDate"));
        this.getAllDispensaries();
        this.currentActiveDispensary = this.dispensaryService.activeDispensary;
        this.StoreName = this.currentActiveDispensary.Name;
        this.LoadPharmacySchemesList();
    }

    gridExportOptions = {
        fileName: 'BillingReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };

    getAllDispensaries() {
        this.dispensaryService.GetAllDispensaryList().subscribe(res => {
            if (res.Status == "OK") {
                this.dispensaryList = res.Results;
            }
            else {
                this.messageBoxService.showMessage("Failed", ["Failed to load the dispensaries."]);
            }
        });
    }

    GetReportData() {
        if (this.phrmReports.FromDate == null || this.phrmReports.ToDate == null) {
            this.messageBoxService.showMessage('Notice', ['Please select valid date.']);
            return;
        }
        if (!this.SelectedSalesTypes.length) {
            this.messageBoxService.showMessage('Notice', ['Please select sales type.']);
            return;
        }
        this.loading = true;
        this.TransactionType = this.SelectedSalesTypes.join(',')
        if (this.phrmReports.FromDate && this.phrmReports.ToDate) {
            this.FilterParameters = [
                { DisplayName: "DateRange:", Value: this.dateRange },
                { DisplayName: "Invoice No:", Value: this.InvoiceNumber == null ? 'All' : this.InvoiceNumber.toString() },
                { DisplayName: "Patient Name:", Value: this.PatientName == '' ? 'All' : this.PatientName },
                { DisplayName: "Visit Type:", Value: this.VisitType == null ? 'All' : this.VisitType },
                { DisplayName: "Transaction Type :", Value: this.TransactionType == null ? 'All' : this.TransactionType },
                { DisplayName: "Store :", Value: this.StoreName == null ? 'All' : this.StoreName },
                { DisplayName: "Scheme :", Value: this.SchemeName == null ? 'All' : this.SchemeName },
            ];
            this.PHRMBillingReportData = [];
            this.pharmacyBLService.GetPharmacyBillingReport(this.phrmReports, this.InvoiceNumber, this.PatientId, this.currentActiveDispensary.StoreId, this.VisitType, this.TransactionType, this.selMembershipId).finally(() => {
                this.loading = false;
            }).subscribe(res => {
                if (res.Status == 'OK') {
                    this.SearchedPatient = null;
                    this.PatientId = null;
                    this.PHRMBillingReportColumns = PHRMReportsGridColumns.PHRMBillingReport;
                    this.PHRMBillingReportData = res.Results;
                    this.CalculateSummaryData();
                    this.changeDetector.detectChanges();
                }
                if (res.Status == 'OK' && res.Results.length == 0) {
                    this.messageBoxService.showMessage("Notice-Message", ["No Data is Available for Selected Record"]);
                }
            });
        }
    }

    CalculateSummaryData() {
        this.storeWiseBillingSummary = [];
        let storeWiseSubtotalAmount = 0;
        let storeWiseTotalDiscount = 0;
        let storeWiseTotalAmount = 0;
        let storeWiseCreditAmount = 0;
        let grandSubTotal = 0;
        let grandTotalDiscount = 0;
        let grandTotalAmount = 0;
        let grandCreditAmount = 0;

        let selectedDispensary = this.dispensaryList.find(d => d.StoreId === this.currentActiveDispensary.StoreId);
        if (selectedDispensary) {
            let storeWiseReportData = this.PHRMBillingReportData.filter(a => a.StoreId == selectedDispensary.StoreId);
            storeWiseSubtotalAmount = storeWiseReportData.reduce((a, b) => a + b.SubTotal, 0);
            storeWiseTotalDiscount = storeWiseReportData.reduce((a, b) => a + b.DiscountAmount, 0);
            storeWiseTotalAmount = storeWiseReportData.reduce((a, b) => a + b.TotalAmount, 0);
            storeWiseCreditAmount = storeWiseReportData.reduce((a, b) => a + b.CreditAmount, 0);
            this.storeWiseBillingSummary.push(
                { StoreName: selectedDispensary.Name, SubTotal: storeWiseSubtotalAmount, Discount: storeWiseTotalDiscount, TotalAmount: storeWiseTotalAmount, CreditAmount: storeWiseCreditAmount }
            );
        }

        grandSubTotal = this.PHRMBillingReportData.reduce((a, b) => a + b.SubTotal, 0);
        grandTotalDiscount = this.PHRMBillingReportData.reduce((a, b) => a + b.DiscountAmount, 0);
        grandTotalAmount = this.PHRMBillingReportData.reduce((a, b) => a + b.TotalAmount, 0);
        grandCreditAmount = this.PHRMBillingReportData.reduce((a, b) => a + b.CreditAmount, 0);
        this.storeWiseBillingSummary.push(
            { StoreName: "All", SubTotal: grandSubTotal, Discount: grandTotalDiscount, TotalAmount: grandTotalAmount, CreditAmount: grandCreditAmount }
        );
    }


    ErrorMsg(err) {
        this.messageBoxService.showMessage("error", ["Sorry!!! Not able export the excel file."]);
        console.log(err.ErrorMessage);
    }

    OnFromToDateChange($event) {
        if ($event) {
            this.phrmReports.FromDate = $event.fromDate;
            this.phrmReports.ToDate = $event.toDate;
            this.dateRange = "<b>Date:</b>&nbsp;" + this.phrmReports.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.phrmReports.ToDate;
        }
    }

    OnSalesTypeSelected(event) {
        this.SelectedSalesTypes = [];
        event.forEach(a => {
            this.SelectedSalesTypes.push(a.value);
        });
    }
    public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
        return this.pharmacyBLService.GetPatients(keyword, false);
    }

    patientListFormatter(data: any): string {
        let html = `${data["ShortName"]} [ ${data['PatientCode']} ]`;
        return html;
    }

    OnPatientChanged() {
        if (this.SearchedPatient && this.SearchedPatient.PatientId) {
            this.PatientId = this.SearchedPatient.PatientId;
            this.PatientName = this.SearchedPatient.ShortName;
        }
        else {
            this.PatientId = null;
            this.PatientName = null;
        }
    }

    ngAfterViewChecked() {
        if (document.getElementById("print_summary") != null) {
            this.footerContent = document.getElementById("print_summary").innerHTML;
        }
    }
    public LoadPharmacySchemesList() {
        this.settingsBLService.GetBillingSchemesDtoList(ENUM_ServiceBillingContext.OpPharmacy)
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.membershipList = res.Results;
                    if (this.membershipList) {
                        this.membershipList.forEach(mem => {
                            mem.MembershipDisplayName = mem.SchemeName;
                        });
                    }
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Sorry!!! Not able export the excel file."]);
                }
            });
    }
    MembershipTypeChange() {
        if (this.selMembershipId && this.membershipList && this.membershipList.length > 0) {
            const selectedSchemeObj = this.membershipList.find(a => a.SchemeId === +this.selMembershipId);
            this.selMembershipId = selectedSchemeObj.SchemeId;
            this.SchemeName = selectedSchemeObj.SchemeName;
        }
    }
}



