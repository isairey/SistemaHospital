import { ClinicalCommonData_DTO } from "./clinical-common-data.dto";


export class ClinicalData_DTO extends ClinicalCommonData_DTO {
    ClinicalInformationId: number;
    ClinicalHeadingId: number;
    FieldId: number;
    InputType: string;
    FieldValue: string;
    Remarks: string;
    ClinicalHeadingName: string;
    ParentId: number;
    HeadingDisplayName: string;
    FieldCode: string;
    FieldName: string;
    FieldDisplayName: string;
    IsEditable: boolean = false;
    ClinicalOptionsData: ClinicalOptions_DTO[];
    ClinicalAnswerData: ClinicalQuestionAnswer_DTO[];
    ClinicalAnswerOptionData: ClinicalQuestionOption_DTO[];
    // IsInEditMode?: boolean = false;
    IsPrintable?: boolean = false;


}

export class ClinicalOptions_DTO extends ClinicalCommonData_DTO {
    ClinicalOptionRecordId: number;
    ClinicalInformationId: number;
    ParentHeadingId: number;
    FieldId: number;
    OptionId: number;
    Options: string;
}

export interface ClinicalQuestionAnswer_DTO extends ClinicalCommonData_DTO {
    ClinicalQuestionAnswerId: number;
    ClinicalInformationId: number;
    ClinicalHeadingId: number;
    ParentHeadingId: number;
    FieldId: number;
    QuestionId: number;
    AnswerValue: string;
    Remarks: string;
    AnswerType: string;
    Question: string;
    // IsInEditMode?: boolean;
    IsPrintable?: boolean;
    IsEditable?: boolean;
}

export interface ClinicalQuestionOption_DTO extends ClinicalCommonData_DTO {
    ClinicalAnswerOptionId: number;
    ClinicalInformationId: number;
    ClinicalHeadingId: number;
    ParentHeadingId: number;
    FieldId: number;
    QuestionId: number;
    QuestionOptionId: number;
    Remarks: string;
    QuestionOption: string;
}