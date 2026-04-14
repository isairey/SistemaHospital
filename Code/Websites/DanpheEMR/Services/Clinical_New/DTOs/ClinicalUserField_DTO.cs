namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalUserField_DTO
    {
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public int? ClinicalUserFieldId { get; set; }
        public bool IsActive { get; set; }
        public int DisplaySequence { get;set; }
    }
}
