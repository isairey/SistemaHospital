export class LabFinalReportList_DTO {
    PatientId: number;
    PatientCode: string;
    DateOfBirth: string;
    PhoneNumber: string;
    Gender: string;
    PatientName: string;
    FirstName: string;
    LastName: string;
    Email: string;
    SampleCodeFormatted: string;
    VisitType: string;
    RunNumberType: string;
    IsFileUploadedToTeleMedicine: boolean | string;
    IsPrinted: boolean;
    BillingStatus: string;
    BarCodeNumber: number;
    ReportId: number;
    WardName: string;
    ReportGeneratedBy: string;
    LabTestCSV: string;
    LabRequisitionIdCSV: string;
    AllowOutpatientWithProvisional: boolean;
    IsValidToPrint: number;
}