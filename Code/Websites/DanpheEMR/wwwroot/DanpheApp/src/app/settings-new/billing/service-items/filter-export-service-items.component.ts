import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_ServiceItemStatus } from "../../../shared/shared-enums";
import { IntegrationName } from "../../shared/integration-name.model";
import { ServiceDepartment } from "../../shared/service-department.model";
import { SettingsBLService } from "../../shared/settings.bl.service";
import { BillServiceItemModel, ServiceCategories } from "../shared/bill-service-item.model";
import { FilterExportServiceItem_DTO } from "../shared/dto/filter-export-service-item.dto";
import { PriceCategory_DTO } from './../../shared/DTOs/price-category.dto';


@Component({
  selector: 'filter-export-service-items',
  templateUrl: './filter-export-service-items.component.html',
})
export class ServiceItemsFilterExportComponent {
  SrvdeptList = new Array<ServiceDepartment>();
  PriceCategory = new Array<PriceCategory_DTO>();
  Status: Array<string> = [];
  PriceCategoryList = new Array<number>();
  ServiceItemList = new Array<number>();

  @Input('ShowFilterAnd-Export')
  ShowFilterAndExport: boolean = false;

  @Input('Service-Categories')
  ServiceCategoryList = new Array<ServiceCategories>();

  @Input('IntegrationName-List')
  IntegrationNameList = new Array<IntegrationName>();

  @Input("Service-Items")
  ServiceItems = new Array<BillServiceItemModel>();

  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  FilterItems = new FilterExportServiceItem_DTO();
  FilterAndExportValidator: FormGroup;
  FilterAndExportItems = new Array<BillServiceItemModel>();
  FilteredServiceItemsList = new Array<BillServiceItemModel>();

  constructor(
    private _settingsBLService: SettingsBLService,
    private _msgBoxServ: MessageboxService,
    private _formBuilder: FormBuilder) {
    this.Status = Object.values(ENUM_ServiceItemStatus);
    this.GetSrvDeptList();
    this.GetPriceCategories();
  }
  ngOnInit(): void {
    this.FilterAndExportValidator = this._formBuilder.group({
      'ServiceDepartmentId': [''],
      'ServiceCategoryId': [''],
      'IntegrationName': [''],
      'Status': ['']
    });
    this.FilteredServiceItemsList = this.ServiceItems;
  }
  /**
     * @summary Fetches the list of service departments.
    */
  public GetSrvDeptList(): void {
    this._settingsBLService.GetServiceDepartments().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.SrvdeptList = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No list found of service departmnents."]);
          }
        }
      }, err => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get service departments"]);
        console.error(err);
      });
  }

  /**
   * @summary Filters service items based on user criteria.
   */
  FilteredServiceItems(): void {
    let selectedSerdeptId = this.FilterAndExportValidator.value.ServiceDepartmentId;
    if (selectedSerdeptId && this.ServiceItems.length > 0) {
      let parseSelectedSerdeptId = +selectedSerdeptId;
      this.FilteredServiceItemsList = this.ServiceItems.filter(a => a.ServiceDepartmentId === parseSelectedSerdeptId);
    }
    else {
      this.FilteredServiceItemsList = [...this.ServiceItems];
    }
  }

  /**
     * @summary Updates the selected price categories based on user input.
     * @param price Array of selected price category objects.
     * @returns void
  */
  PriceCategoryChange(price): void {
    this.PriceCategoryList = [];
    price.forEach(price => {
      if (price.PriceCategoryId) {
        this.PriceCategoryList.push(price.PriceCategoryId);
      }
    });
  }

  /**
 * @summary Updates the selected service items based on user input.
 * @param item Array of selected service item objects.
 * @returns void
 */
  ServiceItemChange(item): void {
    this.ServiceItemList = [];
    item.forEach(item => {
      if (item.ServiceItemId) {
        this.ServiceItemList.push(item.ServiceItemId);
      }
    });
  }
  /**
 * @summary Emits a callback event to close the modal.
 */
  Close() {
    this.CallbackAdd.emit({ action: "close", data: null });
  }


  /**
 * @summary Fetches the list of active price categories.
 */
  GetPriceCategories(): void {
    this._settingsBLService.GetPriceCategories().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.PriceCategory = res.Results;
            this.PriceCategory = this.PriceCategory.filter(item => item.IsActive == true);
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No list found of Price Category."]);
          }
        }
      }, err => {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Price category"]);
        console.error(err);
      });
  }

  /**
  * @summary Filters service items based on user criteria and exports them to an Excel file.
  *
  * @description This method allows users to filter service items using various criteria such as
  * Service Department, Service Category, Integration Name, Status, Price Categories, and specific Service Items.
  * It processes the available list of service items to match the selected filter values. If any filter is left unselected,
  * the method treats it as "no filtering" for that parameter. The resulting filtered data is then transformed into
  * a format suitable for Excel export. Dynamic columns are created for each selected Price Category to include
  * the price details for those categories. If no matching data is found, a notification is displayed to the user.
  * Otherwise, the data is exported as an Excel file named `ServiceItems.xlsx`.
  *
  * @returns void - No value is returned. The filtered data is exported to an Excel file.
  */
  FilterAndExport() {
    const filterValues = this.FilterAndExportValidator.value;
    this.FilterItems.ServiceDepartmentId = +filterValues.ServiceDepartmentId;
    this.FilterItems.ServiceCategoryId = +filterValues.ServiceCategoryId;
    this.FilterItems.IntegrationName = filterValues.IntegrationName;
    if (filterValues.Status === ENUM_ServiceItemStatus.Active) {
      this.FilterItems.Status = true;
    } else if (filterValues.Status === ENUM_ServiceItemStatus.Inactive) {
      this.FilterItems.Status = false;
    }
    else {
      this.FilterItems.Status = null;
    }
    this.FilterItems.PriceCategoryIds = this.PriceCategoryList;
    this.FilterItems.ServiceItemIds = this.ServiceItemList;

    this._settingsBLService.GetFilteredServiceItemList(this.FilterItems)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results.length === 0) {
              this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No relevant data found for the specified filters."]);
              return;
            }
            if (res.Results && res.Results.length > 0) {
              this.FilterAndExportItems = res.Results;
              this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                "Filtered Service Items fetched successfully"
              ]);
              this.Close();
              const categoriesToInclude = this.PriceCategoryList.length > 0
                ? this.PriceCategory.filter(function (cat) {
                  return this.PriceCategoryList.includes(cat.PriceCategoryId);
                }.bind(this))
                : this.PriceCategory;
              const exportData = this.FilterAndExportItems.map(item => {
                let row = {
                  ServiceDepartment: item.ServiceDepartmentName,
                  ItemCode: item.ItemCode,
                  ItemName: item.ItemName,
                  Description: item.Description,
                  IsActive: item.IsActive ? 'True' : 'False',
                  Category: item.ServiceCategoryName,
                  TaxApplicable: item.IsTaxApplicable ? 'True' : 'False',
                  IntegrationName: item.IntegrationName
                };
                categoriesToInclude.forEach(function (priceCategory) {
                  let priceDetail = null;
                  if (item.PriceDetails && Array.isArray(item.PriceDetails)) {
                    priceDetail = item.PriceDetails.find(function (pd) {
                      return pd.PriceCategoryId === priceCategory.PriceCategoryId;
                    });
                  }
                  row[priceCategory.PriceCategoryName] = priceDetail && priceDetail.Price ? priceDetail.Price : '';
                });
                return row;
              });
              const worksheet = XLSX.utils.json_to_sheet(exportData);
              const workbook = { Sheets: { 'Service Items': worksheet }, SheetNames: ['Service Items'] };
              XLSX.writeFile(workbook, 'ServiceItems.xlsx');
            }
            else {
              this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Service Items with These filteres"]);
            }
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get filtered Service Items, check log for details']);
          }
        }
      });
  }

}

