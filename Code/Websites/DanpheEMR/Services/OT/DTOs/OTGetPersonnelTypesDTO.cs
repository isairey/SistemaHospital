using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetPersonnelTypesDTO
    {
        public int PersonnelTypeId { get; set; }
        public string PersonnelType { get; set; }
        public bool IsIncentiveApplicable { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        //public int EmployeeRoleId { get; set; }
    }
}
