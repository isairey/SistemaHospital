import { LabComponentModel } from "../../../shared/lab-component-json.model";

export class MachineResultsVM {
    public LISComponentResultId: number = 0;
    public LISComponentId: number = 0;
    public LabTestId: number = 0;
    public RequisitionId: number = 0;
    public BarCodeNumber: number = 0;
    public PatientId: number = 0;
    public TemplateId: number = 0;
    public PatientVisitId: number = 0;
    public LabTestName: string = "";
    public RunNumber: string = "";
    public HospitalNumber: string = "";
    public LISComponentName: string = "";
    public VisitType: string = "";
    public AbnormalType: string = "";
    public PatientName: string = "";
    public Gender: string = "";
    public Age: string = "";
    public DateOfBirth: string = "";
    public Value: string = "";
    public ConversionFactor: number = 0;
    public MachineUnit: string = "";
    public IsSelected: boolean = false;
    public IsValueValid: boolean = false;
    public CreatedBy: number = 0;
    public IsAbnormal: boolean = false;
    public CreatedOn: string = "";
    public Component: LabComponentModel = new LabComponentModel();
    public DisplaySequence: number = 0;
    public GroupName: string = "";
    public IsGroupValid: boolean = true;
    public ErrorMessage: string = "";
}

export class MachineResultsFormatted {
    public BarCodeNumber: number = 0;
    public HospitalNumber: string = "";
    public PatientId: number = 0;
    public LabTestId: number = 0;
    public LabTestName: string = "";
    public PatientName: string = "";
    public RunNumber: string = "";
    public Data: Array<MachineResultsVM> = new Array<MachineResultsVM>();
}