using System;

namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class ClinicalDataVisitList_DTO
	{
		public string VisitCode { get; set; }
		public DateTime VisitDate { get; set; }
		public int PatientVisitId { get; set; }
		public int PatientId { get; set; }
		public string VisitStatus { get; set; }
		public bool IsClinicalDataEditable { get; set; }
	}
}