import { ENUM_POS_ResponseStatus } from "../../shared-enums";
import { FewaPayTransactionDetailsDTO } from "./fewa-pay-transaction-response.dto";

/**
 * @summary This dto class is to represent the response received from Fewa POS terminal
 */
export class FewaPayTransactionLogDTO {
  PatientId: number = 0;
  ModuleName: string = "";
  TransactionId: string = "";
  TransactionType: string = "";
  TransactionAmount: number = 0;
  TransactionStatus: boolean = false;
  ResponseMessage: string = "";
  TransactionResponse: string = "";
  TransactionDate: string | null = "";
  TransactionTime: string | null = "";

  constructor(response: FewaPayTransactionDetailsDTO, patientId: number, moduleName: string) {
    this.TransformFewaPayResponse(response, patientId, moduleName);
  }

  /**
   *
   * @param response It is the response received from FewaPay POS terminal
   * @param patientId It is the patient for whom the payment is being done
   * @returns FewaPayTransactionLogDTO
   */
  TransformFewaPayResponse(response: FewaPayTransactionDetailsDTO, patientId: number, moduleName: string): FewaPayTransactionLogDTO {
    this.PatientId = patientId;
    this.ModuleName = moduleName;
    this.TransactionId = response.verifyTransId;
    this.TransactionType = response.transactionType;
    this.TransactionAmount = response.transactionAmount ? +response.transactionAmount : 0;
    this.TransactionStatus = response.resultCode === ENUM_POS_ResponseStatus.Success ? true : false;
    this.ResponseMessage = response.message;
    this.TransactionDate = response.transactionDate;
    this.TransactionTime = response.transactionTime;
    this.TransactionResponse = JSON.stringify(response);

    return this;
  }

}
