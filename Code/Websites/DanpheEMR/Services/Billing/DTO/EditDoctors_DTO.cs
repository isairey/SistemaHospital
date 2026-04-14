public class EditDoctorDTO
{
    public EmployeeDTO NewPerformer { get; set; } 
    public EmployeeDTO NewPrescriber { get; set; } 
    public int BillTxnItemId { get; set; } = 0;
    public int? RequisitionId { get; set; } = 0;
    public EmployeeDTO NewReferrer { get; set; }
}

public class EmployeeDTO
{
    public int? EmployeeId { get; set; }
    public string EmployeeName { get; set; }
}
