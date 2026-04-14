using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Data.Entity;
using DanpheEMR.Enums;
using DanpheEMR.ServerModel;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.Data;
using DanpheEMR.ViewModel.Dispensary;
using DanpheEMR.ServerModel.PharmacyModels;
using DanpheEMR.Security;
using DanpheEMR.Utilities;
using DanpheEMR.Core.Parameters;
using DanpheEMR.Core;
using DanpheEMR.ServerModel.MasterModels;
using System.Threading.Tasks;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ViewModel.Pharmacy;
using DanpheEMR.Services.Dispensary.DTOs;
using DanpheEMR.Services.Dispensary.DTOs.PharmacyInvoiceReceipt;
using DanpheEMR.Services.Dispensary.DTOs.PharmacyProvisional;
using DanpheEMR.ServerModel.PharmacyModels.Provisional;
using DanpheEMR.Services.Pharmacy.DTOs.Provisional;
using System.Data.Common;
using DanpheEMR.ServerModel.SSFModels;
using DanpheEMR.Services.Dispensary.DTOs.PharmacyConsumption;
using DanpheEMR.ServerModel.MedicareModels;
using DanpheEMR.CommonTypes;
using DanpheEMR.Controllers.Billing;
using DanpheEMR.Services.SSF.DTO;
using DanpheEMR.Services.Billing.Invoice;
using Microsoft.AspNetCore.SignalR;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Http;
using Serilog;
using DanpheEMR.ServerModel.InventoryModels.InventoryReportModel;
using DanpheEMR.Services.OnlinePayment.FonePay;
using DanpheEMR.Services.OnlinePayment.DTO.FonePay;
using DanpheEMR.Services.Insurance;
using Microsoft.Extensions.Logging;

namespace DanpheEMR.Controllers.Pharmacy
{

    public class PharmacySalesController : CommonController
    {
        private readonly PharmacyDbContext _pharmacyDbContext;
        private readonly PatientDbContext _patientDbContext;
        private readonly MasterDbContext _masterDbContext;
        private readonly AdmissionDbContext _admissionDbContext;
        private readonly CoreDbContext _coreDbContext;
        private readonly bool _realTimeRemoteSyncEnabled;
        private readonly bool _realTimeSSFClaimBooking;
        bool EnableDirectFonePay = false;
        bool EnableFewaPay = false;
        private readonly IFonePayService _fonePayService;
        private IHubContext<FonePayHub> _hubContext;
        private IHttpContextAccessor _contextAccessor;
        private IInsuranceService _insuranceService;
        private readonly ILogger<PharmacySalesController> _logger;

        public PharmacySalesController(IOptions<MyConfiguration> _config, IFonePayService fonePayService, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor, IInsuranceService insuranceService, ILogger<PharmacySalesController> logger) : base(_config)
        {
            _pharmacyDbContext = new PharmacyDbContext(connString);
            _patientDbContext = new PatientDbContext(connString);
            _masterDbContext = new MasterDbContext(connString);
            _admissionDbContext = new AdmissionDbContext(connString);
            _coreDbContext = new CoreDbContext(connString);
            _realTimeRemoteSyncEnabled = _config.Value.RealTimeRemoteSyncEnabled;
            _realTimeSSFClaimBooking = _config.Value.RealTimeSSFClaimBooking;
            EnableDirectFonePay = _config.Value.EnableDirectFonePay;
            EnableFewaPay = _config.Value.EnableFewaPay;
            _fonePayService = fonePayService;
            _hubContext = hubContext;
            _contextAccessor = contextAccessor;
            _insuranceService = insuranceService;
            _logger = logger;
        }

        [HttpGet]
        [Route("ProvisionalDrugRequisitionsByStatus")]
        public IActionResult ProvisionalDrugRequisitionsByStatus(string status)
        {
            //else if (reqType == "get-provisional-items")

            //Sud: 2Feb'23--No idea what this api is doing.. there's another similar api (AllProvisionalDrugRequisitions) as well. Need to check if only one can work or not.
            Func<object> func = () => GetProvisionalDrugRequisitionsByStatus(status);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("AllProvisionalDrugRequisitions")]
        public IActionResult AllProvisionalDrugRequisitions()
        {
            // else if (reqType == "get-all-provisional-items")

            //Sud: 2Feb'23--No idea what this api is doing.. there's another similar api (ProvisionalDrugRequisitionsByStatus) as well. Need to check if only one can work or not.
            Func<object> func = () => GetAllProvisionalDrugRequisitions();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("DispensaryAvailableStocksDetail")]
        public IActionResult DispensaryAvailableStocksDetail(int dispensaryId)
        {
            //else if (reqType == "itemtypeListWithItems")
            Func<object> func = () => GetDispensaryAvailableStocksDetail(dispensaryId);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("Invoices")]
        public IActionResult Invoices(string fromDate, string toDate, int dispensaryId)
        {
            //else if (reqType == "getsaleinvoicelist")
            Func<object> func = () => GetDispensaryInvoices(fromDate, toDate, dispensaryId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("InvoiceItems")]
        public IActionResult InvoiceItems(int invoiceId)
        {
            //else if (reqType == "getsaleinvoiceitemsbyid" && invoiceid > 0)
            Func<object> func = () => GetInvoiceItems(invoiceId);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("PatientInfo")]
        public IActionResult PatientInfo(int patientId)
        {
            //else if (reqType == "getPatientByPatId" && patientId > 0)
            Func<object> func = () => GetPatientInfo(patientId);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("PatientBillingSummary")]
        public IActionResult PatientBillingSummary(int patientId, int? schemeId, int? patientVisitId)
        {
            //patientId=${patientId} &priceCategoryId=${PriceCategoryId}&patientVisitId=${PatientVisitId}&memberNo=${MemberNo}
            //else if (reqType != null && reqType == "patientSummary" && patientId != null && patientId != 0)
            Func<object> func = () => GetPatientBillingSummary(patientId, schemeId, patientVisitId);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("PatientDeposits")]
        public IActionResult PatientDeposits(int patientId)
        {
            //else if (reqType != null && reqType == "patAllDeposits" && patientId != null && patientId != 0)
            Func<object> func = () => GetPatientDeposits(patientId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PatientBillHistory")]
        public IActionResult PatientBillHistory(int patientId)
        {
            //else if (reqType != null && reqType == "patientPastBillSummary" && patientId != null && patientId != 0)
            Func<object> func = () => GetPatientBillHistory(patientId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PatientsProvisionalInfo")]
        public IActionResult PatientsProvisionalInfo(int dispensaryId, DateTime fromDate, DateTime toDate)
        {
            //else if (reqType != null && reqType.ToLower() == "listpatientunpaidtotal")
            Func<object> func = () => GetPatientsProvisionalInfo(dispensaryId, fromDate, toDate);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PatientsProvisionalInfoByPatientId")]
        public IActionResult PatientsProvisionalInfoByPatientId(int dispensaryId, int patientId)
        {
            //else if (reqType != null && reqType.ToLower() == "listpatientunpaidtotal")
            Func<object> func = () => GetPatientsProvisionalInfoByPatientId(dispensaryId, patientId);
            return InvokeHttpGetFunction(func);
        }


        [HttpGet]
        [Route("PatientProvisionaItems")]
        public IActionResult PatientProvisionaItems(int patientId, int dispensaryId, int? patientVisitId)
        {
            //else if (reqType != null && reqType.ToLower() == "provisionalitemsbypatientid")
            Func<object> func = () => GetPatientProvisionaItems(patientId, dispensaryId, patientVisitId);
            return InvokeHttpGetFunction(func);
        }


        [HttpPost]
        [Route("DrugRequisitions_NotImplemented")]
        public IActionResult DrugRequisitions_NotImplemented()
        {
            //else if (reqType == "post-provisional-item")

            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();

            //Function used by below savemethod (PharmacyBL.ProvisionalItem) is not implemented in serverside. need to check it later.
            Func<object> func = () => SaveDrugRequisitions_NotImplemented(ipDataString, currentUser);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("OutdoorPatient")]
        public IActionResult OutdoorPatient()
        {
            //else if (reqType == "outdoorPatRegistration")
            string ipDataString = this.ReadPostData();

            Func<object> func = () => SaveOutdoorPatient(ipDataString);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("ProvisionalInvoice")]
        public IActionResult PostProvisionalInvoice([FromBody] List<PharmacyProvisionalSaleItem_DTO> provisionalItem)
        {
            string s = this.ReadPostData();

            List<PharmacyProvisionalSaleItem_DTO> t = DanpheJSONConvert.DeserializeObject<List<PharmacyProvisionalSaleItem_DTO>>(s);
            List<PHRMInvoiceTransactionItemsModel> invoiceItems = DanpheJSONConvert.DeserializeObject<List<PHRMInvoiceTransactionItemsModel>>(DanpheJSONConvert.SerializeObject(provisionalItem));
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<PharmacyProvisionalSale_DTO> func = () => PharmacyBL.SaveProvisionalInvoice(invoiceItems, currentUser, _pharmacyDbContext);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("FinalInvoiceFromProvisional")]
        public IActionResult FinalInvoiceFromProvisional([FromBody] PHRMTransactionProvisional_DTO provisional)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();
            Func<object> func = () => SaveFinalInvoiceFromProvisional(provisional, currentUser);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("Deposit")]
        public IActionResult Deposit()
        {
            //else if (reqType == "depositData")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();
            Func<object> func = () => SaveDeposit(ipDataString, currentUser);
            return InvokeHttpPostFunction(func);
        }


        [HttpPut]
        [Route("ProvisionalInvoice")]
        public IActionResult UpdateProvisional([FromBody] List<PHRMTransactionProvisionalReturnItem_DTO> provisionalReturnItems)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => UpdateProvisionalItems(provisionalReturnItems, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("CancelProvisionalInvoice")]
        public IActionResult CancelProvisional([FromBody] List<PHRMTransactionProvisionalReturnItem_DTO> provisionalReturnItems)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => CancelProvisionalItems(provisionalReturnItems, currentUser);
            return InvokeHttpPutFunction(func);
        }

        private object CancelProvisionalItems(List<PHRMTransactionProvisionalReturnItem_DTO> provisionalRetItems, RbacUser currentUser)
        {
            var currentDate = DateTime.Now;
            var currFiscalYear = PharmacyBL.GetFiscalYear(_pharmacyDbContext);
            List<PHRMTransactionProvisionalReturnItemsModel> provisionalReturnItems = new List<PHRMTransactionProvisionalReturnItemsModel>();

            using (var dbTransaction = _pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    provisionalRetItems.ForEach(item => item.ReturnQty = item.DispatchQty);
                    SaveProvisionalReturnItems(provisionalRetItems, out provisionalReturnItems, currentUser, currentDate, currFiscalYear);
                    var invoiceItemIds = provisionalReturnItems.Select(i => i.InvoiceItemId).ToList();

                    var invoiceItemsFromServer = _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(i => invoiceItemIds.Contains(i.InvoiceItemId)).ToList();

                    if (invoiceItemsFromServer.Exists(i => i.BilItemStatus != "provisional"))
                    {
                        throw new Exception("This provisional bill is already cleared.");
                    }
                    var invoiceItemsDict = provisionalReturnItems.ToDictionary(item => item.InvoiceItemId);

                    foreach (var item in invoiceItemsFromServer)
                    {
                        if (invoiceItemsDict.TryGetValue(item.InvoiceItemId, out var item1) && (decimal)item.Quantity != item1.Quantity)
                        {
                            throw new Exception("This provisional bill is already modified.");
                        }
                    }
                    UpdateStock(provisionalReturnItems, currentUser, currentDate, currFiscalYear, invoiceItemsFromServer);
                    CancelInvoiceItems(invoiceItemsFromServer);
                    dbTransaction.Commit();
                    return new
                    {
                        ReturnReceiptNo = provisionalReturnItems.FirstOrDefault().CancellationReceiptNo,
                        FiscalYearId = currFiscalYear.FiscalYearId
                    };
                }
                catch (Exception ex)
                {
                    dbTransaction.Rollback();
                    throw ex;
                }

            }
        }

        private void CancelInvoiceItems(List<PHRMInvoiceTransactionItemsModel> invoiceItemsFromServer)
        {

            foreach (var item in invoiceItemsFromServer)
            {
                item.Quantity = 0;
                item.SubTotal = 0;
                item.TotalDisAmt = 0;
                item.DiscountPercentage = 0;
                item.VATAmount = 0;
                item.VATPercentage = 0;
                item.TotalAmount = 0;
                item.CoPaymentCashAmount = 0;
                item.CoPaymentCreditAmount = 0;
            }
            _pharmacyDbContext.SaveChanges();
        }


        private object UpdateProvisionalItems(List<PHRMTransactionProvisionalReturnItem_DTO> provisionalRetItems, RbacUser currentUser)
        {
            var currentDate = DateTime.Now;
            var currFiscalYear = PharmacyBL.GetFiscalYear(_pharmacyDbContext);


            using (var dbTransaction = _pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    List<PHRMTransactionProvisionalReturnItemsModel> provisionalReturnItems = new List<PHRMTransactionProvisionalReturnItemsModel>();

                    SaveProvisionalReturnItems(provisionalRetItems, out provisionalReturnItems, currentUser, currentDate, currFiscalYear);

                    var invoiceItemIds = provisionalReturnItems.Select(i => i.InvoiceItemId).ToList();

                    var invoiceItemsFromServer = _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(i => invoiceItemIds.Contains(i.InvoiceItemId)).ToList();

                    if (invoiceItemsFromServer.Exists(i => i.BilItemStatus != "provisional"))
                    {
                        throw new Exception("This provisional bill is already cleared.");
                    }
                    var invoiceItemsDict = provisionalReturnItems.ToDictionary(item => item.InvoiceItemId);

                    foreach (var item in invoiceItemsFromServer)
                    {
                        if (invoiceItemsDict.TryGetValue(item.InvoiceItemId, out var item1) && (decimal)item.Quantity != item1.DispatchQty)
                        {
                            throw new Exception("This provisional bill is already modified.");
                        }
                    }

                    UpdateInvoiceItems(provisionalRetItems, invoiceItemsFromServer);
                    UpdateStock(provisionalReturnItems, currentUser, currentDate, currFiscalYear, invoiceItemsFromServer);
                    dbTransaction.Commit();
                    return new
                    {
                        ReturnReceiptNo = provisionalReturnItems.FirstOrDefault().CancellationReceiptNo,
                        FiscalYearId = currFiscalYear.FiscalYearId
                    };
                }
                catch (Exception ex)
                {
                    dbTransaction.Rollback();
                    throw ex;
                }
            }
        }

        [HttpGet]
        [Route("ProvisionalReturnInfo")]
        public IActionResult ProvisionalReturnInfo(int returnReceiptNo, int fiscalYearId)
        {
            Func<object> func = () => GetProvisionalReturnInfo(returnReceiptNo, fiscalYearId);
            return InvokeHttpGetFunction(func);
        }

        private object GetProvisionalReturnInfo(int ReturnReceiptNo, int fiscalYearId)
        {
            var provisionalReturnItem = (from provRetItm in _pharmacyDbContext.ProvisionalReturnItems
                                         .Where(a => a.CancellationReceiptNo == ReturnReceiptNo && a.FiscalYearId == fiscalYearId)
                                         join item in _pharmacyDbContext.PHRMItemMaster on provRetItm.ItemId equals item.ItemId
                                         join gen in _pharmacyDbContext.PHRMGenericModel on item.GenericId equals gen.GenericId
                                         select new
                                         {
                                             ItemName = provRetItm.ItemName,
                                             GenericName = gen.GenericName,
                                             BatchNo = provRetItm.BatchNo,
                                             ExpiryDate = provRetItm.ExpiryDate,
                                             SalePrice = provRetItm.SalePrice,
                                             Quantity = provRetItm.Quantity,
                                             SubTotal = provRetItm.SubTotal,
                                             DiscountAmount = provRetItm.DiscountAmount,
                                             VATAmount = provRetItm.VATAmount,
                                             TotalAmount = provRetItm.TotalAmount,
                                             PatientId = provRetItm.PatientId,
                                             PatientVisitId = provRetItm.PatientVisitId,
                                             SchemeId = provRetItm.SchemeId,
                                             CreatedBy = provRetItm.CreatedBy,
                                             PrescriberId = provRetItm.PrescriberId,
                                             CreatedOn = provRetItm.CreatedOn,
                                             CancellationReceiptNo = provRetItm.CancellationReceiptNo,
                                             CoPaymentCashAmount = provRetItm.CoPaymentCashAmount,
                                             CoPaymentCreditAmount = provRetItm.CoPaymentCreditAmount,
                                             HSCode = item.HSCode
                                         }).ToList();


            int PatientId = provisionalReturnItem[0].PatientId;
            int CreatedBy = provisionalReturnItem[0].CreatedBy;
            DateTime InvoiceDate = provisionalReturnItem[0].CreatedOn;
            int? PrescriberId = provisionalReturnItem[0].PrescriberId;
            int? PatientVisitId = provisionalReturnItem[0].PatientVisitId;

            var PatientInfo = (from pat in _pharmacyDbContext.PHRMPatient.Where(p => p.PatientId == PatientId)
                               join consub in _pharmacyDbContext.CountrySubDivision on pat.CountrySubDivisionId equals consub.CountrySubDivisionId
                               join country in _pharmacyDbContext.Countries on consub.CountryId equals country.CountryId
                               join mun in _pharmacyDbContext.Municipalities on pat.MunicipalityId equals mun.MunicipalityId into municipalityGroup
                               from municipality in municipalityGroup.DefaultIfEmpty()
                               select new PatientInfo_DTO
                               {
                                   PatientId = pat.PatientId,
                                   PatientCode = pat.PatientCode,
                                   ShortName = pat.ShortName,
                                   Address = pat.Address,
                                   CountrySubDivisionName = consub.CountrySubDivisionName,
                                   Gender = pat.Gender,
                                   Age = pat.Age,
                                   DateOfBirth = pat.DateOfBirth,
                                   PhoneNumber = pat.PhoneNumber,
                                   PANNumber = pat.PANNumber,
                                   MunicipalityName = municipality != null ? municipality.MunicipalityName : null,
                                   WardNumber = pat.WardNumber,
                                   CountryName = country.CountryName
                               }).FirstOrDefault();

            var UserName = _pharmacyDbContext.Employees.Where(emp => emp.EmployeeId == CreatedBy).FirstOrDefault().FullName;
            var prescriberDetail = _pharmacyDbContext.Employees.Where(e => e.EmployeeId == PrescriberId).FirstOrDefault();
            var SchemDetail = _pharmacyDbContext.PatientSchemeMaps.Where(pm => pm.LatestPatientVisitId == PatientVisitId).FirstOrDefault();


            var provisionalReturnInvoice = new
            {
                PatientInfo = PatientInfo,
                UserName = UserName,
                ProvisionalInvoiceItems = provisionalReturnItem,
                ReturnDate = InvoiceDate,
                ProviderNMCNumber = prescriberDetail != null ? prescriberDetail.MedCertificationNo : "N/A",
                ProviderName = prescriberDetail != null ? prescriberDetail.FullName : "ANONYMOUS DOCTOR",
                ClaimCode = SchemDetail != null ? SchemDetail.LatestClaimCode : null,
                PolicyNo = SchemDetail != null ? SchemDetail.PolicyNo : null,
                SubTotal = provisionalReturnItem.Sum(a => a.SubTotal),
                DiscountAmount = provisionalReturnItem.Sum(a => a.DiscountAmount),
                VATAmount = provisionalReturnItem.Sum(a => a.VATAmount),
                TotalAmount = provisionalReturnItem.Sum(a => a.TotalAmount),
                CoPaymentCashAmount = provisionalReturnItem.Sum(a => a.CoPaymentCashAmount),
                CoPaymentCreditAmount = provisionalReturnItem.Sum(a => a.CoPaymentCreditAmount),
                CancellationReceiptNo = ReturnReceiptNo
            };
            return provisionalReturnInvoice;
        }

        private void UpdateStock(List<PHRMTransactionProvisionalReturnItemsModel> provisionalReturnItems, RbacUser currentUser, DateTime currentDate, PharmacyFiscalYear currFiscalYear, List<PHRMInvoiceTransactionItemsModel> invoiceItemsFromServer)
        {

            foreach (var item in provisionalReturnItems)
            {
                var itemFromServer = invoiceItemsFromServer.FirstOrDefault(a => a.InvoiceItemId == item.InvoiceItemId);

                var returningQtyForThisItem = (double)item.Quantity;




                var provisionalSaleTxn = ENUM_PHRM_StockTransactionType.ProvisionalSaleItem;
                var provisionalCancelTxn = ENUM_PHRM_StockTransactionType.ProvisionalCancelItem;

                List<int> previouslyReturnedProvisionalRetItemIds = _pharmacyDbContext.ProvisionalReturnItems.Where(i => i.InvoiceItemId == item.InvoiceItemId).Select(a => a.ProvisionalReturnItemId).ToList();

                // find the total sold stock, substract with total returned stock
                var allStockTxnsForThisInvoiceItem = _pharmacyDbContext.StockTransactions
                                                                .Where(s => (s.ReferenceNo == item.InvoiceItemId && s.TransactionType == provisionalSaleTxn)
                                                                || (previouslyReturnedProvisionalRetItemIds.Contains(s.ReferenceNo) && s.TransactionType == provisionalCancelTxn)).ToList();

                if (allStockTxnsForThisInvoiceItem.Count(i => i.TransactionType == provisionalCancelTxn) > 0)
                {
                    double totalSoldQtyForThisItem = allStockTxnsForThisInvoiceItem.Where(a => a.TransactionType == provisionalSaleTxn).Sum(b => b.OutQty);
                    double? totalReturnedQtyForThisItem = allStockTxnsForThisInvoiceItem.Where(a => a.TransactionType == provisionalCancelTxn).Sum(b => b.InQty);

                    double totalReturnableQtyForThisItem = totalSoldQtyForThisItem - (totalReturnedQtyForThisItem ?? 0);

                    //if total returnable quantity for the item is less than returned quantity from client side, throw exception
                    if (totalReturnableQtyForThisItem < returningQtyForThisItem)
                        throw new Exception($"{totalReturnableQtyForThisItem} qty is already returned for {item.ItemName} with Batch : {item.BatchNo} ");
                }

                var stockIdList = allStockTxnsForThisInvoiceItem.Select(s => s.StockId).Distinct().ToList();
                var soldByStoreId = allStockTxnsForThisInvoiceItem[0].StoreId;
                var stockList = _pharmacyDbContext.StoreStocks.Include(s => s.StockMaster).Where(s => stockIdList.Contains(s.StockId) && s.StoreId == soldByStoreId).ToList();
                var remainingReturnedQuantity = returningQtyForThisItem;

                foreach (var stock in stockList)
                {
                    double soldQuantityForThisStock = allStockTxnsForThisInvoiceItem.Where(s => s.StockId == stock.StockId).Sum(s => s.OutQty);
                    double? previouslyReturnedQuantityForThisStock = allStockTxnsForThisInvoiceItem.Where(s => s.StockId == stock.StockId).Sum(s => s.InQty);
                    double totalReturnableQtyForThisStock = soldQuantityForThisStock - (previouslyReturnedQuantityForThisStock ?? 0);


                    PHRMStockTransactionModel newStockTxn = null;
                    if (totalReturnableQtyForThisStock == 0)
                    {
                        continue;
                    }
                    if (totalReturnableQtyForThisStock < remainingReturnedQuantity)
                    {
                        //Check if the sold store and returning store are same
                        if (stock.StoreId == item.StoreId)
                        {
                            stock.UpdateAvailableQuantity(newQty: stock.AvailableQuantity + totalReturnableQtyForThisStock);

                            newStockTxn = new PHRMStockTransactionModel(
                                                storeStock: stock,
                                                transactionType: ENUM_PHRM_StockTransactionType.ProvisionalCancelItem,
                                                transactionDate: currentDate,
                                                referenceNo: item.ProvisionalReturnItemId,
                                                createdBy: currentUser.EmployeeId,
                                                createdOn: currentDate,
                                                fiscalYearId: currFiscalYear.FiscalYearId
                                                );
                        }
                        else //If store is not same, then find the stock for the returning store
                        {
                            var returningStoreStock = _pharmacyDbContext.StoreStocks.Include(a => a.StockMaster).FirstOrDefault(s => s.StockId == stock.StockId && s.StoreId == item.StoreId);
                            if (returningStoreStock != null)
                            {
                                //If stock found, update the available quantity
                                returningStoreStock.UpdateAvailableQuantity(returningStoreStock.AvailableQuantity + totalReturnableQtyForThisStock);
                            }
                            else
                            {
                                // If stock not found, create a new stock for this store
                                returningStoreStock = new PHRMStoreStockModel(
                                    stockMaster: stock.StockMaster,
                                    storeId: item.StoreId,
                                    quantity: totalReturnableQtyForThisStock,
                                    costPrice: returningStoreStock.CostPrice,
                                    salePrice: returningStoreStock.SalePrice
                                    );

                                _pharmacyDbContext.StoreStocks.Add(returningStoreStock);
                                _pharmacyDbContext.SaveChanges();
                            }
                            // create new txn for this store
                            newStockTxn = new PHRMStockTransactionModel(
                                                storeStock: returningStoreStock,
                                                transactionType: ENUM_PHRM_StockTransactionType.ProvisionalCancelItem,
                                                transactionDate: currentDate,
                                                referenceNo: item.ProvisionalReturnItemId,
                                                createdBy: currentUser.EmployeeId,
                                                createdOn: currentDate,
                                                fiscalYearId: currFiscalYear.FiscalYearId
                                                );
                        }
                        newStockTxn.SetInOutQuantity(inQty: totalReturnableQtyForThisStock, outQty: 0);
                        remainingReturnedQuantity -= totalReturnableQtyForThisStock;
                    }
                    else
                    {
                        //Check if the sold store and returning store are same
                        if (stock.StoreId == item.StoreId)
                        {
                            stock.UpdateAvailableQuantity(newQty: stock.AvailableQuantity + remainingReturnedQuantity);
                            // create new txn for this store
                            newStockTxn = new PHRMStockTransactionModel(
                                                storeStock: stock,
                                                transactionType: ENUM_PHRM_StockTransactionType.ProvisionalCancelItem,
                                                transactionDate: currentDate,
                                                referenceNo: item.ProvisionalReturnItemId,
                                                createdBy: currentUser.EmployeeId,
                                                createdOn: currentDate,
                                                fiscalYearId: currFiscalYear.FiscalYearId
                                                );
                        }
                        //If store is not same, then find the stock for the returning store
                        else
                        {
                            var returningStoreStock = _pharmacyDbContext.StoreStocks.Include(a => a.StockMaster).FirstOrDefault(s => s.StoreStockId == stock.StoreStockId && s.StoreId == item.StoreId);
                            if (returningStoreStock != null)
                            {
                                //If stock found, update the available quantity
                                returningStoreStock.UpdateAvailableQuantity(newQty: returningStoreStock.AvailableQuantity + (remainingReturnedQuantity));
                            }
                            else
                            {
                                // If stock not found, create a new stock for this store
                                returningStoreStock = new PHRMStoreStockModel(
                                    stockMaster: stock.StockMaster,
                                    storeId: item.StoreId,
                                    quantity: remainingReturnedQuantity,
                                    costPrice: stock.CostPrice,
                                    salePrice: stock.SalePrice
                                    );
                                _pharmacyDbContext.StoreStocks.Add(returningStoreStock);
                                _pharmacyDbContext.SaveChanges();
                            }
                            // create new txn for this store
                            newStockTxn = new PHRMStockTransactionModel(
                                                storeStock: returningStoreStock,
                                                transactionType: ENUM_PHRM_StockTransactionType.ProvisionalCancelItem,
                                                transactionDate: currentDate,
                                                referenceNo: item.ProvisionalReturnItemId,
                                                createdBy: currentUser.EmployeeId,
                                                createdOn: currentDate,
                                                fiscalYearId: currFiscalYear.FiscalYearId
                                                );
                        }
                        newStockTxn.SetInOutQuantity(inQty: remainingReturnedQuantity, outQty: 0);
                        remainingReturnedQuantity = 0;
                    }
                    //add txn to dispensary stock txn and then check if fifo is completed.
                    _pharmacyDbContext.StockTransactions.Add(newStockTxn);
                    _pharmacyDbContext.SaveChanges();

                    if (remainingReturnedQuantity == 0)
                    {
                        break;
                    }
                }

            }
            _pharmacyDbContext.SaveChanges();
        }

        private void UpdateInvoiceItems(List<PHRMTransactionProvisionalReturnItem_DTO> provisionalReturnItemsDTO, List<PHRMInvoiceTransactionItemsModel> invoiceItemsFromServer)
        {
            var provisionalReturnItemsDict = provisionalReturnItemsDTO.ToDictionary(item => item.InvoiceItemId);

            foreach (var item in invoiceItemsFromServer)
            {
                if (provisionalReturnItemsDict.TryGetValue(item.InvoiceItemId, out var item1))
                {
                    item.Quantity -= (double)item1.ReturnQty;
                    item.SubTotal = Math.Max(item.SubTotal - item1.SubTotal, 0);
                    item.TotalDisAmt = Math.Max(item.TotalDisAmt - item1.TotalDisAmt, 0);
                    item.DiscountPercentage = item1.DiscountPercentage;
                    item.VATAmount = Math.Max(item.VATAmount - item1.VATAmount, 0);
                    item.VATPercentage = item1.VATPercentage;
                    item.TotalAmount = Math.Max(item.TotalAmount - item1.TotalAmount, 0);
                    item.CoPaymentCashAmount = Math.Max(item.CoPaymentCashAmount - item1.CoPaymentCashAmount, 0);
                    item.CoPaymentCreditAmount = Math.Max(item.CoPaymentCreditAmount - item1.CoPaymentCreditAmount, 0);
                }
            }
            _pharmacyDbContext.SaveChanges();
        }

        private void SaveProvisionalReturnItems(List<PHRMTransactionProvisionalReturnItem_DTO> provisionalReturnItemsDTO, out List<PHRMTransactionProvisionalReturnItemsModel> provisionalReturnItems, RbacUser currentUser, DateTime currentDate, PharmacyFiscalYear currFiscalYear)
        {
            var tempProvisionalReturnItems = new List<PHRMTransactionProvisionalReturnItemsModel>();
            provisionalReturnItemsDTO.ForEach(item =>
            {
                var provisionalReturnItem = new PHRMTransactionProvisionalReturnItemsModel();
                provisionalReturnItem = DanpheJSONConvert.DeserializeObject<PHRMTransactionProvisionalReturnItemsModel>(DanpheJSONConvert.SerializeObject(item));
                provisionalReturnItem.CreatedOn = currentDate;
                provisionalReturnItem.CreatedBy = currentUser.EmployeeId;
                provisionalReturnItem.FiscalYearId = currFiscalYear.FiscalYearId;
                provisionalReturnItem.ReferenceProvisionalReceiptNo = item.ReceiptNo;
                provisionalReturnItem.CancellationReceiptNo = GetProvisionaCancellationReceiptNumber(_pharmacyDbContext);
                provisionalReturnItem.DiscountAmount = item.TotalDisAmt;
                provisionalReturnItem.Quantity = item.ReturnQty;
                provisionalReturnItem.IsActive = true;
                tempProvisionalReturnItems.Add(provisionalReturnItem);
            });
            _pharmacyDbContext.ProvisionalReturnItems.AddRange(tempProvisionalReturnItems);
            _pharmacyDbContext.SaveChanges();
            provisionalReturnItems = tempProvisionalReturnItems;
        }

        public static int GetProvisionaCancellationReceiptNumber(PharmacyDbContext phrmdbcontext)
        {
            int fiscalYearId = PharmacyBL.GetFiscalYear(phrmdbcontext).FiscalYearId;

            int cancellationReceiptNo = (int)(from txn in phrmdbcontext.ProvisionalReturnItems
                                              where txn.FiscalYearId == fiscalYearId
                                              select txn.CancellationReceiptNo).DefaultIfEmpty(0).Max();
            return cancellationReceiptNo + 1;
        }

        [HttpPut]
        [Route("ProvisionalItemsCancel")]
        public IActionResult ProvisionalItemsCancel()
        {
            // else if (reqType == "cancelCreditItems")

            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();
            Func<object> func = () => UpdateProvisionalItemsCancel(ipDataString, currentUser);
            return InvokeHttpPutFunction(func);
        }


        [HttpPut]
        [Route("InvoicePrintCount")]
        public IActionResult PutInvoicePrintCount(int printCount, int invoiceId)
        {
            // else if (reqType == "UpdatePrintCountafterPrint")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();
            Func<object> func = () => UpdateInvoicePrintCount(printCount, invoiceId);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("DepositPrintCount")]
        public IActionResult PutDepositPrintCount()
        {
            //else if (reqType == "updateDepositPrint")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataString = this.ReadPostData();
            Func<object> func = () => UpdateDepositPrintCount(ipDataString);
            return InvokeHttpPutFunction(func);
        }
        [HttpGet("GetPatientList")]
        public IActionResult GetPatientList(string SearchText, bool IsInsurance)
        {

            //CoreDbContext coreDbContext = new CoreDbContext(connString);
            SearchText = SearchText == null ? string.Empty : SearchText.ToLower();
            Func<object> func = () => PharmacyBL.SearchPatient(SearchText, IsInsurance, _pharmacyDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("InvoiceReceiptByInvoiceId")]
        public IActionResult GetInvoiceReceipt(int InvoiceId)
        {
            Func<object> func = () => GetInvoiceReceiptData(InvoiceId);
            return InvokeHttpGetFunction(func);
        }
        private object GetInvoiceReceiptData(int InvoiceId)
        {
            var invoiceInfo = (from inv in _pharmacyDbContext.PHRMInvoiceTransaction.Where(i => i.InvoiceId == InvoiceId)
                               from pat in _pharmacyDbContext.PHRMPatient.Where(p => p.PatientId == inv.PatientId)
                               from provider in _pharmacyDbContext.Employees.Where(p => p.EmployeeId == inv.PrescriberId).DefaultIfEmpty()
                               from countrySubDiv in _pharmacyDbContext.CountrySubDivision.Where(c => c.CountrySubDivisionId == pat.CountrySubDivisionId)
                               from country in _pharmacyDbContext.Countries.Where(c => c.CountryId == countrySubDiv.CountryId).DefaultIfEmpty()
                               from municipality in _pharmacyDbContext.Municipalities.Where(c => c.MunicipalityId == pat.MunicipalityId).DefaultIfEmpty()
                               from fy in _pharmacyDbContext.PharmacyFiscalYears.Where(f => f.FiscalYearId == inv.FiscalYearId)
                               from createdByUser in _pharmacyDbContext.Users.Where(u => u.EmployeeId == inv.CreatedBy)
                               from creditOrg in _pharmacyDbContext.billingCreditOrganizations.Where(c => c.OrganizationId == inv.OrganizationId).DefaultIfEmpty()
                               from store in _pharmacyDbContext.PHRMStore.Where(s => s.StoreId == inv.StoreId)
                               from sch in _pharmacyDbContext.Schemes.Where(s => s.SchemeId == inv.SchemeId)
                               select new PharmacyInvoiceReceipt_DTO
                               {
                                   InvoiceId = inv.InvoiceId,
                                   PatientVisitId = inv.PatientVisitId,
                                   PrescriberId = inv.PrescriberId,
                                   ProviderName = provider.FullName,
                                   ProviderNMCNumber = provider.MedCertificationNo,
                                   PrintCount = inv.PrintCount,
                                   CurrentFiscalYearName = fy.FiscalYearName,
                                   ReceiptDate = inv.CreateOn,
                                   ReceiptPrintNo = inv.InvoicePrintId,
                                   ClaimCode = inv.ClaimCode,
                                   PaymentMode = inv.PaymentMode,
                                   SubTotal = inv.SubTotal,
                                   DiscountAmount = inv.DiscountAmount,
                                   VATAmount = inv.VATAmount,
                                   CashAmount = inv.ReceivedAmount,
                                   CreditAmount = inv.CreditAmount,
                                   TaxableAmount = inv.SubTotal - inv.DiscountAmount,
                                   NonTaxableAmount = inv.DiscountAmount,
                                   TotalAmount = inv.TotalAmount,
                                   Change = inv.Change,
                                   Tender = inv.Tender,
                                   CreditOrganizationName = inv.PaymentMode == ENUM_BillPaymentMode.credit ? creditOrg.OrganizationName : "",
                                   Remarks = inv.Remark,
                                   BillingUser = createdByUser.UserName,
                                   IsReturned = false,
                                   StoreId = inv.StoreId,
                                   StoreName = store.Name,
                                   PaymentDetails = inv.PaymentDetails,
                                   SchemeId = sch.SchemeId,
                                   SchemeApiIntegration = sch.ApiIntegrationName,
                                   PatientInfo = new PatientInfo_DTO
                                   {
                                       PatientId = inv.PatientId,
                                       PatientCode = pat.PatientCode,
                                       ShortName = pat.ShortName,
                                       Address = pat.Address,
                                       CountrySubDivisionName = countrySubDiv.CountrySubDivisionName,
                                       Gender = pat.Gender,
                                       Age = pat.Age,
                                       DateOfBirth = pat.DateOfBirth,
                                       PhoneNumber = pat.PhoneNumber,
                                       PANNumber = pat.PANNumber,
                                       CountryName = country.CountryName,
                                       WardNumber = pat.WardNumber,
                                       MunicipalityName = municipality.MunicipalityName
                                   }

                               }).FirstOrDefault();

            if (invoiceInfo.PatientVisitId != null)
            {
                var patSchemeMapDetails = _pharmacyDbContext.PatientSchemeMaps.Where(pc => pc.PatientId == invoiceInfo.PatientInfo.PatientId && pc.LatestPatientVisitId == invoiceInfo.PatientVisitId).FirstOrDefault();

                if (patSchemeMapDetails != null)
                    invoiceInfo.PolicyNo = patSchemeMapDetails.PolicyNo;
            }

            invoiceInfo.InvoiceItems = (
                from IItem in _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(I => I.InvoiceId == InvoiceId && I.Quantity > 0)
                from I in _pharmacyDbContext.PHRMItemMaster.Where(i => i.ItemId == IItem.ItemId)
                from G in _pharmacyDbContext.PHRMGenericModel.Where(g => g.GenericId == I.GenericId).DefaultIfEmpty()
                select new PharmacyInvoiceReceiptItem_DTO
                {
                    InvoiceItemId = IItem.InvoiceItemId,
                    ItemId = IItem.ItemId,
                    Quantity = IItem.Quantity,
                    ItemName = IItem.ItemName,
                    ItemCode = IItem.ItemCode,
                    BatchNo = IItem.BatchNo,
                    ExpiryDate = IItem.ExpiryDate,
                    SalePrice = IItem.SalePrice,
                    SubTotal = IItem.SubTotal,
                    VATAmount = IItem.VATAmount,
                    DiscountAmount = IItem.TotalDisAmt,
                    TotalAmount = IItem.TotalAmount,
                    GenericName = (G != null) ? G.GenericName : "N/A",
                    RackNo = (from itemrack in _pharmacyDbContext.PHRMRackItem.Where(ri => ri.ItemId == IItem.ItemId && ri.StoreId == invoiceInfo.StoreId)
                              join rack in _pharmacyDbContext.PHRMRack on itemrack.RackId equals rack.RackId
                              select rack.RackNo).FirstOrDefault(),
                    HSCode = I.HSCode
                }).OrderBy(i => i.InvoiceItemId).ToList();

            invoiceInfo.DepositList = (from dep in _pharmacyDbContext.BillingDepositModel
                                       where dep.InvoiceId == InvoiceId
                                             && new[] { "depositdeduct", "ReturnDeposit" }.Contains(dep.TransactionType)
                                       orderby dep.SettlementId
                                       select new DepositDetail_DTO
                                       {
                                           ReceiptNo = "DR-" + dep.ReceiptNo.ToString(),
                                           TransactionType = dep.TransactionType == "depositdeduct" ? "Deposit Deducted" :
                                                             dep.TransactionType == "ReturnDeposit" ? "Deposit Returned" :
                                                             dep.TransactionType == "Deposit" ? "Deposit Received" : "",
                                           DepositAmount = dep.OutAmount,
                                           ReceiptDate = dep.CreatedOn
                                       }).ToList();

            return invoiceInfo;
        }
        [HttpGet]
        [Route("PharmacySalePatient")]
        public IActionResult GetPharmacySalePatient(bool IsInsurance)
        {
            Func<object> func = () => (from pat in _pharmacyDbContext.PHRMPatient
                                       where pat.IsActive == true
                                       let claimCode = _pharmacyDbContext.PHRMPatientVisit.Where(a => a.PatientId == pat.PatientId && a.Ins_HasInsurance == true).Max(a => a.ClaimCode)
                                       select new
                                       {
                                           PatientId = pat.PatientId,
                                           PatientCode = pat.PatientCode,
                                           ShortName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,
                                           IsOutdoorPatient = pat.IsOutdoorPat,
                                           HasInsurance = pat.Ins_HasInsurance,
                                           NSHINumber = pat.Ins_NshiNumber,
                                           LatestClaimCode = IsInsurance ? claimCode : null,
                                           RemainingBalance = IsInsurance ? pat.Ins_InsuranceBalance : 0
                                       }).Where(p => IsInsurance == false || (IsInsurance == true && p.HasInsurance == true && p.LatestClaimCode != null))
                                              .OrderByDescending(p => p.PatientId)
                                              .ToList();
            return InvokeHttpGetFunction(func);
        }
        [HttpPost("Invoice")]
        public IActionResult PostInvoice([FromBody] PHRMInvoiceTransactionModel invoiceDataFromClient)
        {
            Func<object> func = () => PostInvoiceData(invoiceDataFromClient);
            return InvokeHttpPostFunction(func);

        }
        private object PostInvoiceData(PHRMInvoiceTransactionModel invoiceDataFromClient)
        {
            try
            {
                string s = this.ReadPostData();
                var a = DanpheJSONConvert.DeserializeObject<PHRMInvoiceTransactionModel>(s);
                dynamic crSalesValidationObj = CheckValidationForCreditSales(invoiceDataFromClient, _pharmacyDbContext);
                if (!crSalesValidationObj.IsValid)
                {
                    Log.Error(crSalesValidationObj.ErrorMessage);
                    throw new Exception(crSalesValidationObj.ErrorMessage);
                }
                var currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);

                if (invoiceDataFromClient == null || invoiceDataFromClient?.InvoiceItems == null) throw new Exception("Invoice Data is empty.");

                if (invoiceDataFromClient.SelectedPatient.PatientId == 0)
                {
                    invoiceDataFromClient.SelectedPatient.CreatedBy = currentUser.EmployeeId;
                    invoiceDataFromClient.PatientId = PharmacyBL.RegisterPatient(invoiceDataFromClient.SelectedPatient, _pharmacyDbContext, _patientDbContext, _coreDbContext);
                }

                var paymentDetails = invoiceDataFromClient.PaymentDetails;
                if (paymentDetails != null && paymentDetails.ToLower().Contains(ENUM_OnlinePaymentMode.FonePay) && EnableDirectFonePay && EnableFewaPay == false)
                {
                    FonepayDynamicQrRequest_DTO fonepayDynamicQrRequest = new FonepayDynamicQrRequest_DTO
                    {
                        amount = (long)invoiceDataFromClient.TotalAmount,
                        prn = new Random().Next().ToString()
                    };
                    FonePayTransactionEssentials_DTO obj = new FonePayTransactionEssentials_DTO(fonepayDynamicQrRequest, invoiceDataFromClient, currentUser, connString, _realTimeRemoteSyncEnabled, _realTimeSSFClaimBooking, invoiceDataFromClient.TotalAmount, ENUM_FonePayTransactionRequestFrom.PharmacySales, invoiceDataFromClient.PatientId);
                    var qrResponse = _fonePayService.GenerateQR(obj, _pharmacyDbContext, _hubContext, _contextAccessor);
                    return qrResponse;
                }
                else
                {
                    PHRMInvoiceTransactionModel finalInvoiceData = PharmacyBL.InvoiceTransaction(invoiceDataFromClient, _pharmacyDbContext, currentUser, _realTimeRemoteSyncEnabled, _realTimeSSFClaimBooking, _hubContext, _contextAccessor, _coreDbContext, _insuranceService, connString);

                    //var itemList = finalInvoiceData.InvoiceItems.OrderBy(s => s.ItemName).ToList();
                    //finalInvoiceData.InvoiceItems = itemList;

                    return finalInvoiceData.InvoiceId;
                }
            }
            catch (Exception ex)
            {
                Log.Error("Failed to save invoice" + ex.Message);
                throw ex;
            }
        }

        private object CheckValidationForCreditSales(PHRMInvoiceTransactionModel Txn, PharmacyDbContext _pharmacyDbContext)
        {
            bool IsValid = true;
            string ErrorMessage = "";
            int txnPatientSchemeId = Txn.SchemeId;
            BillingSchemeModel txnScheme = (from s in _pharmacyDbContext.Schemes
                                            where s.SchemeId == txnPatientSchemeId
                                            select s).FirstOrDefault();
            if (txnScheme != null && txnScheme.DefaultCreditOrganizationId > 0 && Txn.PaymentMode == ENUM_BillPaymentMode.credit)
            {
                int patLatestVisitId = Txn.PatientVisitId.HasValue ? Txn.PatientVisitId.Value : 0;
                if (patLatestVisitId == 0)
                {
                    IsValid = false;
                    ErrorMessage = "Patient must have Visit for Credit Sales.";
                    return new { IsValid, ErrorMessage };
                }
                VisitModel patLatestVisit = (from vis in _pharmacyDbContext.PHRMPatientVisit
                                             where vis.PatientVisitId == patLatestVisitId
                                             select vis).FirstOrDefault();
                if (patLatestVisit.SchemeId != txnScheme.SchemeId)
                {
                    IsValid = false;
                    ErrorMessage = "Same Scheme Visit is compulsory for Credit Sales.";
                    return new { IsValid, ErrorMessage };
                }
                int txnPaymentOrganizationId = Txn.OrganizationId.Value; //Payment CreditOrganizationId
                CreditOrganizationModel txnCreditOrg = (from crOrg in _pharmacyDbContext.billingCreditOrganizations
                                                        where crOrg.OrganizationId == txnPaymentOrganizationId
                                                        select crOrg).FirstOrDefault();
                if (txnPaymentOrganizationId != txnScheme.DefaultCreditOrganizationId && txnCreditOrg.IsClaimManagementApplicable)
                {
                    IsValid = false;
                    ErrorMessage = "Cannot perform Credit Sales using Credit Organozation except default.";
                    return new { IsValid, ErrorMessage };
                }
            }
            return new { IsValid, ErrorMessage };
        }

        private object GetProvisionalDrugRequisitionsByStatus(string status)
        {
            var WardName = (from ptinfo in _admissionDbContext.PatientBedInfos.AsEnumerable()
                            join wd in _admissionDbContext.Wards.AsEnumerable() on ptinfo.WardId equals wd.WardId
                            select new { ptinfo.PatientId, wd.WardName }).ToList().AsEnumerable();

            var provisionalItems = (from pro in _pharmacyDbContext.DrugRequistion.AsEnumerable()
                                    join pat in _pharmacyDbContext.PHRMPatient.AsEnumerable() on pro.PatientId equals pat.PatientId
                                    where pro.Status == status
                                    select new
                                    {
                                        ShortName = pat.ShortName,
                                        ContactNo = pat.PhoneNumber,
                                        CreatedOn = pro.CreatedOn,
                                        Status = pro.Status,
                                        PatientId = pro.PatientId,
                                        RequisitionId = pro.RequisitionId,
                                        WardName = WardName.Where(w => w.PatientId == pat.PatientId).Select(s => s.WardName).FirstOrDefault()
                                    }).ToList();

            return provisionalItems;
        }

        private object GetAllProvisionalDrugRequisitions()
        {

            var provisionalItems = (from pro in _pharmacyDbContext.DrugRequistion
                                    join pat in _pharmacyDbContext.PHRMPatient on pro.PatientId equals pat.PatientId
                                    orderby pro.RequisitionId descending
                                    select new
                                    {
                                        ShortName = pat.ShortName,
                                        ContactNo = pat.PhoneNumber,
                                        CreatedOn = pro.CreatedOn,
                                        Status = pro.Status,
                                        PatientId = pro.PatientId,
                                        RequisitionId = pro.RequisitionId
                                    }).ToList();

            return provisionalItems;
        }

        private object GetDispensaryAvailableStocksDetail(int dispensaryId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@DispensaryId", dispensaryId)
                    };
            DataTable invoiceList = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_GetDispensaryAvailableStocksDetailForDrugRequuisition", paramList, _pharmacyDbContext);
            return invoiceList;


        }

        private object GetDispensaryInvoices(string fromDate, string toDate, int dispensaryId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@StoreId", dispensaryId)
                    };
            DataTable invoiceList = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_GetInvoicesBetweenDateRange", paramList, _pharmacyDbContext);
            return invoiceList;
        }

        private object GetInvoiceItems(int invoiceId)
        {
            var saleInvoiceItemsByInvoiceId = (from invitm in _pharmacyDbContext.PHRMInvoiceTransactionItems
                                               where invitm.InvoiceId == invoiceId
                                               select new
                                               {
                                                   InvoiceItemId = invitm.InvoiceItemId,
                                                   InvoiceId = invitm.InvoiceId,
                                                   invitm.CounterId,
                                                   ExpiryDate = invitm.ExpiryDate,
                                                   ItemId = invitm.ItemId,
                                                   Quantity = invitm.Quantity,
                                                   ItemName = invitm.ItemName,
                                                   BatchNo = invitm.BatchNo,
                                                   Price = invitm.Price,
                                                   SalePrice = invitm.SalePrice,
                                                   FreeQuantity = invitm.FreeQuantity,
                                                   SubTotal = invitm.SubTotal,
                                                   VATPercentage = invitm.VATPercentage,
                                                   DiscountPercentage = invitm.DiscountPercentage,
                                                   TotalAmount = invitm.TotalAmount,
                                                   BilItemStatus = invitm.BilItemStatus,
                                                   CreatedBy = invitm.CreatedBy,
                                                   CreatedOn = invitm.CreatedOn,
                                                   TotalDisAmt = invitm.TotalDisAmt
                                               }).Where(q => q.Quantity > 0).OrderBy(x => x.ItemName).ToList();
            return saleInvoiceItemsByInvoiceId;

        }

        private object GetPatientInfo(int patientId)
        {

            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@PatientId", patientId)
            };
            DataTable patientInfoDataTable = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_GetPatientInformation", paramList, _pharmacyDbContext);
            DispensaryPatientInfo_DTO patientInfo = DispensaryPatientInfo_DTO.ConvertDataTableToPatientInfoObject(patientInfoDataTable);
            return patientInfo;
        }

        /// <summary>
        /// Returns the bill summary eg: DepositBalance, IpCreditLimits, OpCreditLimits, etc of current patient 
        /// </summary>
        private object GetPatientBillingSummary(int patientId, int? schemeId, int? patientVisitId)
        {
            bool usePharmacyDepositIndependently = ReadDepositConfigureationParam();

            //get all deposit related transactions of this patient. and sum them acc to DepositType groups.
            var patientAllDepositTxns = (from bill in _pharmacyDbContext.BillingDepositModel
                                         .Where(d => usePharmacyDepositIndependently ? d.ModuleName == ENUM_ModuleNames.Dispensary : true)
                                         where bill.PatientId == patientId
                                         group bill by new { bill.PatientId, bill.TransactionType } into p
                                         select new
                                         {
                                             DepositType = p.Key.TransactionType,
                                             SumInAmount = p.Sum(a => a.InAmount),
                                             SumOutAmount = p.Sum(a => a.OutAmount)
                                         }).ToList();

            //separate sum of each deposit types and calculate deposit balance.
            decimal totalDepositAmt = 0;
            decimal totalDepositDeductAmt = 0;
            decimal totalDepositReturnAmt = 0;
            decimal currentDepositBalance = 0;

            var totalDepositAmtObj = patientAllDepositTxns.Find(bil => bil.DepositType == ENUM_DepositTransactionType.Deposit);
            var totalDepositDeductAmtObj = patientAllDepositTxns.Find(bil => bil.DepositType == ENUM_DepositTransactionType.DepositDeduct);
            var totalDepositReturnAmtObj = patientAllDepositTxns.Find(bil => bil.DepositType == ENUM_DepositTransactionType.ReturnDeposit);

            totalDepositAmt = totalDepositAmtObj?.SumInAmount ?? 0;
            totalDepositDeductAmt = totalDepositDeductAmtObj?.SumOutAmount ?? 0;
            totalDepositReturnAmt = totalDepositReturnAmtObj?.SumOutAmount ?? 0;

            currentDepositBalance = totalDepositAmt - totalDepositDeductAmt - totalDepositReturnAmt;

            //Provisional Amount
            decimal TotalPharmacyProvisionalAmount = _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(a => a.BilItemStatus == ENUM_BillingStatus.provisional && a.PatientId == patientId)
                                       .Select(a => a.TotalAmount).DefaultIfEmpty(0).Sum();

            //Credit  Amount
            decimal TotalPharmacyCreditAmount = _pharmacyDbContext.PHRMInvoiceTransaction
                                       .Where(bill => bill.PatientId == patientId && bill.BilStatus == ENUM_BillingStatus.unpaid && !bill.IsReturn)
                                       .Select(a => a.TotalAmount).DefaultIfEmpty(0).Sum();

            //Credit Return Amount
            var patCredit = (from inv in _pharmacyDbContext.PHRMInvoiceTransaction
                             join retinv in _pharmacyDbContext.PHRMInvoiceReturnModel on inv.InvoiceId equals retinv.InvoiceId
                             where inv.PatientId == patientId && inv.BilStatus != ENUM_BillingStatus.paid && inv.IsReturn != true
                             select new
                             {
                                 CreditReturnAmount = retinv.TotalAmount
                             }).ToList();
            decimal TotalPharmacyCreditReturnAmount = 0;
            if (patCredit != null)
            {
                TotalPharmacyCreditReturnAmount = patCredit.Sum(a => a.CreditReturnAmount);
            }


            decimal IpCreditLimit = 0;
            decimal OpCreditLimit = 0;
            decimal GeneralCreditLimit = 0;
            decimal OpBalance = 0;
            decimal IpBalance = 0;

            if (schemeId != null)
            {
                var PatientMapPriceCategoryDetail = _pharmacyDbContext.PatientSchemeMaps
                    .Where(p => p.PatientId == patientId && p.IsActive && p.SchemeId == schemeId).FirstOrDefault();
                if (PatientMapPriceCategoryDetail != null && PatientMapPriceCategoryDetail.PolicyNo != null)
                {
                    IpCreditLimit = PatientMapPriceCategoryDetail.IpCreditLimit;
                    OpCreditLimit = PatientMapPriceCategoryDetail.OpCreditLimit;
                    GeneralCreditLimit = PatientMapPriceCategoryDetail.GeneralCreditLimit;

                    var medicareMeber = _patientDbContext.MedicareMembers.Where(a => a.MemberNo == PatientMapPriceCategoryDetail.PolicyNo).FirstOrDefault();
                    if (medicareMeber != null)
                    {
                        if (medicareMeber.IsDependent)
                        {
                            var Balance = _patientDbContext.MedicareMembers.Where(a => a.MemberNo == PatientMapPriceCategoryDetail.PolicyNo && medicareMeber.IsDependent == true)
                                .Join(_patientDbContext.MedicareMemberBalances,
                            mm => mm.ParentMedicareMemberId,
                            mmb => mmb.MedicareMemberId,
                            (mm, mmb) => new
                            {
                                OpBalance = mmb.OpBalance,
                                IpBalance = mmb.IpBalance
                            }).FirstOrDefault();

                            OpBalance = (Balance != null && Balance.OpBalance > 0) ? Balance.OpBalance : 0;
                            IpBalance = (Balance != null && Balance.IpBalance > 0) ? Balance.IpBalance : 0;
                        }
                        else
                        {
                            var Balance = _patientDbContext.MedicareMembers.Where(a => a.MemberNo == PatientMapPriceCategoryDetail.PolicyNo).Join(_patientDbContext.MedicareMemberBalances,
                                                        mm => mm.MedicareMemberId,
                                                        mmb => mmb.MedicareMemberId,
                                                        (mm, mmb) => new
                                                        {
                                                            OpBalance = mmb.OpBalance,
                                                            IpBalance = mmb.IpBalance
                                                        }).FirstOrDefault();

                            OpBalance = (Balance != null && Balance.OpBalance > 0) ? Balance.OpBalance : 0;
                            IpBalance = (Balance != null && Balance.IpBalance > 0) ? Balance.IpBalance : 0;
                        }
                    }
                }

            }
            //Part-4: Return a single object with Both Balances (Deposit and Credit).
            var patientBillingSummary = new
            {
                PatientId = patientId,
                CreditAmount = TotalPharmacyCreditAmount - TotalPharmacyCreditReturnAmount,
                ProvisionalAmt = TotalPharmacyProvisionalAmount,
                TotalDue = TotalPharmacyCreditAmount + TotalPharmacyProvisionalAmount - TotalPharmacyCreditReturnAmount,
                DepositBalance = currentDepositBalance,
                BalanceAmount = (double)currentDepositBalance - ((double)TotalPharmacyCreditAmount + (double)TotalPharmacyProvisionalAmount - (double)TotalPharmacyCreditReturnAmount),
                IpCreditLimit = IpCreditLimit,
                OpCreditLimit = OpCreditLimit,
                GeneralCreditLimit = GeneralCreditLimit,
                OpBalance = OpBalance,
                IpBalance = IpBalance
            };

            return patientBillingSummary;

        }

        private object GetPatientDeposits(int patientId)
        {
            bool usePharmacyDepositIndependently = ReadDepositConfigureationParam();

            var PatientDeposit = (from data in _pharmacyDbContext.BillingDepositModel
                                  .Where(d => usePharmacyDepositIndependently ? d.ModuleName == ENUM_ModuleNames.Dispensary : true)
                                  where data.PatientId == patientId
                                  group data by new { data.PatientId, data.TransactionType } into p
                                  select new
                                  {
                                      TransactionType = p.Key.TransactionType,
                                      InAmount = p.Sum(a => a.InAmount),
                                      OutAmount = p.Sum(a => a.OutAmount)
                                  }).ToList();

            return PatientDeposit;
        }

        private bool ReadDepositConfigureationParam()
        {
            bool usePharmacyDepositsIndependently = false;
            var param = _pharmacyDbContext.CFGParameters.FirstOrDefault(p => p.ParameterGroupName == "Pharmacy" && p.ParameterName == "UsePharmacyDeposit");
            if (param != null)
            {
                var paramValue = param.ParameterValue;
                usePharmacyDepositsIndependently = paramValue == "true" ? true : false;
            }
            return usePharmacyDepositsIndependently;
        }

        private object GetPatientBillHistory(int patientId)
        {
            var patientAllDepositTxns = (from bill in _pharmacyDbContext.DepositModel
                                         where bill.PatientId == patientId// && bill.i == true//here PatientId comes as InputId from client.
                                         group bill by new { bill.PatientId, bill.DepositType } into p
                                         select new
                                         {
                                             DepositType = p.Key.DepositType,
                                             SumAmount = p.Sum(a => a.DepositAmount)
                                         }).ToList();
            double? totalDepositAmt, totalDepositDeductAmt, totalDepositReturnAmt, currentDepositBalance;
            currentDepositBalance = totalDepositAmt = totalDepositDeductAmt = totalDepositReturnAmt = 0;

            if (patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "deposit").FirstOrDefault() != null)
            {
                totalDepositAmt = patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "deposit").FirstOrDefault().SumAmount;
            }
            if (patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "depositdeduct").FirstOrDefault() != null)
            {
                totalDepositDeductAmt = patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "depositdeduct").FirstOrDefault().SumAmount;
            }
            if (patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "depositreturn").FirstOrDefault() != null)
            {
                totalDepositReturnAmt = patientAllDepositTxns.Where(bil => bil.DepositType.ToLower() == "depositreturn").FirstOrDefault().SumAmount;
            }
            //below is the formula to calculate deposit balance.
            currentDepositBalance = totalDepositAmt - totalDepositDeductAmt - totalDepositReturnAmt;

            //Part-2: Get Total Provisional Items
            //for this request type, patientid comes as inputid.

            //Rajesh:- Getting InoviceId From TXN_Invoice table
            //var patId = phrmdbcontext.PHRMInvoiceTransaction.Where(a => a.PatientId == patientId).FirstOrDefault(); 

            var patProvisional = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems
                                      //sud: 4May'18 changed unpaid to provisional
                                  where bill.PatientId == patientId && (bill.BilItemStatus == "provisional" || bill.BilItemStatus == "wardconsumption") //here PatientId comes as InputId from client.
                                                                                                                                                        // && (bill.IsInsurance == false || bill.IsInsurance == null)
                                  group bill by new { bill.InvoiceId } into p
                                  select new
                                  {
                                      TotalProvisionalAmt = p.Sum(a => a.TotalAmount)
                                  }).FirstOrDefault();

            var patProvisionalAmt = patProvisional != null ? patProvisional.TotalProvisionalAmt : 0;



            var patCredits = (from bill in _pharmacyDbContext.PHRMInvoiceTransaction
                              where bill.PatientId == patientId
                              && bill.BilStatus == ENUM_BillingStatus.unpaid
                              group bill by new { bill.PatientId } into p
                              select new
                              {
                                  TotalUnPaidAmt = p.Sum(a => a.TotalAmount)
                              }).FirstOrDefault();

            var patCreditAmt = patCredits != null ? patCredits.TotalUnPaidAmt : 0;

            //Part-4: Get Total Paid Amount
            var patPaid = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems
                           where bill.PatientId == patientId
                           && bill.BilItemStatus == ENUM_BillingStatus.paid
                           group bill by new { bill.PatientId } into p
                           select new
                           {
                               TotalPaidAmt = p.Sum(a => a.TotalAmount)
                           }).FirstOrDefault();

            var patPaidAmt = patPaid != null ? patPaid.TotalPaidAmt : 0;

            //Part - 5: get Total Discount Amount
            //var patDiscount = dbContext.BillingTransactionItems
            //                .Where(b => b.PatientId == InputId && b.BillStatus == ENUM_BillingStatus.unpaid && b.ReturnStatus == false && b.IsInsurance == false)
            //                 .Sum(b => b.DiscountAmount);

            //double patDiscountAmt = patDiscount != null ? patDiscount.Value : 0;

            var patDiscount = (from bill in _pharmacyDbContext.PHRMInvoiceTransaction
                               where bill.PatientId == patientId
                               && bill.BilStatus == ENUM_BillingStatus.unpaid
                               // && (bill.ReturnStatus == false || bill.ReturnStatus == null)
                               //  && (bill.IsInsurance == false || bill.IsInsurance == null)
                               select bill.DiscountAmount).FirstOrDefault();

            var patDiscountAmt = patDiscount != null ? patDiscount : 0;

            //Part-6: get Total Cancelled Amount
            var patCancel = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems
                                 //sud: 4May'18 changed unpaid to provisional
                             where bill.PatientId == patientId
                             && bill.BilItemStatus == "cancel"
                             //   && (bill.IsInsurance == false || bill.IsInsurance == null)
                             group bill by new { bill.PatientId } into p
                             select new
                             {
                                 TotalPaidAmt = p.Sum(a => a.TotalAmount)
                             }).FirstOrDefault();

            var patCancelAmt = patCancel != null ? patCancel.TotalPaidAmt : 0;

            //Part-7: get Total Cancelled Amount
            //var patReturn = dbContext.BillingTransactionItems
            //                .Where(b => b.PatientId == InputId && b.ReturnStatus == true) //&& (b.BillStatus == ENUM_BillingStatus.paid || b.BillStatus == ENUM_BillingStatus.unpaid) && b.IsInsurance == false)
            //                 .Sum(b => b.TotalAmount);

            var patReturn = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems
                             where bill.PatientId == patientId
                             //  && bill.ReturnStatus == true
                             //  && (bill.IsInsurance == false || bill.IsInsurance == null)
                             group bill by new { bill.PatientId } into p
                             select new
                             {
                                 TotalPaidAmt = p.Sum(a => a.TotalAmount)
                             }).FirstOrDefault();
            var patReturnAmt = patReturn != null ? patReturn.TotalPaidAmt : 0;

            //Part-8 get Subtotal amount 
            var patSubtotal = (from bill in _pharmacyDbContext.PHRMInvoiceTransaction
                               where bill.PatientId == patientId
                               && bill.BilStatus == ENUM_BillingStatus.unpaid
                               // && (bill.ReturnStatus == false || bill.ReturnStatus == null)
                               //  && (bill.IsInsurance == false || bill.IsInsurance == null)
                               select bill.SubTotal).FirstOrDefault();

            var patSubtotalAmt = patSubtotal != null ? patSubtotal : 0;

            //Part-9: Return a single object with Both Balances (Deposit and Credit).
            var patBillHistory = new
            {
                PatientId = patientId,
                PaidAmount = patPaidAmt,
                DiscountAmount = patDiscountAmt,
                CancelAmount = patCancelAmt,
                ReturnedAmount = patReturnAmt,
                CreditAmount = patCreditAmt,
                ProvisionalAmt = patProvisionalAmt,
                TotalDue = patCreditAmt + patProvisionalAmt,
                DepositBalance = currentDepositBalance,
                //  BalanceAmount = currentDepositBalance - (patCreditAmt + patProvisionalAmt)
                SubtotalAmount = patSubtotalAmt
            };


            return patBillHistory;


        }

        private object GetPatientsProvisionalInfo(int dispensaryId, DateTime fromDate, DateTime toDate)
        {

            //var allPatientCreditReceipts = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems
            //                                .Where(i => i.StoreId == dispensaryId && ((DbFunctions.TruncateTime(i.CreatedOn) >= DbFunctions.TruncateTime(fromDate) && DbFunctions.TruncateTime(i.CreatedOn) <= DbFunctions.TruncateTime(toDate))) && i.Quantity > 0 && (i.BilItemStatus == "provisional" || i.BilItemStatus == "wardconsumption"))
            //                                join pat in _pharmacyDbContext.PHRMPatient on bill.PatientId equals pat.PatientId
            //                                join subdiv in _pharmacyDbContext.CountrySubDivision on pat.CountrySubDivisionId equals subdiv.CountrySubDivisionId
            //                                join billingUser in _pharmacyDbContext.Users on bill.CreatedBy equals billingUser.EmployeeId
            //                                join scheme in _pharmacyDbContext.Schemes on bill.SchemeId equals scheme.SchemeId
            //                                join visitInfo in _pharmacyDbContext.PHRMPatientVisit on bill.PatientVisitId equals visitInfo.PatientVisitId into visitInfoGrouped
            //                                from visit in visitInfoGrouped.DefaultIfEmpty()
            //                                group new { bill, visit } by new { pat.PatientId, pat.PatientCode, pat.ShortName, pat.DateOfBirth, pat.Gender, bill.InvoiceId, pat.PhoneNumber, pat.Address, subdiv.CountrySubDivisionName, pat.PANNumber, bill.PatientVisitId, scheme.SchemeName, visit.VisitType } into p
            //                                select new
            //                                {
            //                                    PatientId = p.Key.PatientId,
            //                                    PatientCode = p.Key.PatientCode,
            //                                    ShortName = p.Key.ShortName,
            //                                    DateOfBirth = p.Key.DateOfBirth,
            //                                    Gender = p.Key.Gender,
            //                                    Address = p.Key.Address,
            //                                    CountrySubDivisionName = p.Key.CountrySubDivisionName,
            //                                    PhoneNumber = p.Key.PhoneNumber,
            //                                    PANNumber = p.Key.PANNumber,
            //                                    LastCreditBillDate = p.Max(a => a.bill.CreatedOn),
            //                                    TotalCredit = p.Sum(a => a.bill.TotalAmount),
            //                                    ContactNo = p.Key.PhoneNumber,
            //                                    PatientVisitId = p.Key.PatientVisitId,
            //                                    SchemeName = p.Key.SchemeName,
            //                                    VisitType = p.Key.VisitType == null ? "outpatient" : p.Key.VisitType,
            //                                }).AsEnumerable().OrderByDescending(b => b.LastCreditBillDate);

            List<SqlParameter> paramList = new List<SqlParameter>() {

                        new SqlParameter("@FromDate",fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@DispensaryId", dispensaryId)
                    };
            DataTable allPatientCreditReceipts = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_GetPatientsProvisionalInfo", paramList, _pharmacyDbContext);
            return allPatientCreditReceipts;
        }
        private object GetPatientsProvisionalInfoByPatientId(int dispensaryId, int patientId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {

            new SqlParameter("@DispensaryId", dispensaryId),
            new SqlParameter("@PatientId", patientId)
        };
            DataTable allPatientCreditReceipts = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_ProvisionalPatientBillSummary", paramList, _pharmacyDbContext);
            return allPatientCreditReceipts;
        }
        private object GetPatientProvisionaItems(int patientId, int dispensaryId, int? PatientVisitId)
        {

            var patCreditItems = (from bill in _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(bill => (bill.BilItemStatus == "provisional")
                                  && bill.PatientId == patientId && bill.Quantity > 0 && bill.StoreId == dispensaryId && bill.PatientVisitId == PatientVisitId)
                                  join store in _pharmacyDbContext.PHRMStore on bill.StoreId equals store.StoreId
                                  join emp in _pharmacyDbContext.Employees on bill.CreatedBy equals emp.EmployeeId
                                  join scheme in _pharmacyDbContext.Schemes on bill.SchemeId equals scheme.SchemeId
                                  join rackitm in _pharmacyDbContext.PHRMRackItem on new { bill.ItemId, bill.StoreId } equals new { rackitm.ItemId, rackitm.StoreId } into billRackItemGroup
                                  from billRack in billRackItemGroup.DefaultIfEmpty()
                                  join rack in _pharmacyDbContext.PHRMRack on billRack.RackId equals rack.RackId into rackItemGroup
                                  from rackItemMap in rackItemGroup.DefaultIfEmpty()
                                  join mstitm in _pharmacyDbContext.PHRMItemMaster on bill.ItemId equals mstitm.ItemId
                                  join gen in _pharmacyDbContext.PHRMGenericModel on mstitm.GenericId equals gen.GenericId
                                  select new ProvisionalSaleDetailVm
                                  {
                                      InvoiceItemId = bill.InvoiceItemId,
                                      StoreId = bill.StoreId,
                                      PatientId = bill.PatientId,
                                      ItemId = bill.ItemId,
                                      ItemName = bill.ItemName,
                                      GenericName = gen.GenericName,
                                      BatchNo = bill.BatchNo,
                                      Quantity = bill.Quantity,
                                      Price = bill.Price,
                                      SalePrice = bill.SalePrice,
                                      SubTotal = bill.SubTotal,
                                      VATPercentage = bill.VATPercentage,
                                      VATAmount = bill.VATAmount,
                                      DiscountPercentage = bill.DiscountPercentage,
                                      TotalAmount = bill.TotalAmount,
                                      BilItemStatus = bill.BilItemStatus,
                                      Remark = bill.Remark,
                                      CreatedBy = bill.CreatedBy,
                                      CreatedOn = bill.CreatedOn,
                                      CounterId = bill.CounterId,
                                      VisitType = bill.VisitType,
                                      TotalDisAmt = bill.TotalDisAmt,
                                      PerItemDisAmt = bill.PerItemDisAmt,
                                      ExpiryDate = bill.ExpiryDate,
                                      PrescriberId = bill.PrescriberId,
                                      SchemeId = bill.SchemeId,
                                      IsPharmacySalePriceEditable = scheme.IsPharmacySalePriceEditable,
                                      CoPaymentCashPercent = scheme.PharmacyCoPayCashPercent,
                                      CoPaymentCreditPercent = scheme.PharmacyCoPayCreditPercent,
                                      CoPaymentCashAmount = bill.CoPaymentCashAmount,
                                      CoPaymentCreditAmount = bill.CoPaymentCreditAmount,
                                      RackNo = rackItemMap.RackNo,
                                      DefaultPaymentMode = scheme.DefaultPaymentMode,
                                      DefaultCreditOrganizationId = scheme.DefaultCreditOrganizationId,
                                      PatientVisitId = bill.PatientVisitId,
                                      PriceCategoryId = bill.PriceCategoryId,
                                      ReceiptNo = bill.ReceiptNo,
                                      WardName = store.Name,
                                      WardUser = emp.FullName,
                                      PreviousSalePrice = bill.PreviousSalePrice,
                                      BillServiceItemId = bill.BillServiceItemId,
                                      ClaimCode = bill.ClaimCode
                                  }).ToList();


            //foreach (var wardCreditItems in patCreditItems)
            //{
            //    var User = _pharmacyDbContext.Users.Where(a => a.EmployeeId == wardCreditItems.CreatedBy).FirstOrDefault();
            //    var stores = _pharmacyDbContext.PHRMStore.Where(a => a.StoreId == wardCreditItems.StoreId).FirstOrDefault();
            //    if (wardCreditItems.BilItemStatus == "wardconsumption")
            //    {
            //        var Consumption = _pharmacyDbContext.WardConsumption.Where(a => a.InvoiceItemId == wardCreditItems.InvoiceItemId).FirstOrDefault();
            //        wardCreditItems.WardName = _pharmacyDbContext.WardModel.Find(Consumption.WardId).WardName;
            //        wardCreditItems.WardUser = _pharmacyDbContext.Employees.Find(Consumption.CreatedBy).FullName;
            //    }
            //    else if (wardCreditItems.BilItemStatus == "provisional")
            //    {
            //        wardCreditItems.WardUser = User.UserName;
            //        wardCreditItems.WardName = stores.Name;
            //        wardCreditItems.StockId = (from provItem in _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(provItem => provItem.InvoiceItemId == wardCreditItems.InvoiceItemId)
            //                                   from dispenStock in _pharmacyDbContext.StoreStocks.Where(d => d.ItemId == provItem.ItemId && d.StockMaster.BatchNo == provItem.BatchNo && d.StockMaster.SalePrice == provItem.SalePrice && d.StockMaster.ExpiryDate == provItem.ExpiryDate)
            //                                   select dispenStock.StockId).FirstOrDefault();

            //    }


            //}

            int schemeId = patCreditItems[0].SchemeId;
            string patientVisitType = patCreditItems[0].VisitType;
            var schemeDetails = _pharmacyDbContext.Schemes.Where(s => s.SchemeId == schemeId).Select(s => new
            {
                s.PharmacyCoPayCashPercent,
                s.PharmacyCoPayCreditPercent,
                s.DefaultPaymentMode,
                s.DefaultPriceCategoryId,
                s.DefaultCreditOrganizationId,
                s.IsCreditOnlyScheme,
                IsCoPayment = s.IsPharmacyCoPayment,
                DiscountPercent = patientVisitType == ENUM_VisitType.inpatient ? s.IpPhrmDiscountPercent : s.OpPhrmDiscountPercent,
                SchemeId = schemeId,
                s.IsPharmacySalePriceEditable
            }).FirstOrDefault();

            var PatientCreditItems = patCreditItems.OrderByDescending(s => s.InvoiceItemId).ToList();


            return new
            {
                PatientCreditItems = PatientCreditItems,
                SchemePriceCategory = schemeDetails
            };

        }


        private object SaveDrugRequisitions_NotImplemented(string ipDataStr, RbacUser currentUser)
        {
            List<PHRMDrugsRequistionItemsModel> requisitionItems = DanpheJSONConvert.DeserializeObject<List<PHRMDrugsRequistionItemsModel>>(ipDataStr);

            if (requisitionItems != null) //check client data is null or not
            {
                List<PHRMDrugsRequistionItemsModel> finalInvoiceData = PharmacyBL.ProvisionalItem(requisitionItems, _pharmacyDbContext, currentUser);

                if (finalInvoiceData != null)
                {
                    for (int i = 0; i < finalInvoiceData.Count; i++)
                    {
                        PHRMDrugsRequistionModel drugReqData = new PHRMDrugsRequistionModel();

                        drugReqData.RequisitionId = finalInvoiceData[i].RequisitionId;
                        drugReqData.PatientId = finalInvoiceData[i].PatientId;
                        var requisitionItemId = finalInvoiceData[i].RequisitionItemId;
                        var newDrugReq = _pharmacyDbContext.DrugRequistion.Where(itm => itm.RequisitionId == drugReqData.RequisitionId).FirstOrDefault();

                        newDrugReq.Status = "Complete";
                        _pharmacyDbContext.DrugRequistion.Attach(newDrugReq);
                        _pharmacyDbContext.Entry(newDrugReq).State = EntityState.Modified;
                        _pharmacyDbContext.Entry(newDrugReq).Property(x => x.Status).IsModified = true;
                        _pharmacyDbContext.SaveChanges();
                    }

                    return finalInvoiceData;

                }
                else
                {
                    throw new Exception("Nursing Drugs Details is null or failed to Save");

                }
            }
            else
            {
                throw new Exception("Input data is NULL or Invalid");
            }

        }

        private object SaveOutdoorPatient(string ipDataString)
        {
            //Sud:2Feb'23: This function has Hardcoded District and Country.. Need to revise ASAP if we want to register the patient from Pharmacy module.
            PHRMPatient patientData = DanpheJSONConvert.DeserializeObject<PHRMPatient>(ipDataString);
            patientData.CreatedOn = System.DateTime.Now;
            patientData.CountrySubDivisionId = 76; //this is hardcoded because there is no provision to enter in countrysubdivision id 
            patientData.CountryId = 1;//this is hardcoded because there is no provision to enter in country id
            _pharmacyDbContext.PHRMPatient.Add(patientData);
            _pharmacyDbContext.SaveChanges();
            patientData.PatientCode = this.GetPatientCode(patientData.PatientId);
            patientData.PatientNo = this.GetPatientNo(patientData.PatientId);
            _pharmacyDbContext.SaveChanges();
            return patientData;
        }

        private object SaveFinalInvoiceFromProvisional(PHRMTransactionProvisional_DTO provisional, RbacUser currentUser)
        {
            PHRMInvoiceTransactionModel invoice = DanpheJSONConvert.DeserializeObject<PHRMInvoiceTransactionModel>(DanpheJSONConvert.SerializeObject(provisional));
            if (invoice == null || invoice.InvoiceItems == null || invoice.InvoiceItems.Count == 0) throw new ArgumentException("No Items to update.");


            var currFiscalYearId = PharmacyBL.GetFiscalYear(_pharmacyDbContext).FiscalYearId;
            var currentDate = DateTime.Now;

            List<PHRMInvoiceTransactionItemsModel> invoiceitems = new List<PHRMInvoiceTransactionItemsModel>();
            List<PHRMEmployeeCashTransaction> employeeCashTransactions = new List<PHRMEmployeeCashTransaction>();

            ExtractInvoiceItemsFromInvoice(invoice, out invoiceitems, currentUser, employeeCashTransactions, currFiscalYearId);

            using (var dbTxn = _pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    SaveInvoiceFromProvisional(currentUser, invoice, currFiscalYearId, currentDate);
                    UpdateInvoiceItems(invoice, invoiceitems);
                    SaveStockTransactionAndUpdateStock(currentUser, currFiscalYearId, currentDate, invoiceitems);

                    if (invoice.PaymentMode == ENUM_BillPaymentMode.credit)
                    {
                        SaveCreditBillStatus(currentUser, invoice);
                    }
                    if (invoice.DepositDeductAmount > 0 || invoice.DepositReturnAmount > 0)
                    {
                        HandleDeposit(currentUser, invoice, currFiscalYearId, employeeCashTransactions);
                    }
                    SaveEmployeeCashTransaction(invoice, currentUser, employeeCashTransactions);
                    if (invoice.SchemeId > 0)
                    {
                        UpdateSchemeCreditLimit(invoice, _pharmacyDbContext, invoice.PatientVisitId);
                    }

                    dbTxn.Commit();
                    return invoice.InvoiceId;
                }
                catch (Exception ex)
                {
                    dbTxn.Rollback();
                    Log.Error($"Failed to save invoice from provisional", ex);
                    throw ex;
                }
            }
        }
        private static void UpdateSchemeCreditLimit(PHRMInvoiceTransactionModel invoiceDataFromClient, PharmacyDbContext phrmdbcontext, int? PatientVisitId)
        {
            if (invoiceDataFromClient.PatientId > 0)
            {
                int? SchemeId = invoiceDataFromClient?.SchemeId;

                if (SchemeId != null)
                {
                    var patientCreditLimitData = phrmdbcontext.PatientSchemeMaps.Where(p => p.PatientId == invoiceDataFromClient.PatientId && p.SchemeId == SchemeId && p.LatestPatientVisitId == PatientVisitId).FirstOrDefault();
                    if (patientCreditLimitData != null)
                    {
                        if (invoiceDataFromClient.VisitType == ENUM_VisitType.inpatient)
                        {
                            //If credit limit is greater than 0 then the credit amount shoud be reduce in PatientMapPriceCategory
                            if (patientCreditLimitData.IpCreditLimit > 0 && patientCreditLimitData.IpCreditLimit >= invoiceDataFromClient.TotalAmount)
                            {
                                patientCreditLimitData.IpCreditLimit = patientCreditLimitData.IpCreditLimit - invoiceDataFromClient.TotalAmount;
                                phrmdbcontext.SaveChanges();
                            }
                        }
                        else
                        {
                            if (patientCreditLimitData.OpCreditLimit > 0 && patientCreditLimitData.OpCreditLimit >= invoiceDataFromClient.TotalAmount)
                            {
                                patientCreditLimitData.OpCreditLimit = patientCreditLimitData.OpCreditLimit - invoiceDataFromClient.TotalAmount;
                                phrmdbcontext.SaveChanges();
                            }
                        }

                        if (patientCreditLimitData.IpCreditLimit == 0 && patientCreditLimitData.OpCreditLimit == 0 && patientCreditLimitData.GeneralCreditLimit > 0 && patientCreditLimitData.GeneralCreditLimit >= invoiceDataFromClient.TotalAmount)
                        {
                            patientCreditLimitData.GeneralCreditLimit = patientCreditLimitData.GeneralCreditLimit - invoiceDataFromClient.TotalAmount;
                            phrmdbcontext.SaveChanges();
                        }
                    }
                    var scheme = phrmdbcontext.Schemes.FirstOrDefault(a => a.SchemeId == SchemeId);
                    if (scheme != null && scheme.ApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.Medicare)
                    {
                        var medicareMemberDetail = phrmdbcontext.MedicareMembers.Where(mm => mm.PatientId == invoiceDataFromClient.PatientId).FirstOrDefault();
                        if (medicareMemberDetail != null)
                        {
                            UpdateMedicareBalance(invoiceDataFromClient, phrmdbcontext, medicareMemberDetail);
                        }

                    }
                }
            }
        }
        private static void UpdateMedicareBalance(PHRMInvoiceTransactionModel invoiceDataFromClient, PharmacyDbContext phrmdbcontext, MedicareMember medicareMemberDetail)
        {
            MedicareMemberBalance medicareMemberBalance = new MedicareMemberBalance();

            if (medicareMemberDetail != null)
            {
                if (!medicareMemberDetail.IsDependent)
                {
                    medicareMemberBalance = phrmdbcontext.MedicareMemberBalances.Where(mm => mm.MedicareMemberId == medicareMemberDetail.MedicareMemberId).FirstOrDefault();
                }
                else
                {
                    medicareMemberBalance = phrmdbcontext.MedicareMemberBalances.Where(mm => mm.MedicareMemberId == medicareMemberDetail.ParentMedicareMemberId).FirstOrDefault();
                }
                if (invoiceDataFromClient.VisitType == ENUM_VisitType.inpatient)
                {
                    DeductMedicareIPBalance(invoiceDataFromClient.CoPaymentCreditAmount, phrmdbcontext, medicareMemberBalance);
                }
                else
                {
                    DeductMedicareOPBalance(invoiceDataFromClient.CoPaymentCreditAmount, phrmdbcontext, medicareMemberBalance);
                }
            }
        }
        private static void DeductMedicareOPBalance(decimal CoPaymentCreditAmount, PharmacyDbContext phrmdbcontext, MedicareMemberBalance medicareMemberBalance)
        {
            if (medicareMemberBalance.OpBalance > 0 && medicareMemberBalance.OpBalance >= CoPaymentCreditAmount)
            {
                medicareMemberBalance.OpBalance = medicareMemberBalance.OpBalance - CoPaymentCreditAmount;
                medicareMemberBalance.OpUsedAmount = medicareMemberBalance.OpUsedAmount + CoPaymentCreditAmount;
                phrmdbcontext.SaveChanges();
            }
        }

        private static void DeductMedicareIPBalance(decimal CoPaymentCreditAmount, PharmacyDbContext phrmdbcontext, MedicareMemberBalance medicareMemberBalance)
        {
            if (medicareMemberBalance.IpBalance > 0 && medicareMemberBalance.IpBalance >= CoPaymentCreditAmount)
            {
                medicareMemberBalance.IpBalance = medicareMemberBalance.IpBalance - CoPaymentCreditAmount;
                medicareMemberBalance.IpUsedAmount = medicareMemberBalance.IpUsedAmount + CoPaymentCreditAmount;
                phrmdbcontext.SaveChanges();
            }
        }
        private void SaveEmployeeCashTransaction(PHRMInvoiceTransactionModel invoiceTxn, RbacUser currentUser, List<PHRMEmployeeCashTransaction> empCashTxns)
        {
            empCashTxns.ForEach(txn => { txn.ReferenceNo = invoiceTxn.InvoiceId; });
            _pharmacyDbContext.phrmEmployeeCashTransaction.AddRange(empCashTxns);
            _pharmacyDbContext.SaveChanges();
        }

        private void HandleDeposit(RbacUser currentUser, PHRMInvoiceTransactionModel invoice, int currFiscalYearId, List<PHRMEmployeeCashTransaction> employeeCashTransactions)
        {
            var DefaultDepositHead = _pharmacyDbContext.DepositHeadModels.FirstOrDefault(a => a.IsDefault == true);
            var DepositHeadId = DefaultDepositHead != null ? DefaultDepositHead.DepositHeadId : 0;

            PaymentModes MstPaymentModes = _pharmacyDbContext.PaymentModes.Where(a => a.PaymentSubCategoryName.ToLower() == "deposit").FirstOrDefault();


            List<PHRMEmployeeCashTransaction> empCashTxns = new List<PHRMEmployeeCashTransaction>();

            if (invoice.DepositDeductAmount > 0)
            {
                decimal currentDepositBalance = PharmacyBL.CurrentDepositBalance(invoice.PatientId, invoice.DepositDeductAmount, 0, _pharmacyDbContext);

                BillingDepositModel dep = new BillingDepositModel()
                {
                    TransactionType = ENUM_DepositTransactionType.DepositDeduct,
                    ModuleName = ENUM_ModuleNames.Dispensary,
                    OrganizationOrPatient = ENUM_Deposit_OrganizationOrPatient.Patient,
                    DepositHeadId = DepositHeadId,
                    IsActive = true,
                    FiscalYearId = currFiscalYearId,
                    Remarks = "deposit used for transactionid:" + "PH" + invoice.InvoicePrintId + " on " + DateTime.Now.Date,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now,
                    CounterId = (int)invoice.CounterId,
                    PatientVisitId = invoice.PatientVisitId,
                    PatientId = invoice.PatientId,
                    OutAmount = invoice.DepositDeductAmount,
                    DepositBalance = currentDepositBalance - invoice.DepositDeductAmount,
                    PaymentMode = ENUM_BillPaymentMode.cash,
                    ReceiptNo = GetDepositReceiptNo(_pharmacyDbContext, currFiscalYearId),
                    VisitType = invoice.VisitType,
                    StoreId = invoice.StoreId,
                    InvoiceId = invoice.InvoiceId,
                    PrintCount = 0
                };
                _pharmacyDbContext.BillingDepositModel.Add(dep);
                _pharmacyDbContext.SaveChanges();

                PHRMEmployeeCashTransaction empCashTxn = new PHRMEmployeeCashTransaction();
                empCashTxn.ReferenceNo = dep.DepositId;
                empCashTxn.InAmount = 0;
                empCashTxn.OutAmount = invoice.DepositDeductAmount;
                empCashTxn.PaymentModeSubCategoryId = MstPaymentModes.PaymentSubCategoryId;
                empCashTxn.PatientId = invoice.PatientId;
                empCashTxn.EmployeeId = currentUser.EmployeeId;
                empCashTxn.CounterID = (int)invoice.CounterId;
                empCashTxn.TransactionDate = DateTime.Now;
                empCashTxn.TransactionType = ENUM_PHRM_EmpCashTxnTypes.DepositDeduct;
                empCashTxn.ModuleName = ENUM_ModuleNames.Dispensary;
                empCashTxn.Remarks = "deduct from deposit";
                empCashTxn.IsActive = true;
                empCashTxn.FiscalYearId = currFiscalYearId;
                empCashTxns.Add(empCashTxn);
                employeeCashTransactions.Add(empCashTxn);
            }

            if (invoice.DepositReturnAmount > 0)
            {
                decimal currentDepositBalance = PharmacyBL.CurrentDepositBalance(invoice.PatientId, 0, invoice.DepositReturnAmount, _pharmacyDbContext);


                VisitModel patientVisit = _pharmacyDbContext.PHRMPatientVisit.Where(visit => visit.PatientId == invoice.PatientId)
                    .OrderByDescending(a => a.PatientVisitId)
                    .FirstOrDefault();
                BillingDepositModel depositModel = new BillingDepositModel()
                {
                    TransactionType = ENUM_DepositTransactionType.ReturnDeposit,
                    ModuleName = ENUM_ModuleNames.Dispensary,
                    OrganizationOrPatient = ENUM_Deposit_OrganizationOrPatient.Patient,
                    DepositHeadId = DepositHeadId,
                    IsActive = true,
                    FiscalYearId = currFiscalYearId,
                    Remarks = "deposit used for transactionid:" + "PH" + invoice.InvoicePrintId + " on " + DateTime.Now.Date,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now,
                    CounterId = (int)invoice.CounterId,
                    PatientVisitId = invoice.PatientVisitId,
                    PatientId = invoice.PatientId,
                    OutAmount = invoice.DepositReturnAmount,
                    DepositBalance = currentDepositBalance - invoice.DepositReturnAmount,
                    PaymentMode = ENUM_BillPaymentMode.cash,
                    ReceiptNo = GetDepositReceiptNo(_pharmacyDbContext, currFiscalYearId),
                    VisitType = invoice.VisitType,
                    StoreId = invoice.StoreId,
                    InvoiceId = invoice.InvoiceId,
                    PrintCount = 0
                };

                _pharmacyDbContext.BillingDepositModel.Add(depositModel);
                _pharmacyDbContext.SaveChanges();

                PHRMEmployeeCashTransaction empCashTransaction = new PHRMEmployeeCashTransaction();
                PaymentModes PaymentMode = _pharmacyDbContext.PaymentModes.Where(a => a.PaymentSubCategoryName.ToLower() == "deposit").FirstOrDefault();
                empCashTransaction.ReferenceNo = depositModel.DepositId;
                empCashTransaction.InAmount = 0;
                empCashTransaction.OutAmount = invoice.DepositReturnAmount;
                empCashTransaction.PaymentModeSubCategoryId = MstPaymentModes.PaymentSubCategoryId;
                empCashTransaction.PatientId = invoice.PatientId;
                empCashTransaction.EmployeeId = currentUser.EmployeeId;
                empCashTransaction.CounterID = (int)invoice.CounterId;
                empCashTransaction.TransactionDate = DateTime.Now;
                empCashTransaction.TransactionType = ENUM_PHRM_EmpCashTxnTypes.ReturnDeposit;
                empCashTransaction.ModuleName = ENUM_ModuleNames.Dispensary;
                empCashTransaction.Remarks = "deduct from deposit";
                empCashTransaction.IsActive = true;
                empCashTransaction.FiscalYearId = currFiscalYearId;
                empCashTxns.Add(empCashTransaction);
                employeeCashTransactions.Add(empCashTransaction);
            }
        }

        private static int? GetDepositReceiptNo(PharmacyDbContext _pharmacyDbContext, int fiscalYearId)
        {
            int? receiptNo = (from depTxn in _pharmacyDbContext.BillingDepositModel
                              where depTxn.FiscalYearId == fiscalYearId
                              select depTxn.ReceiptNo).DefaultIfEmpty(0).Max();
            return receiptNo + 1;
        }

        private void SaveCreditBillStatus(RbacUser currentUser, PHRMInvoiceTransactionModel invoice)
        {
            PHRMTransactionCreditBillStatus transactionCreditBillStatus = new PHRMTransactionCreditBillStatus();
            var fiscalYear = PharmacyBL.GetFiscalYear(_pharmacyDbContext);
            var patientScheme = _pharmacyDbContext.PatientSchemeMaps.FirstOrDefault(p => p.SchemeId == invoice.SchemeId && p.PatientId == invoice.PatientId);

            transactionCreditBillStatus.InvoiceId = invoice.InvoiceId;
            transactionCreditBillStatus.InvoiceNoFormatted = fiscalYear.FiscalYearName + "-PH" + invoice.InvoicePrintId.ToString();
            transactionCreditBillStatus.CreditOrganizationId = invoice.OrganizationId > 0 ? (int)invoice.OrganizationId : 0;
            transactionCreditBillStatus.PatientId = invoice.PatientId;
            transactionCreditBillStatus.CreatedBy = currentUser.EmployeeId;
            transactionCreditBillStatus.CreatedOn = DateTime.Now;
            transactionCreditBillStatus.InvoiceDate = DateTime.Now;
            transactionCreditBillStatus.LiableParty = "Organization";
            transactionCreditBillStatus.SalesTotalBillAmount = invoice.TotalAmount;
            transactionCreditBillStatus.CoPayReceivedAmount = invoice.IsCopayment ? (invoice.TotalAmount - invoice.CoPaymentCreditAmount) : 0;
            transactionCreditBillStatus.ReturnTotalBillAmount = 0;
            transactionCreditBillStatus.CoPayReturnAmount = 0;
            transactionCreditBillStatus.NetReceivableAmount = transactionCreditBillStatus.SalesTotalBillAmount - transactionCreditBillStatus.CoPayReceivedAmount - (transactionCreditBillStatus.ReturnTotalBillAmount - transactionCreditBillStatus.CoPayReturnAmount);
            transactionCreditBillStatus.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Pending;
            transactionCreditBillStatus.IsClaimable = true;
            transactionCreditBillStatus.IsActive = true;
            transactionCreditBillStatus.FiscalYearId = fiscalYear.FiscalYearId;
            transactionCreditBillStatus.PatientVisitId = invoice.PatientVisitId;
            transactionCreditBillStatus.SchemeId = invoice.SchemeId;
            transactionCreditBillStatus.MemberNo = patientScheme != null ? patientScheme.PolicyNo : null;
            _pharmacyDbContext.PHRMTransactionCreditBillStatus.Add(transactionCreditBillStatus);
            _pharmacyDbContext.SaveChanges();
        }

        private void SaveStockTransactionAndUpdateStock(RbacUser currentUser, int currFiscalYearId, DateTime currentDate, List<PHRMInvoiceTransactionItemsModel> invoiceitems)
        {
            try
            {
                List<int> invoiceItemIds = invoiceitems.Select(s => s.InvoiceItemId).ToList();

                var itemsFromServer = _pharmacyDbContext.PHRMInvoiceTransactionItems
                                                       .Where(itm => invoiceItemIds.Contains(itm.InvoiceItemId))
                                                       .ToList();

                var previouslyReturnedProvisionals = _pharmacyDbContext.ProvisionalReturnItems
                                                                                      .Where(i => invoiceItemIds.Contains(i.InvoiceItemId))
                                                                                      .ToList();

                List<int> previouslyReturnedProvisionalRetItemIds = previouslyReturnedProvisionals
                                                                                      .Select(a => a.ProvisionalReturnItemId)
                                                                                      .ToList();

                var provisionalSaleTxn = ENUM_PHRM_StockTransactionType.ProvisionalSaleItem;
                var provisionalCancelTxn = ENUM_PHRM_StockTransactionType.ProvisionalCancelItem;

                var allStockTxnsForThisInvoiceItem = _pharmacyDbContext.StockTransactions
                                                           .Where(s => (invoiceItemIds.Contains(s.ReferenceNo) && s.TransactionType == provisionalSaleTxn)
                                                                  || (previouslyReturnedProvisionalRetItemIds.Contains(s.ReferenceNo) && s.TransactionType == provisionalCancelTxn))
                                                           .ToList();


                var storeStockIdList = allStockTxnsForThisInvoiceItem.Select(s => s.StoreStockId)
                                                                     .Distinct()
                                                                     .ToList();

                var soldByStoreId = allStockTxnsForThisInvoiceItem[0].StoreId;

                var storeStockList = _pharmacyDbContext.StoreStocks.Include(s => s.StockMaster)
                                                                   .Where(s => storeStockIdList.Contains((int)s.StoreStockId) && s.StoreId == soldByStoreId)
                                                                   .ToList();

                List<PHRMStockTransactionModel> stockTransactions = new List<PHRMStockTransactionModel>();

                foreach (PHRMInvoiceTransactionItemsModel itmFromClient in invoiceitems)
                {
                    var itemFromServer = itemsFromServer.Where(itm => itm.InvoiceItemId == itmFromClient.InvoiceItemId).FirstOrDefault();
                    if (itemFromServer != null)
                    {
                        var provisionalReturnItemIds = previouslyReturnedProvisionals
                                                                        .Where(a => a.InvoiceItemId == itemFromServer.InvoiceItemId)
                                                                        .Select(b => b.ProvisionalReturnItemId)
                                                                        .ToList();

                        var provisionalStockTransactions = allStockTxnsForThisInvoiceItem
                                                                        .Where(s => s.ReferenceNo == itemFromServer.InvoiceItemId || provisionalReturnItemIds.Contains(s.ReferenceNo))
                                                                        .ToList();

                        var provToSaleQtyForThisInvoice = provisionalStockTransactions.Sum(s => s.OutQty - s.InQty);
                        List<int> currentStoreStockIds = provisionalStockTransactions.Select(a => a.StoreStockId).Distinct().ToList();

                        if (itmFromClient.Quantity != provToSaleQtyForThisInvoice)
                        {
                            throw new InvalidOperationException($"Failed. Item: {itmFromClient.ItemName} with Batch: {itmFromClient.BatchNo} has quantity mismatch. ");
                        }

                        var currentStoreStockList = storeStockList.Where(s => currentStoreStockIds.Contains((int)s.StoreStockId)).ToList();

                        foreach (var storeStock in currentStoreStockList)
                        {
                            var provToSaleQty = allStockTxnsForThisInvoiceItem.Where(s => s.StoreStockId == storeStock.StoreStockId && s.ReferenceNo == itemFromServer.InvoiceItemId)
                                                                              .Sum(s => s.OutQty - s.InQty);
                            if (provToSaleQty == 0)
                            {
                                continue;
                            }

                            var provToSaleTxn = new PHRMStockTransactionModel(
                                                       storeStock: storeStock,
                                                       transactionType: ENUM_PHRM_StockTransactionType.ProvisionalToSale,
                                                       transactionDate: currentDate,
                                                       referenceNo: itemFromServer.InvoiceItemId,
                                                       createdBy: currentUser.EmployeeId,
                                                       createdOn: currentDate,
                                                       fiscalYearId: currFiscalYearId
                                                       );
                            provToSaleTxn.SetInOutQuantity(inQty: provToSaleQty, outQty: 0);

                            var SaleTxn = new PHRMStockTransactionModel(
                                                       storeStock: storeStock,
                                                       transactionType: ENUM_PHRM_StockTransactionType.SaleItem,
                                                       transactionDate: currentDate,
                                                       referenceNo: itemFromServer.InvoiceItemId,
                                                       createdBy: currentUser.EmployeeId,
                                                       createdOn: currentDate,
                                                       fiscalYearId: currFiscalYearId
                                                       );
                            SaleTxn.SetInOutQuantity(inQty: 0, outQty: provToSaleQty);

                            stockTransactions.Add(provToSaleTxn);
                            stockTransactions.Add(SaleTxn);
                        }
                    }
                }

                CommonFunctions.BulkInsert("dbo.PHRM_TXN_StockTransaction", stockTransactions, connString);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to save stock transaction", ex);
                throw;
            }
        }

        private void UpdateInvoiceItems(PHRMInvoiceTransactionModel invoice, List<PHRMInvoiceTransactionItemsModel> invoiceitems)
        {
            var InvoiceItemIds = invoiceitems.Select(a => a.InvoiceItemId).ToList();
            var itemsFromServer = _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(itm => InvoiceItemIds.Contains(itm.InvoiceItemId)).ToList();

            if (itemsFromServer.Any(i => i.BilItemStatus != "provisional"))
            {
                throw new Exception("This provisional bill is already cleared.");
            }
            var invoiceItemsDict = invoiceitems.ToDictionary(item => item.InvoiceItemId);

            foreach (var item in itemsFromServer)
            {
                if (invoiceItemsDict.TryGetValue(item.InvoiceItemId, out var item1))
                {
                    if (item.Quantity == item1.Quantity)
                    {
                        item.InvoiceId = invoice.InvoiceId;
                        item.Quantity = item1.Quantity;
                        item.SubTotal = item1.SubTotal;
                        item.DiscountPercentage = item1.DiscountPercentage;
                        item.TotalDisAmt = item1.TotalDisAmt;
                        item.VATAmount = item1.VATAmount;
                        item.TotalAmount = item1.TotalAmount;
                        item.CoPaymentCashAmount = item1.CoPaymentCashAmount;
                        item.CoPaymentCreditAmount = item1.CoPaymentCreditAmount;
                        item.BilItemStatus = invoice.PaymentMode == ENUM_BillPaymentMode.credit ? ENUM_BillingStatus.unpaid : ENUM_BillingStatus.paid;
                    }
                    else
                    {
                        throw new Exception("This provisional bill is already modified.");
                    }
                }
            }
            _pharmacyDbContext.SaveChanges();
        }

        private void SaveInvoiceFromProvisional(RbacUser currentUser, PHRMInvoiceTransactionModel invoice, int currFiscalYearId, DateTime currentDate)
        {
            invoice.IsOutdoorPat = invoice.VisitType != ENUM_VisitType.inpatient;
            invoice.CreateOn = currentDate;
            invoice.CreatedBy = currentUser.EmployeeId;
            invoice.InvoicePrintId = PharmacyBL.GetInvoiceNumber(_pharmacyDbContext);
            invoice.FiscalYearId = currFiscalYearId;
            invoice.BilStatus = invoice.PaymentMode == ENUM_BillPaymentMode.credit ? ENUM_BillingStatus.unpaid : ENUM_BillingStatus.paid;

            if (invoice.PaymentMode == ENUM_BillPaymentMode.credit && invoice.IsCopayment)
            {
                invoice.Creditdate = currentDate;
                invoice.ReceivedAmount = invoice.TotalAmount - invoice.CoPaymentCreditAmount;
                invoice.CreditAmount = invoice.CoPaymentCreditAmount;
                invoice.PaidAmount = invoice.ReceivedAmount;
                invoice.PaidDate = currentDate;
            }
            else if (invoice.PaymentMode == ENUM_BillPaymentMode.credit && !invoice.IsCopayment)
            {
                invoice.Creditdate = currentDate;
                invoice.ReceivedAmount = 0;
                invoice.CreditAmount = invoice.TotalAmount;
            }
            else
            {
                invoice.Creditdate = null;
                invoice.ReceivedAmount = invoice.TotalAmount;
                invoice.PaidAmount = invoice.ReceivedAmount;
                invoice.PaidDate = currentDate;
                invoice.CreditAmount = 0;
            }
            if (invoice.PaymentDetails == null)
            {
                invoice.PaymentDetails = "";
            }
            _pharmacyDbContext.PHRMInvoiceTransaction.Add(invoice);
            _pharmacyDbContext.SaveChanges();
        }

        private static void ExtractInvoiceItemsFromInvoice(PHRMInvoiceTransactionModel invoiceObj, out List<PHRMInvoiceTransactionItemsModel> InvoiceItems, RbacUser currentUser, List<PHRMEmployeeCashTransaction> employeeCashTransactions, int FiscalYearId)
        {
            InvoiceItems = invoiceObj.InvoiceItems;
            MapEmployeeCashTransactions(invoiceObj, currentUser, employeeCashTransactions, FiscalYearId);
            invoiceObj.InvoiceItems = null;
            invoiceObj.PHRMEmployeeCashTransactions = null;
        }

        private static void MapEmployeeCashTransactions(PHRMInvoiceTransactionModel invoiceObj, RbacUser currentUser, List<PHRMEmployeeCashTransaction> employeeCashTransactions, int FiscalYearId)
        {
            if (invoiceObj.PaymentMode != ENUM_BillPaymentMode.credit)
            {
                invoiceObj.PHRMEmployeeCashTransactions.ForEach(txn =>
                {
                    PHRMEmployeeCashTransaction empCashTxn = new PHRMEmployeeCashTransaction();
                    empCashTxn.TransactionDate = DateTime.Now;
                    empCashTxn.PatientId = invoiceObj.PatientId;
                    empCashTxn.PaymentModeSubCategoryId = txn.PaymentModeSubCategoryId;
                    empCashTxn.ModuleName = txn.ModuleName;
                    empCashTxn.CounterID = invoiceObj.CounterId;
                    empCashTxn.EmployeeId = currentUser.EmployeeId;
                    empCashTxn.FiscalYearId = FiscalYearId;
                    empCashTxn.InAmount = txn.InAmount;
                    empCashTxn.OutAmount = 0;
                    empCashTxn.IsActive = true;
                    empCashTxn.Remarks = txn.Remarks;
                    empCashTxn.Description = txn.Description;
                    empCashTxn.TransactionType = ENUM_EmpCashTransactionType.CashSales;
                    employeeCashTransactions.Add(empCashTxn);
                });
            }
            if (invoiceObj.PaymentMode == ENUM_BillPaymentMode.credit && invoiceObj.IsCopayment)
            {
                invoiceObj.PHRMEmployeeCashTransactions.ForEach(txn =>
                {
                    PHRMEmployeeCashTransaction empCashTxn = new PHRMEmployeeCashTransaction();
                    empCashTxn.TransactionDate = DateTime.Now;
                    empCashTxn.PatientId = invoiceObj.PatientId;
                    empCashTxn.PaymentModeSubCategoryId = txn.PaymentModeSubCategoryId;
                    empCashTxn.ModuleName = txn.ModuleName;
                    empCashTxn.CounterID = invoiceObj.CounterId;
                    empCashTxn.EmployeeId = currentUser.EmployeeId;
                    empCashTxn.FiscalYearId = FiscalYearId;
                    empCashTxn.InAmount = invoiceObj.ReceivedAmount;
                    empCashTxn.OutAmount = 0;
                    empCashTxn.IsActive = true;
                    empCashTxn.Remarks = txn.Remarks;
                    empCashTxn.Description = txn.Description;
                    empCashTxn.TransactionType = ENUM_EmpCashTransactionType.CashSales;
                    employeeCashTransactions.Add(empCashTxn);
                });
            }
        }


        private object SaveDeposit(string ipDataString, RbacUser currentUser)
        {
            using (var dbTransaction = _pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    BillingDepositModel deposit = DanpheJSONConvert.DeserializeObject<BillingDepositModel>(ipDataString);

                    if (deposit is null)
                    {
                        throw new ArgumentNullException("Deposit information is empty.");
                    }

                    if (deposit.PatientId == null || deposit.PatientId == 0)
                    {
                        Log.Error($"PatientId is null.");
                        throw new Exception("Pateint Information is missing");
                    }

                    List<PHRMEmployeeCashTransaction> empTxns = new List<PHRMEmployeeCashTransaction>();
                    PHRMEmployeeCashTransaction empTxn = new PHRMEmployeeCashTransaction();
                    deposit.DepositId = 0;
                    deposit.CreatedOn = DateTime.Now;
                    deposit.CreatedBy = currentUser.EmployeeId;
                    PharmacyFiscalYear fiscYear = PharmacyBL.GetFiscalYear(connString);
                    deposit.FiscalYearId = fiscYear.FiscalYearId;
                    deposit.ReceiptNo = GetDepositReceiptNo(_pharmacyDbContext, fiscYear.FiscalYearId);
                    deposit.FiscalYear = fiscYear.FiscalYearName;
                    deposit.IsActive = true;
                    EmployeeModel currentEmp = _pharmacyDbContext.Employees.Where(emp => emp.EmployeeId == currentUser.EmployeeId).FirstOrDefault();
                    _pharmacyDbContext.BillingDepositModel.Add(deposit);
                    _pharmacyDbContext.SaveChanges();

                    PaymentModes masterPaymentModes = _masterDbContext.PaymentModes.Where(a => a.PaymentSubCategoryName.ToLower() == "cash")
                                                     .FirstOrDefault();
                    if (deposit.TransactionType != ENUM_PHRM_DepositTypes.DepositReturn)
                    {
                        deposit.PHRMEmployeeCashTransactions.ForEach(empTxnDetails =>
                        {
                            empTxnDetails.TransactionType = ENUM_PHRM_EmpCashTxnTypes.DepositAdd;
                            empTxnDetails.PatientId = (int)deposit.PatientId;
                            empTxnDetails.ReferenceNo = deposit.DepositId;
                            empTxnDetails.Remarks = empTxnDetails.Remarks != "" ? empTxnDetails.Remarks : "Deposit Added From Dispensary";
                            empTxnDetails.InAmount = deposit.InAmount;
                            empTxnDetails.TransactionDate = DateTime.Now;
                            empTxnDetails.CounterID = (int)deposit.CounterId;
                            empTxnDetails.EmployeeId = currentUser.EmployeeId;
                            empTxnDetails.IsActive = true;
                            empTxnDetails.ModuleName = ENUM_ModuleNames.Dispensary;
                            empTxnDetails.PaymentModeSubCategoryId = masterPaymentModes.PaymentSubCategoryId;
                            empTxnDetails.FiscalYearId = fiscYear.FiscalYearId;
                            empTxns.Add(empTxnDetails);
                        });
                        _pharmacyDbContext.phrmEmployeeCashTransaction.AddRange(empTxns);
                    }
                    else
                    {
                        empTxn.TransactionType = ENUM_PHRM_EmpCashTxnTypes.ReturnDeposit;
                        empTxn.PaymentModeSubCategoryId = masterPaymentModes.PaymentSubCategoryId;
                        empTxn.OutAmount = deposit.OutAmount;
                        empTxn.PatientId = (int)deposit.PatientId;
                        empTxn.ReferenceNo = deposit.DepositId;
                        empTxn.Remarks = empTxn.Remarks != "" ? empTxn.Remarks : "Deposit Return From Dispensary";
                        empTxn.OutAmount = deposit.OutAmount;
                        empTxn.TransactionDate = DateTime.Now;
                        empTxn.CounterID = deposit.CounterId;
                        empTxn.EmployeeId = currentUser.EmployeeId;
                        empTxn.IsActive = true;
                        empTxn.ModuleName = ENUM_ModuleNames.Dispensary;
                        empTxn.PaymentModeSubCategoryId = masterPaymentModes.PaymentSubCategoryId;
                        empTxn.FiscalYearId = fiscYear.FiscalYearId;
                        _pharmacyDbContext.phrmEmployeeCashTransaction.Add(empTxn);
                    }
                    _pharmacyDbContext.SaveChanges();
                    dbTransaction.Commit();

                    var deposits = new List<BillingDepositModel>();
                    deposits.Add(deposit);

                    var depositData = (from dep in deposits
                                       join pat in _pharmacyDbContext.PHRMPatient on dep.PatientId equals pat.PatientId
                                       join fy in _pharmacyDbContext.PharmacyFiscalYears on dep.FiscalYearId equals fy.FiscalYearId
                                       join emp in _pharmacyDbContext.Employees on dep.CreatedBy equals emp.EmployeeId
                                       join ctry in _pharmacyDbContext.Countries on pat.CountryId equals ctry.CountryId
                                       join mun in _pharmacyDbContext.Municipalities on pat.MunicipalityId equals mun.MunicipalityId into municipalityGroup
                                       from municipality in municipalityGroup.DefaultIfEmpty()
                                       join subdivision in _pharmacyDbContext.CountrySubDivision on pat.CountrySubDivisionId equals subdivision.CountrySubDivisionId into subdivisionGroup
                                       from countrySubDivision in subdivisionGroup.DefaultIfEmpty()
                                       select new
                                       {
                                           dep.DepositId,
                                           dep.ReceiptNo,
                                           dep.PatientId,
                                           pat.PatientCode,
                                           dep.CreatedOn,
                                           dep.InAmount,
                                           dep.OutAmount,
                                           Amount = dep.TransactionType == "Deposit" ? dep.InAmount : dep.OutAmount,
                                           dep.DepositBalance,
                                           dep.PaymentMode,
                                           dep.TransactionType,
                                           dep.Remarks,
                                           dep.ModuleName,
                                           dep.VisitType,
                                           dep.FiscalYearId,
                                           dep.PrintCount,
                                           dep.PatientVisitId,
                                           dep.PaymentDetails,
                                           dep.CareOf,
                                           FiscalYear = fy.FiscalYearName,
                                           pat.ShortName,
                                           pat.Gender,
                                           pat.DateOfBirth,
                                           pat.PhoneNumber,
                                           Address = pat.Address,
                                           WardNumber = pat.WardNumber,
                                           CountryName = ctry.CountryName,
                                           MunicipalityName = municipality != null ? municipality.MunicipalityName : null,
                                           CountrySubDivisionName = countrySubDivision != null ? countrySubDivision.CountrySubDivisionName : null,
                                           UserName = emp.FullName,
                                           //Address = pat.Address + " " + (pat.MunicipalityId != null ? municipality.MunicipalityName : "") + " " + (pat.CountrySubDivisionId != null ? countrySubDivision.CountrySubDivisionName : ""),
                                           dep.CareOfContact
                                       }
                                       ).FirstOrDefault();

                    return depositData;


                }
                catch (Exception ex)
                {
                    Log.Error($"Failed to save deposit information  {ex.ToString()}");
                    dbTransaction.Rollback();
                    throw ex;
                }
            }
        }

        private object UpdateProvisionalItemsCancel(string ipDataString, RbacUser currentUser)
        {
            List<PHRMInvoiceTransactionItemsModel> invoiceObjFromClient = DanpheJSONConvert.DeserializeObject<List<PHRMInvoiceTransactionItemsModel>>(ipDataString);
            // if invoiceObjFromClient is empty, then stop the process
            if (invoiceObjFromClient == null || invoiceObjFromClient.Any())
                throw new ArgumentException("No Items to update.");

            using (var dbTxn = _pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    var currentDate = DateTime.Now;
                    var currFiscalYearId = PharmacyBL.GetFiscalYear(_pharmacyDbContext).FiscalYearId;
                    PHRMInvoiceTransactionItemsModel itemFromServer = new PHRMInvoiceTransactionItemsModel();
                    foreach (PHRMInvoiceTransactionItemsModel itmFromClient in invoiceObjFromClient)
                    {

                        itemFromServer = _pharmacyDbContext.PHRMInvoiceTransactionItems
                                                                  .Where(itm => itm.InvoiceItemId == itmFromClient.InvoiceItemId).FirstOrDefault();
                        if (itemFromServer != null)
                        {
                            if (itemFromServer.BilItemStatus != "provisional")
                            {
                                throw new Exception("This provisional bill is already cleared.");
                            }

                            if (itemFromServer.Quantity != itmFromClient.Quantity)
                            {
                                throw new Exception("This provisional bill is already modified.");
                            }

                            _pharmacyDbContext.PHRMInvoiceTransactionItems.Attach(itemFromServer);

                            itemFromServer.Quantity = itmFromClient.Quantity;
                            itemFromServer.SubTotal = itmFromClient.SubTotal;
                            itemFromServer.TotalAmount = itmFromClient.TotalAmount;
                            itemFromServer.BilItemStatus = ENUM_PHRM_InvoiceItemBillStatus.ProvisionalCancel;

                            _pharmacyDbContext.Entry(itemFromServer).State = EntityState.Modified;
                            _pharmacyDbContext.Entry(itemFromServer).Property(x => x.BilItemStatus).IsModified = true;
                            _pharmacyDbContext.Entry(itemFromServer).Property(x => x.Quantity).IsModified = true;
                            //to update client side
                            itmFromClient.BilItemStatus = ENUM_PHRM_InvoiceItemBillStatus.ProvisionalCancel;
                            itmFromClient.InvoiceId = itemFromServer.InvoiceId;
                            _pharmacyDbContext.SaveChanges();
                        }

                        // perform the stock manipulation operation here
                        // perform validation check to avoid concurrent user issue or stale data issue
                        var provisionalSaleTxn = ENUM_PHRM_StockTransactionType.ProvisionalSaleItem;
                        var provisionalCancelTxn = ENUM_PHRM_StockTransactionType.ProvisionalCancelItem;
                        // find the total sold stock, substract with total returned stock
                        var allStockTxnsForThisInvoiceItem = _pharmacyDbContext.StockTransactions
                                                                        .Where(s => (s.ReferenceNo == itemFromServer.InvoiceItemId && s.TransactionType == provisionalSaleTxn)
                                                                        || (s.ReferenceNo == itemFromServer.InvoiceItemId && s.TransactionType == provisionalCancelTxn)).ToList();

                        // if-guard
                        // the provToSale Qty must be equal to the (outQty-inQty) of the stock transactions, otherwise, there might be an issue
                        var cancellableQtyForThisItem = allStockTxnsForThisInvoiceItem.Sum(s => s.OutQty - s.InQty);
                        if (itmFromClient.Quantity != cancellableQtyForThisItem)
                            throw new InvalidOperationException($"Failed. Item: {itmFromClient.ItemName} with Batch: {itmFromClient.BatchNo} has quantity mismatch. ");
                        // Find the stock that was sold
                        var stockIdList = allStockTxnsForThisInvoiceItem.Select(s => s.StockId).Distinct().ToList();
                        var soldByStoreId = allStockTxnsForThisInvoiceItem[0].StoreId;
                        var stockList = _pharmacyDbContext.StoreStocks.Include(s => s.StockMaster).Where(s => stockIdList.Contains(s.StockId) && s.StoreId == soldByStoreId).ToList();

                        foreach (var stock in stockList)
                        {
                            // add a cancel stock transaction with quantity = (sold qty - previously returned qty)
                            var cancellableQty = allStockTxnsForThisInvoiceItem.Where(s => s.StockId == stock.StockId).Sum(s => s.OutQty - s.InQty);

                            var cancelStockTxn = new PHRMStockTransactionModel(
                                                       storeStock: stock,
                                                       transactionType: ENUM_PHRM_StockTransactionType.ProvisionalCancelItem,
                                                       transactionDate: currentDate,
                                                       referenceNo: itemFromServer.InvoiceItemId,
                                                       createdBy: currentUser.EmployeeId,
                                                       createdOn: currentDate,
                                                       fiscalYearId: currFiscalYearId
                                                       );
                            cancelStockTxn.SetInOutQuantity(inQty: cancellableQty, outQty: 0);
                            stock.UpdateAvailableQuantity(newQty: stock.AvailableQuantity + cancellableQty);
                            // add to db
                            _pharmacyDbContext.StockTransactions.Add(cancelStockTxn);
                        }
                        _pharmacyDbContext.SaveChanges();
                    }
                    dbTxn.Commit();
                    return invoiceObjFromClient;
                }

                catch (Exception ex)
                {
                    dbTxn.Rollback();
                    throw new Exception("Invoice details is null or failed to Save. Exception Details: " + ex.Message.ToString());

                }
            }

        }


        private object UpdateInvoicePrintCount(int printCount, int invoiceId)
        {

            PHRMInvoiceTransactionModel dbPhrmBillPrintReq = _pharmacyDbContext.PHRMInvoiceTransaction
                           .Where(a => a.InvoiceId == invoiceId).FirstOrDefault<PHRMInvoiceTransactionModel>();
            if (dbPhrmBillPrintReq != null)
            {
                dbPhrmBillPrintReq.PrintCount = printCount;
                _pharmacyDbContext.Entry(dbPhrmBillPrintReq).State = EntityState.Modified;
            }

            _pharmacyDbContext.SaveChanges();
            return "Print count updated successfully.";
        }

        private object UpdateDepositPrintCount(string ipDataString)
        {

            BillingDepositModel depositModel = DanpheJSONConvert.DeserializeObject<BillingDepositModel>(ipDataString);
            BillingDepositModel data = (from depositData in _pharmacyDbContext.BillingDepositModel
                                        where depositModel.DepositId == depositData.DepositId
                                        select depositData).FirstOrDefault();
            if (data != null && data.DepositId > 0)
            {
                data.PrintCount = data.PrintCount == 0 ? 1 : data.PrintCount == null ? 1 : data.PrintCount + 1;
                _pharmacyDbContext.BillingDepositModel.Attach(data);
                _pharmacyDbContext.Entry(data).State = EntityState.Modified;
                _pharmacyDbContext.Entry(data).Property(x => x.PrintCount).IsModified = true;
                _pharmacyDbContext.SaveChanges();
                return data;
            }
            else
            {
                throw new Exception("invalid deposit object for update.");
            }

        }


        /// <summary>
        /// Need to use a centralized function to get GetPatientNo.. Its a Problem when scattered in many places.
        /// </summary>
        private int GetPatientNo(int patientId)
        {
            try
            {
                if (patientId != 0)
                {
                    int newPatNo = 0;

                    var maxPatNo = _patientDbContext.Patients.DefaultIfEmpty().Max(p => p == null ? 0 : p.PatientNo);
                    newPatNo = maxPatNo + 1;

                    return newPatNo;
                }
                else
                    throw new Exception("Invalid PatientId");
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        /// <summary>
        /// Need to use a centralized function to get PatientCode.. Its a Problem when scattered in many places.
        /// </summary>
        private string GetPatientCode(int patientId)
        {
            try
            {
                if (patientId != 0)
                {
                    NewPatientUniqueNumbersVM retValue = new NewPatientUniqueNumbersVM();
                    int newPatNo = 0;
                    string newPatCode = "";

                    var maxPatNo = _patientDbContext.Patients.DefaultIfEmpty().Max(p => p == null ? 0 : p.PatientNo);
                    newPatNo = maxPatNo + 1;


                    string patCodeFormat = "YYMM-PatNum";//this is default value.
                    string hospitalCode = "";//default empty

                    List<ParameterModel> allParams = _coreDbContext.Parameters.ToList();

                    ParameterModel patCodeFormatParam = allParams
                                         .Where(a => a.ParameterGroupName == "Patient" && a.ParameterName == "PatientCodeFormat")
                                         .FirstOrDefault<ParameterModel>();
                    if (patCodeFormatParam != null)
                    {
                        patCodeFormat = patCodeFormatParam.ParameterValue;
                    }


                    ParameterModel hospCodeParam = allParams
                        .Where(a => a.ParameterName == "HospitalCode")
                        .FirstOrDefault<ParameterModel>();
                    if (hospCodeParam != null)
                    {
                        hospitalCode = hospCodeParam.ParameterValue;
                    }



                    if (patCodeFormat == "YYMM-PatNum")
                    {
                        newPatCode = DateTime.Now.ToString("yy") + DateTime.Now.ToString("MM") + String.Format("{0:D6}", newPatNo);
                    }
                    else if (patCodeFormat == "HospCode-PatNum")
                    {
                        newPatCode = hospitalCode + newPatNo;
                    }
                    else if (patCodeFormat == "PatNum")
                    {
                        newPatCode = newPatNo.ToString();
                    }

                    return newPatCode;
                }
                else
                    throw new Exception("Invalid PatientId");


            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }



        [HttpGet]
        [Route("DispensaryAvailableStock")]
        public IActionResult GetDispensaryAvailableStock(int dispensaryId, int? priceCategoryId)
        {
            Func<object> func = () => GetDispensaryAvailableStock(dispensaryId, priceCategoryId, _pharmacyDbContext);
            return InvokeHttpGetFunction(func);
        }
        private List<DispensaryAvailableStockDetail_DTO> GetDispensaryAvailableStock(int dispensaryId, int? priceCategoryId, PharmacyDbContext pharmacyDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@DispensaryId", dispensaryId),
                 new SqlParameter("@PriceCategoryId", priceCategoryId)
            };
            DataTable stockItemsDataTable = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_GetDispensaryAvailableStock", paramList, pharmacyDbContext);
            List<DispensaryAvailableStockDetail_DTO> stockItems = DataTableToList.ConvertToList<DispensaryAvailableStockDetail_DTO>(stockItemsDataTable);
            return stockItems;
        }

        [HttpGet]
        [Route("PrescriptionItems")]
        public IActionResult PrescriptionItems(int patientId, int prescriberId, int prescriptionId)
        {
            Func<object> func = () => GetPrescriptionItems(patientId, prescriberId, prescriptionId);
            return InvokeHttpGetFunction(func);

        }

        //private object GetPrescriptionItems(int PatientId, int PrescriberId, int PrescriptionId)
        //{
        //    var presItems = (from pres in _pharmacyDbContext.PHRMPrescriptionItems
        //                     where pres.PatientId == PatientId && pres.CreatedBy == PrescriberId && pres.PrescriptionId == PrescriptionId
        //                     select pres).ToList().OrderByDescending(a => a.CreatedOn);

        //    if (presItems != null)
        //    {
        //        foreach (var presItm in presItems)
        //        {
        //            presItm.IsAvailable = _pharmacyDbContext.StoreStocks.Include(a => a.StockMaster).Any(stk => stk.ItemId == presItm.ItemId && stk.AvailableQuantity > 0 && DbFunctions.TruncateTime(stk.StockMaster.ExpiryDate) > DbFunctions.TruncateTime(DateTime.Now));
        //            var item = _pharmacyDbContext.PHRMItemMaster.FirstOrDefault(x => x.ItemId == presItm.ItemId);
        //            if (item != null)
        //            {
        //                presItm.ItemName = item.ItemName;
        //            }
        //        }

        //    }

        //    return presItems;
        //}

        private object GetPrescriptionItems(int PatientId, int PrescriberId, int PrescriptionId)
        {
            var presItems = (from pres in _pharmacyDbContext.PHRMPrescriptionItems
                             join item in _pharmacyDbContext.PHRMItemMaster on pres.ItemId equals item.ItemId
                             where pres.PatientId == PatientId
                                && pres.CreatedBy == PrescriberId
                                && pres.PrescriptionId == PrescriptionId
                             orderby pres.CreatedOn descending
                             select new
                             {
                                 PrescriptionItem = pres,
                                 ItemName = item.ItemName,
                                 IsAvailable = (from stk in _pharmacyDbContext.StoreStocks
                                                join stockMaster in _pharmacyDbContext.StockMasters
                                                on stk.StockId equals stockMaster.StockId
                                                where stk.ItemId == pres.ItemId
                                                    && stk.AvailableQuantity > 0
                                                    && stockMaster.ExpiryDate > DateTime.Today
                                                select stk).Any()
                             })
                             .ToList();

            foreach (var presItem in presItems)
            {
                presItem.PrescriptionItem.IsAvailable = presItem.IsAvailable;
                presItem.PrescriptionItem.ItemName = presItem.ItemName;
            }

            return presItems.Select(p => p.PrescriptionItem).ToList();
        }

        [HttpPut]
        [Route("UpdatePrescriptionOrderStatus")]
        public IActionResult UpdatePrescriptionOrderStatus(int patientId)
        {
            var currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();

            try
            {
                var prescriptionItems = _pharmacyDbContext.PHRMPrescriptionItems
                    .Where(pres => pres.PatientId == patientId && pres.OrderStatus != "final")
                    .ToList();

                if (prescriptionItems.Count > 0)
                {
                    foreach (var prescriptionItem in prescriptionItems)
                    {
                        prescriptionItem.OrderStatus = "final";
                        prescriptionItem.ModifiedOn = DateTime.Now;
                        prescriptionItem.ModifiedBy = currentUser.EmployeeId;
                    }

                    _pharmacyDbContext.SaveChanges();
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                }
                else
                {
                    responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                    responseData.Results = "No prescription details found to update";
                }
            }
            catch (Exception ex)
            {
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.Results = ex.ToString();
            }
            return Ok(responseData);
        }


        [HttpGet]
        [Route("PharmacyDeposits")]
        public IActionResult Deposits(DateTime fromDate, DateTime toDate, int dispensaryId)
        {
            Func<object> func = () => GetPharmacyDeposits(fromDate, toDate, dispensaryId);
            return InvokeHttpGetFunction(func);
        }
        private object GetPharmacyDeposits(DateTime fromDate, DateTime toDate, int dispensaryId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {

                        new SqlParameter("@FromDate",fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@DispensaryId", dispensaryId)
                    };
            DataTable Deposits = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_Deposits", paramList, _pharmacyDbContext);
            return Deposits;


        }

        [HttpGet]
        [Route("PharmacyProvisionalEstimationBillInfo")]
        public IActionResult PharmacyProvisionalEstimationBillInfo(int patientId, int dispensaryId, int patientVisitId)
        {
            Func<object> func = () => GetPharmacyProvisionalEstimationBillInfo(patientId, dispensaryId, patientVisitId);
            return InvokeHttpGetFunction(func);
        }
        private object GetPharmacyProvisionalEstimationBillInfo(int patientId, int dispensaryId, int patientVisitId)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {

                        new SqlParameter("@PatientId",patientId),
                        new SqlParameter("@PatientVisitId", patientVisitId),
                        new SqlParameter("@DispensaryId", dispensaryId)
                    };
            DataSet ProvisionalEstimationBillDetails = DALFunctions.GetDatasetFromStoredProc("SP_PHRM_GetProvisionalEstimationBill", paramList, _pharmacyDbContext);

            DataTable billItem = ProvisionalEstimationBillDetails.Tables[0];
            DataTable patientInfo = ProvisionalEstimationBillDetails.Tables[1];

            var provisionalEstimationBillInfo = new PharmacyProvisionaEstimationBillInfo
            {
                ProvisionalEstimationBillInvoiceItems = PharmacyProvisionalEstimationBillItem_DTO.MapDataTableToObjectList(billItem),
                PatientInfo = PharmacyPatientInfo_DTO.MapDataTableToSingleObject(patientInfo)

            };

            return provisionalEstimationBillInfo;


        }

        [HttpPut]
        [Route("UpdateSalePrice")]
        public IActionResult SalePriceUpdate([FromBody] List<InvoiceItemSalePriceUpdate_DTO> invoiceItems)
        {
            Func<object> func = () => UpdateSalePrice(invoiceItems);
            return InvokeHttpPutFunction(func);
        }

        /// <summary>
        /// This methods update the SalePrice of invoice items.
        /// </summary>PatientProvisionaItems
        /// <param name="invoiceItems"></param>
        /// <returns></returns>
        private object UpdateSalePrice(List<InvoiceItemSalePriceUpdate_DTO> invoiceItems)
        {
            invoiceItems.ForEach(item =>
            {
                var invoiceItem = _pharmacyDbContext.PHRMInvoiceTransactionItems.Where(i => i.InvoiceItemId == item.InvoiceItemId).FirstOrDefault();
                if (invoiceItem != null)
                {
                    invoiceItem.SalePrice = item.SalePrice;
                    invoiceItem.BillServiceItemId = item.BillServiceItemId;
                    _pharmacyDbContext.SaveChanges();
                }
            });
            return invoiceItems;
        }

        [HttpGet]
        [Route("InsurnacePackageBillServiceItems")]
        public IActionResult InsurancePackageBillServiceItems()
        {
            Func<object> func = () => _pharmacyDbContext.BillServiceItems
                                                        .Where(item => item.IsInsurancePackage && item.IsActive)
                                                        .Select(item => new
                                                        {
                                                            item.ServiceItemId,
                                                            item.ItemName
                                                        }).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PreviousSalesQuantityWithInCappingDaysLimit")]
        public IActionResult GetPatientInvoiceHistory(int patientId, int cappingDaysLimit, int itemId)
        {
            Func<object> func = () => PharmacyBL.PreviouslySalesQuantityWithinCappingDaysLimit(_pharmacyDbContext, itemId, patientId, cappingDaysLimit);
            return InvokeHttpGetFunction<object>(func);
        }
    }
}
