import { ClinicalQuestionAnswer_DTO, ClinicalQuestionOption_DTO } from "../clinical-info-preview/dto/clinical-data.dto";
import { PreviewConfiguration } from "./field.dto";
import { QuestionOption } from "./question-option.dto";

export class QuestionaryConfig {
    QuestionId: number;
    FieldId: number;
    Question: string;
    AnswerType: string;
    IsActive: boolean;
    Options: QuestionOption[];

    FieldConfig?: any;
    PreviewConfig?: PreviewConfiguration = new PreviewConfiguration();
    ClinicalQuestionAnswers?: ClinicalQuestionAnswer_DTO[];
    ClinicalQuestionOptions?: ClinicalPreviewQuestionOptions[];
}
export class ClinicalPreviewQuestionOptions {
    IsEditable: boolean = false;
    IsPrintable: boolean = false;
    // IsInEditMode: boolean;
    QuestionOptions: ClinicalQuestionOption_DTO[];
}