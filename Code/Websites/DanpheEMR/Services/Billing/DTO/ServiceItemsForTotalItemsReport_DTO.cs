namespace DanpheEMR.Services.Billing.DTO
{
    public class ServiceItemsForTotalItemsReport_DTO
    {
        public int ServiceItemId { get; set; }
        public string ItemName { get; set; }
        public int ServiceDepartmentId { get; set; }
        public string ItemCode { get; set; }
        public string ServiceDepartmentName { get; set; }
        public bool IsActive { get; set; }
    }
}
