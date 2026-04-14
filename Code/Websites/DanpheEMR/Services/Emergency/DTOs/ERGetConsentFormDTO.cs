using System;

namespace DanpheEMR.Services.Emergency.DTOs
{
    public class ERGetConsentFormDTO
    {
        /// <summary>
        /// ERPatientId refers to the Emergency Patient for which transaction is being done
        /// </summary>
        public int ERPatientId { get; set; }
        /// <summary>
        /// FileId refers to the Consent File
        /// </summary>
        public int FileId { get; set; }
        /// <summary>
        /// PatientId refers to the Patient for which transaction is being done
        /// </summary>
        public int PatientId { get; set; }
        /// <summary>
        /// ShortName refers to Patient's ShortName
        /// </summary>
        public string ShortName { get; set; }
        /// <summary>
        /// FileType refers to the type of Consent File
        /// </summary>
        public string FileType { get; set; }
        /// <summary>
        /// FileName refers to the Consent File Name
        /// </summary>
        public string FileName { get; set; }
        /// <summary>
        /// DisplayName refers to the Consent File DisplayName
        /// </summary>
        public string DisplayName { get; set; }
        /// <summary>
        /// BinaryData refers to the Binary Data of the Consent File
        /// </summary>
        public string BinaryData { get; set; }
    }
}
