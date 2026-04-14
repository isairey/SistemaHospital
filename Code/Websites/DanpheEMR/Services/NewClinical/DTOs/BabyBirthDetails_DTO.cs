using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class BabyBirthDetails_DTO
    {
        public int? BabyBirthDetailsId { get; set; }
        public int? CertificateNumber { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int FiscalYearId { get; set; }
        public int NumberOfBabies { get; set; }
        public string Gender { get; set; }
        public string FathersName { get; set; }
        public string ShortName { get; set; }
        public double WeightOfBaby { get; set; }
        public DateTime BirthDate { get; set; }
        public TimeSpan BirthTime { get; set; }
        public int? IssuedBy { get; set; }
        public int? CertifiedBy { get; set; }
        public DateTime? CreatedOn { get; set; }
        public string BirthType { get; set; }
        public string BirthNumberType { get; set; }
        public int BirthConditionId { get; set; }

    }
}
