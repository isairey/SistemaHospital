export class PostOTCheckList_DTO {
    OTBookingId: number = null;
    PatientId: number = null;
    PatientVisitId: number = null;
    CheckList = new Array<CheckList>();
}

export class CheckList {
    TXNChecklistId: number = 0;
    CheckListId: number = null;
    CheckListValue: string = null;
    Remarks: string = null;
}