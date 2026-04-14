import { QuestionarySingleSelectMultipleSelect } from "./questionary-singleselect-multiple-select.dto";
import { QuestionaryTextBoxFreeTypeNumber } from "./questionary-textbox-freetype-number.dto";

export class Questionary {
    ClinicalInformationId: number;
    PatientId: number;
    PatientVisitId: number;
    ClinicalHeadingId: number;
    ParentHeadingId?: number;
    FieldId: number;
    InputType: string;
    FieldValue: string;
    Remarks: string;
    QuestionaryData: {
        textBoxFreeTypeNumber: QuestionaryTextBoxFreeTypeNumber[];
        singleSelectMultipleSelect: QuestionarySingleSelectMultipleSelect[];
    };
}
