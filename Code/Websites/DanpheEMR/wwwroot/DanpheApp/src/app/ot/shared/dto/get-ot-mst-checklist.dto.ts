export class GetOTMSTCheckList_DTO {
    CheckListId: number = null;
    ServiceItemId: number = null;
    CheckListName: string = null;
    DisplayName: string = null;
    InputType: string = null;
    IsMandatory: boolean = null;
    DisplaySequence: number = null;
    LookUp: string = null;
    CreatedBy: number = null;
    CreatedOn: string = null;
    ModifiedBy: number = null;
    ModifiedOn: string = null;
    IsActive: boolean = false;
    LookUpList = new Array<string>();
    Remarks: string = null; //!Sanjeev, required for form Array
    CheckListValue: string = null; //!Sanjeev, required for form Array

}