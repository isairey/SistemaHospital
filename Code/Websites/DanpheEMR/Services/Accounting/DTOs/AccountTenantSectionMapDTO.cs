using DanpheEMR.ServerModel;
using System.Collections.Generic;

namespace DanpheEMR.Services.Accounting.DTOs
{
    public class AccountTenantSectionMapDTO
    {
        public string HospitalName { get; set; }
        public string HospitalShortCode { get; set; }
        public string SectionName { get; set; }
        public string SectionCode { get; set; }
        public bool IsActive { get; set; }
    }
    public class AccountTenantMapWrapperDTO
    {
        public List<AccountTenantSectionMapDTO> Maps { get; set; }
        public List<AccSectionModel> SectionList { get; set; }
    }

    public class AddAccountTenantPost_DTO
    {
        public string HospitalName { get; set; }
        public string HospitalShortCode { get; set; }
        public string SectionIds { get; set; }
    }
}
