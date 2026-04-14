namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonePayDynamicQRSuccessResponse
    {
        public string qrMessage { get; set; }
        public string clientCode { get; set; }
        public string status { get; set; }
        public int statusCode { get; set; }
        public bool success { get; set; }
        public string deviceId { get; set; }
        public string requested_date { get; set; }
        public string merchantCode { get; set; }
        public string merchantWebSocketUrl { get; set; }
        public string thirdpartyQrWebSocketUrl { get; set; }
    }
}
