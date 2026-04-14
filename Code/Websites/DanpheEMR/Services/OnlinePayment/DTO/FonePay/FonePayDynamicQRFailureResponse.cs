namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonePayDynamicQRFailureResponse
    {
        public string message { get; set; }
        public bool isSuccess { get; set; }
        public bool reCaptchaEnabled { get; set; }
    }
}
