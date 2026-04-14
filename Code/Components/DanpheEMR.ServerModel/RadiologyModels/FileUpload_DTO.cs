using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.RadiologyModels
{
    public class FileUpload_DTO
    {
        public PatientModel PatientDetails { get; set; }
        public PatientFilesModel FileDetails { get; set; }
        public int PatientId { get; set; }
        public int ImagingReportId { get; set; }
        public int ImagingRequisitionId { get; set; }
        public int? PatientFileId { get; set; }
        public string ImagingItemName { get; set; }
        public string PatientCode { get; set; }
        public string OrderStatus { get; set; }
    }
}
