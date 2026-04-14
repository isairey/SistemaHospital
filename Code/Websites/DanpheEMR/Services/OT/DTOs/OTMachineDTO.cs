using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTMachineDTO
    {
        public int OTMachineId { get; set; }
        public string MachineName { get; set; }
        public string Description { get; set; }
        public decimal MachineCharge { get; set; }
        public bool IsActive { get; set; }
    }
}
