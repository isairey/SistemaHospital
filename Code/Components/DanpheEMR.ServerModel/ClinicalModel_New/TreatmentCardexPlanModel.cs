using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class TreatmentCardexPlanModel
    {
        [Key]
        public int CardexId { get; set; }
        public int? PrescriptionItemId { get; set; }
        public int MedicationItemId { get; set; }
        public int? PrescriberId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string FrequencyAbbreviation { get; set; }
        public int Duration { get; set; }
        public string RouteOfAdministration { get; set; }
        public string MedicationSchedule { get; set; }
        public bool IsPRN { get; set; }
        public string PRNNotes { get; set; }
        public string Doses { get; set; }
        public string Strength { get; set; }
        public string CardexNote { get; set; }
        public string Status { get; set; }
        public string AlternativeItemName { get; set; }
        public DateTime MedicationStartDate { get; set; }
        public DateTime MedicationEndDate { get; set; } 
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
