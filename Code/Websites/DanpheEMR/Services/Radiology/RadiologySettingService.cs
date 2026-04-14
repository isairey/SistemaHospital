using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.RadiologyModels;
using DanpheEMR.ServerModel.RadiologyModels.DTOs;
using DanpheEMR.ServerModel.RadiologyModels.RadiologyValidators;
using DanpheEMR.ServerModel.Shared;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Serilog;
using System;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Radiology
{
    public class RadiologySettingService : IRadiologySettingService
    {
        private readonly ILogger<RadiologySettingService> _logger;
        public RadiologySettingService(ILogger<RadiologySettingService> logger)
        {
            _logger = logger;
        }

        public async Task<object> GetTemplateStyleList(RadiologyDbContext _radiologyDbContext)
        {
            try
            {
                var templateStyleList = await (from style in _radiologyDbContext.TemplateStyle
                                               join radiologyTemplate in _radiologyDbContext.RadiologyReportTemplate on style.TemplateId equals radiologyTemplate.TemplateId
                                               join emp in _radiologyDbContext.Employees on style.CreatedBy equals emp.EmployeeId
                                               select new ViewTemplateStyleResponse
                                               {
                                                   TemplateName = radiologyTemplate.TemplateName,
                                                   TemplateCode = radiologyTemplate.TemplateCode,
                                                   TemplateStyleId = style.TemplateStyleId,
                                                   HeaderStyle = style.Headerstyle,
                                                   FooterStyle = style.FooterStyle,
                                                   TemplateId = radiologyTemplate.TemplateId,
                                                   IsActive = style.IsActive
                                               }).ToListAsync();
                return templateStyleList;
            }
            catch (Exception ex) {
                _logger.LogError("Error fetching TemplateStyleList from Database \n Exception detail: "+ex.Message);
                throw;
            }
        }
        public async Task<int> PostTemplateStyle(AddTemplateStyleRequest addTemplateStyleRequest, RbacUser currentUser, RadiologyDbContext _radiologyDbContext)
        {
            try
            {
                var existingTemplateStyle = await _radiologyDbContext.TemplateStyle.FirstOrDefaultAsync(ts => ts.TemplateId == addTemplateStyleRequest.TemplateId);
                if (existingTemplateStyle != null)
                {
                    _logger.LogError($"A template style with TemplateId {addTemplateStyleRequest.TemplateId} already exists.");
                    throw new InvalidOperationException($"A template style with TemplateId {addTemplateStyleRequest.TemplateId} already exists.");
                }
                else
                {
                    var templateStyleModel = TemplateStyleModel.Create(addTemplateStyleRequest, currentUser.EmployeeId);
                    var _validator = new TemplateStyleValidator(ENUM_ValidatorActionNames.Create);
                    ValidationResult result = await _validator.ValidateAsync(templateStyleModel);
                    if (!result.IsValid)
                    {
                        var errorMessage = "";
                        foreach (var error in result.Errors)
                        {
                            errorMessage = errorMessage + "\n" + error.ErrorMessage;
                        }
                        throw new ValidationException(errorMessage);
                    }
                    _radiologyDbContext.TemplateStyle.Add(templateStyleModel);
                    await _radiologyDbContext.SaveChangesAsync();
                    return templateStyleModel.TemplateStyleId;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception is thrown while adding templatestyle {addTemplateStyleRequest.TemplateId}, exception details is, \n {ex.Message} ");
                throw;
            }
        }
        public async Task<object> PutTemplateStyle(UpdateTemplateStyleRequest updateTemplateStyleRequest, RbacUser currentUser, RadiologyDbContext _radiologyDbContext)
        { 
            try
            {
                var existingTemplateStyle = _radiologyDbContext.TemplateStyle.FirstOrDefault(a => a.TemplateStyleId == updateTemplateStyleRequest.TemplateStyleId); 
                existingTemplateStyle.UpdateStyleContent(updateTemplateStyleRequest.HeaderStyle, updateTemplateStyleRequest.FooterStyle);
                existingTemplateStyle.UpdateModifiedStatus(currentUser.EmployeeId);
                var _validator = new TemplateStyleValidator(ENUM_ValidatorActionNames.Update);
                ValidationResult result = await _validator.ValidateAsync(existingTemplateStyle);
                if (!result.IsValid)
                {
                    var errorMessage = "";
                    foreach (var error in result.Errors)
                    {
                        errorMessage = errorMessage + "\n" + error.ErrorMessage;
                    }
                    throw new ValidationException(errorMessage);
                }
                await _radiologyDbContext.SaveChangesAsync();
                return updateTemplateStyleRequest;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception is thrown while adding templatestyle {updateTemplateStyleRequest.TemplateId}, exception details is, \n {ex.Message} ");
                throw;
            }
        }
        public async Task<object> PutActiveStatus(int templateStyleId, RbacUser currentUser, RadiologyDbContext _radiologyDbContext)
        {
            try
            {
                var existingTemplateStyle = _radiologyDbContext.TemplateStyle.FirstOrDefault(a => a.TemplateStyleId == templateStyleId);
                existingTemplateStyle.UpdateIsActiveStatus();
                existingTemplateStyle.UpdateModifiedStatus(currentUser.EmployeeId);
                var _validator = new TemplateStyleValidator(ENUM_ValidatorActionNames.UpdateActiveStatus);
                ValidationResult result = await _validator.ValidateAsync(existingTemplateStyle);
                if(!result.IsValid)
                {
                    var errorMessage = "";
                    foreach(var err in result.Errors)
                    {
                        errorMessage = errorMessage + "\n" + errorMessage;
                    }
                    throw new ValidationException(errorMessage);
                }
                await _radiologyDbContext.SaveChangesAsync();
                return templateStyleId;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception is thrown while updating Active Status, exception details is, \n {ex.Message} ");
                throw;
            }
        }
    }
}
