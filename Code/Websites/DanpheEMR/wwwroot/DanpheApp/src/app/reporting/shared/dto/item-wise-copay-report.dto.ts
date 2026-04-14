export class ItemwiseCopayReport_DTO {
    public ransactionDate: String = '';
    public NepMonthName: String = '';
    public EngMonthName: String = '';
    public ReceiptNo: String = '';
    public BillingType: String = '';
    public VisitType: String = '';
    public HospitalNumber: String = '';
    public ClaimCode: String = '';
    public SchemeName: String = '';
    public PolicyNo: String = '';
    public PatientName: String = '';
    public ServiceDepartmentName: String = '';
    public ItemName: String = '';
    public Price: number = 0;
    public Quantity: number = 0;
    public SubTotal: number = 0;
    public DiscountAmount: number = 0;
    public TotalAmount: number = 0;
    public CoPayCashAmount: number = 0;
    public CoPayCreditAmount: number = 0;
    public AssignedToDoctor: String = '';
    public ReferredByDoctor: String = '';
    public PrescriberDoctor: String = '';
    public Remarks: String = '';
    public ReferenceReceiptNo: String = '';
    public UserName: String = '';
}