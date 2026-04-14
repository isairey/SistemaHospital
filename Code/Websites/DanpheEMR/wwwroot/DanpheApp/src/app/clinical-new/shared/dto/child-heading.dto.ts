import { FormGroup } from "@angular/forms";
import { Field } from "./field.dto";

export class ChildHeading {
    ClinicalHeadingId: number;
    ClinicalHeadingName: string;
    DisplayName: string;
    DisplayOrder: number;
    ParentId: number;
    IsDefault: boolean;
    Field: Field[];
    ActiveTab?: boolean;
    IsPrintable?: boolean = false;
    Form: FormGroup;
}
