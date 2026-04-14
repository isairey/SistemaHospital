using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class PHRMPrescriptionItemModel
    {
        [Key]
        public int PrescriptionItemId { get; set; }
        public int PrescriptionId { get; set; }
        public int PatientId { get; set; }
        public int? PatientVisitId { get; set; }
        public int? PrescriberId { get; set; }
        public int? ItemId { get; set; }//when order is given with generic, it could be null.
        public decimal Quantity { get; set; }
        public int? Frequency { get; set; }
        public DateTime? StartingDate { get; set; }
        public int? HowManyDays { get; set; }
        public string FrequencyAbbreviation { get; set; }
        public string TimingOfMedicineTake { get; set; }
        public Boolean IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public string Notes { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string OrderStatus { get; set; }
        public bool IsDischargeRequest { get; set; }
        public string Dosage { get; set; }//sud: 6July'18
        public string Strength { get; set; }
        public int? GenericId { get; set; }//sud: 6July'18
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }

        public int? DiagnosisId { get; set; }

        [NotMapped]
        public string PerformerName { get; set; }

        [NotMapped]
        public string ItemName { get; set; }
        [NotMapped]
        public Boolean IsAvailable { get; set; }
        public string Route { get; set; }
        public decimal SalesQuantity { get; set; }
        public bool IsActive { get; set; } 
    }
}
