export class WARDInventoryStockModel {
    StockId: number;
    StoreId: number;
    SubstoreId: number;
    GoodsReceiptItemId: number;
    ItemId: number;
    AvailableQuantity: number;
    MRP: number = 0;
    Price: number = 0;
    BatchNo: string;
    ExpiryDate: string | null;
    DepartmentId: number | null;
    CreatedBy: number;
    CreatedOn: string;
    DispachedQuantity: number = 0;
    ItemName: string;
    Remarks: string;
    UnConfirmedQty: number;
    SubCategoryName: string;
    SubCategoryId: number;
    CostPrice: number = 0;
}