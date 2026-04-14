using DanpheEMR.Controllers;
using DanpheEMR.Core;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels.DischargeModel;
using DanpheEMR.ServerModel.FonePayLog;
using DanpheEMR.Services.Billing.Invoice;
using DanpheEMR.Services.Discharge;
using DanpheEMR.Services.Insurance;
using DanpheEMR.Services.OnlinePayment.DTO.FonePay;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net.Http;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace DanpheEMR.Services.OnlinePayment.FonePay
{
    public class FonePayService : IFonePayService
    {
        private string _merchantCode = "";
        private string _username = "";
        private string _password = "";
        private string _signSecret = "";
        //Krishna, 10thDec'23, Below api links are fixed hence hardcoded.
        private const string _fonepay_DQR_API = "https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload";
        private const string _fonepay_GetStatus_API = "https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus";
        private readonly IInsuranceService _insuranceService;
        private readonly CoreDbContext _coreDbContext;

        public FonePayService(IOptions<MyConfiguration> _config, IInsuranceService insuranceService)
        {
            _merchantCode = ConfigurationManager.AppSettings["MerchantCode"];
            _username = ConfigurationManager.AppSettings["Username"];
            _password = ConfigurationManager.AppSettings["Password"];
            _signSecret = ConfigurationManager.AppSettings["SignSecret"];
            _insuranceService = insuranceService;
            _coreDbContext = new CoreDbContext(_config.Value.Connectionstring);
        }

        public async Task<dynamic> GenerateQR(FonePayTransactionEssentials_DTO fonePayTransaction, dynamic dbContext, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            Log.Information($"FonePay Payement is initiated from {fonePayTransaction.RequestFrom}");

            HttpRequestMessage generateQRRequest = CreateFonePayDynamicQrRequest(fonePayTransaction.FonepayDynamicQrRequest.amount, fonePayTransaction.FonepayDynamicQrRequest.prn);

            Log.Information($"QR Request is generated and ready to be displayed in the UI!");

            return await SendFonePayRequestAsync(generateQRRequest, dbContext, fonePayTransaction, hubContext, contextAccessor);
        }

        public HttpRequestMessage CreateFonePayDynamicQrRequest(long amount, string prn, string remarks1 = "test1", string remarks2 = "test2")
        {
            string dataValidation = GenerateDataValidation(amount, prn, remarks1, remarks2);

            StringContent content = GeneratePayloadContent(amount, prn, remarks1, remarks2, dataValidation);
            return FonePayRequest(content);
        }

        private async Task<dynamic> SendFonePayRequestAsync(HttpRequestMessage generateQRRequest, dynamic dbContext, FonePayTransactionEssentials_DTO fonePayTransaction, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            var client = new HttpClient();
            HttpResponseMessage response = await client.SendAsync(generateQRRequest);
            string responseContent = await response.Content.ReadAsStringAsync();
            bool qrGenerationStatus = false;
            if (response.StatusCode == System.Net.HttpStatusCode.Created)
            {
                qrGenerationStatus = true;
                //Log the QR generation request
                LogFonePay(fonePayTransaction, "qr-generation", dbContext, fonePayTransaction.CurrentUser, qrGenerationStatus, null, responseContent, fonePayTransaction.RequestFrom);
                Log.Information($"FonePay QR is generated and logged the response into our database as well, which will be send to client and listen to the fonePay Server, for the patient, {fonePayTransaction.PatientId}!");
                var fonepaySuccessResponse = JsonConvert.DeserializeObject<FonePayDynamicQRSuccessResponse>(responseContent);
                ListenToFonePayWebSocket(fonepaySuccessResponse.thirdpartyQrWebSocketUrl, dbContext, fonePayTransaction, hubContext, contextAccessor);

                return fonepaySuccessResponse;
            }

            return JsonConvert.DeserializeObject<FonePayDynamicQRFailureResponse>(responseContent);
        }

        private async Task ListenToFonePayWebSocket(string socketUrl, dynamic dbContext, FonePayTransactionEssentials_DTO fonePayTransaction, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            Log.Information($"Listening to the FonePay Server for the Payment response for the patient, {fonePayTransaction.PatientId}!");
            using (ClientWebSocket clientWebSocket = new ClientWebSocket())
            {
                Uri fonepayURI = new Uri(socketUrl);
                var cancellationToken = new CancellationTokenSource();
                cancellationToken.CancelAfter(TimeSpan.FromSeconds(120));
                try
                {
                    await clientWebSocket.ConnectAsync(fonepayURI, cancellationToken.Token);
                    while (clientWebSocket.State == WebSocketState.Open)
                    {
                        try
                        {
                            await ReceiveFonePaySocketResponse(clientWebSocket, cancellationToken, dbContext, fonePayTransaction, hubContext, contextAccessor);
                        }
                        catch (TaskCanceledException ex)
                        {
                            Console.WriteLine(ex.ToString());
                            break;
                        }
                    }

                }
                catch (WebSocketException e)
                {
                    Console.WriteLine("Exception Details: " + e.Message);
                }
            }
        }

        private async Task ReceiveFonePaySocketResponse(ClientWebSocket clientWebSocket, CancellationTokenSource cancellationToken, dynamic dbContext, FonePayTransactionEssentials_DTO fonePayTransaction, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            Log.Information($"FonePay response is received and further processing is proceeded!");
            var responseBuffer = new byte[1024];
            var offset = 0;
            var packet = 1024;
            var socketResponse = await clientWebSocket.ReceiveAsync(new ArraySegment<byte>(responseBuffer, offset, packet), cancellationToken.Token);
            do
            {
                var responseMessage = Encoding.UTF8.GetString(responseBuffer, offset, socketResponse.Count);

                //This is called multiple Times as the socket connection is open
                if (responseMessage != null)
                {
                    try
                    {
                        var jsonObject = JObject.Parse(responseMessage);
                        var transactionStatus = jsonObject["transactionStatus"].ToString();
                        var transactionStatusObject = JsonConvert.DeserializeObject<TransactionStatus>(transactionStatus);
                        if (transactionStatusObject != null && transactionStatusObject.paymentSuccess)
                        {
                            //Log the Transaction
                            LogFonePay(fonePayTransaction, "transaction", dbContext, fonePayTransaction.CurrentUser, true, transactionStatusObject.traceId, transactionStatus, fonePayTransaction.RequestFrom);
                            Log.Information($"Payment through FonePay is successful and the response is logged into our database for the patient, {fonePayTransaction.PatientId}");

                            switch (fonePayTransaction.RequestFrom)
                            {
                                case ENUM_FonePayTransactionRequestFrom.OutpatientBilling:
                                    {
                                        fonePayTransaction.InvoiceObj.Txn.PaymentDetails = $"{fonePayTransaction.InvoiceObj.Txn.PaymentDetails} TransactionId: {transactionStatusObject.traceId}";
                                        //check from where the payment request is coming and proceed accordingly.
                                        BillingInvoiceService.PostBillingTransactionAsync(dbContext, fonePayTransaction.InvoiceObj, fonePayTransaction.CurrentUser, fonePayTransaction.ConnString, fonePayTransaction.RealTimeRemoteSyncEnabled, fonePayTransaction.RealTimeSSFClaimBooking, hubContext, contextAccessor);

                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.InPatientDischarge:
                                    {
                                        //logic to create discharge invoice and statement goes from here.
                                        fonePayTransaction.InvoiceObj.BillingPendingItems.billingTransactionModel.PaymentDetails = $"{fonePayTransaction.InvoiceObj.BillingPendingItems.billingTransactionModel.PaymentDetails} TransactionId: {transactionStatusObject.traceId}";
                                        var result = DischargeBillingService.SaveBillingAndPharmacyTransactionAndDischarge(dbContext, fonePayTransaction.InvoiceObj, fonePayTransaction.CurrentUser, fonePayTransaction.ConnString, fonePayTransaction.RealTimeRemoteSyncEnabled, fonePayTransaction.RealTimeSSFClaimBooking, hubContext, contextAccessor);
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.Appointment:
                                    {
                                        //logic to create invoice for appointment goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.BillingOpProvisionalClearance:
                                    {
                                        //logic to create invoice for outpatient provisional clearance goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.BillingProvisionalDischargeClearance:
                                    {
                                        //logic to create invoice for provisional discharge clearance goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.BillingDeposit:
                                    {
                                        //logic to create billing deposit receipt goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.BillingSettlement:
                                    {
                                        //logic to create Settlement receipt goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.PharmacySales:
                                    {
                                        //logic to create invoice for Pharmacy Sales goes here
                                        fonePayTransaction.InvoiceObj.PaymentDetails = $"{fonePayTransaction.InvoiceObj.PaymentDetails} TransactionId: {transactionStatusObject.traceId}";
                                        PHRMInvoiceTransactionModel finalInvoiceData = PharmacyBL.InvoiceTransaction(fonePayTransaction.InvoiceObj, dbContext, fonePayTransaction.CurrentUser, fonePayTransaction.RealTimeRemoteSyncEnabled, fonePayTransaction.RealTimeSSFClaimBooking, hubContext, contextAccessor, _coreDbContext, _insuranceService, fonePayTransaction.ConnString);
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.PharmacyProvisionalClearance:
                                    {
                                        //logic to create invoice for Pharmacy Provisional Clearance goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.PharmacyDeposit:
                                    {
                                        //logic to create pharmacy deposit goes here
                                        break;
                                    }
                                case ENUM_FonePayTransactionRequestFrom.PharmacySettlement:
                                    {
                                        //logic to create for Pharmacy Settlement Receipt goes here
                                        break;
                                    }
                                default:
                                    {
                                        break;
                                    }
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        throw new Exception($"Something went wrong in parsing the response received from FonePayServer {e.Message}");
                    }


                }

            }
            while (socketResponse.EndOfMessage != true);
        }

        private static void LogFonePay(FonePayTransactionEssentials_DTO fonePayTransaction, string logFor, dynamic dbContext, RbacUser currentUser, bool transactionStatus, int? fonePayTraceId, string responseMessage, string requestFrom)
        {
            FonePayTransactionLogModel fonePayTransactionLogModel = new FonePayTransactionLogModel(logFor, fonePayTransaction.PatientId, requestFrom, fonePayTransaction.TotalAmount, fonePayTraceId, transactionStatus, responseMessage, currentUser.EmployeeId);
            dbContext.FonePayTransactionLogs.Add(fonePayTransactionLogModel);
            dbContext.SaveChanges();
        }

        private HttpRequestMessage FonePayRequest(StringContent content)
        {
            HttpRequestMessage fonePayRequest = new HttpRequestMessage()
            {
                Method = HttpMethod.Post,
                Content = content,
                RequestUri = new Uri(_fonepay_DQR_API)
            };
            return fonePayRequest;
        }

        private StringContent GeneratePayloadContent(long amount, string prn, string remarks1, string remarks2, string dataValidation)
        {
            var values = new Dictionary<string, string>()
            {
                {"amount",  amount.ToString() },
                {"remarks1", remarks1 },
                {"remarks2", remarks2 },
                {"prn", prn },
                {"merchantCode", _merchantCode },
                {"dataValidation", dataValidation },
                {"username", _username },
                {"password", _password }
            };
            // Serialize our concrete class into a JSON String
            var stringPayload = JsonConvert.SerializeObject(values);

            // Wrap our JSON inside a StringContent which then can be used by the HttpClient class
            var httpContent = new StringContent(stringPayload, Encoding.UTF8, "application/json");

            return httpContent;
        }

        private string GenerateDataValidation(long amount, string prn, string remarks1, string remarks2)
        {
            string encoded_payload = GenerateEncodePayload(amount, prn, remarks1, remarks2);
            string dataValidation = GenerateHash(encoded_payload);
            return dataValidation;
        }

        private string GenerateHash(string encoded_payload)
        {
            var cipher_text = encoded_payload;
            var provider = new System.Security.Cryptography.HMACSHA512(Encoding.UTF8.GetBytes(_signSecret));
            var hashBytes = provider.ComputeHash(Encoding.UTF8.GetBytes(cipher_text));

            var dataValidation = "";
            foreach (var hashByte in hashBytes)
            {
                dataValidation += hashByte.ToString("x2");
            }

            return dataValidation;
        }

        private string GenerateEncodePayload(long amount, string prn, string remarks1, string remarks2)
        {
            var message = $"{amount},{prn},{_merchantCode},{remarks1},{remarks2}";

            byte[] bytes = Encoding.UTF8.GetBytes(message);
            string encoded_payload = Convert.ToBase64String(bytes);
            return encoded_payload;
        }





        public async Task<dynamic> GetStatus(string prn, string dataValidation)
        {
            HttpRequestMessage generateQRRequest = CreateFonePayGetStatusRequest(prn, dataValidation);

            return await SendFonePayGetStatusRequestAsync(generateQRRequest);
        }

        private HttpRequestMessage CreateFonePayGetStatusRequest(string prn, string dataValidation)
        {

            StringContent content = GenerateGetStatusPayloadContent(prn, dataValidation);
            return FonePayGetStatusRequest(content);
        }

        private HttpRequestMessage FonePayGetStatusRequest(StringContent content)
        {
            HttpRequestMessage fonePayRequest = new HttpRequestMessage()
            {
                Method = HttpMethod.Post,
                Content = content,
                RequestUri = new Uri(_fonepay_GetStatus_API)
            };
            return fonePayRequest;
        }

        private StringContent GenerateGetStatusPayloadContent(string prn, string dataValidation)
        {
            var values = new Dictionary<string, string>()
            {
                {"prn", prn },
                {"merchantCode", _merchantCode },
                {"dataValidation", dataValidation },
                {"username", _username },
                {"password", _password }
            };
            // Serialize our concrete class into a JSON String
            var stringPayload = JsonConvert.SerializeObject(values);

            // Wrap our JSON inside a StringContent which then can be used by the HttpClient class
            var httpContent = new StringContent(stringPayload, Encoding.UTF8, "application/json");

            return httpContent;
        }

        private async Task<dynamic> SendFonePayGetStatusRequestAsync(HttpRequestMessage generateQRRequest)
        {
            var client = new HttpClient();
            HttpResponseMessage response = await client.SendAsync(generateQRRequest);

            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                string responseContent = await response.Content.ReadAsStringAsync();
                var fonepaySuccessResponse = JsonConvert.DeserializeObject<FonePayGetStatusSuccessResponse>(responseContent);

                return fonepaySuccessResponse;
            }
            return response;
        }
    }
}
