namespace DanpheEMR.Sync.IRDNepal
{
    public class IrdConfigsDTO
    {
        public string RemoteSyncServers { get; set; }
        public string user_IRDNepal { get; set; }
        public string pwd_IRDNepal { get; set; }
        public string url_IRDNepal { get; set; }
        public string api_SalesIRDNepal { get; set; }
        public string api_SalesReturnIRDNepal { get; set; }
        public string seller_pan_IRDNepal { get; set; }
        public int maximumTXNRecords { get; set; }
    }
}
