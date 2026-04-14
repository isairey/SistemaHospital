export class ProfileItemMap_DTO {
    BillItemProfileMapId: number = 0;
    ProfileId: number = null;
    PerformerPercent: number = null;
    PrescriberPercent: number = null;
    ReferrerPercent: number = null;
    PriceCategoryId: number = null;
    BillingTypesApplicable: string = null;
    public ServiceItemId: number = null;
    public ItemName: string = '';
    public DepartmentName: string = '';
    public IsSelected: boolean = false;
    public OpdSelected: boolean = true;
    public IpdSelected: boolean = true;
    PriceCategoryName: string;
    IsActive: boolean = true;
    public Price: number = null;

}