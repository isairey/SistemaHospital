using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTICDModel
    {
        public int ICDId { get; set; }
        public string ICDCode { get; set; }
        public string ICDDescription { get; set; }
        public string ICDVersion { get; set; }
        public bool IsActive { get; set; }
    }
}
