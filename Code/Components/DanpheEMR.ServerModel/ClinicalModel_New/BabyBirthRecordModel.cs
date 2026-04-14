using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class BabyBirthRecordModel
    {
        [Key]
        public int BabyBirthDetailsId { get; set; }
        public int? CertificateNumber { get; set; }
        [Column("Sex")] 
        public string Gender { get; set; }
        public string FathersName { get; set; }
        public double WeightOfBaby { get; set; }
        public DateTime BirthDate { get; set; }
        public TimeSpan BirthTime { get; set; }
        public int? DischargeSummaryId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int? MedicalRecordId { get; set; }
        public int? IssuedBy { get; set; }
        public int? CertifiedBy { get; set; }
        public int FiscalYearId { get; set; }
        public BillingFiscalYear FiscalYear { get; set; }
        public string BirthType { get; set; }
        public string BirthNumberType { get; set; }
        public int? PrintedBy { get; set; }
        public int PrintCount { get; set; }
        public DateTime? PrintedOn { get; set; }
        public int CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }

        public bool IsActive { get; set; }

        public int BirthConditionId { get; set; }
    }
}
