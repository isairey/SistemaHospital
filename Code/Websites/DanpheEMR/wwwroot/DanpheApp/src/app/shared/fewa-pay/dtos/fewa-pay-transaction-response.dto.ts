/**
 * @summary FewaPayTransactionDetailsDTO dto class is used to map the response received from FewaPay POS Terminal
 */
export class FewaPayTransactionDetailsDTO {
  amount: number = 0;
  invoiceNo: string = "";
  message: string = "";
  resultCode: string = "";
  transactionAmount: string = "";
  transactionDate: string = "";
  transactionTime: string = "";
  transactionType: string = "";
  verifyTransId: string = "";
}
