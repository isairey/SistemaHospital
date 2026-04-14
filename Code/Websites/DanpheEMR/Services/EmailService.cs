using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DanpheEMR.ServerModel.LabModels;
using MimeKit;
using Serilog;

namespace DanpheEMR.Services
{
    public class EmailService : IEmailService
    { 
       
        public async Task<string> SendEmail(string senderAddress, List<string> emailList, string nameOfSender, string subject, 
            string plainText, string htmlContent, string apiKey)
        {
            List<EmailAddress> toSenderList = new List<EmailAddress>();

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(senderAddress, nameOfSender);

            foreach (var email in emailList)
            {
                var to = new EmailAddress(email);
                toSenderList.Add(to);
            }

            var msg = MailHelper.CreateSingleEmailToMultipleRecipients(from, toSenderList, subject, plainText, htmlContent);
            var response = await client.SendEmailAsync(msg);
            if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
            {
                return "OK";
            }
            else
            {
                return "Error";
            }
        }

        public async Task<string> SendEmail(string senderAddress, List<string> emailList, string nameOfSender,
        string subject, string plainText,  string htmlContent, string pdfBase64string, string fileName, 
        List<AttachmentModel> ImageAttachments, string apiKey, string smtpServer, string password, int portNo)
        {
            try
            {
                var email = new MimeMessage();
                email.Sender = MailboxAddress.Parse(senderAddress);

                email.From.Add(MailboxAddress.Parse(senderAddress));//We need From as well for some Email Server, hence adding From here.

                foreach (var emailAddress in emailList)
                {
                    email.To.Add(MailboxAddress.Parse(emailAddress));
                }
                email.Subject = subject;
                var builder = new BodyBuilder();
                if (pdfBase64string != null)
                {
                    byte[] fileBytes = Convert.FromBase64String(pdfBase64string);
                    builder.Attachments.Add(fileName, fileBytes, ContentType.Parse("application/pdf"));
                }

                if (ImageAttachments != null && ImageAttachments.Count > 0)
                {
                    foreach (var imgAttach in ImageAttachments)
                    {
                        byte[] imageByte = Convert.FromBase64String(imgAttach.ImageBase64);
                        builder.Attachments.Add(imgAttach.ImageName, imageByte, ContentType.Parse("image/jpeg"));
                    }
                }
                
                builder.HtmlBody = string.Concat(string.Concat(plainText, "<br/>"), (htmlContent));
                builder.TextBody = plainText;

                email.Body = builder.ToMessageBody();

                var smtp = new MailKit.Net.Smtp.SmtpClient();
                smtp.Connect(smtpServer, portNo);
                smtp.Authenticate(senderAddress, password);
                var response = await smtp.SendAsync(email);
                smtp.Disconnect(true);
                return "OK";
            }
            catch (Exception ex)
            {
                Log.Error(ex.Message);
                throw;
            }
        }
    }
}
