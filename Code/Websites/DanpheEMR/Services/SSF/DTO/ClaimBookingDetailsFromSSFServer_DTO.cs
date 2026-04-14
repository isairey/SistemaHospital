using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.SSF.DTO
{
    public class ClaimBookingDetailsFromSSFServer_Root_DTO
    {
        public string resourceType { get; set; }
        public ClaimBookingDetailsFromSSFServer_Response_DTO response { get; set; }
        public int success { get; set; }
        public string msg { get; set; }
    }

    public class ClaimBookingDetailsFromSSFServer_Response_DTO
    {
        public List<ClaimBookingDetailsFromSSFServer_Data_DTO> data { get; set; }
    }

    public class ClaimBookingDetailsFromSSFServer_Data_DTO
    {
        public string scheme { get; set; }
        public string chfid { get; set; }
        public string subProduct { get; set; }
        public string booked { get; set; }
        public string booked_by { get; set; }
        public DateTime date { get; set; }
        public string clientClaimId { get; set; }
        public string clientInvoiceNumber { get; set; }
    }
}
