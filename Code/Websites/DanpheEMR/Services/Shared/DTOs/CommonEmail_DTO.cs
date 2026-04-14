using DanpheEMR.ServerModel.LabModels;
using System.Collections.Generic;

namespace DanpheEMR.Services.Shared.DTOs
{
    public class CommonEmail_DTO
    {
        public string EmailAddress { get; set; }
        public string Subject { get; set; }
        public string PlainContent { get; set; }
        public string HtmlContent { get; set; }
        public string PdfBase64 { get; set; }
        public string AttachmentFileName { get; set; }
        public List<AttachmentModel> ImageAttachments { get; set; }
        public string SenderEmailAddress { get; set; }
        public string SenderTitle { get; set; }
        public bool SendPdf { get; set; }
        public bool SendHtml { get; set; }
        public string SmtpServer { get; set; }
        public string Password { get; set; }
        public int PortNo { get; set; }
        public string EmailApiKey { get; set; }
        public List<string> EmailList { get; set; }
    }
}
