using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class OTBookingDetailsModel
    {
        [Key]
        public int OTBookingId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public DateTime BookedForDate { get; set; }
        public string ICDDiagnosis { get; set; }
        public string OtherDiagnosis { get; set; }
        public string BillingItems { get; set; }
        public bool UseAnaesthesia { get; set; }
        public string Anaesthesias { get; set; }
        /*public int? OTMachineId { get; set; }*/
        public string Remarks { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? CancelledBy { get; set; }
        public DateTime? CancelledOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public string CancellationRemarks { get; set; }
        public string Status { get; set; }
        public decimal OTExpectedDuration { get; set; }
        public int SurgeryId { get; set; }
        public string SurgeryType { get; set; }
        public string OTPriority { get; set; }
        public int PrescribedBy { get; set; }
        public DateTime? OTStartTime { get; set; }
        public DateTime? OTConcludeTime { get; set; }
        public bool IsOnScheduledTime { get; set; }
        public bool IsSeroPositive { get; set; }
        public decimal? OutTimeCharge { get; set; }
        public string ConcludeRemarks { get; set; }
    }
}
