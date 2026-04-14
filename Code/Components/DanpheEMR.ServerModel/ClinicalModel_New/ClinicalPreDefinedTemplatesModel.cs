using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalPreDefinedTemplatesModel
    {
        [Key]
        public int PredefinedTemplateId {  get; set; }
        public string TemplateCode {  get; set; }
        public string TemplateName { get; set; }
        public string TemplateGroup {  get; set; }
        public string TemplateType { get; set; }
        public string TemplateAccessibility {  get; set; }
        public string TemplateContent { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
      
    }
}
