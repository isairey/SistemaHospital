export class PHRMDepositBalanceReportModel {
    PatientId: number = 0;
    PatientName: string = '';
    PatientCode: string = '';
    DateOfBirth: string = '';
    Gender: string = '';
    PhoneNumber: string = '';
    TotalDeposit: number = 0;
    TotalDeducted: number = 0;
    TotalRefunded: number = 0;
    Balance: number = 0;
}