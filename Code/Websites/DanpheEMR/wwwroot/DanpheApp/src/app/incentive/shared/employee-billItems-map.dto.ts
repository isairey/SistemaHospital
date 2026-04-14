import { ItemGroupDistributionModel } from "./item-group-distribution.model";

export class EmployeeBillItemsMap_DTO {

  public EmployeeBillItemsMapId: number = 0;
  public EmployeeId: number = 0;
  public PriceCategoryId: number = 0;
  public PriceCategoryName: string = "";
  public ServiceItemId: number = 0;
  public PerformerPercent: number = 0;
  public PrescriberPercent: number = 0;
  public ReferrerPercent: number = 0;
  public OpdSelected: boolean = true;
  public IpdSelected: boolean = false;
  public HasGroupDistribution: boolean = false;
  public IsActive: boolean = true;
  public BillingTypesApplicable: string = null;
  public GroupDistribution: Array<ItemGroupDistributionModel> = [];
  public ItemName: string = "";
  public Price: number = null;
  IsSelected: boolean = false;
  public ServiceDepartmentId: number = 0;

}
