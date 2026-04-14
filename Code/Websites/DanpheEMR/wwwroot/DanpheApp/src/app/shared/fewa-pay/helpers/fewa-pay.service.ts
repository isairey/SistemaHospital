import { Injectable } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../common-models";
import { ENUM_DanpheHTTPResponses, ENUM_FewaPayMessageTypes, ENUM_FewaPay_TransactionTypes, ENUM_PaymentModeSubCategory } from "../../shared-enums";
import { FewaPayTransactionLogDTO } from "../dtos/fewa-pay-transaction-log.dto";
import { FewaPayTransactionRequestDTO } from "../dtos/fewa-pay-transaction-request.dto";
import { FewaPayTransactionDetailsDTO } from "../dtos/fewa-pay-transaction-response.dto";
import { FewaPayDLService } from "./fewa-pay.dl.service";
import { PaymentConfig } from "./payment-config-custom-types";

@Injectable({
  providedIn: "root"
})
/**FewaPayService Class is responsible to handle all the reusable codes needed for fewa Pay integration */
export class FewaPayService {

  constructor(private _coreService: CoreService, private _fewaPayDlService: FewaPayDLService) {

  }

  /**
   *
   * @param paymentModeDetails It is the details of payment mode used eg: FonePay, NepalPay, Card, etc.
   * @returns It returns the boolean value to represent either the Transaction is applicable to FewaPay or not.
   */
  IsFewaPayApplicable(paymentModeDetails: string): boolean {
    let isApplicable = false;
    if (paymentModeDetails && paymentModeDetails.trim()) {
      const paymentConfig = this.GetPaymentConfigParameter();
      if (paymentConfig && paymentConfig.EnableFewaPay && !paymentConfig.EnableDirectFonePay) {
        if ((paymentModeDetails.toLowerCase().includes(ENUM_PaymentModeSubCategory.Card)
          || paymentModeDetails.toLowerCase().includes(ENUM_PaymentModeSubCategory.FonePay)
          || paymentModeDetails.toLowerCase().includes(ENUM_PaymentModeSubCategory.NepalPay))) {
          isApplicable = true;
        }
      }
    }
    return isApplicable;
  }

  /**
   *
   * @param paymentModeDetails It is the details of payment mode used eg: FonePay, NepalPay, Card, etc.
   * @param totalAmount It is the amount that is to be paid.
   * @param remarks It is just a explanation for the transaction/payment.
   * @returns A string of transaction request object if valid data is passed.
   */
  CreateFewaPayTransactionRequest(paymentModeDetails: string, totalAmount: number, remarks: string): string | null {
    if (!this.IsValidPaymentDetails(paymentModeDetails, totalAmount, remarks)) {
      return null;
    }
    let transactionType = this.DetermineTransactionType(paymentModeDetails);

    if (!transactionType) {
      return null; // Return null if no valid transaction type is determined
    }

    let transactionReq = new FewaPayTransactionRequestDTO(transactionType, totalAmount, remarks);
    return JSON.stringify(transactionReq);
  }


  /**
   *
   * @returns It returns the parameter configuration of PaymentConfig, It gives either FewaPay is enabled or Direct FonePay is enabled
   */
  private GetPaymentConfigParameter(): PaymentConfig {
    const param = this._coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "PaymentConfig");
    if (param) {
      const paramValue = JSON.parse(param.ParameterValue) as PaymentConfig;
      return paramValue;
    } else {
      const defaultParamValue: PaymentConfig = {
        EnableFewaPay: false,
        EnableDirectFonePay: false
      }
      return defaultParamValue;
    }
  }

  /**
   *
   * @param paymentModeDetails It is the details of payment mode used eg: FonePay, NepalPay, Card, etc.
   * @param totalAmount It is the amount that is to be paid.
   * @param remarks It is just a explanation for the transaction/payment.
   * @returns boolean value either payment details are valid or not.
   */
  private IsValidPaymentDetails(paymentModeDetails: string, totalAmount: number, remarks: string): boolean {
    return (
      !!paymentModeDetails && // Check if paymentModeDetails is not empty
      totalAmount > 0 && // Check if totalAmount is greater than 0
      !!remarks && remarks.trim().length > 0 // Check if remarks is not empty and has non-whitespace characters
    );
  }

  /**
   *
   * @param paymentModeDetails It is the details of payment mode used eg: FonePay, NepalPay, Card, etc.
   * @returns TransactionType based on paymentModeDetails provided.
   */
  private DetermineTransactionType(paymentModeDetails: string): string | null {
    const lowerCaseDetails = paymentModeDetails.toLowerCase();

    if (lowerCaseDetails.includes(ENUM_FewaPay_TransactionTypes.FonePay)) {
      return ENUM_FewaPay_TransactionTypes.FonePay;
    } else if (lowerCaseDetails.includes(ENUM_FewaPay_TransactionTypes.NepalPay)) {
      return ENUM_FewaPay_TransactionTypes.NepalPay;
    } else if (lowerCaseDetails.includes(ENUM_PaymentModeSubCategory.Card)) {
      return ENUM_FewaPay_TransactionTypes.Sale;
    }

    return null; // Return null if no valid transaction type matches
  }

  /**
   *
   * @param event It is a message event received from FewaPay Browser Extension
   * @returns The result after parsing the received event
   */
  HandleEventsFromFewaPayBrowserExtension(event: MessageEvent) {
    if (event && event.type === "message" && ('data' in event.data)) {
      if (event.data && event.data.type === ENUM_FewaPayMessageTypes.PaymentInfoResponse) {
        const responseMessage = JSON.parse(event.data.data);
        const result = { ...responseMessage, amount: responseMessage.amount / 100 }; //! amount is in Paisa, hence divided by 100 to convert.
        return result;
      }
    }
  }

  /**
   *
   * @param response It is the response received from Fewa POS terminal
   * @param patientId It is the patient for whom payment is being done
   * @param moduleName It is the name of the module or feature from where payment is being done.
   * @summary This function is responsible to save the transaction logs of Payments done using FewaPay
   * @returns void
   */
  SaveFewaPayTransactionLogs(response: object, patientId: number, moduleName: string): void {
    if (!response) {
      console.warn("No response provided to save transaction logs.");
      return;
    }
    const fewaPayTransactionDetails = this.FormatResponseData(response);

    const fewaPayTransactionLog = new FewaPayTransactionLogDTO(fewaPayTransactionDetails, patientId, moduleName);

    this._fewaPayDlService.SaveFewaPayTransactionLogs(fewaPayTransactionLog)
      .subscribe((res: DanpheHTTPResponse) => this.HandleSaveResponse(res),
        (err: any) => this.HandleSaveError(err));
  }

  /**
 * Merges response data into the class properties if they exist
 * @param response The dynamic response received
 * @returns An instance of TransactionDetails with updated properties
 */
  FormatResponseData(response: any): FewaPayTransactionDetailsDTO {
    const fewaPayTransactionDetails = new FewaPayTransactionDetailsDTO();

    // Iterate over the properties of the response
    for (const key in response) {
      if (response.hasOwnProperty(key) && fewaPayTransactionDetails.hasOwnProperty(key)) {
        // Assign the value if the property exists in the class
        (fewaPayTransactionDetails as any)[key] = response[key];
      }
    }

    return fewaPayTransactionDetails;
  }


  /**
   * Handles the response after saving the transaction logs
   * @param res The HTTP response
   */
  private HandleSaveResponse(res: DanpheHTTPResponse): void {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results) {
        console.log("Fewa Pay Transaction Logs Saved Successfully.");
      } else {
        console.warn("FewaPay Transaction Logs is not saved.");
      }
    } else {
      console.warn(`Unexpected response status: ${res.Status}`, res);
    }
  }

  /**
   * Handles errors during the save operation
   * @param err The error object
   */
  private HandleSaveError(err: any): void {
    console.error("Error while saving Fewa Pay Transaction Logs:", err);
  }

}
