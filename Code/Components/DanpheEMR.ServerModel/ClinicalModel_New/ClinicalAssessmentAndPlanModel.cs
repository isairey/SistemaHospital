using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModels
{
    public class ClinicalAssessmentAndPlanModel
    {
        [Key]
        public int ClinicalNotesId { get; set; }
        public int PatientId { get; set; }
        public int VisitId { get; set; }
        public int ClinicalNotesMasterId { get; set; }
        public string NotesValues { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; } 
        public int? VerifiedBy { get; set; }
        public DateTime? VerifiedOn { get; set; }
    }
}
