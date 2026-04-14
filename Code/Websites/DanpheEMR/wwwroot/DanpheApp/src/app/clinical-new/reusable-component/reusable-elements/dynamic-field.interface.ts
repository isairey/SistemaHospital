import { Field } from "../../shared/dto/field.dto";
import { QuestionaryConfig } from "../../shared/dto/questionary-config.dto";

export interface IDynamicElement {
    Field: Field;
    Question: QuestionaryConfig;
}