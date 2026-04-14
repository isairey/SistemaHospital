import { Component, Input } from "@angular/core";
import { BillingService } from "../../billing/shared/billing.service";
import { CoreService } from "../../core/shared/core.service";
import { INSClaimBillingInvoiceReceipt_DTO } from "../../insurance/nep-gov/shared/ins-claim-invoice-receipt.dto";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { CommonFunctions } from "../../shared/common.functions";
import { ENUM_Country, ENUM_VisitType } from "../../shared/shared-enums";


@Component({
    templateUrl: 'ins-claim-billing-invoice-view.component.html',
    selector: 'ins-claim-billing-invoice-view',
})
export class INSClaimBillingInvoiceViewComponent {
    @Input("invoice")
    public invoice: INSClaimBillingInvoiceReceipt_DTO = new INSClaimBillingInvoiceReceipt_DTO();
    public taxLabel: string;
    public Invoice_Label: string = "INVOICE";
    public ShowProviderName: boolean;
    public CreditInvoiceDisplaySettings = { ShowPatAmtForCrOrganization: false, PatAmtValue: "0.00", ValidCrOrgNameList: ["Nepal Govt Dialysis"] };
    public QueueNoSetting = { "ShowInInvoice": false, "ShowInSticker": false };
    public InvoiceDisplaySettings: any = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false };
    public InvoiceFooterNoteSettings: any = { ShowFooter: true, ShowEnglish: true, ShowNepali: false, EnglishText: "Please bring this invoice on your next visit.", NepaliText: "कृपया अर्को पटक आउँदा यो बिल अनिवार्य रुपमा लिएर आउनुहोला ।" };
    public hospitalCode: string = "";
    public headerDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel };
    public showLabType: boolean = false;
    public labCount: number = 0;
    public showMunicipality: boolean = false;
    ipdNumber: string = '';
    localDateTime: string = '';
    finalAge: string = '';
    patientQRCodeInfo: string = '';
    CountryNepal: string = '';
    public BillingInvoiceDisplaySetting = { Unit: true, Price: true, DiscountPercent: true, DiscountAmount: true, Amount: true, InvoiceSubTotal: true, InvoiceDiscount: true };
    public OtherCurrencyDetail: OtherCurrencyDetail = { CurrencyCode: '', ExchangeRate: 0, BaseAmount: 0, ConvertedAmount: 0 };
    ShowADTDate: boolean = false;

    constructor(
        public nepaliCalendarServ: NepaliCalendarService,
        public billingService: BillingService,
        public coreService: CoreService
    ) {
        this.taxLabel = this.billingService.taxLabel;
        this.SetInvoiceLabelNameFromParam();
        this.GetBillingPackageInvoiceColumnSelection();
        this.ShowProviderName = this.coreService.SetShowProviderNameFlag();
        this.LoadCreditInvoiceDisplaySettingsFromParameter();
        this.QueueNoSetting = this.coreService.GetQueueNoSetting();
        this.InvoiceDisplaySettings = this.coreService.GetInvoiceDisplaySettings();
        this.InvoiceFooterNoteSettings = this.coreService.GetInvoiceFooterNoteSettings();
        this.GetBillingInvoiceDisplaySetting();
        this.hospitalCode = this.coreService.GetHospitalCode();
        if (!this.hospitalCode) {
            this.hospitalCode = "default";
        }

        this.showMunicipality = this.coreService.ShowMunicipality().ShowMunicipality;

        var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'BillingHeader').ParameterValue;
        if (paramValue)
            this.headerDetail = JSON.parse(paramValue);

        var StrParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "OPBillingRequestDisplaySettings");
        if (StrParam && StrParam.ParameterValue) {
            let currParam = JSON.parse(StrParam.ParameterValue);
            this.showLabType = currParam.LabType;
        }
        this.labCount = this.coreService.labTypes.length;
        this.CountryNepal = ENUM_Country.Nepal;

    }

    ngOnInit() {
        if (this.invoice) {
            this.localDateTime = this.GetLocalDate(this.invoice.InvoiceInfo.InvoiceDate);
            this.finalAge = CommonFunctions.GetFormattedAgeSex(this.invoice.PatientInfo.DateOfBirth, this.invoice.PatientInfo.Gender);

            if (this.invoice.InvoiceInfo.TransactionType == "inpatient") {
                this.ipdNumber = this.invoice.PatientInfo.VisitCode;
            }
            this.patientQRCodeInfo = `Name: ` + this.invoice.PatientInfo.PatientName + `
                                    Age/Sex : `+ this.invoice.PatientInfo.Age + `/` + this.invoice.PatientInfo.Gender.charAt(0) + `
                                    Hospital No: `+ '[' + this.invoice.PatientInfo.HospitalNo + ']' + `
                                    Invoice No: ` + this.invoice.InvoiceInfo.InvoiceNumFormatted;
            if (this.invoice.InvoiceInfo.OtherCurrencyDetail) {
                this.OtherCurrencyDetail = JSON.parse(this.invoice.InvoiceInfo.OtherCurrencyDetail);
            } else {
                this.OtherCurrencyDetail = null;
            }
            if (this.invoice.PatientInfo && this.invoice.PatientInfo.VisitType === ENUM_VisitType.inpatient) {
                this.ShowADTDate = true;
            }
            else {
                this.ShowADTDate = false;
            }
        }
    }

    GetBillingInvoiceDisplaySetting() {
        let currParam = this.coreService.Parameters.find(a => a.ParameterGroupName === "Billing" && a.ParameterName === "BillingInvoiceDisplaySettings");
        if (currParam && currParam.ParameterValue) {
            this.BillingInvoiceDisplaySetting = JSON.parse(currParam.ParameterValue);
        }
    }
    public SetInvoiceLabelNameFromParam() {
        var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "BillingInvoiceDisplayLabel");
        if (currParam && currParam.ParameterValue) {
            this.Invoice_Label = currParam.ParameterValue;
        }
    }
    public BillingPackageInvoiceColumnSelection: any = null;
    public GetBillingPackageInvoiceColumnSelection() {
        var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "BillingPackageInvoiceColumnSelection");
        if (currParam && currParam.ParameterValue) {
            this.BillingPackageInvoiceColumnSelection = JSON.parse(currParam.ParameterValue);
        }
    }

    GetLocalDate(engDate: string): string {
        let npDate = this.nepaliCalendarServ.ConvertEngToNepDateString(engDate);
        return npDate + " BS";
    }

    public LoadCreditInvoiceDisplaySettingsFromParameter() {
        let param = this.coreService.Parameters.find(p => p.ParameterGroupName == "Billing" && p.ParameterName == "CreditInvoiceDisplaySettings");
        if (param) {
            let paramValueStr = param.ParameterValue;
            if (paramValueStr) {
                this.CreditInvoiceDisplaySettings = JSON.parse(paramValueStr);
            }
        }
    }
}