using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using static System.Net.Mime.MediaTypeNames;

namespace DanpheEMR.ServerModel.ClinicalModel_New.ViewModels
{
    public class SmartPrintableFormVariablesViewModel
    {
        // Patient details
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string PatientSalutation { get; set; }
        public string PatientFname { get; set; }
        public string PatientMname { get; set; }
        public string PatientLname { get; set; }
        public string PatientNameNepali { get; set; }
        public string PhoneNumber { get; set; }
        public string BloodGroup { get; set; }
        public string IdCardNumber { get; set; }
        public string Posting { get; set; }
        public string Gender { get; set; }
        public string Age { get; set; }
        public string Dob { get; set; }
        public string MaritalStatus { get; set; }
        public string EthnicGroup { get; set; }
        public string CountrySubDivision { get; set; }
        public string Municipality { get; set; }
        public string WardNumber { get; set; }
        public string Address { get; set; }
        public string Country { get; set; }
        public string PatientFileName { get; set; }


        // Visit details
        public string VisitCode { get; set; }
        public string DoctorName { get; set; }
        public string DepartmentName { get; set; }
        public string VisitType { get; set; }
        public string AppointmentType { get; set; }
        public string ClaimCode { get; set; }
        public int? QueueNo { get; set; }
        public string Scheme { get; set; }
        public string PriceCategory { get; set; }
        public string RoomNo { get; set; }
        public string VisitDate { get; set; }
        public string VisitNepaliDate { get; set; }
        public string VisitTime { get; set; }
        public string VisitDateTime { get; set; }
        public string PolicyNo { get; set; }


        // Admission details
        public string AdmissionDate { get; set; }
        public string AdmissionNepaliDate { get; set; }
        public string AdmissionTime { get; set; }
        public string AdmittingDoctor { get; set; }
        public string ConsultingDoctors { get; set; }
        public string AdmittingDepartment { get; set; }
        public string BedNo { get; set; }
        public string Ward { get; set; }
        public string AdmissionCase { get; set; }
        public int? StayDays { get; set; }
        public string AdmissionNotes { get; set; }
        public string CareOfPersonName { get; set; }
        public string CareOfPersonPhoneNo { get; set; }
        public string CareOfPersonRelation { get; set; }


        // Discharge summary
        public string IPNumber { get; set; }
        public string DischargeDate { get; set; }
        public string DischargeNepaliDate { get; set; }
        public string DischargeTime { get; set; }
        public string DischargeType { get; set; }
        public string DoctorIncharge { get; set; }
        public string Diagnosis { get; set; }
        public string ProvisionalDiagnosis { get; set; }

        public string CurrentDate { get; set; }
        public string CurrentNepaliDate { get; set; }
        public string CurrentTime { get; set; }
        public string CurrentDateTime { get; set; }

        public string DeathDate { get; set; }
        public string DeathNepaliDate { get; set; }
        public string DeathTime { get; set; }
        public string ErCareOfPerson { get; set; }
        public string ErRelationWithPatient { get; set; }
        public string MedicoLegalCase { get; set; }
        public string TriageCode { get; set; }


        public static SmartPrintableFormVariablesViewModel MapDataTableToSingleObject(DataTable patInfo)
        {
            SmartPrintableFormVariablesViewModel retObj = new SmartPrintableFormVariablesViewModel();
            if (patInfo != null)
            {
                string strPatData = JsonConvert.SerializeObject(patInfo);
                List<SmartPrintableFormVariablesViewModel> patDetails = JsonConvert.DeserializeObject<List<SmartPrintableFormVariablesViewModel>>(strPatData);
                if (patDetails != null && patDetails.Count > 0)
                {
                    retObj = patDetails.First();
                }
            }
            return retObj;
        }

        public static string ConvertToBase64Image(string path)
        {
            if (!string.IsNullOrEmpty(path))
            {
                byte[] imageArray = System.IO.File.ReadAllBytes(path);
                string base64ImageRepresentation = Convert.ToBase64String(imageArray);
                return base64ImageRepresentation;
            }
            return "";
        }
    }
}
