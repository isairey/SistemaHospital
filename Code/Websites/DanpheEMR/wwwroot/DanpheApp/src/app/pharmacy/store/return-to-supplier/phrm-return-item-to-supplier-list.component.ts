import { ChangeDetectorRef, Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { GeneralFieldLabels } from "../../../shared/DTOs/general-field-label.dto";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PharmacyService } from "../../shared/pharmacy.service";
import PHRMGridColumns from '../../shared/phrm-grid-columns';
import { PHRMReturnToSupplierItemModel } from "../../shared/phrm-return-to-supplier-items.model";
import { PHRMReturnToSupplierModel } from "../../shared/phrm-return-to-supplier.model";
import { PHRMSupplierModel } from "../../shared/phrm-supplier.model";


@Component({
    templateUrl: "./phrm-return-item-to-supplier-list.html",
    host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PHRMReturnItemToSupplierListComponent {
    public returnItemToSupplierList: Array<PHRMReturnToSupplierModel> = new Array<PHRMReturnToSupplierModel>();
    public returnToSupplierListGridColumns: Array<any> = null;
    ///variable to show-hide Popup box
    public showRetSuppItemsbyRetSuppID: boolean = false;
    public returnSupplierData: ReturnToSupplierData = new ReturnToSupplierData();

    ////variable to Bind All POItemsList
    public PHRMRetSuppItemsList: Array<PHRMReturnToSupplierItemModel> = new Array<PHRMReturnToSupplierItemModel>();
    ///variable to push RetItemList to this variable because we have to minimize server call 
    public localDatalist: Array<PHRMReturnToSupplierItemModel> = new Array<PHRMReturnToSupplierItemModel>();
    ///final stored List to bind by locally stored data to view
    public selectedDatalist: Array<PHRMReturnToSupplierItemModel> = new Array<PHRMReturnToSupplierItemModel>();
    ///Varible to bind Supplier Data to View
    public currentSupplier: PHRMSupplierModel = new PHRMSupplierModel();
    public fileFromDate: string = null;
    public fileToDate: string = null;
    public time: any;
    public returnDate: any;
    public fromDate: string = null;
    public toDate: string = null;
    public dateRange: string = "last1Week";  //by default show last 1 week data.;
    public ReturnToSupplierId: number = null;
    public returnType = [{ id: 1, name: "Breakage" }, { id: 2, name: "Expiry" }, { id: 3, name: "Breakage and Expiry" }, { id: 4, name: "Others" }];
    public RetType: any;
    public returnsuppList: Array<any> = [];
    public userName: any;
    refNo: any;
    retSuppId: any;
    public goodReceiptPrintId: any;
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    showPrint: boolean;
    printDetaiils: any;
    showFreeQty: boolean;
    showCCCharge: boolean;
    patientQRCodeInfo: string = '';
    public GeneralFieldLabel = new GeneralFieldLabels();
    constructor(public coreService: CoreService,
        public pharmacyBLService: PharmacyBLService,
        public changeDetector: ChangeDetectorRef,
        public msgBoxServ: MessageboxService, public securityService: SecurityService, public route: ActivatedRoute, public pharmacyService: PharmacyService) {
        this.returnToSupplierListGridColumns = PHRMGridColumns.PHRMReturnItemToSupplierList;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('ReturnDate', false));
        this.GeneralFieldLabel = coreService.GetFieldLabelParameter();


    }
    ngOnInit() {
        this.GetPharmacyBillingHeaderParameter();
        this.checkReturnCustomization();
        this.ReturnToSupplierId = this.pharmacyService.getReturnToSupplietId();
        if (this.ReturnToSupplierId) {
            this.ShowRetSuppItemsDetailsByRetSuppId(this.ReturnToSupplierId);
        }
        else {
            this.getReturnItemsToSupplierList();
        }
    }
    public getReturnItemsToSupplierList() {
        this.pharmacyBLService.GetReturnedList(this.fromDate, this.toDate)
            .subscribe(res => {
                if (res.Status == "OK") {
                    this.returnItemToSupplierList = res.Results;
                    this.returnsuppList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage("error", ["Failed to get Return Item To Supplier. " + res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get Return Item To Supplier111. " + err.ErrorMessage]);
                });
    }

    ReturnToSupplierGridAction($event: GridEmitModel) {
        switch ($event.Action) {
            case "view": {
                this.ShowRetSuppItemsDetailsByRetSuppId($event.Data.ReturnToSupplierId);
                break;
            }
            default:
                break;
        }
    }

    onGridDateChange($event) {
        this.fromDate = $event.fromDate;
        this.toDate = $event.toDate;
        if (this.fromDate != null && this.toDate != null) {
            if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
                this.getReturnItemsToSupplierList();
            } else {
                this.msgBoxServ.showMessage('failed', ['Please enter valid From date and To date']);
            }

        }

    }
    ///this function is for when enduser Clicks on View in POList 
    ShowRetSuppItemsDetailsByRetSuppId(returnToSupplierId) {

        this.pharmacyBLService.GetReturnDetailByRetSuppId(returnToSupplierId)
            .subscribe(res => {
                if (res.Status == "OK") {
                    this.PHRMRetSuppItemsList = res.Results.returnToSupplierItemsList;
                    this.returnSupplierData = res.Results.returnSupplierData;
                    this.userName = this.returnSupplierData.UserName;
                    this.time = this.returnSupplierData.Time;
                    switch (this.returnSupplierData.ReturnType) {
                        case 1: {
                            this.RetType = "Breakage";
                            break;
                        }
                        case 2: {
                            this.RetType = "Expiry";
                            break;
                        }
                        case 3: {
                            this.RetType = "Breakage and Expiry";
                            break;
                        }
                        case 4: {
                            this.RetType = "Others";
                            break;
                        }
                    }
                    //  this.RetType = this.returnSupplierData.ReturnType;
                    this.currentSupplier.CreditNotePrintId = this.returnSupplierData.CreditNoteNo;
                    this.currentSupplier.CreditNoteNo = this.returnSupplierData.SuppliersCRN;
                    this.currentSupplier.SupplierName = this.returnSupplierData.SupplierName;
                    this.currentSupplier.PANNumber = this.returnSupplierData.PanNo;
                    this.currentSupplier.ContactNo = this.returnSupplierData.ContactNo;
                    let ReturnDate = this.returnSupplierData.ReturnDate;
                    this.returnDate = moment(ReturnDate).format("YYYY-MM-DD");
                    this.goodReceiptPrintId = this.returnSupplierData.RefNo;
                    this.currentSupplier.Remarks = this.returnSupplierData.Remarks;
                    this.time = this.PHRMRetSuppItemsList[0].CreatedOn;
                    this.PHRMRetSuppItemsList.forEach(itm => { this.localDatalist.push(itm); });
                    this.currentSupplier.SubTotal = this.PHRMRetSuppItemsList.reduce((acc, itm) => acc + itm.SubTotal, 0);
                    this.currentSupplier.DiscountAmount = this.PHRMRetSuppItemsList.reduce((acc, itm) => acc + itm.DiscountedAmount, 0);
                    this.currentSupplier.VATAmount = this.PHRMRetSuppItemsList.reduce((acc, itm) => acc + itm.VATAmount, 0);
                    this.currentSupplier.TotalAmount = this.PHRMRetSuppItemsList.reduce((acc, itm) => acc + itm.TotalAmount, 0);
                    this.showRetSuppItemsbyRetSuppID = true;
                    this.SetFocusOnButton("printButton");


                } else {
                    this.msgBoxServ.showMessage("failed", ['Failed to get OrderList.' + res.ErrorMessage]);
                }

            },
                err => {
                    this.msgBoxServ.showMessage("error", ['Failed to get OrderList.' + err.ErrorMessage]);
                }
            )

    }

    /////For Closing ModelBox Popup
    Close() {
        this.showRetSuppItemsbyRetSuppID = false;
        this.ReturnToSupplierId = null;
        this.currentSupplier = new PHRMSupplierModel();
        this.pharmacyService.setReturnToSupplietId(this.ReturnToSupplierId);
        this.getReturnItemsToSupplierList();
    }

    public headerDetail: { hospitalName, address, email, PANno, tel, DDA };

    //Get Pharmacy Billing Header Parameter from Core Service (Database) assign to local variable
    GetPharmacyBillingHeaderParameter() {
        var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy Receipt Header').ParameterValue;
        if (paramValue)
            this.headerDetail = JSON.parse(paramValue);
        else
            this.msgBoxServ.showMessage("error", ["Please enter parameter values for BillingHeader"]);
    }
    SetFocusOnButton(idToSelect: string) {
        if (document.getElementById(idToSelect)) {
            let btn = <HTMLInputElement>document.getElementById(idToSelect);
            btn.focus();
        }
    }
    printCreditNote() {
        this.showPrint = false;
        this.printDetaiils = null;
        this.printDetaiils = document.getElementById("print-credit-note");
        this.changeDetector.detectChanges();
        this.showPrint = true;
    }
    public hotkeys(event) {
        //For ESC key => close the pop up
        if (event.keyCode == 27) {
            this.Close();
        }
    }
    checkReturnCustomization() {
        let GRParameterStr = this.coreService.Parameters.find(p => p.ParameterName == "GRFormCustomization" && p.ParameterGroupName == "Pharmacy");
        if (GRParameterStr != null) {
            let GRParameter = JSON.parse(GRParameterStr.ParameterValue);
            if (GRParameter.showFreeQuantity == true) {
                this.showFreeQty = true;
            }
            if (GRParameter.showCCCharge == true) {
                this.showCCCharge = true;
            }
        }
    }
}

class ReturnToSupplierData {
    CreditNoteNo: number = 0;
    SuppliersCRN: string = '';
    ReturnType: number = 0;
    Time: string = '';
    UserName: string = '';
    ReturnDate: string = '';
    ContactNo: string = '';
    PanNo: string = '';
    RefNo: number = 0;
    SupplierName: string = '';
    Remarks: string = '';
    CreatedOn: string = '';
}

