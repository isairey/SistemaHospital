export class GetOTCheckList_DTO {
    TXNChecklistId: number = null;
    CheckListId: number = null;
    OTBookingId: number = null;
    PatientId: number = null;
    PatientVisitId: number = null;
    CheckListValue: string = null;
    Remarks: string = null;
    CreatedBy: number = null;
    CreatedOn: string = null;
    ModifiedBy: number = null;
    ModifiedOn: string = null;

    //Later Added for Showing CheckListName on Grid during Assigning CheckList
    // CheckListName: string = null;
    DisplayName: string = null;
    InputType: string = null;
}