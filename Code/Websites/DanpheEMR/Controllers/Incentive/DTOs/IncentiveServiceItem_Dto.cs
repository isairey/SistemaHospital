namespace DanpheEMR.Controllers.Incentive.DTOs
{
    public class IncentiveServiceItem_Dto
    {
        public int ServiceItemId { get; set; }
        public string ItemName { get; set; }
        public decimal Price { get; set; }
        public string ItemCode { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int ServiceDepartmentId { get; set; }
        public string ServiceDepartmentShortName { get; set; }
        public string PriceCategoryName { get; set; }
        public DoctorDto Doctor { get; set; }
    }

    public class DoctorDto
    {
        public int DoctorId { get; set; }
        public string DoctorName { get; set; }
    }
}
