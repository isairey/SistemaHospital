using Org.BouncyCastle.Asn1.X9;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class FieldListView_DTO
    {
        public int FieldId { get; set; }
        public string FieldName { get; set; }
        public bool IsActive { get; set; }

    }
}
