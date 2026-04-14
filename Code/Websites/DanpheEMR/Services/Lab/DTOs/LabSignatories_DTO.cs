namespace DanpheEMR.Services.Lab.DTOs
{
    public class LabSignatories_DTO
    {
        public int EmployeeId { get; set; }
        public string EmployeeFullName { get; set; }
        public string Signature { get; set; }
        public string SignatoryImageName { get; set; }
        public int? DisplaySequence { get; set; }
        public bool? Show { get; set; }
    }


}
