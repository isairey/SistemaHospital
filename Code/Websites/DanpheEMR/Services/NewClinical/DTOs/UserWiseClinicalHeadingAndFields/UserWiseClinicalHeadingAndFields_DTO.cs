using System.Collections.Generic;

namespace DanpheEMR.Services.NewClinical.DTOs.UserWiseClinicalHeadingAndFields
{
    public class ParentHeading_DTO
    {
        public int? ClinicalHeadingId { get; set; }
        public string ClinicalHeadingName { get; set; }
        public string DisplayName { get; set; }
        public int? DisplayOrder { get; set; }
        public int? ParentId { get; set; }
        public List<ChildHeading> ChildHeading { get; set; }
        public List<Field> Field { get; set; }
        public bool ActiveTab { get; set; }=false;
        public bool IsDefault { get; set; }

	}

    public class ChildHeading
    {
        public int? ClinicalHeadingId { get; set; }
        public string ClinicalHeadingName { get; set; }
        public string DisplayName { get; set; }
        public int? DisplayOrder { get; set; }
        public int? ParentId { get; set; }
        public List<Field> Field { get; set; }
        public bool ActiveTab { get; set; }=false;
		public bool IsDefault { get; set; }

	}

	public class Field
    {
        public int? FieldId { get; set; }
        public string FieldName { get; set; }
        public string FieldDisplayName { get; set; }
        public string FieldCode { get; set; }
        public string InputType { get; set; }
        public bool IsAcrossVisitAvailability { get; set; }
        public bool IsDisplayTitle { get; set; }
		public bool IsActive { get; set; }
        public string Pretemplate { get; set; }
        public int? ClinicalHeadingId {  get; set; }
        public int FieldDisplaySequence { get; set; }

		public List<FieldOptions> Options { get; set; }
        public List<QuestionaryConfig> QuestionaryConfig { get; set; }
    }

    public class FieldOptions
    {
        public int? FieldId { get; set; }
        public int? ClinicalOptionId { get; set; }
        public string Options { get; set; }
        public bool IsActive { get; set; }
    }

    public class QuestionaryConfig
    {
        public int? QuestionId { get; set; }
        public int? FieldId { get; set; }
        public string Question { get; set; }
        public string AnswerType { get; set; }
        public bool IsActive { get; set; }
        public List<QuestionOption> Options { get; set; }
    }

    public class QuestionOption
    {
        public int? QuestionId { get; set; }
        public int? QuestionOptionId { get; set; }
        public string QuestionOptionText { get; set; }
        public bool IsActive { get; set; }
    }
}
