import { Type } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ClinicalReusableFreeTypeElement } from "../../reusable-component/reusable-elements/free-type-element/free-type-element.component";
import { ClinicalReusableMultipleSelectionElement } from "../../reusable-component/reusable-elements/multiple-selection-element/multiple-selection-element.component";
import { ClinicalReusableNumberElement } from "../../reusable-component/reusable-elements/number-element/number-element.component";
import { QuestionaryWrapperComponent } from "../../reusable-component/reusable-elements/questionary-wrapper/questionary-wrapper.component";
import { ClinicalReusableSelectionElement } from "../../reusable-component/reusable-elements/selection-element/selection-element.component";
import { SmartPrintableFormComponent } from "../../reusable-component/reusable-elements/smart-printable-form/smart-printable-form.component";
import { ClinicalReusableTextElement } from "../../reusable-component/reusable-elements/text-element/text-element.component";

export class TextboxConfig {
    type: Type<ClinicalReusableTextElement>;
    key: string;
    label: string;
    form: FormGroup;
}
export class FreeTypeConfig {
    type: Type<ClinicalReusableFreeTypeElement>;
    key: string;
    label: string;
    form: FormGroup;
}

export class NumberConfig {
    type: Type<ClinicalReusableNumberElement>;
    key: string;
    label: string;
    form: FormGroup;
}

export class SingleSelectionConfig {
    type: Type<ClinicalReusableSelectionElement>;
    key: string;
    label: string;
    form: FormGroup;
    options: GeneralizedOption[];
}

export class MultipleSelectConfig {
    type: Type<ClinicalReusableMultipleSelectionElement>;
    key: string;
    label: string;
    form: FormGroup;
    options: GeneralizedOption[];
}

export class PreTemplateConfig {
    type: Type<any>;
    form: FormGroup;
}

export class QuestionaryFieldConfig {
    type: Type<QuestionaryWrapperComponent>;
    key: string;
    label: string;
    form: FormGroup;
    questionaryConfig: any[];
}

export class GeneralizedOption {
    label: string;
    value: string;
}

export class SmartPrintableFormConfig {
    type: Type<SmartPrintableFormComponent>;
    templateCode: string = "";
    IsPrintButton: boolean = false;


}