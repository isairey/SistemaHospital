using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.StickerModels
{
    public class RegistrationStickerModel
    {
        [Key]
        public int RegistrationStickerSettingsId { get; set; }
        public string StickerName { get; set; }
        public string StickerGroupCode { get; set; }
        public string VisitType { get; set; }
        public bool IsDefaultForCurrentVisitType { get; set; }
        public string VisitDateLabel { get; set; }
        public bool ShowSchemeCode { get; set; }
        public bool ShowMemberNo { get; set; }
        public string MemberNoLabel { get; set; }
        public bool ShowClaimCode { get; set; }
        public bool ShowIpdNumber { get; set; }
        public bool ShowWardBedNo { get; set; }
        public bool ShowRegistrationCharge { get; set; }
        public bool ShowPatContactNo { get; set; }
        public bool ShowPatientDesignation { get; set; }
        public string PatientDesignationLabel { get; set; }
        public bool ShowQueueNo { get; set; }
        public bool IsActive { get; set; }
        public string QueueNoLabel { get; set; }
    }
}
