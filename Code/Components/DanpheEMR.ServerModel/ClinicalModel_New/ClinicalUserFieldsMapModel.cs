using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
	public class ClinicalUserFieldsMapModel
	{
		[Key]
		public int ClinicalUserFieldId { get; set; }
		public int DepartmentId { get; set; }
		public int ClinicalHeadingId { get; set; }
		public int ClinicalFieldId { get; set; }
		public int EmployeeId { get; set; }
		public int CreatedBy { get; set; }
		public DateTime CreatedOn { get; set; }
		public int? ModifiedBy { get; set; }
		public DateTime? ModifiedOn { get; set; }
		public bool IsActive { get; set; }
	}
}
