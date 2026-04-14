using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.MasterModels
{
    public class AgeClassificationModel
    {

        [Key]
        public int AgeClassificationId { get; set; }
        public string AgeName { get; set; }
        public int MinAgeInDays { get; set; }
        public int MaxAgeInDays { get; set; }
        public string ReportType { get; set; }

    }
}
