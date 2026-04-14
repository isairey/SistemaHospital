import { QuestionarySingleSelectMultipleSelect } from "../../dto/questionary-singleselect-multiple-select.dto";
import { QuestionaryTextBoxFreeTypeNumber } from "../../dto/questionary-textbox-freetype-number.dto";

export class QuestionaryData {
    ClinicalInformationId: number;
    PatientId: number;
    PatientVisitId: number;
    ClinicalHeadingId: number;
    ParentHeadingId?: number;
    FieldId: number;
    InputType: string;
    FieldValue: string;
    Remarks: string;

}
export class QTextBoxFreeTypeNumber extends QuestionaryData {
    TextBoxFreeTypeNumberData: QuestionaryTextBoxFreeTypeNumber;
}
export class QSingleSelectMultipleSelect extends QuestionaryData {
    QuestionarySingleSelectMultipleSelectData: QuestionarySingleSelectMultipleSelect;
}