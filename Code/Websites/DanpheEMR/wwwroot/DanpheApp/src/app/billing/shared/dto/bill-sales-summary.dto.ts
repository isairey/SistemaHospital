export class BillingSalesSummaryReportDto {
    PatientVisitId: number;
    VisitCode: string;
    SchemeName: string;
    PriceCategoryName: string;
    ItemName: string;
    Quantity: number;
    ReturnQuantity: number;
    TotalQuantity: number;
    SaleRate: number;
    SubTotal: number;
    DiscountAmount: number;
    Total: number;
    Remarks: string;
}
