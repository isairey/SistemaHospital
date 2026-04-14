export class DischargeType_DTO {
  DischargeTypeId: number = 0;
  DischargeTypeName: string = null;
}
export class DischargeConditionType_DTO {
  DischargeConditionId: number = 0;
  DischargeTypeId: number = 0;
  Condition: string = null;
}
export class OperationType {
  OperationId: number = 0;
  OperationName: string = null;
}
