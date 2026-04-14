using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.InventoryModels.DTOs
{
    public class InventoryConsumptionType_DTO
    {
        public int ConsumptionTypeId { get; set; }
        public string ConsumptionTypeName { get; set; }
        public bool IsActive { get; set; }
    }
}
