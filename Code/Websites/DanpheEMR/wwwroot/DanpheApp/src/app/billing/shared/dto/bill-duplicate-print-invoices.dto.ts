export class PatientBillingDTO {
    PatientId: number = 0;
    PatientCode: string = null;
    ShortName: string = null;
    Gender: string = null;
    DateOfBirth: string = null;
    PaidDate: string = null;
    TransactionDate: string = null;
    TotalAmount: number = 0;
    BillingTransactionId: number = 0;
    InvoiceNumber: number = 0;
    InvoiceCode: string = null;
    FiscalYear: string = null;
    FiscalYearId: number = 0;
    InvoiceNumFormatted: string = null;
    PhoneNumber: string = null;
    IsInsuranceBilling: boolean;
    OrganizationId: number = 0;
    OrganizationName: string = null;
    PaymentMode: string = null;
    PhoneNumber1: string = null;
    Age: string = null;
}
