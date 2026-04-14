using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.CommonModels
{
    public class PrintTemplateSettingsNewModel
    {
        [Key]
        public int PrintTemplateSettingsId { get; set; }
        public string PrintType { get; set; }
        public string FieldSettingsName { get; set; }
        public string PrintTemplateMainFormat { get; set; }
        public string PrintTemplateDetailsFormat { get; set; }
        public string PrinterType { get; set; }
        public string VisitType { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set;}
    }
}
