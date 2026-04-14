using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalHeadingFieldsQuestionary_DTO
    {
        public int? QuestionId { get; set; }

        public string Question { get; set; }
        public string AnswerType { get; set; }

        public int FieldId { get; set; }
        public List<ClinicalFieldQuestionaryOption_DTO> QuestionOptions { get; set; }

    }
}
