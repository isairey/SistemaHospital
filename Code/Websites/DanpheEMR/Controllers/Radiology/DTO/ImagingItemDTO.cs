using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Radiology.DTO
{
    public class ImagingItemDTO
    {
        public int ImagingItemId { get; set; }
        public int? ImagingTypeId { get; set; }
        public string ImagingItemName { get; set; }
        public string ProcedureCode { get; set; }
        public bool IsSelected { get; set; }
        public int? CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public bool IsPreference { get; set; }
        public int? TemplateId { get; set; }
        public bool IsValidForReporting { get; set; }
        public string IntegrationName { get; set; }
        public int? IntegrationId { get; set; }
        public string DepartmentName { get; set; }
        public int? DepartmentId { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int? ServiceDepartmentId { get; set; }
    }
}
