
import { ChildHeading } from "./child-heading.dto";
import { Field } from "./field.dto";

export class ParentHeading_DTO {
    ClinicalHeadingId: number;
    ClinicalHeadingName: string;
    DisplayName: string;
    DisplayOrder: number;
    ParentId: number;
    IsDefault: boolean;
    ChildHeading: ChildHeading[];
    Field: Field[];
    ActiveTab?: boolean = false;
    IsPrintable?: boolean = false;
}