using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
	 public class ClinicalFieldOptionModel
	{
		[Key]
		public int ClinicalOptionId { get; set; }
		public int FieldId{get; set;}
		public string Options{get; set;}
		public DateTime CreatedOn{get; set;}
		public int CreatedBy{get; set;}
		public DateTime? ModifiedOn{get; set;}
		public int? ModifiedBy{get; set;}
		public bool IsActive { get; set; }
	}
}
