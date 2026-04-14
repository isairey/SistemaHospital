/**
 * @summary FewaPayTransactionRequestDTO dto class is used to create a fewa pay transaction request
 */
export class FewaPayTransactionRequestDTO {
  transId: string = this.GenerateUniqTransactionId();
  transType: string = "";
  amount: number = 0;
  tip: number = 0;
  remark: string = "";
  origin: string = "";
  pat: string = "T!3@$T#P$@%T^"; // This is a hardcoded value.

  constructor(transactionType: string, amount: number, remark: string) {
    this.transType = transactionType;
    this.amount = amount * 100; //! Need to send amount in paisa, hence multiplied by 100.
    this.remark = remark;
    this.origin = window.location.origin;
  }

  /**
   *
   * @returns a string of unique transactionId
   */
  private GenerateUniqTransactionId(): string {
    const timestamp = new Date().getTime();
    const randomPart = Math.random().toString(36).substr(2, 5);
    const uniqueValue = `${timestamp}${randomPart}`;
    const uniqueTransactionId = uniqueValue.substr(0, 10);
    return uniqueTransactionId.toString();
  }
}
