export class TelMedicineResponse_DTO<T> {
  Results: T
  IsSuccess: boolean
  ResponseMessage: string
  StatusCode: number
}