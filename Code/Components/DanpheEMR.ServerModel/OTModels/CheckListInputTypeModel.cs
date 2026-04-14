using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OTModels
{
    public class CheckListInputTypeModel
    {
        [Key]
        public int InputTypeId { get; set; }
        public string InputType { get; set; }
        public string DisplayText { get; set; }
        public string Value { get; set; }
        public bool HasDisplayLookUp { get; set; }
    }
}
