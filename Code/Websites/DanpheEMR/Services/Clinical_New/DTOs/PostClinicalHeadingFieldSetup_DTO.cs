using DanpheEMR.ServerModel.ClinicalModel_New;
using System.ComponentModel.DataAnnotations;
using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PostClinicalHeadingFieldSetup_DTO
    {
        public string FieldName { get; set; }
        public string InputType { get; set; }
        public string DisplayName { get; set; }
        public string OptionValue { get; set; } 
        public bool IsActive { get; set; }
        public bool IsIPD { get; set; }
        public bool IsOPD { get; set; }
        public bool IsEmergency { get; set; }
        public string GroupName { get; set; }
        public bool IsAcrossVisitAvailability { get; set; }
        public bool IsDisplayTitle { get; set; }

    }
}
