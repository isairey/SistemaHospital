import { ChangeDetectorRef, Component, Input } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../core/shared/core.service";
import { DispensaryService } from "../../dispensary/shared/dispensary.service";
import { INSClaimPharmacyInvoiceReceipt_DTO } from "../../insurance/nep-gov/shared/ins-claim-invoice-receipt.dto";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { CommonFunctions } from "../../shared/common.functions";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";

@Component({
    selector: "ins-claim-pharmacy-invoice-view",
    templateUrl: "./ins-claim-pharmacy-invoice-view.component.html"
})
export class INSClaimPharmacyInvoiceViewComponent {
    @Input("invoice") public receipt: INSClaimPharmacyInvoiceReceipt_DTO = new INSClaimPharmacyInvoiceReceipt_DTO();
    public patientQRCodeInfo: string = "";
    isItemLevelVATApplicable: boolean;
    isMainVATApplicable: boolean;
    isMainDiscountAvailable: boolean;
    IsItemLevelDiscountEnable: boolean = false;
    showDis: boolean;
    showFooter: boolean;
    showEnglish: boolean;
    englishText: string;
    nepaliText: string;
    showNepali: boolean;
    public showQrCode: boolean = false;
    public ageOfPatient: string = null;
    public finalAge: string = null;
    public unitOfAge: string = null;
    InvoiceLabel: string = 'INVOICE';
    ShowItemCode: boolean = false;
    constructor(
        public coreService: CoreService,
        public nepaliCalendarService: NepaliCalendarService,
        public messageBoxService: MessageboxService,
        public changeDetector: ChangeDetectorRef,
        public _dispensaryService: DispensaryService
    ) {
        this.checkSalesCustomization();
        this.GetPharmacyInvoiceFooterParameter();
        this.GetPharmacyInvoiceDisplayLabelParameter();
        this.GetDisplayGenericItemCodeParameter()
    }

    ngOnInit() {
        this.GetPharmacyBillingHeaderParameter();
        this.patientQRCodeInfo = `Name: ` + this.receipt.PatientInfo.PatientName + `
                              Hospital No: `+ '[' + this.receipt.PatientInfo.HospitalNo + ']' + `
                              Invoice No: ` + this.receipt.InvoiceInfo.CurrentFinYear + ` - PH` + this.receipt.InvoiceInfo.InvoiceNumber;
        this.showQrCode = true;
        if (this.receipt.InvoiceInfo.DiscountAmount > 0) {
            this.showDis = true;
        }
        for (let index = 0; index < this.receipt.InvoiceItems.length; index++) {
            if (this.receipt.InvoiceItems[index].DiscountAmount > 0) {
                this.showDis = true;
            }
        }
        this.changeDetector.detectChanges();

        this.receipt.PatientInfo.CountrySubDivisionName;
        if (this.receipt.InvoiceInfo.PrintCount == 0) {
            this.unitOfAge = "Y";
            this.finalAge = CommonFunctions.GetFormattedAge(this.receipt.PatientInfo.DateOfBirth);
        }
        else {
            this.unitOfAge = this.receipt.PatientInfo.Age.slice(this.receipt.PatientInfo.Age.length - 1);

            let currentDate = moment().format('YYYY-MM-DD');
            let years = moment(currentDate).diff(moment(this.receipt.PatientInfo.DateOfBirth).format('YYYY-MM-DD'), 'years');
            let totMonths = moment(currentDate).diff(moment(this.receipt.PatientInfo.DateOfBirth).format('YYYY-MM-DD'), 'months');
            let totDays = moment(currentDate).diff(moment(this.receipt.PatientInfo.DateOfBirth).format('YYYY-MM-DD'), 'days');

            if (years >= 0 || totMonths >= 0 || totDays >= 0) {

                if (years >= 1 && this.unitOfAge == "Y") {
                    this.ageOfPatient = years.toString() + ' Y';
                    this.finalAge = this.ageOfPatient;
                }
                else if (this.unitOfAge == 'M') {
                    this.ageOfPatient = totMonths.toString() + 'M';
                    this.finalAge = this.ageOfPatient;
                }
                else if (this.unitOfAge == "D") {
                    if (Number(totDays) == 0)
                        totDays = 1;
                    this.ageOfPatient = totDays.toString() + 'D';
                    this.finalAge = this.ageOfPatient;
                }
                //else show only months for 1 to 35 months (other cases are checked in above conditions).
                else {
                    this.ageOfPatient = years.toString() + ' Y';
                    this.finalAge = this.ageOfPatient;
                }
            }
        }

    }

    ngOnChange() {
        this.patientQRCodeInfo = `Name: ` + this.receipt.PatientInfo.PatientName + `
            Hospital No: `+ '[' + this.receipt.PatientInfo.HospitalNo + ']' + `
            Invoice No: ` + this.receipt.InvoiceInfo.CurrentFinYear + ` - PH` + this.receipt.InvoiceInfo.InvoiceNumber;
        this.showQrCode = true;
    }
    public headerDetail: { hospitalName, address, email, PANno, tel, DDA };

    GetPharmacyBillingHeaderParameter() {
        const storeBillHeader = this._dispensaryService.getDispensaryHeader(this.receipt.InvoiceInfo.StoreId)
        if (storeBillHeader != null) {
            this.headerDetail = {
                hospitalName: storeBillHeader.StoreLabel,
                address: storeBillHeader.Address,
                email: storeBillHeader.Email,
                PANno: storeBillHeader.PanNo,
                tel: storeBillHeader.ContactNo,
                DDA: ''
            }
        }
        else {
            var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy BillingHeader').ParameterValue;
            if (paramValue)
                this.headerDetail = JSON.parse(paramValue);
            else
                this.messageBoxService.showMessage("error", ["Please enter parameter values for BillingHeader"]);
        }
    }
    //Get Pharmacy Invoice Footer Paramater
    GetPharmacyInvoiceFooterParameter() {
        let InvFooterParameterStr = this.coreService.Parameters.find(p => p.ParameterName == "PharmacyInvoiceFooterNoteSettings" && p.ParameterGroupName == "Pharmacy");
        if (InvFooterParameterStr != null) {
            let FooterParameter = JSON.parse(InvFooterParameterStr.ParameterValue);
            if (FooterParameter.ShowFooter == true) {
                this.showFooter = true;
                if (FooterParameter.ShowEnglish == true) {
                    this.showEnglish = true;
                    this.englishText = FooterParameter.EnglishText;
                }
                if (FooterParameter.ShowNepali == true) {
                    this.showNepali = true;
                    this.nepaliText = FooterParameter.NepaliText;
                }
            }
        }
    }

    GetDisplayGenericItemCodeParameter() {
        let genericItemCodeParameter = this.coreService.Parameters.find(p => p.ParameterName == "DisplayGenericItemCodeInInvoice" && p.ParameterGroupName == "Pharmacy");
        if (genericItemCodeParameter) {
            this.ShowItemCode = JSON.parse(genericItemCodeParameter.ParameterValue);
        }
    }

    //check the Sales Page Customization ie enable or disable Vat and Discount;
    checkSalesCustomization() {
        let salesParameterString = this.coreService.Parameters.find(p => p.ParameterName == "SalesFormCustomization" && p.ParameterGroupName == "Pharmacy");
        if (salesParameterString != null) {
            let SalesParameter = JSON.parse(salesParameterString.ParameterValue);
            this.isItemLevelVATApplicable = (SalesParameter.EnableItemLevelVAT == true);
            this.isMainVATApplicable = (SalesParameter.EnableMainVAT == true);
            this.IsItemLevelDiscountEnable = (SalesParameter.EnableItemLevelDiscount == true);
            this.isMainDiscountAvailable = (SalesParameter.EnableMainDiscount == true);

        }
    }

    GetLocalDate(engDate: string): string {
        let npDate = this.nepaliCalendarService.ConvertEngToNepDateString(engDate);
        return npDate + " BS";
    }
    GetPharmacyInvoiceDisplayLabelParameter() {
        let pharmacyInvoiceDisplayLabelParams = this.coreService.Parameters.find(p => p.ParameterName == "PharmacyInvoiceDisplayLabel" && p.ParameterGroupName == "Pharmacy");
        if (pharmacyInvoiceDisplayLabelParams != null) {
            this.InvoiceLabel = pharmacyInvoiceDisplayLabelParams.ParameterValue;
        }
    }
}
