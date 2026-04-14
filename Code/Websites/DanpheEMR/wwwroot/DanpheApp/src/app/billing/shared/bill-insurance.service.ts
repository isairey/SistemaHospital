import { Injectable, OnDestroy } from "@angular/core";
import * as moment from "moment";
import { Subscription } from "rxjs";
import { CurrentVisitContextVM } from "../../appointments/shared/current-visit-context.model";
import { CoreBLService } from "../../core/shared/core.bl.service";
import { InsuranceCappingEntryDTO } from "../../core/shared/dto/insurance-capping-entry-info.dto";
import { GovInsuranceBlService } from "../../insurance/nep-gov/shared/insurance.bl.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { BillingTransactionItem } from "./billing-transaction-item.model";
import { InvoiceItem_DTO } from "./dto/billing-invoiceitem.dto";

@Injectable({ providedIn: 'root' })
export class BillInsuranceService implements OnDestroy {
    pastOneYearTestList: BillingTransactionItem[] = [];
    InsuranceCappingEntries: InsuranceCappingEntryDTO[] = [];
    InvoiceItem: InvoiceItem_DTO = new InvoiceItem_DTO();
    billingTransactionItem: BillingTransactionItem = new BillingTransactionItem();
    InformationSubscription = new Subscription();
    patAllPendingItems: BillingTransactionItem[] = [];
    IsValidCapping: boolean = false;

    CurrPatVisitContext: CurrentVisitContextVM = new CurrentVisitContextVM();
    PreviouslySalesQuantity: number;
    RequestedQuantity: number = 1; // By default, all quantity is 1
    AvailableCappingQuantity: number = 0;
    HIBItemDetail: InsuranceCappingEntryDTO;

    constructor(
        private coreBlService: CoreBLService,
        public msgBoxService: MessageboxService,
        public insuranceBLService: GovInsuranceBlService
    ) { }

    ngOnDestroy() {
        this.InformationSubscription.unsubscribe();
        this.cleanup(); // Call cleanup to reset properties
    }

    /**
     * Sets the list of past one year tests for the patient.
     * @param pastTest List of past tests.
     */
    PatientsPastOneYearTestList(pastTest: BillingTransactionItem[]) {
        this.pastOneYearTestList = pastTest;
        console.log(this.pastOneYearTestList);
    }

    /**
     * Sets the current patient visit context.
     * @param currPatVisitContext Current visit context.
     */
    SetPatientVisitContext(currPatVisitContext: CurrentVisitContextVM) {
        this.CurrPatVisitContext = currPatVisitContext;
    }

    /**
     * Sets all pending items for the patient.
     * @param patAllPendingItems List of pending items.
     */
    SetPatientAllPendingItems(patAllPendingItems: BillingTransactionItem[]) {
        this.patAllPendingItems = patAllPendingItems;
        console.log('sent from ip', this.patAllPendingItems);
    }

    /**
     * Checks capping validations for the given item.
     * @param item Billing transaction item.
     */
    CheckCappingValidations(item: BillingTransactionItem) {
        this.billingTransactionItem = item;
    }

    /**
     * Cleans up the service by resetting all properties.
     */
    cleanup() {
        this.pastOneYearTestList = [];
        this.InsuranceCappingEntries = [];
        this.InvoiceItem = new InvoiceItem_DTO();
        this.CurrPatVisitContext = new CurrentVisitContextVM();
        this.PreviouslySalesQuantity = null;
        this.patAllPendingItems = [];
        this.RequestedQuantity = 1;
    }

    /**
     * Evaluates the capping for the given item.
     * @param itemCode Item code.
     * @param capPeriodInDays Capping period in days.
     * @param cappingQuantity Capping quantity.
     * @param requestedQuantity Requested quantity.
     * @param IsItemSelected Indicates if the item is selected.
     * @param IsQuantityChanged Indicates if the quantity is changed.
     */
    private evaluateCapping(itemCode: string, capPeriodInDays: number, cappingQuantity: number, requestedQuantity: number, IsItemSelected: boolean, IsQuantityChanged: boolean): boolean {
        const allTests = [...this.pastOneYearTestList, ...this.patAllPendingItems];
        const relevantTests = allTests.filter(test => test.ItemCode === itemCode);

        if (relevantTests.length === 0) {
            if (requestedQuantity > cappingQuantity) {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Remaining capping quantity: ${cappingQuantity}`]);
                this.IsValidCapping = false;
                return false;
            }
            this.IsValidCapping = true;
            return true;
        }

        const firstUsedTest = relevantTests.reduce((earliest, test) => new Date(test.CreatedOn) < new Date(earliest.CreatedOn) ? test : earliest);
        const firstUsedDate = new Date(firstUsedTest.CreatedOn);
        const nextEligibleDate = new Date(firstUsedDate);
        nextEligibleDate.setDate(nextEligibleDate.getDate() + capPeriodInDays);
        const currentDate = new Date();
        const remainingDays = moment(nextEligibleDate).diff(moment(currentDate), 'days');

        const usedQuantityInCappingPeriod = relevantTests.reduce((total, test) => {
            const testDate = new Date(test.CreatedOn);
            if (testDate >= firstUsedDate && testDate < nextEligibleDate) {
                return total + (test.Quantity || 0);
            }
            return total;
        }, 0);

        const remainingCappingQuantity = cappingQuantity - usedQuantityInCappingPeriod;
        this.AvailableCappingQuantity = remainingCappingQuantity < 0 ? 0 : remainingCappingQuantity;

        if (currentDate < nextEligibleDate) {
            if (requestedQuantity > this.AvailableCappingQuantity) {
                if (IsItemSelected && this.AvailableCappingQuantity <= 0) {
                    this.msgBoxService.showMessage(
                        ENUM_MessageBox_Status.Notice, [`Insurance capping is applied. You cannot use the item '${itemCode}' for the next ${remainingDays} days.`]);
                }
                if (IsQuantityChanged) {
                    this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Remaining capping quantity: ${this.AvailableCappingQuantity}`]);
                }
                this.IsValidCapping = false;
                return false;
            } else {
                this.IsValidCapping = true;
                return true;
            }
        } else {
            if (requestedQuantity > cappingQuantity) {
                if (IsQuantityChanged) {
                    this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Remaining capping quantity: ${this.AvailableCappingQuantity}`]);
                }
                this.IsValidCapping = false;
                return false;
            } else {
                // Reason: If the requested quantity is within the limit, allow the usage.
                this.IsValidCapping = true;
                return true;
            }
        }
    }

    /**
     * Validates if capping is applicable for the given invoice item.
     * @param invoiceItem Invoice item.
     * @param IsItemSelected Indicates if the item is selected.
     * @param IsQuantityChanged Indicates if the quantity is changed.
     */
    ValidateCappingApplicable(invoiceItem: InvoiceItem_DTO, isCappingEnabled: boolean, IsItemSelected: boolean, IsQuantityChanged: boolean, RequestedQuantity?: number): boolean {
        this.InvoiceItem = invoiceItem;
        const requestedQuantity = RequestedQuantity;
        const matchingItemDetail = this.InsuranceCappingEntries.find(itm => itm.Code === this.InvoiceItem.ItemCode);
        if (matchingItemDetail) {
            this.HIBItemDetail = matchingItemDetail;
            return this.evaluateCappingFromHIB(this.HIBItemDetail, requestedQuantity, IsItemSelected, IsQuantityChanged, invoiceItem);
        }
        this.IsValidCapping = true;
        return true;
    }

    /**
     * Checks if capping is applicable locally for the given invoice item.
     * @param invoiceItem Invoice item.
     * @param IsItemSelected Indicates if the item is selected.
     * @param IsQuantityChanged Indicates if the quantity is changed.
     */
    CheckCappingApplicableLocally(invoiceItem: InvoiceItem_DTO, isCappingEnabled: boolean, IsItemSelected: boolean, IsQuantityChanged: boolean, RequestedQuantity?: number): boolean {
        this.RequestedQuantity = RequestedQuantity;
        if (isCappingEnabled) {
            return this.evaluateCapping(invoiceItem.ItemCode, invoiceItem.CappingLimitDays, invoiceItem.CappingQuantity, this.RequestedQuantity, IsItemSelected, IsQuantityChanged);
        } else {
            this.IsValidCapping = true;
            return true;
        }
    }

    /**
     * Centralized method to validate capping.
     * @param invoiceItem Invoice item.
     * @param IsItemSelected Indicates if the item is selected.
     * @param IsQuantityChanged Indicates if the quantity is changed.
     * @param RequestedQuantity Requested quantity.
     * @param UseCappingAPI Indicates if the capping API should be used.
     */
    ValidateCapping(UseCappingAPI: boolean, isCappingEnabled: boolean, invoiceItem: InvoiceItem_DTO, IsItemSelected: boolean, IsQuantityChanged: boolean, reqQuantity?: number): boolean {
        const RequestedQuantity = reqQuantity ? reqQuantity : this.RequestedQuantity;
        if (UseCappingAPI) {
            return this.ValidateCappingApplicable(invoiceItem, isCappingEnabled, IsItemSelected, IsQuantityChanged, RequestedQuantity);
        } else {
            return this.CheckCappingApplicableLocally(invoiceItem, isCappingEnabled, IsItemSelected, IsQuantityChanged, RequestedQuantity);
        }
    }

    /**
     * Gets insurance capping information for the given NSHI number.
     * @param NSHINumber NSHI number.
     * @summary This method is used to get the insurance capping information for the given NSHI number. If no data is found then it will return an empty array.and checks from the local settings.
     */
    GetInsuranceCappingInformation(NSHINumber: string) {
        this.InsuranceCappingEntries = [];
        this.coreBlService.GetCappingResponse(NSHINumber).subscribe({
            next: (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this.InsuranceCappingEntries = res.Results.entries
                        .filter(a => a.itemserv === 'service')
                        .map(a => ({
                            ...a,
                            CapQtyPeriod: a.CapQtyPeriod !== null ? a.CapQtyPeriod : 0,
                            QtyRemain: a.QtyRemain !== null ? a.QtyRemain : 0,
                        }));
                    console.log(this.InsuranceCappingEntries);
                } else {
                    console.log(res.ErrorMessage);
                }
            },
            error: (error: any) => {
                console.log(error);
            }
        });
    }

    private evaluateCappingFromHIB(HIBItemDetail: InsuranceCappingEntryDTO, requestedQuantity: number, IsItemSelected: boolean, IsQuantityChanged: boolean, invoiceItem: InvoiceItem_DTO): boolean {
        const availableQty = HIBItemDetail && HIBItemDetail.QtyRemain != null ? HIBItemDetail.QtyRemain : 0;
        if (availableQty <= 0) {
            this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Insurance capping is applied. Remaining capping quantity: ${availableQty}.`]);
            this.IsValidCapping = false;
            return false;
        }
        this.AvailableCappingQuantity = availableQty;
        if (requestedQuantity > availableQty) {
            if (IsItemSelected && availableQty <= 0) {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Insurance capping is applied. Remaining capping quantity: ${availableQty}.`]);
            }
            if (IsQuantityChanged) {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Remaining capping quantity: ${availableQty}.`]);
            }
            this.IsValidCapping = false;
            return false;
        } else {
            this.IsValidCapping = true;
            return true;
        }
    }
}

