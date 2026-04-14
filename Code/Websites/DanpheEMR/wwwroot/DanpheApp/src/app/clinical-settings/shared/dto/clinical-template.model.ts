import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ENUM_ClinicalPhrases_EditorType } from "../../../shared/shared-enums";

export class ClinicalTemplate {
    public TemplateId: number;
    public TemplateCode: string = "";
    public TemplateName: string = "";

    public TemplateHTML: string = "";
    public IsDefaultForThisType: boolean;
    public CreatedBy: number;
    public CreatedOn: string;
    public ModifiedBy: number;
    public ModifiedOn: string = "";
    public IsActive: boolean;
    public EditorType: string;
    public DynamicTemplateValidator: FormGroup;
    TemplateType: string = "";
    PrintHospitalHeader: boolean = true;


    constructor() {
        var _formBuilder = new FormBuilder();
        this.DynamicTemplateValidator = _formBuilder.group({
            'TemplateCode': ['', Validators.compose([Validators.required])],
            'TemplateName': ['', Validators.compose([Validators.required])],
            'TemplateType': ['', Validators.compose([Validators.required])],
            'PrintHospitalHeader': [true, Validators.compose([Validators.required])],
            'EditorType': [ENUM_ClinicalPhrases_EditorType.SimpleText],
        });
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.DynamicTemplateValidator.dirty;
        else
            return this.DynamicTemplateValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean {
        if (this.DynamicTemplateValidator.valid) {
            return true;
        }
        else {
            return false;
        }
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.DynamicTemplateValidator.valid;
        else
            return !(this.DynamicTemplateValidator.hasError(validator, fieldName));
    }
}
