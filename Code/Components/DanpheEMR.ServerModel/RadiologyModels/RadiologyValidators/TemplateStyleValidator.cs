using DanpheEMR.ServerModel.Shared;
using FluentValidation;

namespace DanpheEMR.ServerModel.RadiologyModels.RadiologyValidators
{
    public class TemplateStyleValidator:AbstractValidator<TemplateStyleModel>
    {
        public TemplateStyleValidator(string operation)
        {
            if (operation == ENUM_ValidatorActionNames.Create)
            {
                RuleFor(t => t.TemplateId).GreaterThan(0).WithMessage("Template ID must be greater than zero.");
            }
            else if (operation == ENUM_ValidatorActionNames.Update)
            {
                RuleFor(t => t.TemplateId).GreaterThan(0).WithMessage("Template ID must be greater than zero.");
                RuleFor(t => t.TemplateStyleId).GreaterThan(0).WithMessage("Template style ID must be greater than zero.");
            }
            else if(operation == ENUM_ValidatorActionNames.UpdateActiveStatus)
            {
                RuleFor(t => t.TemplateId).GreaterThan(0).WithMessage("Template ID must be greater than zero.");
            }
        }
    } 
}
