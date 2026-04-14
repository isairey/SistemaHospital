import { BillingPackageServiceItemForGridDTO } from "./bill-package-service-item-for-grid.dto";

export class BillingPackageForGrid_DTO {
  BillingPackageId: number;
  BillingPackageName: string;
  Description: string;
  TotalPrice: number;
  DiscountPercent: number;
  PackageCode: string;
  IsActive: boolean;
  LabTypeName: string;
  PackageType: string;
  SchemeId: number;
  PriceCategoryId: number;
  PriceCategoryName: string;
  IsEditable: boolean;
  IsItemLevelDiscount: boolean;
  IsDiscountEditableInSales: boolean;
  IsHealthPackage: boolean;
  IsItemLoadPackage: boolean;
  BillingPackageServiceItemList: BillingPackageServiceItemForGridDTO[];
}
