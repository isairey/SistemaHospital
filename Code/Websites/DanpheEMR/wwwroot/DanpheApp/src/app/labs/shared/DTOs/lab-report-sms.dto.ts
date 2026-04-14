export class LabReportSMS_DTO {
  public PatientId: number = 0;
  public PatientName: string = "";
  public Age: string = "";
  public Gender: string = "";
  public PatientCode: string = "";
  public IsPhoneNumberValid: boolean = false;
  public IsSelected: boolean = false;
  public PhoneNumber: string = "";
  public IsSmsSend: boolean = false;
  public TestNamesCSV: string = "";
  public VerifiedTestNamesCSV: string = "";
  public PendingTestNamesCSV: string = "";
  public RequisitionsCSV: string = "";
  public VerifiedRequisitionsCSV: string = "";
  public RequisitionIdPlusReportIdCSV: string = "";
  public IsFileUploadedToTeleMedicine: boolean = false;
  public IsFileUploaded: boolean = false;
}
