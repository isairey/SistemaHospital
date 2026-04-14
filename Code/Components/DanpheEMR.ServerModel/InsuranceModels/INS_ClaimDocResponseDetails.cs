using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.InsuranceModels
{
    public class INS_ClaimDocResponseDetails
    {
        [Key]
        public int ClaimDocResponseDetailsId { get; set; }
        public long ClaimCode { get; set; }
        public int PatientId { get; set; }
        public string ResponseData { get; set; }
        public int UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; }
        public DateTime? ResponseDate { get; set; }
        public int? ReUploadedBy { get; set; }
        public DateTime? ReUploadedDate { get; set; }
        public bool ResponseStatus { get; set; }
    }
}
