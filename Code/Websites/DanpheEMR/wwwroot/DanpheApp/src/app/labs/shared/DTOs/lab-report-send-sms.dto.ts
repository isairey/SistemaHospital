export class LabReportSendSMS_DTO {
    public MaxPhoneNumCountInSingleBatch: number = 0;
    public SMSText: string = "";
    public PatientInfo: Array<LabReportSendSMSPatientInfo_DTO> = new Array<LabReportSendSMSPatientInfo_DTO>();
}
export class LabReportSendSMSPatientInfo_DTO {
    public patientId: number;
    public PhoneNumber: string;
    public LabRequisitions: Array<number>;
}