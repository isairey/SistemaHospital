import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { CurrentVisitContextVM } from "../appointments/shared/current-visit-context.model";
import { BillingMasterBlService } from "../billing/shared/billing-master.bl.service";
import { BillingTransactionItem } from "../billing/shared/billing-transaction-item.model";
import { BillingPackages_DTO } from "../billing/shared/dto/billing-packages.dto";
import { ServiceItemDetails_DTO } from "../billing/shared/dto/service-item-details.dto";
import { CoreService } from "../core/shared/core.service";
import { SettingsBLService } from "../settings-new/shared/settings.bl.service";
import { ServiceDepartmentVM } from "./common-masters.model";
import { DanpheHTTPResponse } from "./common-models";
import { MessageboxService } from "./messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "./shared-enums";

@Injectable({ providedIn: 'root' })
export class PackageBillingService {
    public SchemeId: number;
    public PriceCategoryId: number;
    public SelectedPackage: BillingPackages_DTO = new BillingPackages_DTO();
    public ServicePackages: BillingPackages_DTO[] = [];
    public FilteredPackages: BillingPackages_DTO[] = [];
    public serviceDeptList: ServiceDepartmentVM[] = [];
    public serviceItemList: ServiceItemDetails_DTO[] = [];
    public CurrPatVisitContextSubject: CurrentVisitContextVM;
    public TransactionItems: BillingTransactionItem[] = [];


    constructor(private billingMasterBlService: BillingMasterBlService,
        public coreService: CoreService,
        public settingsBLService: SettingsBLService,
        private _messageBoxService: MessageboxService,
    ) {
        this.serviceDeptList = this.coreService.Masters.ServiceDepartments;
    }
    public SetCurrPatVisitContext(currPatVisitContextSubject: CurrentVisitContextVM) {
        this.CurrPatVisitContextSubject = currPatVisitContextSubject;
    }
    SetServiceItem(ServiceItems: ServiceItemDetails_DTO[]) {
        this.serviceItemList = ServiceItems;
    }
    /**
     * 
     * @param SchemeId 
    *  @summary fetches the list pf packages 
     * @param PriceCategoryId 
     * @returns list of packages
     */
    GetServicePackages(SchemeId, PriceCategoryId): Observable<BillingPackages_DTO[]> {
        return this.billingMasterBlService.GetServicePackages(SchemeId, PriceCategoryId)
            .pipe(map((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.FilteredPackages = res.Results.filter(a => a.IsItemLoadPackage === true);
                    return this.FilteredPackages;
                } else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to fetch ServicePackages"]);
                    console.log(res.ErrorMessage);
                    return [];
                }
            })
            );
    }
    /**
     * 
     * @param selectedPackage 
     * @summary When package is selected its items are mapped as individual items and pushed to new list 
     */
    handleSelectedPackage(selectedPackage: BillingPackages_DTO): void {
        this.TransactionItems = [];
        this.SelectedPackage = selectedPackage;
        this.SelectedPackage.BillingPackageServiceItemList.forEach((itm) => {
            const billingTransactionItem = new BillingTransactionItem();
            billingTransactionItem.BillingPackageId = itm.BillingPackageId;
            billingTransactionItem.DiscountPercent = itm.DiscountPercent;
            billingTransactionItem.PerformerId = itm.PerformerId;
            billingTransactionItem.Quantity = itm.Quantity;
            billingTransactionItem.ServiceItemId = itm.ServiceItemId;
            billingTransactionItem.Price = itm.Price;
            const tempServiceItem = this.serviceItemList.find(a => a.ServiceItemId === itm.ServiceItemId);
            if (tempServiceItem) {
                billingTransactionItem.ServiceDepartmentId = tempServiceItem.ServiceDepartmentId;
                billingTransactionItem.ServiceDepartmentName = tempServiceItem.ServiceDepartmentName;
                billingTransactionItem.ItemName = tempServiceItem.ItemName;
                billingTransactionItem.ItemCode = tempServiceItem.ItemCode;
                billingTransactionItem.IntegrationItemId = tempServiceItem.IntegrationItemId;
            }
            if (selectedPackage.IsEditable) {
                billingTransactionItem.DisableAssignedDrField = false;
            } else {
                billingTransactionItem.DisableAssignedDrField = true;
            }
            billingTransactionItem.PrescriberName = this.CurrPatVisitContextSubject.PerformerName;
            billingTransactionItem.PrescriberId = this.CurrPatVisitContextSubject.PerformerId;
            this.TransactionItems.push(billingTransactionItem);
        })
    }
    getTransactionItems(): BillingTransactionItem[] {
        return this.TransactionItems;
    }
}