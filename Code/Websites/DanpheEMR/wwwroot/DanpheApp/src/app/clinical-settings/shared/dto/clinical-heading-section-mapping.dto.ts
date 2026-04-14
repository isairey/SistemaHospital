export class ClinicalHeadingSectionMapping_DTO {
  ClinicalDocumentHeadingMapId: number = 0;

  ClinicalHeadingId: number = 0;
  FieldId: number = 0;
  FieldName: string = '';
  DisplaySequence: number = 0;
  InputType: string = '';
  GroupName: string = '';
  IsMapped: boolean = false;
  FieldList = new Array<ClinicalFieldsList_DTO>();


}
export class ClinicalFieldsList_DTO {
  ClinicalDocumentHeadingMapId: number = 0;

  FieldId: number = 0;
  DisplaySequence: number = 0;
  IsMapped: boolean = false;
  FieldName: string = '';
  InputType: string = '';
  GroupName: string = '';
  ClinicalHeadingId: number = 0;
}



