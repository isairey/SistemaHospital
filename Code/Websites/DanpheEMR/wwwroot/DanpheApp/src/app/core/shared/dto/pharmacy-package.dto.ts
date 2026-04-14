export class PharmacyPackage_DTO {
    PharmacyPackageId: number = 0;
    PackageCode: string = '';
    PharmacyPackageName: string = '';
    Description: string = '';
}


export class PharmacyPackageItem_DTO {
    PharmacyPackageId: number = 0;
    PackageItemId: number = 0;
    ItemId: number = 0;
    ItemName: string = "";
    GenericId: number = 0;
    GenericName: string = "";
    ItemCode: string = '';
    Quantity: number = 0;
}