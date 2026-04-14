namespace DanpheEMR.Services.SSF.DTO
{
    public class AddAttachmentDTO
    {
        public string claim { get; set; }
        public AttachmentDocument[] documents { get; set; }
    }
    public class AttachmentDocument
    {
        public string filename { get; set; }
        public string mime { get; set; }
        public string title { get; set; }
        public string date { get; set; }
        public bool isRolledBack { get; set; }
        public string document { get; set; }
    }

}
