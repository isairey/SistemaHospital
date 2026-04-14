import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
export class CommonEmailModel {

  public EmailAddress: string = null;
  public Subject: string = null;
  public PlainContent: string = null;
  public HtmlContent: string = null;
  public PdfBase64: string = null;
  public AttachmentFileName: string = null;
  //public AttachmentFileName:Array<string>=new Array<string>();
  public SenderEmailAddress: string = null;
  public SenderTitle: string = null;
  public SendPdf: boolean = false;
  public SendHtml: boolean = false;

  public EmailList: Array<string> = new Array<string>();
  public Remark: string = null;
  public ImageAttachments: Array<AttachmentModel> = new Array<AttachmentModel>();
  //sud: below is for preview section, we'll have to filter from it and assign to above array for sending email.
  public ImageAttachments_Preview: Array<AttachmentModel> = new Array<AttachmentModel>();
  public SmtpServer: string = "";
  public Password: string = "";
  public PortNo: number = 0;
  public EmailApiKey: string = "";

  public EmailValidator: FormGroup = null;
  constructor() {
    var _formBuilder = new FormBuilder();
    this.EmailValidator = _formBuilder.group({
      'EmailAddress': ['', Validators.compose([Validators.required])],
      'Subject': ['', Validators.compose([Validators.required])],
      'PlainContent': ['', Validators.compose([Validators.required])]
    });
  }


  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.EmailValidator.dirty;
    else
      return this.EmailValidator.controls[fieldName].dirty;
  }

  public IsValid(fieldName, validator): boolean {
    if (fieldName == undefined)
      return this.EmailValidator.valid;
    else
      return !(this.EmailValidator.hasError(validator, fieldName));
  }

  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined)
      return this.EmailValidator.valid;
    else
      return !(this.EmailValidator.hasError(validator, fieldName));
  }

}

export class AttachmentModel {
  public ImageBase64: string = null;
  public ImageName: string = null;
  public IsSelected: boolean = true;//sud:31Oct'19--Only to be used in Client Side.
  public src: string = null;
  public pdfBase64: string = null;


}
