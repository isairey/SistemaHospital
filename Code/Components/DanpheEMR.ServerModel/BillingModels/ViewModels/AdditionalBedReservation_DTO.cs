using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.BillingModels.ViewModels
{
    public class AdditionalBedReservation_DTO
    {
        public DateTime CreatedOn { get; set; }
        public string WardName { get; set; }
        public string BedFeatureName { get; set; }
        public string BedNumber { get; set; }
        public string CareTakerInformation { get; set; }
        public DateTime? CompletedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
