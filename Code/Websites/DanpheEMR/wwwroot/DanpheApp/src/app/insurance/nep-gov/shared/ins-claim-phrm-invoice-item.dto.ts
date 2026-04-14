export class INSClaimablePharmacyInvoiceItems {
    public UnitPrice: number = 0;
    public ServiceCode: string = "ADJ02" //* This is hardcoded and not used anywhere else.
    public PatientId: number = 0;
    public Quantity: number = 0;
    public ClaimCode: number = 0;
    public InvoiceId: number = null;
    public ItemName: string = "";
    public ExpiryDate: string = '';
    public BatchNo: string = '';
    public SubTotal: number = 0;
    public DiscountAmount: number = 0;
    RackNo: string = '';
    ItemCode: string = '';
}