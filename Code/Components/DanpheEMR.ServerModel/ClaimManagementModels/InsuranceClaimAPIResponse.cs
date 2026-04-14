using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClaimManagementModels
{
    public class InsuranceClaimAPIResponse
    {
        [Key]
        public int ClaimApiResponseId { get; set; }
        public int ClaimSubmissionId { get; set; }
        public int? CreditOrganizationId { get; set; }
        public string RequestApiURL { get; set; }
        public Boolean ResponseStatus { get; set; }
        public string ResponseData { get; set; }
        public string ErrorMessage { get; set; }
        public int? PostedBy { get; set; }
        public DateTime? PostedOn { get; set; }
    }
}
