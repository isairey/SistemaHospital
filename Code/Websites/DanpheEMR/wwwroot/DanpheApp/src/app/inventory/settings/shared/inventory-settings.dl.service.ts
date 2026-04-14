import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConsumptionType } from '../consumption-type/consumption-type.model';

@Injectable()
export class InventorySettingDLService {
  public options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
  };
  public jsonOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(public http: HttpClient) { }



  //GET

  public GetAccountHeadList() {
    return this.http.get<any>("/api/InventorySettings?reqType=AccountHeadList");
  }
  public GetAccountHead(showIsActive: boolean) {
    return this.http.get<any>(`/api/InventorySettings/AccountHeads?showIsActive=${showIsActive}`);
  }
  // getMappedledgerlist
  public getMappedledgerlist(ledgerType) {
    return this.http.get<any>("/api/Accounting/MappedLedgers?ledgerType=" + ledgerType);
  }
  public GetCurrencyCode() {
    return this.http.get<any>("/api/InventorySettings/CurrencyCodes");
  }
  public GetItemList() {
    return this.http.get<any>("/api/InventorySettings?reqType=ItemList");
  }
  public GetTermsConditions(termsApplicationId) {
    return this.http.get<any>(`/api/InventorySettings/TermsListByTermsApplicationId?termsApplicationId=${termsApplicationId}`, this.options);
  }

  // public GetItem() {
  //   return this.http.get<any>("/api/InventorySettings/ItemsWithUnit");
  // }
  public GetPackagingType() {
    return this.http.get<any>("/api/InventorySettings/PackagingTypes");
  }
  public GetUnitOfMeasurement() {
    return this.http.get<any>("/api/InventorySettings/UnitOfMeasurements");
  }
  public GetItemCategory() {
    return this.http.get<any>("/api/InventorySettings/ItemCategories");
  }
  public GetItemSubCategory() {
    return this.http.get<any>("/api/InventorySettings/ItemSubCategories");
  }
  public GetItemCategoryList() {
    return this.http.get<any>("/api/InventorySettings/Vendors");
  }
  public GetPackagingTypeList() {
    return this.http.get<any>("/api/InventorySettings?reqType=PackagingTypeList");
  }
  public GetUnitOfMeasurementList() {
    return this.http.get<any>("/api/InventorySettings?reqType=UnitOfMeasurementList");
  }
  public GetVendorsList() {
    return this.http.get<any>("/api/InventorySettings/Vendors");
  }
  // public GetVendors() {
  //   return this.http.get<any>("/api/InventorySettings/VendorsWithDefaultItems");
  // }

  public getActiveRbacRoles() {
    return this.http.get<any>("/api/InventorySettings/ActiveRbacRoles");
  }

  //POST

  public PostAccountHead(currentAccountHead) {
    let data = JSON.stringify(currentAccountHead);
    return this.http.post<any>("/api/InventorySettings/AccountHead", data, this.options);
  }
  public PostCurrency(currentCurrency) {
    let data = JSON.stringify(currentCurrency);
    return this.http.post<any>("/api/InventorySettings/Currency", data, this.options);
  }
  public PostTerms(currentData) {
    let data = JSON.stringify(currentData);
    return this.http.post<any>("/api/InventorySettings/InventoryTerm", data, this.options);
  }

  public PostItem(currentItem) {
    let data = JSON.stringify(currentItem);
    return this.http.post<any>("/api/InventorySettings/Item", data, this.options);
  }
  public PostItemCategory(currentItemCategory) {
    let data = JSON.stringify(currentItemCategory);
    return this.http.post<any>("/api/InventorySettings/ItemCategory", data, this.options);
  }
  public PostItemSubCategory(currentItemSubCategory) {
    let data = JSON.stringify(currentItemSubCategory);
    return this.http.post<any>("/api/InventorySettings/ItemSubCategory", data, this.options);
  }
  public PostPackagingType(currentPackagingType) {
    let data = JSON.stringify(currentPackagingType);
    return this.http.post<any>("/api/InventorySettings/PackagingType", data, this.options);
  }
  public PostUnitOfMeasurement(currentUnitOfMeasurement) {
    let data = JSON.stringify(currentUnitOfMeasurement);
    return this.http.post<any>("/api/InventorySettings/UnitOfMeasurement", data, this.options);
  }
  public PostVendor(currentVendor) {
    let data = JSON.stringify(currentVendor);
    return this.http.post<any>("/api/InventorySettings/Vendor", data, this.options);
  }



  //PUT

  public PutAccountHead(accountHead) {
    return this.http.put<any>("/api/InventorySettings/AccountHead", accountHead, this.options);
  }
  public PutCurrency(currency) {
    return this.http.put<any>("/api/InventorySettings/Currency", currency, this.options);
  }
  public PutItem(item) {
    return this.http.put<any>("/api/InventorySettings/Item", item, this.options);
  }
  public PutItemCategory(itemCategory) {
    return this.http.put<any>("/api/InventorySettings/ItemCategory", itemCategory, this.options);
  }
  public PutItemSubCategory(itemSubCategory) {
    return this.http.put<any>("/api/InventorySettings/ItemSubCategory", itemSubCategory, this.options);
  }
  public PutPackagingType(packagingType) {
    return this.http.put<any>("/api/InventorySettings/PackagingType", packagingType, this.options);
  }
  public PutUnitOfMeasurement(unitOfMeasurement) {
    return this.http.put<any>("/api/InventorySettings/UnitOfMeasurement", unitOfMeasurement, this.options);
  }
  public PutVendor(vendor) {
    return this.http.put<any>("/api/InventorySettings/Vendor", vendor, this.options);
  }

  public PutTerms(currentData) {
    return this.http.put<any>("/api/InventorySettings/InventoryTerm", currentData, this.options);
  }
  SaveConsumptionType(ConsumptionType: ConsumptionType) {
    return this.http.post(`/api/InventorySettings/ConsumptionType`, ConsumptionType, this.jsonOptions);
  }

  UpdateConsumptionType(ConsumptionType: ConsumptionType) {
    return this.http.put(`/api/InventorySettings/ConsumptionType`, ConsumptionType, this.jsonOptions);
  }

  GetConsumptionTypes() {
    return this.http.get(`/api/InventorySettings/ConsumptionTypes`, this.options);
  }

  GetActiveConsumptionTypes() {
    return this.http.get(`/api/InventorySettings/ActiveConsumptionTypes`, this.options);
  }

  ActivateDeActiveConsumptionType(consumptionTypeId: number, activate: boolean) {
    return this.http.put(`/api/InventorySettings/ActiveDeactivateConsumptionType?consumptionTypeId=${consumptionTypeId}&activate=${activate}`, this.jsonOptions)
  }
}
