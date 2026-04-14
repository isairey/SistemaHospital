using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalFieldQuestionaryOption_DTO
    {
        
        public int? QuestionOptionId { get; set; }
        public string QuestionOption { get; set; }

        public int? QuestionId { get; set; }

    }
}
