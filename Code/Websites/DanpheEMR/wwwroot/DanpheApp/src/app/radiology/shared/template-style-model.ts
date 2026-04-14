import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class TemplateStyleModel {
    public TemplateStyleId: number = 0;
    public HeaderStyle: string = null;
    public TemplateName: string = "";
    public TemplateCode: string = "";
    public FooterStyle: string = null;
    public TemplateId: number = null;
    public CreatedBy: number = null;
    public CreatedOn: string = null;
    public ModifiedBy: number = null;
    public ModifiedOn: string = null;
    public IsActive: boolean = true;
    TemplateStyleFormValidator: FormGroup;
    constructor(
    ) {
        let _formBuilder = new FormBuilder;
        this.TemplateStyleFormValidator = _formBuilder.group({
            TemplateId: [0, Validators.required],
            HeaderStyle: [''],
            FooterStyle: ['']
        })
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined) {
            return this.TemplateStyleFormValidator.dirty;
        }
        else {
            return this.TemplateStyleFormValidator.controls[fieldName].dirty;
        }
    }
    public IsValid(): boolean {
        if (this.TemplateStyleFormValidator.valid) {
            return true;
        }
        else {
            return false;
        }
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.TemplateStyleFormValidator.dirty;
        }
        else {
            return !(this.TemplateStyleFormValidator.hasError(validator, fieldName));
        }
    }
}