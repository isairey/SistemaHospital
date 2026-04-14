import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ENUM_ClinicalPhrases_EditorType, ENUM_PhrasesAccessibility } from "../../../shared/shared-enums";

export class PersonalPhrases {
    PredefinedTemplateId: number;
    TemplateName: string;
    TemplateCode: string;
    TemplateGroup: string;
    TemplateType = Object.values(ENUM_ClinicalPhrases_EditorType);;
    TemplateContent: string = "";
    IsActive: boolean;
    TemplateAccessibility = Object.values(ENUM_PhrasesAccessibility);
    ClinicalMyPhrasesValidator: FormGroup;

    constructor() {
        var _formBuilder = new FormBuilder();
        this.ClinicalMyPhrasesValidator = _formBuilder.group({
            'TemplateName': ['', Validators.compose([Validators.required])],
            'TemplateCode': ['', Validators.compose([Validators.required, Validators.maxLength(10), Validators.pattern(/^(?=.*[A-Za-z0-9])[A-Za-z0-9 ]*$/)])],
            'TemplateAccessibility': [ENUM_PhrasesAccessibility.Personal],
            'TemplateGroup': [''],
            'TemplateType': [ENUM_ClinicalPhrases_EditorType.SimpleText]
        });
    }

    public IsValid(): boolean {
        if (this.ClinicalMyPhrasesValidator.valid) {
            return true;
        }
        else {
            return false;
        }
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.ClinicalMyPhrasesValidator.valid;
        else
            return !(this.ClinicalMyPhrasesValidator.hasError(validator, fieldName));
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ClinicalMyPhrasesValidator.dirty;
        else
            return this.ClinicalMyPhrasesValidator.controls[fieldName].dirty;
    }
}