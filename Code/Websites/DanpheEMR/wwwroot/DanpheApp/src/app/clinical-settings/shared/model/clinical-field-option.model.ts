export class ClinicalOption {
    ClinicalOptionId: number;
    FieldId: number;
    Options: string;
    CreatedOn: Date;
    CreatedBy: number;
    ModifiedOn: Date | null;
    ModifiedBy: number | null;
    IsActive: boolean;
}