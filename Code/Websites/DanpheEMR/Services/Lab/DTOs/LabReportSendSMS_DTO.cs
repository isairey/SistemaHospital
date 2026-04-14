using System.Collections.Generic;
using System;

namespace DanpheEMR.Services.Lab.DTOs
{
    public class LabReportSendSMS_DTO
    {
        public int MaxPhoneNumCountInSingleBatch { get; set; }
        public string SMSText { get; set; }
        public List<LabReportSendSMSPatientInfo_DTO> PatientInfo { get; set; }
    }
    public class LabReportSendSMSPatientInfo_DTO
    {
        public int PatientId { get; set; }
        public string PhoneNumber { get; set; }
        public List<Int64> LabRequisitions { get; set; }
    }
    public class LabSendSMS_DTO
    {
        public string message { get; set; }
        public string mobile { get; set; }
        public LabSendSMS_DTO(string message, string mobile)
        {
            this.message = message;
            this.mobile = mobile;
        }
    }

    public class SparrowMessageResponse_DTO
    {
        public int count { get; set; }
        public int response_code { get; set; }
        public string response { get; set; }
        public int message_id { get; set; }
        public int credit_consumed { get; set; }
        public double credit_available { get; set; }
    }
}
