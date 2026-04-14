using DanpheEMR.Security;

namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonePayTransactionEssentials_DTO
    {
        public FonepayDynamicQrRequest_DTO FonepayDynamicQrRequest { get; set; }
        public dynamic InvoiceObj { get; set; }
        public RbacUser CurrentUser { get; set; }
        public string ConnString { get; set; }
        public bool RealTimeRemoteSyncEnabled { get; set; }
        public bool RealTimeSSFClaimBooking { get; set; }
        public decimal TotalAmount { get; set; }
        public string RequestFrom { get; set; }
        public int PatientId { get; set; }
        public FonePayTransactionEssentials_DTO(FonepayDynamicQrRequest_DTO fonepayDynamicQrRequest, dynamic invoiceObj, RbacUser currentUser, string connString, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking, decimal totalAmount, string requestFrom, int patientId)
        {
            FonepayDynamicQrRequest = fonepayDynamicQrRequest;
            InvoiceObj = invoiceObj;
            CurrentUser = currentUser;
            ConnString = connString;
            RealTimeRemoteSyncEnabled = realTimeRemoteSyncEnabled;
            RealTimeSSFClaimBooking = realTimeSSFClaimBooking;
            TotalAmount = totalAmount;
            RequestFrom = requestFrom;
            PatientId = patientId;

        }
    }
}
