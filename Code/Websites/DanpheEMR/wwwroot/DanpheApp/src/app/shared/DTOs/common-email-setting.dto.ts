export class CommonEmailSetting_DTO {
  public UsedBy: string = "";
  public SenderEmail: string = "";
  public Password: string = "";
  public SenderName: string = "";
  public EmailApiKey: string = "";
  public SmtpServer: string = "";
  public PortNo: number = 0;
  public DefaultSubject: string = "";
  public EnableSendEmail: boolean = false;
  public TextContent: boolean = false;
  public PdfContent: boolean = false;
  public DisplayHeader: boolean = false;
}
