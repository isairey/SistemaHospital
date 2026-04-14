import { Questionary } from "./questionary.dto";
import { SingleSelectMultipleSelect } from "./singleselect-multipleselect.dto";
import { TextBoxFreeTypeNumber } from "./textbox-freetype-number.dto";

export class FormFieldData_DTO {
    textBoxFreeTypeNumber: TextBoxFreeTypeNumber[];
    singleSelectMultipleSelect: SingleSelectMultipleSelect[];
    questionary: Questionary[];
}
