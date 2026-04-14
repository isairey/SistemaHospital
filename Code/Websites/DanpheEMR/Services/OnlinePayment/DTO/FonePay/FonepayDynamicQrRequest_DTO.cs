using System;

namespace DanpheEMR.Services.OnlinePayment.DTO.FonePay
{
    public class FonepayDynamicQrRequest_DTO
    {
        public long amount { get; set; }
        public string prn { get; set; }
    }
}
