using DanpheEMR.ServerModel.RadiologyModels.DTOs;
using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.RadiologyModels
{
    public class TemplateStyleModel
    {

        [Key]
        public int TemplateStyleId { get; private set; }

        public string Headerstyle { get; private set; }

        public string FooterStyle { get; private set; }

        public int TemplateId { get; private set; }

        public int CreatedBy { get; private set; }

        public DateTime CreatedOn { get; private set; }

        public int? ModifiedBy { get; private set; }

        public DateTime? ModifiedOn { get; private set; }

        public bool IsActive { get; private set; }
        public static TemplateStyleModel Create(AddTemplateStyleRequest addTemplateStyleRequest, int employeeId)
        {
            return new TemplateStyleModel
            {
                Headerstyle = addTemplateStyleRequest.HeaderStyle,
                FooterStyle = addTemplateStyleRequest.FooterStyle,
                TemplateId = addTemplateStyleRequest.TemplateId,
                CreatedBy = employeeId,
                CreatedOn = DateTime.Now,
                IsActive = true
            };

        }
        public void UpdateStyleContent(string headerStyle, string footerStyle)
        {
            Headerstyle = headerStyle;
            FooterStyle = footerStyle;
        }
        public void UpdateModifiedStatus(int employeeId)
        {
            ModifiedBy = employeeId;
            ModifiedOn = DateTime.Now;
        }   
        public void UpdateIsActiveStatus()
        {
            IsActive = !IsActive;
        }
    }
}
