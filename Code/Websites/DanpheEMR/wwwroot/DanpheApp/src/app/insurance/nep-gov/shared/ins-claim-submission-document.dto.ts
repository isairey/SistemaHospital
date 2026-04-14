export class INSClaimSubmissionSingleDocument_DTO {
    public PatientId: number = 0;
    public claim_id: number = 0;
    public name: string = '';
    public access_code: string = '';
    public file: string = '';
}

export class INSClaimSubmissionMultipleDocument_DTO {
    public PatientId: number = 0;
    public claim_id: number = 0;
    public name: string = '';
    public access_code: string = '';
    public file: string[] = [];
}