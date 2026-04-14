import { OptionAnswers } from "./option-answers.dto";

export class SingleSelectMultipleSelect {
    ClinicalInformationId: number;
    PatientId: number;
    PatientVisitId: number;
    ClinicalHeadingId: number;
    ParentHeadingId?: number;
    FieldId: number;
    InputType: string;
    FieldValue: string;
    Remarks: string;
    OptionAnswers: OptionAnswers[];
}
