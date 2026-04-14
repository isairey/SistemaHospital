using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Settings.DTO
{
    public class FilterServiceItemsRequestDTO
    { 
        public int? ServiceDepartmentId { get; set; }
        public int? ServiceCategoryId { get; set; }
        public int? IntegrationNameID { get; set; }
        public bool? Status { get; set; }
        public string IntegrationName { get; set; }
        public List<int> PriceCategoryIds { get; set; }
        public List<int> ServiceItemIds { get; set; }

    }
}
