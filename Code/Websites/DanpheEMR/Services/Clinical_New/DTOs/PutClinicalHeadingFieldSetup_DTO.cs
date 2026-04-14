using DanpheEMR.ServerModel.ClinicalModel_New;
using System.ComponentModel.DataAnnotations;
using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class PutClinicalHeadingFieldSetup_DTO
    {
        public int ClinicalHeadingId { get; set; }
        public string FieldDisplayName { get; set; }
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public string InputType { get; set; }
        public string OptionValue { get; set; }
        public int ParentHeadingId { get; set; }
        public bool IsIPD { get; set; }
        public bool IsOPD { get; set; }
        public bool IsEmergency { get; set; }
        public string GroupName { get; set; }
        public bool IsAcrossVisitAvailability { get; set; }
        public bool IsDisplayTitle { get; set; }
    }
}
