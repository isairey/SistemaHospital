import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ClinicalUserFieldList_DTO } from "./field-list-view.dto";

export class ClinicalUserFieldMappingsDTO {
    ClinicalUserFieldId?: number;
    DepartmentName: string;
    ClinicalHeadingName: string;
    ParentHeadingName: string;
    ClinicalHeadingId: number;
    EmployeeName: string;
    IsActive: boolean;
    DepartmentId: number;
    EmployeeId?: number;
    ParentHeadingId?: number;
    FieldList = new Array<ClinicalUserFieldList_DTO>();
    ClnFieldMappingsGroup: FormGroup;
    constructor() {
        const _formBuilder = new FormBuilder();
        this.ClnFieldMappingsGroup = _formBuilder.group({
            'DepartmentId': [''],
            'EmployeeId': [''],
            'ClinicalHeadingId': ['', Validators.compose([Validators.required])],
            'ParentHeadingId': ['', Validators.compose([Validators.required])],
        },);
    }


    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.ClnFieldMappingsGroup.valid;
        }
        else
            return !(this.ClnFieldMappingsGroup.hasError(validator, fieldName));
    }

}

