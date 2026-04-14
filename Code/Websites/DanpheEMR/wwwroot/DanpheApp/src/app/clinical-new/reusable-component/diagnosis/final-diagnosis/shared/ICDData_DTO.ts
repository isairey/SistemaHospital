export class ICDData {
    ICD10Code: string = '';

    ICD10Id: number = 0;

    icd10Description: string = '';

    Active: boolean = false;

}
export class StoreData {
    ICDDataList: ICDData[] = [];
    Remark: string = '';
    IsCauseOfDeath: boolean = false;
}
