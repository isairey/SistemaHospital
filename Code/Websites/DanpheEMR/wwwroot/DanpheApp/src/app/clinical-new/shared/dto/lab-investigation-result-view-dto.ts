export class LabInvestigationResultsView_DTO {
  public TestName: string = "";
  public ComponentName: string = "";
  public Unit: string = "";
  public Values: Array<string> = [];
  public MaleRange: string = '';
  public FemaleRange: string = '';
  public ChildRange: string = '';
  public Range: string = '';
  public ValueType: string = '';
  public ReferenceRange: string = '';
  public RangeDescription: string = '';
  IsAbnormal: boolean;
  public Value: number;

}
