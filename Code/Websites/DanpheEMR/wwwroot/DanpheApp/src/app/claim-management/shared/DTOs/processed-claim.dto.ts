export class ProcessedClaim_Dto {
    public ClaimedDate: string = '';
    public ClaimCode: string = '';
    public PolicyNo: string = '';
    public ShortName: string = '';
    public PatientCode: string = '';
    public ClaimReferenceNo: string = '';
}

export class AddAttachmentDTO {
    public claim: string;
    public documents: AttachmentDocument[];
}

export class AttachmentDocument {
    public filename: string;
    public mime: string;
    public title: string;
    public date: string;
    public isRolledBack: boolean;
    public document: string;
}

