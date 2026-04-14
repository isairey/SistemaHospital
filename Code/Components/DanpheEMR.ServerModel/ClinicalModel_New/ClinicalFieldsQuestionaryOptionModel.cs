using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalFieldsQuestionaryOptionModel
    {
        [Key]
        public int QuestionOptionId { get; set; }
        public int QuestionId { get; set; }
        public string QuestionOption { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public virtual ClinicalHeadingFieldsQuestionaryModel Questionaries { get; set; }

    }
}
