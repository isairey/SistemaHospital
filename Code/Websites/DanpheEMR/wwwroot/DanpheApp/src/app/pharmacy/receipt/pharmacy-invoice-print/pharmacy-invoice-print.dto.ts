export class PharmacyInvoicePrint_DTO {
  InvoiceId: number = null;
  InvoiceCode: string = '';
  ReceiptDate: string = '';
  ProviderName: string = '';
  ProviderNMCNumber: string = '';
  PrintCount: number = 0;
  CurrentFiscalYearName: string = '';
  ReceiptPrintNo: number = null;
  ClaimCode: number = null;
  PolicyNo: number = null;
  PaymentMode: string = '';
  SubTotal: number = 0;
  DiscountPercentage: number = 0;
  DiscountAmount: number = 0;
  VATPercentage: number = 0;
  VATAmount: number = 0;
  CashAmount: number = 0;
  CreditAmount: number = 0;
  TaxableAmount: number = 0;
  NonTaxableAmount: number = 0;
  TotalAmount: number = 0;
  Tender: number = 0;
  Change: number = 0;
  CreditOrganizationName: string = '';
  Remarks: string = '';
  BillingUser: string = '';
  IsReturned: boolean = false;
  StoreId: number = 0;
  LocalReceiptDate: string = '';
  PatientVisitId: number = 0;
  PrescriberId: number = 0;
  SchemeId: number = 0;
  SchemeApiIntegration: string = "";
  InvoiceItems: PharmacyInvoicePrintItem_DTO[] = [];
  PaymentModeDetails: Array<PaymentMode> = new Array<PaymentMode>();
  PatientInfo: PatientInfo_DTO = new PatientInfo_DTO();
  StoreName: string = "";
  PaymentDetails: string = "";
  DepositList: Array<DepositDetail_DTO> = new Array<DepositDetail_DTO>();

}

export class PatientInfo_DTO {
  PatientId: number = 0;
  PatientCode: string = '';
  ShortName: string = '';
  Address: string = '';
  CountrySubDivisionName: string = '';
  Gender: string = '';
  Age: string = '';
  DateOfBirth: string = '';
  PhoneNumber: string = '';
  PANNumber: string = '';
  CountryName: string = '';
  WardNumber: string = '';
  MunicipalityName: string = '';
  VisitCode: string = '';
  PolicyNo: string = '';
  SchemeName: string = '';
  ClaimCode: number = null;
}
export class PharmacyInvoicePrintItem_DTO {
  ItemName: string = '';
  GenericName: string = '';
  ItemDisplayName: string = '';
  Quantity: number = 0;
  ReturnedQty: number = 0;
  ExpiryDate: string = '';
  BatchNo: string = '';
  RackNo: string = '';
  SalePrice: number = 0;
  SubTotal: number = 0;
  DiscountAmount: number = 0;
  VATAmount: number = 0;
  TotalAmount: number = 0;
  ItemCode: number = 0;
  HSCode: number = 0;
}

export class PaymentMode {
  PaymentSubCategoryName: string = null;
  InAmount: number = null;
}
export class DepositDetail_DTO {
  ReceiptNo: string = '';
  TransactionType: string = '';
  DepositAmount: number = 0;
  ReceiptDate: string = '';
}
