export class PostOTMapSurgeryCheckList_DTO {
    MapSurgeryCheckListItems = new Array<MapSurgeryCheckListItems>()
    SurgeryId: number = 0;
}

export class MapSurgeryCheckListItems {
    SurgeryCheckListId: number = 0;
    SurgeryId: number = 0;
    CheckListId: number = 0;
    DisplaySequence: number = 0;
    IsMandatory: boolean = false;
    IsActive: boolean = false;
}
