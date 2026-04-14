import { ClinicalUserFieldList_DTO } from "./field-list-view.dto";

export class AddUpdateClinicalUserFieldMappingsDTO {
    DepartmentId?: number;
    ClinicalHeadingId: number;
    FieldList = Array<ClinicalUserFieldList_DTO>();
    EmployeeId?: number;
    ModifiedBy?: number;
    ModifiedOn?: Date;
    IsActive: boolean;
}

