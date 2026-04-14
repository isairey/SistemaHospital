import { ChangeDetectorRef, Component, EventEmitter, Input, Output, Renderer2 } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment/moment";
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from "../../../security/shared/security.service";
import { CallbackService } from '../../../shared/callback.service';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PharmacyService } from "../../shared/pharmacy.service";
import { PHRMGenericModel } from "../../shared/phrm-generic.model";
import { PHRMGoodsReceiptItemsModel } from "../../shared/phrm-goods-receipt-items.model";
import { PHRMGoodsReceiptViewModel } from "../../shared/phrm-goods-receipt-vm.model";
import { PHRMItemMasterModel } from "../../shared/phrm-item-master.model";
import { PHRMPackingTypeModel } from '../../shared/phrm-packing-type.model';
import { PHRMStoreModel } from '../../shared/phrm-store.model';

@Component({
    selector: "phrm-add-goods-receipt-item",
    templateUrl: "./phrm-gr-item.html"
})
export class PHRMGoodsReceiptItemComponent {
    GoodsReceiptVM: PHRMGoodsReceiptViewModel = new PHRMGoodsReceiptViewModel();
    GoodReceiptItem: PHRMGoodsReceiptItemsModel = new PHRMGoodsReceiptItemsModel();
    PurchaseOrderId: number = 0;
    Loading: boolean = false;
    ShowAddItemPopUp: boolean = false;
    ShowAddSupplierPopUp: boolean = false;
    IsPOorder: boolean = false;
    IsUpdate: boolean = false;
    SelectedItem: any;
    ItemList: Array<PHRMItemMasterModel> = new Array<PHRMItemMasterModel>();
    TaxList: Array<any>;
    TaxData: Array<any> = [];

    //@ViewChild('addItems')
    //addItems: phrmitemaddComponent;
    Store: PHRMStoreModel;
    CurrentStore: any;
    TempStore: any;
    IsPackingItem: boolean = false;
    IsItemLevelDiscount: boolean = false;
    ShowDispensary: boolean = false;
    IdList: Array<any> = [];
    IsGReditAfterModification: boolean = false;
    DispensaryList: Array<any> = [];
    SelectedDispensary: any = null;
    GoodReceiptHistory: Array<any> = [];
    CheckIsValid: boolean = true;
    IsExpiryNotApplicable: boolean = false;
    ExpiryAfterYear: number = 0;
    ItemId: number = 0;
    IsStripRateEdit: boolean = false;
    FiscalYearList: Array<any> = new Array<any>();
    @Output("callback-update")
    CallBackUpdate: EventEmitter<Object> = new EventEmitter<Object>();
    @Output("callback-add")
    CallBackAdd: EventEmitter<Object> = new EventEmitter<Object>();
    @Output("popup-close")
    PopUpClose: EventEmitter<boolean> = new EventEmitter<boolean>();

    PackagingTypeList: Array<PHRMPackingTypeModel> = new Array<PHRMPackingTypeModel>();

    @Input("PackingList")
    packingListInput: Array<any> = [];

    @Input("all-items-list")
    itemListInput: Array<PHRMItemMasterModel> = new Array<PHRMItemMasterModel>();
    ESCAPE_KEYCODE = 27;//to close the window on click of ESCape.
    GlobalListenFunc: Function;
    ShowFreeQty: boolean = false;
    ShowCCCharge: boolean = false;
    VATPercentage: number;
    GRItemPrice: number;
    ItemQty: number;
    ShowPendingQty: boolean = false;
    @Input('generic-list')
    GenericList: PHRMGenericModel[] = [];
    SelectedGeneric: any;
    ItemListFiltered: Array<any> = new Array<any>();
    ShowAddGenericPopUp: boolean = false;
    @Output("callback-add-item")
    CallbackAddMasterItem: EventEmitter<Object> = new EventEmitter<Object>();
    constructor(
        public pharmacyService: PharmacyService,
        public coreService: CoreService,
        public pharmacyBLService: PharmacyBLService,
        public securityService: SecurityService,
        public messageBoxService: MessageboxService,
        public router: Router,
        public callBackService: CallbackService,
        public changeDetectorRef: ChangeDetectorRef, public renderer2: Renderer2
    ) {
        this.ItemList = new Array<PHRMItemMasterModel>();
        this.GetTaxList();
        this.GoodsReceiptVM.goodReceipt.GoodReceiptDate = moment().format("YYYY-MM-DD");
        this.MakeExpiryNotApplicable();
        this.ShowPackaging();
        this.ShowItemLevelDiscount();
        this.GetGRFromCustomizationParameter();
    }
    ngOnInit() {
        this.PackagingTypeList = [];
        if (this.packingListInput) {
            this.PackagingTypeList = this.packingListInput;
        }

        this.ItemList = [];
        if (this.itemListInput) {
            this.ItemList = this.itemListInput.filter(a => a.IsActive == true);
            this.ItemListFiltered = this.ItemList;

        }
        if (this.IsPOorder || this.IsUpdate == true) {
            (this.IsPackingItem == true) ? this.SetFocusById('ddl_packing', 300) : this.SetFocusById('txt_BatchNo', 300);
        }
        else {
            if (!this.IsUpdate) {
                this.SetFocusById("txt_GenericName", 300);
            }
        }
        this.GlobalListenFunc = this.renderer2.listen('document', 'keydown', e => {
            if (e.keyCode == this.ESCAPE_KEYCODE) {
                this.Close();
            }
        });
        this.GoodReceiptItem.ItemQTy = this.ItemQty;
        if (this.GoodReceiptItem.SelectedItem) {
            this.SelectedItem = this.GoodReceiptItem.SelectedItem.ItemName;
        }
        else {
            this.SelectedItem = '';
        }
    }
    ngOnDestroy() {
        this.pharmacyService.Id = null;
    }
    Close() {
        this.PopUpClose.emit(true);
    }

    GetTaxList() {
        try {
            this.pharmacyBLService.GetTAXList().subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.TaxList = res.Results;
                        this.TaxData = this.TaxList;
                    } else {
                        console.error(res.ErrorMessage);
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
                            "Failed to get tax list, see detail in console log",
                        ]);
                    }
                },
                (err) => {
                    console.error(err);
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
                        "Failed to get tax list., see detail in console log",
                    ]);
                }
            );
        } catch (exception) {
            console.log(exception);
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["error details see in console log"]);
        }
    }

    AssignSelectedGenName() {
        try {
            if (this.SelectedGeneric != null) {
                this.ItemListFiltered = this.ItemList.filter(a => a.GenericId == this.SelectedGeneric.GenericId);
                this.GoodReceiptItem.GenericId = this.SelectedGeneric.GenericId;
                this.GoodReceiptItem.GenericName = this.SelectedGeneric.GenericName;
            }
            else {
                this.ItemListFiltered = this.ItemList;
                this.SelectedItem = null;
            }
        } catch (ex) {
            this.ShowCatchErrMessage(ex);
        }
    }


    AssignSelectedItem() {
        try {
            if (this.SelectedItem && this.SelectedItem.ItemId) {
                if ((this.SelectedItem.ItemId != 0) && (this.SelectedItem.ItemId != null)) {
                    this.GoodReceiptItem.SelectedItem = this.SelectedItem;
                    this.GoodReceiptItem.GoodReceiptItemValidator.controls['ItemName'].setValue(this.SelectedItem);
                    this.GoodReceiptItem.ItemName = this.SelectedItem.ItemName;
                    this.GoodReceiptItem.ItemId = this.SelectedItem.ItemId;
                    this.GoodReceiptItem.CCCharge = this.SelectedItem.CCCharge;
                    this.getRackNoByItemIdAndStoreId(this.SelectedItem.ItemId);
                    this.GoodReceiptItem.VATPercentage = (this.SelectedItem.IsVATApplicable == true && !!this.SelectedItem.PurchaseVATPercentage) ? this.SelectedItem.PurchaseVATPercentage : 0;

                    this.GoodReceiptItem.ItemRateHistory = this.pharmacyService.allItemRateList.filter(i => i.ItemId == this.SelectedItem.ItemId).filter((x, y) => y < 3); //first filter the Item and take top 3 rate history;
                    // Assign default vat percentage from item-settings
                    this.GoodReceiptItem.VATPercentage = (this.SelectedItem.IsVATApplicable == true && !!this.SelectedItem.PurchaseVATPercentage) ? this.SelectedItem.PurchaseVATPercentage : 0;
                    // this.goodReceiptItem.VATPercentage = this.item.VATPercentage;
                    // this.goodReceiptItem.SelectedItem.PackingTypeId = this.item.PackingTypeId;
                    this.GoodReceiptItem.ItemMRPHistory = this.pharmacyService.allMRPList.filter(i => i.ItemId == this.SelectedItem.ItemId).filter((x, y) => y < 3); //first filter the Item and take top 3 SalePrice history;
                    this.GoodReceiptItem.ItemFreeQuantityHistory = this.pharmacyService.allItemFreeQuantityList.filter(i => i.ItemId == this.SelectedItem.ItemId).filter((x, y) => y < 5); //first filter the Item and take top 5 Free Quantity history;
                    this.GoodReceiptItem.MRP = this.SelectedItem.MRP;
                    if (!this.SelectedGeneric) {
                        this.GoodReceiptItem.GenericId = this.SelectedItem.GenericId;
                        this.GoodReceiptItem.GenericName = this.SelectedItem.GenericName;
                        this.SelectedGeneric = this.SelectedItem.GenericName;
                    }
                    else {
                        this.SelectedGeneric = this.SelectedItem.GenericName;
                    }
                    this.UpdatePackingSettingForItem(this.GoodReceiptItem);
                }
                //by default expiry should be calculated
                //if (!this.ExpiryAfterYear) {
                this.ExpiryAfterYear = 5;//by default 5 years if it's value is not set in parameter.
                //}
                //input type=Month accepts YYYY-MM as input value
                this.GoodReceiptItem.ExpiryDate = (moment().add(this.ExpiryAfterYear, 'years')).format("YYYY-MM");
            }
            else {
                if (this.IsUpdate == false) {
                    this.SelectedGeneric = null;
                }
                this.ItemListFiltered = this.ItemList;
            }
        } catch (ex) {
            this.ShowCatchErrMessage(ex);
        }

    }
    ShowCatchErrMessage(exception) {
        if (exception) {
            let ex: Error = exception;
            this.messageBoxService.showMessage("error", ["Check error in Console log !"]);
            console.log("Error Message =>  " + ex.message);
            console.log("Stack Details =>   " + ex.stack);
        }
    }
    Save() {
        if (this.GoodReceiptItem.GoodReceiptItemValidator.valid === false) {
            for (let key in this.GoodReceiptItem.GoodReceiptItemValidator.controls) {
                if (this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].valid === false) {
                    this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].markAsDirty();
                    this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].updateValueAndValidity();
                }
            }
            return;
        }
        if (this.IsPackingItem) {
            if (!this.GoodReceiptItem.PackingTypeId) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please Select a PackingType"]);
                return;
            }
            if (this.GoodReceiptItem.StripQty <= 0) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Packing Qty should be greater than 0"]);
                return;
            }
        }
        this.GoodReceiptItem.IsItemDiscountApplicable = this.GoodReceiptItem.DiscountAmount ? true : false;
        this.MakeBatchNoNA(this.GoodReceiptItem);
        this.CallBackAdd.emit(this.GoodReceiptItem);
        this.PopUpClose.emit(true);
    }
    Update() {
        if (this.IsPackingItem) {
            //  if (this.GoodReceiptItem.Packing && typeof (this.GoodReceiptItem.Packing) == "object" && !this.GoodReceiptItem.Packing.PackingTypeId) {

            if (!this.GoodReceiptItem.PackingTypeId) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please Select a PackingType"]);
                return;
            }
            if (this.GoodReceiptItem.StripQty <= 0) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Packing Qty should be greater than 0"]);
                return;
            }
            this.GoodReceiptItem.PackingQty = this.GoodReceiptItem.StripQty;
            this.GoodReceiptItem.GRItemPrice = CommonFunctions.parseAmount(this.GoodReceiptItem.StripRate / this.GoodReceiptItem.Packing.PackingQuantity, 4);
        }
        this.GoodReceiptItem.GoodReceiptItemValidator.controls['ItemName'].setErrors(null);
        if (this.GoodReceiptItem.GoodReceiptItemValidator.valid === false) {
            for (let key in this.GoodReceiptItem.GoodReceiptItemValidator.controls) {
                if (this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].valid === false) {
                    this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].markAsDirty();
                    this.GoodReceiptItem.GoodReceiptItemValidator.controls[key].updateValueAndValidity();
                }
            }
            return;
        }
        this.GoodReceiptItem.GRItemPrice = this.GoodReceiptItem.GRItemPrice;
        this.GoodReceiptItem.GenericId = this.GoodReceiptItem.GenericId;
        this.CallBackUpdate.emit(this.GoodReceiptItem);
        this.PopUpClose.emit(true);
    }

    AssignPackingQty() {
        if (this.GoodReceiptItem && this.GoodReceiptItem.Packing) {
            this.GoodReceiptItem.PackingName = this.GoodReceiptItem.Packing.PackingName;
            this.GoodReceiptItem.PackingTypeId = this.GoodReceiptItem.Packing.PackingTypeId;
        }
        else {
            this.GoodReceiptItem.PackingTypeId = null;
        }
    }

    SetFocusById(IdToBeFocused: string, defaultTimeInMs: number = 100) {
        window.setTimeout(function () {
            let elemToFocus = document.getElementById(IdToBeFocused)
            if (elemToFocus != null && elemToFocus != undefined) {
                elemToFocus.focus();
            }
        }, defaultTimeInMs);
    }


    LogError(err: any) {
        this.PurchaseOrderId = 0;
        this.pharmacyService.CreateNew();
        this.IsPOorder = false;
        this.router.navigate(["/Pharmacy/Order/GoodsReceiptList"]);
        console.log(err);
    }

    OnStripSalePriceChange() {
        let stripRate = this.GoodReceiptItem.StripRate;
        let StripSalePrice = this.GoodReceiptItem.StripSalePrice;
        this.GoodReceiptItem.AdjustedMargin = CommonFunctions.parseAmount(((StripSalePrice - stripRate) * 100) / stripRate, 4);
        this.GoodReceiptItem.Margin = (((StripSalePrice - stripRate) * 100) / stripRate);
        this.CalculationForPackingValues();
    }


    OnSalePriceChange() {
        let rate = this.GoodReceiptItem.GRItemPrice;
        let mrp = this.GoodReceiptItem.SalePrice;
        this.GoodReceiptItem.AdjustedMargin = CommonFunctions.parseAmount(((mrp - rate) * 100) / rate);
        this.GoodReceiptItem.Margin = ((mrp - rate) * 100) / rate;
        this.CalculationForPHRMGoodsReceiptItem();
    }

    UpdatePackingSettingForItem(selectedGRItem: PHRMGoodsReceiptItemsModel) {

        if (this.PackagingTypeList != null && this.PackagingTypeList.length > 0 && selectedGRItem.SelectedItem.PackingTypeId != null) {
            var selectedItemPackingType = this.PackagingTypeList.find(a => a.PackingTypeId == selectedGRItem.SelectedItem.PackingTypeId);
            if (selectedItemPackingType != null) {
                this.GoodReceiptItem.Packing = selectedItemPackingType;
                this.GoodReceiptItem.PackingName = selectedItemPackingType.PackingName;
                this.GoodReceiptItem.PackingTypeId = selectedItemPackingType.PackingTypeId;
            }

        }
        else {
            selectedGRItem.PackingName = "N/A";
            selectedGRItem.ItemQTy = selectedGRItem.ReceivedQuantity;
            selectedGRItem.GoodReceiptItemValidator.updateValueAndValidity();
        }
    }

    CalculationForPackingValues() {
        let stripQty = this.GoodReceiptItem.StripQty;
        let stripRate = this.GoodReceiptItem.StripRate;
        let margin = this.GoodReceiptItem.Margin;
        if (margin == 0) {
            this.GoodReceiptItem.StripSalePrice = this.GoodReceiptItem.StripRate;
        }
        let packingQty = this.GoodReceiptItem.Packing ? this.GoodReceiptItem.Packing.PackingQuantity : 1; //by default, if no packing selected, use packing qty as 1. (to avoid divide by zero exception)
        this.GoodReceiptItem.ItemQTy = stripQty * packingQty;
        this.GoodReceiptItem.StripSalePrice = CommonFunctions.parseAmount((stripRate + (stripRate * margin) / 100), 4);

        this.GoodReceiptItem.SalePrice = this.GoodReceiptItem.StripSalePrice ? this.GoodReceiptItem.StripSalePrice / packingQty : 0;
        this.GoodReceiptItem.GRItemPrice = CommonFunctions.parseAmount(stripRate / packingQty, 4);
        let freeStripQuantity = this.GoodReceiptItem.FreeStripQuantity ? this.GoodReceiptItem.FreeStripQuantity : 0;
        this.GoodReceiptItem.FreeQuantity = freeStripQuantity * packingQty;
        this.GoodReceiptItem.IsPacking = this.GoodReceiptItem.Packing ? true : false;
        // ! StripQty is saved as PackingQty in Good Receipt Item Table. (PackingQuantity is different than PackingQty)
        this.GoodReceiptItem.PackingQty = this.GoodReceiptItem.StripQty;
        this.CalculationForPHRMGoodsReceiptItem();
    }

    CalculationForPHRMGoodsReceiptItem() {
        if (this.IsUpdate == true && this.IsPackingItem == true) {
            if (this.GoodReceiptItem.IsPacking) {
                this.GoodReceiptItem.SelectedItem.PackingTypeId = this.GoodReceiptItem.Packing.PackingTypeId;
                this.UpdatePackingSettingForItem(this.GoodReceiptItem);
            }

        }
        //do the calculation only if item is already selected, else leave it..
        if (this.GoodReceiptItem.SelectedItem) {

            updateCalculationsForGrItem(this.GoodReceiptItem);

        }
    }


    DiscountAmountOnChange() {
        if (this.GoodReceiptItem.SelectedItem) {
            let itmQty = this.GoodReceiptItem.ReceivedQuantity ? this.GoodReceiptItem.ReceivedQuantity : 0;
            let itmRate = this.GoodReceiptItem.GRItemPrice ? this.GoodReceiptItem.GRItemPrice : 0;
            let freeQty = this.GoodReceiptItem.FreeQuantity ? this.GoodReceiptItem.FreeQuantity : 0;
            let vatPercentage = this.GoodReceiptItem.VATPercentage ? this.GoodReceiptItem.VATPercentage : 0;
            let margin = this.GoodReceiptItem.Margin ? this.GoodReceiptItem.Margin : 0;
            let disAmt = this.GoodReceiptItem.DiscountAmount ? this.GoodReceiptItem.DiscountAmount : 0;
            let ccAmount = 0;
            if (this.GoodReceiptItem.CCCharge && this.GoodReceiptItem.FreeQuantity) {
                ccAmount = freeQty * itmRate * this.GoodReceiptItem.CCCharge / 100;
            }
            let subTotalWithoutCC = itmQty * itmRate;
            let subTotalWithCC = subTotalWithoutCC + ccAmount;
            let subTotal = subTotalWithoutCC;

            let discAmount = this.GoodReceiptItem.DiscountAmount;// subTotalWithoutCC * discPercent / 100;
            let vatAmount = (subTotalWithoutCC - discAmount) * vatPercentage / 100;
            let totalAmt = subTotalWithCC - discAmount + vatAmount;

            this.GoodReceiptItem.SalePrice = CommonFunctions.parseAmount(itmRate + (itmRate * margin / 100), 4);
            this.GoodReceiptItem.CCAmount = CommonFunctions.parseAmount(ccAmount, 4);
            this.GoodReceiptItem.DiscountAmount = CommonFunctions.parseAmount(discAmount, 4);
            this.GoodReceiptItem.VATAmount = CommonFunctions.parseAmount(vatAmount, 4);
            this.GoodReceiptItem.SubTotal = CommonFunctions.parseAmount(subTotal, 4);
            this.GoodReceiptItem.TotalAmount = CommonFunctions.parseAmount(totalAmt, 4);

            this.GoodReceiptItem.DiscountPercentage = CommonFunctions.parseAmount(discAmount / subTotalWithoutCC * 100, 4);
            this.GoodReceiptItem.CostPrice = CommonFunctions.parseAmount(this.GoodReceiptItem.TotalAmount / (itmQty + freeQty), 4);

        }

    }
    PackingListsFormatter(data: any): string {
        let html = data["PackingName"];
        return html;
    }
    ItemListFormatter(data: any): string {
        let html = `<font color='blue'; size=03 >${data["ItemName"]}</font> (<i>${data["GenericName"]}</i>)`;
        return html;
    }
    GenericNameListFormatter(data: any): string {
        let html = `<font color='blue'; size=03 >${data["GenericName"]}</font>`;
        return html;
    }

    AddItemPopUp(i) {
        this.ShowAddItemPopUp = false;
        this.changeDetectorRef.detectChanges();
        this.ShowAddItemPopUp = true;
    }
    AddGenericPopUp() {
        this.ShowAddGenericPopUp = false;
        this.changeDetectorRef.detectChanges();
        this.ShowAddGenericPopUp = true;
    }
    OnNewItemAdded($event) {
        this.ShowAddItemPopUp = false;
        if ($event) {
            var item = $event.item;
            this.ItemList.unshift(item);
            this.ItemListFiltered = this.ItemList;
            this.GoodReceiptItem = new PHRMGoodsReceiptItemsModel();
            this.GoodReceiptItem.GoodReceiptItemValidator.get("ItemName").setValue(item.ItemName);
            this.SelectedItem = item.ItemName;
            this.GoodReceiptItem.SelectedItem = item;
            this.CallbackAddMasterItem.emit(item);
        }
        this.SetFocusById('txt_ItemName');
    }

    OnNewGenericAdded($event) {
        this.ShowAddItemPopUp = false;
        var generic = $event.generic;
        this.GenericList.unshift(generic);
        this.GoodReceiptItem = new PHRMGoodsReceiptItemsModel();
        this.SelectedGeneric = generic;
        this.SetFocusById('txt_GenericName');
    }
    MakeExpiryNotApplicable() {
        this.IsExpiryNotApplicable = false;
        let data = this.coreService.Parameters.find(
            (p) =>
                p.ParameterName == "PharmacyGRExpiryNotApplicable" &&
                p.ParameterGroupName == "Pharmacy"
        );
        if (data && data.ParameterValue) {
            let paramValue = data.ParameterValue
            let dataObj = JSON.parse(paramValue);
            this.ExpiryAfterYear = dataObj.ExpiryAfter;
            if (dataObj.ExpiryNotApplicable) {
                this.IsExpiryNotApplicable = true;
            }
        }
    }

    MakeBatchNoNA(grItem: PHRMGoodsReceiptItemsModel): boolean {
        if (this.IsExpiryNotApplicable) {
            grItem.BatchNo = 'N/A';

        }
        return true;
    }

    // for Free Qty and CC Charge Paramaters.
    GetGRFromCustomizationParameter() {
        let GRParameterStr = this.coreService.Parameters.find(p => p.ParameterName == "GRFormCustomization" && p.ParameterGroupName == "Pharmacy");
        if (GRParameterStr != null) {
            let GRParameter = JSON.parse(GRParameterStr.ParameterValue);
            if (GRParameter.showFreeQuantity == true) {
                this.ShowFreeQty = true;
            }
            if (GRParameter.showCCCharge == true) {
                this.ShowCCCharge = true;
            }
        }
    }
    ShowPackaging() {
        this.IsPackingItem = true;
        let pkg = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyGRpacking" && p.ParameterGroupName == "Pharmacy").ParameterValue;
        if (pkg == "true") {
            this.IsPackingItem = true;
        } else {
            this.IsPackingItem = false;
        }

    }

    ShowItemLevelDiscount() {
        this.IsItemLevelDiscount = true;
        let discountParameter = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyDiscountCustomization" && p.ParameterGroupName == "Pharmacy").ParameterValue;
        discountParameter = JSON.parse(discountParameter);
        this.IsItemLevelDiscount = (discountParameter.EnableItemLevelDiscount == true);
    }
    public getRackNoByItemIdAndStoreId(ItemId: number): void {
        this.pharmacyBLService.GetRackNoByItemIdAndStoreId(ItemId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.GoodReceiptItem.RackNo = res.Results;
                }
            });
    }

    OnStripMRPChange() {
        let StripMRP = this.GoodReceiptItem.StripMRP;
        this.GoodReceiptItem.MRP = StripMRP ? StripMRP : 0;
    }
}


export function updateCalculationsForGrItem(grItem: PHRMGoodsReceiptItemsModel) {
    let itmQty = grItem.ItemQTy;
    let itmRate = grItem.GRItemPrice ? grItem.GRItemPrice : 0;
    let freeQty = grItem.FreeQuantity ? grItem.FreeQuantity : 0;
    let totalItemQty = grItem.TotalQuantity ? grItem.TotalQuantity : 0;
    let vatPercentage = grItem.VATPercentage ? grItem.VATPercentage : 0;
    let discPercent = grItem.DiscountPercentage ? grItem.DiscountPercentage : 0;
    if (discPercent == 0) {
        grItem.DiscountAmount = 0;
    }
    let margin = grItem.Margin ? grItem.Margin : 0;
    let disAmt = grItem.DiscountAmount ? grItem.DiscountAmount : 0;
    let ccCharge = grItem.CCCharge ? grItem.CCCharge : 0;
    grItem.SalePrice = CommonFunctions.parseAmount(itmRate + (itmRate * margin / 100), 4);

    let ccAmount = 0;
    ccAmount = freeQty * itmRate * ccCharge / 100;

    let subTotalWithoutCC = itmQty * itmRate;
    let subTotalWithCC = subTotalWithoutCC + ccAmount;
    totalItemQty = itmQty + freeQty;

    let discAmount = subTotalWithoutCC * discPercent / 100;
    let vatAmount = (subTotalWithoutCC - discAmount) * vatPercentage / 100;
    let totalAmt = subTotalWithCC - discAmount + vatAmount;

    let CostPrice = totalAmt / totalItemQty;

    grItem.CCAmount = CommonFunctions.parseAmount(ccAmount, 4);
    grItem.DiscountAmount = CommonFunctions.parseAmount(discAmount, 4);
    grItem.VATAmount = CommonFunctions.parseAmount(vatAmount, 4);
    grItem.SubTotal = CommonFunctions.parseAmount(subTotalWithoutCC, 4);
    grItem.TotalAmount = CommonFunctions.parseAmount(totalAmt, 4);
    grItem.ReceivedQuantity = itmQty;
    grItem.TotalQuantity = totalItemQty;
    grItem.CostPrice = CommonFunctions.parseAmount(CostPrice, 4);
    grItem.CCAmount = CommonFunctions.parseAmount(ccAmount, 4);

    if (disAmt > 0 && discPercent == 0) {
        grItem.DiscountPercentage = 0;
    }
    if (disAmt == 0 && discPercent == 0) {
        grItem.DiscountPercentage = 0;
    }

}
