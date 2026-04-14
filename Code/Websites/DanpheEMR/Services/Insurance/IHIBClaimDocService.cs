using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.Insurance.DTOs;
using System.Threading.Tasks;
using static DanpheEMR.Services.Insurance.DTOs.ClaimUploadFileRequest_DTO;

namespace DanpheEMR.Services.Insurance
{
    public interface IHIBClaimDocService
    {
        Task<ClaimUploadFileResponse_DTO> UploadSingleFile(ClaimUploadSingleFileRequest_DTO claimUploadSingleFile, RbacUser currentUser, InsuranceDbContext insuranceDbContext);
        Task<ClaimUploadFileResponse_DTO> UploadMultipleFile(ClaimUploadMultipleFileRequest_DTO claimUploadMultipleFile, RbacUser currentUser, InsuranceDbContext insuranceDbContext);
    }
}
