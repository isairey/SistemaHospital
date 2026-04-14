using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace DanpheEMR.Controllers.Stickers.DTOs
{
    public class VisitStickerData_DTO
    {
        //added for dynamcic code
        public string PatientSalutation { get; set; }
        public string PatientFname { get; set; }
        public string PatientMName { get; set; }
        public string PatientLname { get; set; }
        public string BloodGroup { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string MunicipalityName { get; set; }
        public string WardNumber { get; set; }
        public string Posting { get; set; }
        public string IdCardNumber { get; set; }
        public string Age { get; set; }
        public string SchemeName { get; set; }
        public string RoomNo { get; set; }
        public string VisitDate { get; set; }
        public string VisitTime { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string HospitalNumber { get; set; }
        public string PatientName { get; set; }
        public string Gender { get; set; }
        public string DateOfBirth { get; set; }
        public string PatientAddress { get; set; }
        public string PatientPhoneNumber { get; set; }
        public string PatientDesignation { get; set; }
        public string VisitCode { get; set; }
        public string VisitDateTime { get; set; }
        public string visitDate { get; set; }
        public string VisitTypeFormatted { get; set; }
        public string AppointmentType { get; set; }
        public string DepartmentName { get; set; }
        public string DepartmentCode { get; set; }
        public string PerformerName { get; set; }
        public decimal TicketCharge { get; set; }
        public string WardName { get; set; }
        public string BedNumber { get; set; }
        public string UserName { get; set; }
        public Int64? ClaimCode { get; set; }
        public string SchemeCode { get; set; }
        public string MemberNo { get; set; }
        public int? QueueNo { get; set; }
        public string FieldSettingsParamName { get; set; }
        public string MaritalStatus { get; set; }
        public string EthnicGroup { get; set; }
        public string CountryName { get; set; }
        public string CertificationNo { get; set; }
        public string Address { get; set; }


        public static VisitStickerData_DTO MapDataTableToSingleObject(DataTable visitSticker)
        {
            VisitStickerData_DTO retObj = new VisitStickerData_DTO();
            if (visitSticker != null)
            {
                string strPatData = JsonConvert.SerializeObject(visitSticker);
                List<VisitStickerData_DTO> sticker = JsonConvert.DeserializeObject<List<VisitStickerData_DTO>>(strPatData);
                if (sticker != null && sticker.Count > 0)
                {
                    retObj = sticker.First();
                }
            }
            return retObj;
        }
    }
}
