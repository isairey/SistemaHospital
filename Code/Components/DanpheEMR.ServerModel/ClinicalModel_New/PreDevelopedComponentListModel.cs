using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
	public class PreDevelopedComponentListModel
	{
		[Key]
		public int PreDevelopedComponentId { get; set; }
		public string ComponentName { get; set; }
		public string ComponentSelector{ get; set; }
		public string ComponentRoute{ get; set; }
		public string KeyWord{ get; set; }
		public DateTime CreatedOn{ get; set; }
		public int CreatedBy{ get; set; }
		public DateTime? ModifiedOn{ get; set; }
		public int? ModifiedBy{ get; set; }
		public bool IsActive{ get; set; }
	}
}
