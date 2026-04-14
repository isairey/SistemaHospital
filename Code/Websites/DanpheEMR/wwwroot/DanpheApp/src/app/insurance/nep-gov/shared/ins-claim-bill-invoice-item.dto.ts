export class INSClaimableBillingInvoiceItems {
    public BillingTransactionItemId: number = null;
    public PatientId: number = null;
    public BillingTransactionId: number = null;
    public ServiceDepartmentId: number = null;
    public ItemId: number = null;
    public ServiceDepartmentName: string = null;
    public ItemName: string = null;
    public Price: number = null;
    public Quantity: number = null;
    public SubTotal: number = null;
    public DiscountAmount: number = null;
    public TotalAmount: number = null;
    public PerformerId: number = null;
    public PerformerName: string = null;
    public RequestedById: number = null;
    public RequestedByName: string = null;
    public RequestedBy: string = null;
    public PriceCategory: string = null;
    public ServiceCode: string = null;
    public IsCopayment: boolean = false;
    DiscountPercent: number = 0;
}