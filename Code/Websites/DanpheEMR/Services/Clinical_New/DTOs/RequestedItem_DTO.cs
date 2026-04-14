using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class RequestedItem_DTO
    {
        public Int64? RequisitionId { get;set; }

        public string TestName { get; set; }

        public string Type { get; set; }
        public DateTime? RequisitionDate {  get; set; }
        public string OrderStatus { get; set; }
        public string BillStatus { get; set; }

    }
}
