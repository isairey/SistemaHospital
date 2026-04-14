import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { CreditOrganization } from '../../pharmacy/shared/pharmacy-credit-organizations.model';
import { PHRMStoreModel, StoreBillHeader } from '../../pharmacy/shared/phrm-store.model';
import { ENUM_DispensaryType } from '../../shared/shared-enums';
import { DispensaryEndpoint } from './dispensary.endpoint';
import { InsurancePackageBillServiceItem_DTO } from './DTOs/insurance-package-bill-service-item.dto';

@Injectable()
export class DispensaryService {

  /**
   * @description eagerly loaded dispensary list -- sanjit 2Aug'21
   */
  private dispensaryList: PHRMStoreModel[] = [];
  public AllCreditOrganizationsList = [];
  public BillingCreditOrganizationList = [];
  PatientVisitId: number = 0;
  PatientId: number = 0;
  PatientCode: string = '';
  InsurancePackageBillServiceItems: InsurancePackageBillServiceItem_DTO[];

  constructor(public dispensaryEndpoint: DispensaryEndpoint) { }

  //sanjit: 14 May'20, to implement authorization in Dispensary  Module.
  private _activeDispensary: PHRMStoreModel = new PHRMStoreModel();
  public get activeDispensary(): PHRMStoreModel {
    return this._activeDispensary;
  }
  public set activeDispensary(dispensary: PHRMStoreModel) {
    this._activeDispensary = dispensary;
    this._isInsuranceDispensary = (dispensary.SubCategory == ENUM_DispensaryType.insurance);
  }

  private _isInsuranceDispensary: boolean = false;
  public get isInsuranceDispensarySelected(): boolean {
    return this._isInsuranceDispensary;
  }

  GetAllDispensaryList() {
    if (this.dispensaryList != null && this.dispensaryList.length > 0)
      return Observable.of({ Status: "OK", Results: this.dispensaryList });
    else
      return this.dispensaryEndpoint.GetAllDispensaryList()
        .map(res => res)
        .do(res => {
          if (res.Status == "OK")
            this.dispensaryList = res.Results
          return res;
        });
  }
  GetAllPharmacyStores() {
    return this.dispensaryEndpoint.GetAllPharmacyStores().map(res => res);
  }
  AddDispensary(dispensary: PHRMStoreModel) {
    var temp = _.omit(dispensary, ['StoreValidator']);
    temp = JSON.stringify(temp);
    return this.dispensaryEndpoint.AddDispensary(temp)
      .map(res => { return res })
      .do(res => {
        if (res.Status == "OK")
          this.dispensaryList.push(res.Results)
        return res;
      });
  }
  UpdateDispensary(dispensary: PHRMStoreModel) {
    var temp = _.omit(dispensary, ['StoreValidator']);
    temp = JSON.stringify(temp);
    return this.dispensaryEndpoint.UpdateDispensary(temp)
      .map(res => { return res })
      .do(res => {
        if (res.Status == "OK") {
          this.callBackAfterUpdateFunc(res.Results as PHRMStoreModel);
        }
        return res;
      });
  }
  ActivateDeactivateDispensary(dispensaryId: number) {
    return this.dispensaryEndpoint.ActivateDeactivateDispensary(dispensaryId)
      .map(res => { return res })
      .do(res => {
        if (res.Status == "OK") {
          var savedDisp = this.dispensaryList.find(d => d.StoreId == dispensaryId)
          savedDisp.IsActive = !savedDisp.IsActive
        }
        return res;
      });
  }
  getActiveDispensary() {
    return this.dispensaryEndpoint.getActiveDispensary()
      .map(res => { return res });
  }
  DeactivateDispensary() {
    return this.dispensaryEndpoint.DeactivateDispensary()
      .map(res => { return res });
  }
  ActivateDispensary(dispensaryId: number, dispensaryName: string) {
    return this.dispensaryEndpoint.ActivateDispensary(dispensaryId, dispensaryName)
      .map(res => { return res });
  }
  /**
   * @param dispensaryId: the id of the dispensary 
   * @returns the required dispensary header values as StoreBillHeader Object
   */
  getDispensaryHeader(dispensaryId: number): StoreBillHeader {
    const dispensary = this.dispensaryList.find(d => d.StoreId == dispensaryId && d.UseSeparateInvoiceHeader == true);
    return dispensary as StoreBillHeader
  }

  /**
   * @description Helper function to only update the required field of the dispensary
   */
  private callBackAfterUpdateFunc(updatedDispensary: PHRMStoreModel) {
    var savedDisp = this.dispensaryList.find(d => d.StoreId == updatedDispensary.StoreId);
    savedDisp.Name = updatedDispensary.Name;
    savedDisp.SubCategory = updatedDispensary.SubCategory;
    savedDisp.StoreDescription = updatedDispensary.StoreDescription;
    savedDisp.StoreLabel = updatedDispensary.StoreLabel;
    savedDisp.PanNo = updatedDispensary.PanNo;
    savedDisp.Address = updatedDispensary.Address;
    savedDisp.ContactNo = updatedDispensary.ContactNo;
    savedDisp.Email = updatedDispensary.Email;
    savedDisp.UseSeparateInvoiceHeader = updatedDispensary.UseSeparateInvoiceHeader;
    savedDisp.PrintInvoiceHeaderInDotMatrix = updatedDispensary.PrintInvoiceHeaderInDotMatrix;
    savedDisp.IsActive = updatedDispensary.IsActive;
  }
  public SetAllCreditOrgList(creditOrgFromServer: Array<CreditOrganization>) {
    this.AllCreditOrganizationsList = creditOrgFromServer;
  }

  public SetAllBillingCreditOrgList(creditOrgFromServer: Array<any>) {
    this.BillingCreditOrganizationList = creditOrgFromServer;
  }

  /**
   * This sets PatientId, PatientVisitId in the service
   * @param patientId 
   * @param patientVisitId 
   */
  SetPatientIdAndVisitIdForProvisionalView(patientId: number, patientVisitId: number, patientCode: string) {
    this.PatientVisitId = patientVisitId;
    this.PatientId = patientId;
    this.PatientCode = patientCode;
  }
  /**
   * This method set InsurancePackageBillServiceItem into the service for further need.
   */
  SetInsurancePackageBillServiceItems(serviceItems: InsurancePackageBillServiceItem_DTO[]) {
    this.InsurancePackageBillServiceItems = serviceItems;
  }

}
