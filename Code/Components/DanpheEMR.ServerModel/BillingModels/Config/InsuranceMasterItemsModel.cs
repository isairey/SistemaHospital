using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.BillingModels.Config
{
    public class InsuranceMasterItemsModel
    {
        [Key]
        public int InsServiceItemId { get; set; }
        public string ServiceItemName { get; set; }
        public string InsCode { get; set; }
        public decimal Price { get; set; }
        public string InsuranceType { get; set; }
    }
}
