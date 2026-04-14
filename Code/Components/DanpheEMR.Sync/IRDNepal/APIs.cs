using DanpheEMR.Sync.IRDNepal.Models;
using System;
using System.Net.Http;
using System.Net.Http.Headers;


namespace DanpheEMR.Sync.IRDNepal
{
    public class APIs
    {

        public static string PostSalesBillToIRD(IRD_BillViewModel salesBill, IrdConfigsDTO irdConfigs)
        {
            //return "200";
            string url_IRDNepal = irdConfigs.url_IRDNepal; //ConfigurationManager.AppSettings["url_IRDNepal"];
            string api_SalesIRDNepal = irdConfigs.api_SalesIRDNepal; // ConfigurationManager.AppSettings["api_SalesIRDNepal"];

            string respMsg = PostCmmonBillToIRd(salesBill, url_IRDNepal, api_SalesIRDNepal);
            return respMsg;
        }
        public static string PostSalesReturnBillToIRD(IRD_BillReturnViewModel salesReturnBill, IrdConfigsDTO irdConfigs)
        {
            //return "200";
            string url_IRDNepal = irdConfigs.url_IRDNepal; //ConfigurationManager.AppSettings["url_IRDNepal"];
            string api_SalesIRDNepal = irdConfigs.api_SalesReturnIRDNepal; //ConfigurationManager.AppSettings["api_SalesReturnIRDNepal"];
            string respMsg = PostCmmonBillToIRd(salesReturnBill, url_IRDNepal, api_SalesIRDNepal);
            return respMsg;
        }
        public static string PostPhrmInvoiceToIRD(IRD_PHRMBillSaleViewModel salesBill, IrdConfigsDTO irdConfigs)
        {
            //return "200";
            string url_IRDNepal = irdConfigs.url_IRDNepal; //ConfigurationManager.AppSettings["url_IRDNepal"];
            string api_SalesIRDNepal = irdConfigs.api_SalesIRDNepal; //ConfigurationManager.AppSettings["api_SalesIRDNepal"];
            string respMsg = PostCmmonBillToIRd(salesBill, url_IRDNepal, api_SalesIRDNepal);
            return respMsg;
        }
        public static string PostPhrmInvoiceReturnToIRD(IRD_PHRMBillSaleReturnViewModel salesReturnBill, IrdConfigsDTO irdConfigs)
        {
            //return "200";
            string url_IRDNepal = irdConfigs.url_IRDNepal; //ConfigurationManager.AppSettings["url_IRDNepal"];
            string api_SalesIRDNepal = irdConfigs.api_SalesReturnIRDNepal; //ConfigurationManager.AppSettings["api_SalesReturnIRDNepal"];
            string respMsg = PostCmmonBillToIRd(salesReturnBill, url_IRDNepal, api_SalesIRDNepal);
            return respMsg;
        }
        //extracted common code for both BillViewModel, BillReturnModel, pharmacy invoice and invoice return posting
        private static string PostCmmonBillToIRd(object bill, string url, string api)
        {
            string responseMessage = null;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.BaseAddress = new Uri(url);
                var response = client.PostAsJsonAsync(api, bill).Result;
                if (response.IsSuccessStatusCode)
                {
                    var message = response.Content.ReadAsStringAsync();
                    responseMessage = message.Result;
                }
                else
                {
                    responseMessage = "400";
                }

                return responseMessage;
            }
        }
    }
}
