using DanpheEMR.ServerModel.ClaimManagementModels;
using System.Collections.Generic;
using static DanpheEMR.Services.Insurance.HIBApiResponses;

namespace DanpheEMR.Services.ClaimManagement.DTOs
{
    public class SubmitedClaimDTO
    {
        public InsuranceClaim claim { get; set; }
        public List<UploadedFileDTO> files { get; set; }
        public ClaimSubmitRequest HIBClaimSubmitPayload { get; set; }
    }
}
