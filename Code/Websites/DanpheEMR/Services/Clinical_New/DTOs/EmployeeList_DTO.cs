namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class EmployeeList_DTO
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; }
        public int DepartmentId { get; set; }
        public string MedCertificationNo { get; set; }
        public int EmployeeRoleId { get; set; }
        public bool IsSelected { get; set; }

    }
}
