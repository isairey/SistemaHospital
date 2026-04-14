using System;

namespace DanpheEMR.Services.Insurance
{
    public class HIBApiConfig
    {
        public string HIBUrl { get; set; }
        public string HIBRemotekey { get; set; }
        public string HIBRemoteValue { get; set; }
        public string HIBUsername { get; set; }
        public string HIBPassword { get; set; }
        public string Enterer { get; set; }
        public string Facility { get; set; }
        public bool IsLatestAPI { get; set; }
    }
}
