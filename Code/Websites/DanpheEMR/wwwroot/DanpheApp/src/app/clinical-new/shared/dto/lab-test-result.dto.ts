export class LabTestResult_DTO {
  public ComponentName: string = '';
  public Value: string = '';
  public Unit: string = '';
  public ValueType: string = '';

  public MaleRange: string = '';
  public FemaleRange: string = '';
  public ChildRange: string = '';
  public Range: string = '';
  public RangeDescription: string = '';
  public TestCategoryName: string = '';
  public CreatedOn: Date;
  public ReferenceRange: string = '';
  public LabTestName: string = '';
  IsAbnormal: boolean = false;

}
export class GroupedLabTestItemDTO {
  Category: string;
  Items: LabTestResult_DTO[];
}
