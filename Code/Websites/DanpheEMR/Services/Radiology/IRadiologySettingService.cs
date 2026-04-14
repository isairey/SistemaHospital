using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.RadiologyModels.DTOs;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Radiology
{
    public interface IRadiologySettingService
    {
        Task<object> GetTemplateStyleList(RadiologyDbContext _radiologyDbContext);
        Task<object> PutActiveStatus( int templateStyleId, RbacUser currentUser, RadiologyDbContext _radiologyDbContext);
        Task<int> PostTemplateStyle(AddTemplateStyleRequest addTemplateStyleRequest, RbacUser currentUser, RadiologyDbContext _radiologyDbContext);
        Task<object> PutTemplateStyle(UpdateTemplateStyleRequest updateTemplateStyleRequest, RbacUser currentUser, RadiologyDbContext _radiologyDbContext);
    }
}
