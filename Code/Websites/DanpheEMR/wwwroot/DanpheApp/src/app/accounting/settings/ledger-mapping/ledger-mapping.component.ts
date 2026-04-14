
import { Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { ENUM_ACC_ADDLedgerLedgerType, ENUM_ACC_ConsumptionLevel, ENUM_ACC_SectionCodes } from "../../../shared/shared-enums";
import { AccountingService } from "../../shared/accounting.service";
import { SectionModel } from "../shared/section.model";

// Bikash,31st March 2022, refactored ledger mapping into respective separate files 
// i.e. Billing items, consultant, credit organization, inventory subcategory, inventory-vendor and pharmacy suppliers mappings

@Component({
  templateUrl: './ledger-mapping.html'
})
export class LedgerMappingComponent {

  public LedgerType: string;
  public TypeSupplier: boolean = false;
  public TypeConsultant: boolean = false;
  public TypeCreditOrganization: boolean = false;
  public TypeInventoryVendor: boolean = false;
  public TypeInventorySubstore: boolean = false;
  public TypeInventorySubcategory: boolean = false;
  public TypeBillingLedger: boolean = false;
  public TypePaymentMode: boolean = false;
  public TypeBankReconciliationCategory: boolean = false;
  public TypeMedicareTypes: boolean = false;
  public SectionData: SectionModel[] = [];
  public ActiveHopsitalId: number = 0;
  public SubStoreAndSubCategorySetting: string = 'InventorySubStore';
  constructor(public coreService: CoreService, public accountingService: AccountingService, public securityServ: SecurityService) {
    // initializing ledger type as 'billing income ledger' //Bikash,31st March 2022
    // this.LedgerType = ENUM_ACC_ADDLedgerLedgerType.PharmacySupplier;
    this.ActiveHopsitalId = this.securityServ.AccHospitalInfo.ActiveHospitalId;
    this.SubStoreAndSubCategorySetting = this.coreService.GetPharmacySubstoreAndSubcategory();
    let manualVoucherSectionId = 4;
    this.SectionData = this.accountingService.accCacheData.Sections.filter(a => a.HospitalId === this.ActiveHopsitalId && a.SectionId !== manualVoucherSectionId);
    this.MapDisplaySection();
  }


  tempLedgerDisplayList: LedgerDisplayList_DTO[] = [];
  LedgerDisplayList: LedgerDisplayList_DTO[] = [];

  MapDisplaySection() {
    this.LedgerDisplayList = [];
    const existingLedgerTypes = new Set(); // To track which LedgerTypes have been added

    this.SectionData.forEach((s) => {
      const itemsToAdd = [];

      if (s.SectionCode === ENUM_ACC_SectionCodes.Pharmacy) {
        if (this.SubStoreAndSubCategorySetting == ENUM_ACC_ConsumptionLevel.InventorySubStore) {
          itemsToAdd.push(
            {
              "PermissionValue": "{\"name\":\"accounting-create-inventory-substore-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
              "LedgerType": "InventoryConsumption",
              "LedgerDisplayName": "Inventory SubStore"
            }
          );
        } else {
          itemsToAdd.push(
            {
              "PermissionValue": "{\"name\":\"accounting-create-inventory-subcategory-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
              "LedgerType": "inventorysubcategory",
              "LedgerDisplayName": "Inventory SubCategory"
            }
          );
        }
        itemsToAdd.push(
          {
            "PermissionValue": "{\"name\":\"accounting-create-phrm-supplier-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "pharmacysupplier",
            "LedgerDisplayName": "Pharmacy Supplier"
          },
          {
            "PermissionValue": "{\"name\":\"accounting-create-credit-organization-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "creditorganization",
            "LedgerDisplayName": "Credit Organizations"
          },
          {
            "PermissionValue": "",
            "LedgerType": "paymentmodes",
            "LedgerDisplayName": "Payment Modes"
          }
        );
      }

      if (s.SectionCode === ENUM_ACC_SectionCodes.Inventory) {
        if (this.SubStoreAndSubCategorySetting == ENUM_ACC_ConsumptionLevel.InventorySubStore) {
          itemsToAdd.push(
            {
              "PermissionValue": "{\"name\":\"accounting-create-inventory-substore-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
              "LedgerType": "InventoryConsumption",
              "LedgerDisplayName": "Inventory SubStore"
            }
          );
        } else {
          itemsToAdd.push(
            {
              "PermissionValue": "{\"name\":\"accounting-create-inventory-subcategory-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
              "LedgerType": "inventorysubcategory",
              "LedgerDisplayName": "Inventory SubCategory"
            }
          );
        }

        itemsToAdd.push(
          {
            "PermissionValue": "{\"name\":\"accounting-create-inventory-vendor-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "inventoryvendor",
            "LedgerDisplayName": "Inventory Vendor"
          }
        );
      }

      if (s.SectionCode === ENUM_ACC_SectionCodes.Billing) {
        itemsToAdd.push(
          {
            "PermissionValue": "{\"name\":\"accounting-create-billing-item-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "billingincomeledger",
            "LedgerDisplayName": "Billing Ledgers"
          },
          {
            "PermissionValue": "{\"name\":\"accounting-create-credit-organization-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "creditorganization",
            "LedgerDisplayName": "Credit Organizations"
          },
          {
            "PermissionValue": "",
            "LedgerType": "paymentmodes",
            "LedgerDisplayName": "Payment Modes"
          }
        );
      }

      if (s.SectionCode === ENUM_ACC_SectionCodes.Incentive) {
        itemsToAdd.push(
          {
            "PermissionValue": "{\"name\":\"accounting-create-consultant-credit-ledger-button-permission\",\"actionOnInvalid\":\"hidden\"}",
            "LedgerType": "consultant",
            "LedgerDisplayName": "Consultant (Credit A/C)"
          }
        );
      }

      itemsToAdd.forEach((item) => {
        const shouldAdd = !existingLedgerTypes.has(item.LedgerType);

        if (shouldAdd) {
          this.tempLedgerDisplayList.push(item);
          existingLedgerTypes.add(item.LedgerType);
        }
      });
    });

    const distinctLedgerTypes = new Set();
    const distinctList = this.tempLedgerDisplayList.filter((item) => {
      if (!distinctLedgerTypes.has(item.LedgerType)) {
        distinctLedgerTypes.add(item.LedgerType);
        return true;
      }
      return false;
    });

    this.LedgerDisplayList = distinctList;
    if (this.LedgerDisplayList.length > 0) {
      this.LedgerType = this.LedgerDisplayList[0].LedgerType;
      this.ToggleLedgerType(this.LedgerType);
    }
  }

  ToggleLedgerType(LedgerType) {

    this.LedgerType = LedgerType;


    if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.PharmacySupplier) {
      this.MakeAllLedgerTypeFalse();
      this.TypeSupplier = true;

    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.InventoryVendor) {

      this.MakeAllLedgerTypeFalse();
      this.TypeInventoryVendor = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.Consultant) {
      this.MakeAllLedgerTypeFalse();
      this.TypeConsultant = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.CreditOrganization) {
      this.MakeAllLedgerTypeFalse();
      this.TypeCreditOrganization = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.InventoryConsumption) {
      this.MakeAllLedgerTypeFalse();
      this.TypeInventorySubstore = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.InventorySubCategory) {
      this.MakeAllLedgerTypeFalse();
      this.TypeInventorySubcategory = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.BillingPriceItem) {
      this.MakeAllLedgerTypeFalse();
      this.TypeBillingLedger = true;
    }
    // else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.BillingPriceItem) {
    //   this.MakeAllLedgerTypeFalse();
    //   this.TypeBillingLedger = true;
    // }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.PaymentModes) {
      this.MakeAllLedgerTypeFalse();
      this.TypePaymentMode = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.BankReconciliationCategory) {
      this.MakeAllLedgerTypeFalse();
      this.TypeBankReconciliationCategory = true;
    }
    else if (LedgerType == ENUM_ACC_ADDLedgerLedgerType.MedicareTypes) {
      this.MakeAllLedgerTypeFalse();
      this.TypeMedicareTypes = true;
    }
  }

  MakeAllLedgerTypeFalse() {
    this.TypeSupplier = false;
    this.TypeBillingLedger = false;
    this.TypeConsultant = false;
    this.TypeCreditOrganization = false;
    this.TypeInventorySubstore = false;
    this.TypeInventorySubcategory = false;
    this.TypeInventoryVendor = false;
    this.TypePaymentMode = false;
    this.TypeBankReconciliationCategory = false;
    this.TypeMedicareTypes = false;

  }

}
class LedgerDisplayList_DTO {

  public PermissionValue: string = '';
  public CSSValue: string = '';
  public LedgerType: string = '';
  public LedgerDisplayName: string = '';
}

