import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { PageNotFound } from '../../404-error/404-not-found.component';
import { InvoiceHeaderListComponent } from '../../shared/invoice-header/invoice-header-list.component';
import { AccountHeadListComponent } from './accounthead/account-head-list.component';
import { CompanyListComponent } from './company/company-list.component';
import { ConsumptionTypeListComponent } from './consumption-type/consumption-type-list.component';
import { CurrencyListComponent } from './currency/currency-list';
import { InventorySettingsComponent } from './inventory-settings.component';
import { ItemListComponent } from './item/item-list';
import { ItemSubCategoryListComponent } from './itemsubcategory/item-subcategory-list';
import { OtherChargesListComponent } from './othercharges/other-charges-list/other-charges-list.component';
import { PackagingTypeListComponent } from './packagingtype/packaging-type-list';
import { TermsListComponent } from './termsconditions/terms-list.component';
import { UnitOfMeasurementListComponent } from './unitofmeasurement/unit-of-measurement-list';
import { VendorListComponent } from './vendors/vendor-list';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: InventorySettingsComponent,
        children: [
          { path: '', redirectTo: 'item-list', pathMatch: 'full' },
          { path: 'vendor-list', component: VendorListComponent },
          // { path: 'itemcategory-list', component: ItemCategoryListComponent }, //not required Yubraj --2nd April 2019
          { path: 'AccountHeadList', component: AccountHeadListComponent },
          { path: 'packagingtype-list', component: PackagingTypeListComponent },
          { path: 'unitofmeasurement-list', component: UnitOfMeasurementListComponent },
          { path: 'item-list', component: ItemListComponent },
          { path: 'CurrencyList', component: CurrencyListComponent },
          { path: 'company-list', component: CompanyListComponent },
          { path: 'TermsList', component: TermsListComponent },
          { path: 'sub-category-list', component: ItemSubCategoryListComponent },
          { path: 'InvoiceHeaders/:module', component: InvoiceHeaderListComponent },
          { path: 'other-charges', component: OtherChargesListComponent },
          { path: 'ConsumptionTypes', component: ConsumptionTypeListComponent },
          { path: "**", component: PageNotFound }
        ]
      }
    ])
  ],
  exports: [
    RouterModule
  ]
})

export class InventorySettingRoutingModule {

}
