using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class PatientAllergyDTO
    {
        public int PatientAllergyId { get; set; }
        public int PatientId { get; set; }
        public int? AllergenAdvRecId { get; set; }
        public string AllergenAdvRecName { get; set; }
        public string AllergyType { get; set; }
        public string Severity { get; set; }
        public bool Verified { get; set; }
        public string Reaction { get; set; }
        public string Comments { get; set; }


    }
}
