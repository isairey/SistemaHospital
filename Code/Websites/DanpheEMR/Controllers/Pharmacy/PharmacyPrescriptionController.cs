using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.SSFModels;
using DanpheEMR.Services.Dispensary.DTOs;
using DanpheEMR.Utilities;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OfficeOpenXml.FormulaParsing.Excel.Functions.Text;
using Org.BouncyCastle.Asn1.Ocsp;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DanpheEMR.Controllers.Pharmacy
{

    public class PharmacyPrescriptionController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly PharmacyDbContext _phrmDbContext;

        public PharmacyPrescriptionController(IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _phrmDbContext = new PharmacyDbContext(connString);
        }

        [HttpGet]
        [Route("PatientsPrescriptions")]
        public IActionResult PatientsPrescriptions()
        {
            //else if (reqType == "getprescriptionlist")
            //{

            Func<object> func = () => GetPatientsPrescriptions();
            return InvokeHttpGetFunction(func);
        }

        //[HttpGet]
        //[Route("PatientPrescriptions")]
        //public IActionResult PatientPrescriptions(int patientId, int prescriberId)
        //{
        //    //else if (reqType == "getPrescriptionItems" && patientId > 0 && providerId > 0)
        //    // {

        //    Func<object> func = () => GetPatientPrescriptions(patientId, prescriberId);
        //    return InvokeHttpGetFunction(func);

        //}


        [HttpPost]
        [Route("NewPrescription")]
        public IActionResult NewPrescription([FromBody] PHRMPrescriptionModel prescription)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddNewPrescription(prescription, currentUser);
            return InvokeHttpPostFunction<object>(func);
        }


        [HttpPost]
        [Route("NewPrescriptionItem")]
        public IActionResult NewPrescriptionItem()
        {
            //else if (reqType == "postprescriptionitem")
            //{
            string str = this.ReadPostData();
            List<PHRMPrescriptionItemModel> prescItems = DanpheJSONConvert.DeserializeObject<List<PHRMPrescriptionItemModel>>(str);

            Func<object> func = () => AddNewPrescriptionItem(prescItems);
            return InvokeHttpPostFunction<object>(func);
        }


        //private object GetPatientPrescriptions(int patientId, int prescriberId)
        //{
        //    var presItems = (from pres in _phrmDbContext.PHRMPrescriptionItems
        //                     where pres.PatientId == patientId && pres.PerformerId == prescriberId && pres.OrderStatus != "final"
        //                     select pres).ToList().OrderByDescending(a => a.CreatedOn);
        //    foreach (var presItm in presItems)
        //    {
        //        presItm.ItemName = _phrmDbContext.PHRMItemMaster.Find(presItm.ItemId).ItemName;
        //        var AvailableStockList = (from stk in _phrmDbContext.DispensaryStocks
        //                                  where stk.ItemId == presItm.ItemId && stk.AvailableQuantity > 0 && stk.ExpiryDate > DateTime.Now
        //                                  select stk).ToList();
        //        presItm.IsAvailable = (AvailableStockList.Count > 0) ? true : false;
        //        //(phrmdbcontext.DispensaryStock.Where(a => a.ItemId == presItm.ItemId).Select(a => a.AvailableQuantity).FirstOrDefault() > 0) ? true : false;
        //    }
        //    return presItems;
        //}

        private object GetPatientsPrescriptions()
        {
            var presList = (from pres in _phrmDbContext.PHRMPrescriptionItems .Where(a => a.IsActive == true)//.Where(a => status.Contains(a.OrderStatus))
                            join pat in _phrmDbContext.PHRMPatient on pres.PatientId equals pat.PatientId
                            join emp in _phrmDbContext.Employees on pres.CreatedBy equals emp.EmployeeId
                            join visit in _phrmDbContext.PHRMPatientVisit on pres.PatientVisitId equals visit.PatientVisitId
                            group new { pres, pat, emp, visit } by new
                            {
                                // pres.ProviderId,
                                pres.PatientId,
                                pat.PatientCode,
                                pat.FirstName,
                                pat.MiddleName,
                                pat.LastName,
                                eFirstName = emp.FirstName,
                                eMiddleName = emp.MiddleName,
                                eLastName = emp.LastName,
                                PrescriberId = pres.CreatedBy,
                                PrescriptionId = pres.PrescriptionId,
                                visit.VisitType,
                            }
                            into t
                            select new
                            {
                                PatientCode = t.Key.PatientCode,
                                PatientId = t.Key.PatientId,
                                PrescriptionId = t.Key.PrescriptionId,
                                PatientName = t.Key.FirstName + " " + (string.IsNullOrEmpty(t.Key.MiddleName) ? "" : t.Key.MiddleName + " ") + t.Key.LastName,
                                PrescriberId = t.Key.PrescriberId,
                                PrescriberName = t.Key.eFirstName + " " + (string.IsNullOrEmpty(t.Key.eMiddleName) ? "" : t.Key.eMiddleName + " ") + t.Key.eLastName,
                                VisitType = t.Key.VisitType,
                                CreatedOn = t.Max(r => r.pres.CreatedOn),
                            }
                            ).OrderByDescending(a => a.CreatedOn).ToList();
            return presList;
        }

        private object AddNewPrescription(PHRMPrescriptionModel prescription, RbacUser currentUser)
        {
            prescription.CreatedBy = currentUser.EmployeeId;
            prescription.CreatedOn = DateTime.Now;
            prescription.PHRMPrescriptionItems.ForEach(p =>
            {
                p.CreatedBy = currentUser.EmployeeId;
                p.CreatedOn = DateTime.Now;
            });


            _phrmDbContext.PHRMPrescription.Add(prescription);
            _phrmDbContext.SaveChanges();
            return prescription;
        }

        private object AddNewPrescriptionItem(List<PHRMPrescriptionItemModel> prescItems)
        {
            if (prescItems != null && prescItems.Count > 0)
            {
                foreach (var prItm in prescItems)
                {
                    prItm.CreatedOn = System.DateTime.Now;
                    prItm.Quantity = prItm.Frequency.Value * prItm.HowManyDays.Value;
                    _phrmDbContext.PHRMPrescriptionItems.Add(prItm);

                }

            }

            _phrmDbContext.SaveChanges();
            return prescItems;
        }

        [HttpGet]
        [Route("PatientPrescriptionAvailability")]
        public IActionResult GetPatientPrescriptionAvailability(int PatientId)
        {
            string[] status = { ENUM_PrescriptionOrderStatus.Active, ENUM_PrescriptionOrderStatus.Partial };
            Func<object> func = () => _phrmDbContext.PHRMPrescriptionItems
                                                        .Any(a => a.PatientId == PatientId && status.Contains(a.OrderStatus));
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("PatientPrescriptions")]
        public IActionResult GetPatientPrescription(int PatientId)
        {
            string[] status = { ENUM_PrescriptionOrderStatus.Active, ENUM_PrescriptionOrderStatus.Partial };

            Func<object> func = () => (from pres in _phrmDbContext.PHRMPrescription.Where(a => a.PatientId == PatientId && status.Contains(a.PrescriptionStatus))
                                       join visit in _phrmDbContext.PHRMPatientVisit on new { pres.PatientVisitId, pres.PatientId } equals new { visit.PatientVisitId, visit.PatientId }
                                       join emp in _phrmDbContext.Employees on pres.CreatedBy equals emp.EmployeeId
                                       join scheme in _phrmDbContext.Schemes on visit.SchemeId equals scheme.SchemeId
                                       join priceCategory in _phrmDbContext.PriceCategories on visit.PriceCategoryId equals priceCategory.PriceCategoryId
                                       orderby pres.PrescriptionNo descending
                                       select new
                                       {
                                           pres.PrescriptionId,
                                           pres.PrescriptionNo,
                                           pres.PrescriptionStatus,
                                           visit.VisitType,
                                           pres.CreatedOn,
                                           PrescriberName = emp.FullName,
                                           pres.CreatedBy,
                                           visit.PatientVisitId,
                                           visit.SchemeId,
                                           visit.PriceCategoryId,
                                           visit.ClaimCode,
                                           scheme.SchemeName,
                                           priceCategory.PriceCategoryName
                                       })
                                       .ToList();
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("PatientPrescriptionItems")]
        public IActionResult GetPatientPrescriptionItems(int PrescriptionId)
        {
            string[] status = { ENUM_PrescriptionOrderStatus.Active, ENUM_PrescriptionOrderStatus.Partial };

            Func<object> func = () => (from presItem in _phrmDbContext.PHRMPrescriptionItems.Where(a => a.PrescriptionId == PrescriptionId && a.IsActive == true
                                       && status.Contains(a.OrderStatus))
                                       join item in _phrmDbContext.PHRMItemMaster on presItem.ItemId equals item.ItemId
                                       join gen in _phrmDbContext.PHRMGenericModel on item.GenericId equals gen.GenericId
                                       select new
                                       {
                                           presItem.PrescriptionItemId,
                                           presItem.PatientId,
                                           presItem.PatientVisitId,
                                           presItem.PrescriberId,
                                           presItem.ItemId,
                                           presItem.GenericId,
                                           PendingQuantity = presItem.Quantity - presItem.SalesQuantity,
                                           item.ItemName,
                                           gen.GenericName,
                                           Quantity = 0,
                                           presItem.FrequencyAbbreviation,
                                           presItem.Strength,
                                           presItem.Dosage,
                                           presItem.HowManyDays
                                       })
                                       .ToList();
            return InvokeHttpGetFunction<object>(func);
        }


        [HttpPut]
        [Route("PrescriptionItems")]
        public IActionResult PrescriptionItems([FromBody] List<PrescriptionItemQuantityUpdate_DTO> prescriptionItems)
        {
            Func<object> func = () => UpdatePrescriptionQuantity(prescriptionItems);
            return InvokeHttpPutFunction<object>(func);
        }

        private object UpdatePrescriptionQuantity(List<PrescriptionItemQuantityUpdate_DTO> prescriptionItemsToUpdate)
        {
            var prescriptionItemIds = prescriptionItemsToUpdate.Select(a => a.PrescriptionItemId).ToList();
            var prescriptionItemUpdates = prescriptionItemsToUpdate.ToDictionary(x => x.PrescriptionItemId);
            var prescriptionItemsFromServer = _phrmDbContext.PHRMPrescriptionItems
                                                       .Where(a => prescriptionItemIds.Contains(a.PrescriptionItemId))
                                                       .ToList();
            if (prescriptionItemsFromServer.Any(a => a.Quantity > 0))
            {
                throw new InvalidOperationException($"Some of the prescription quantity is already modified.");
            }
            foreach (var item in prescriptionItemsFromServer)
            {
                if (prescriptionItemUpdates.TryGetValue(item.PrescriptionItemId, out var itemUpdate))
                {
                    item.Quantity = itemUpdate.Quantity;
                }
            }
            _phrmDbContext.SaveChanges();
            return prescriptionItemsFromServer;
        }

        [HttpPut]
        [Route("DiscardPrescriptionItem")]
        public IActionResult DiscardPrescriptionItem(int PrescriptionItemId)
        {
            Func<object> func = () => UpdatePrescriptionItemOrderStatus(PrescriptionItemId);
            return InvokeHttpPutFunction<object>(func);
        }

        private object UpdatePrescriptionItemOrderStatus(int PrescriptionItemId)
        {
            var prescriptionItemFromServer = _phrmDbContext.PHRMPrescriptionItems
                                                           .FirstOrDefault(a => a.PrescriptionItemId == PrescriptionItemId);
            if (prescriptionItemFromServer == null)
            {
                throw new InvalidOperationException("Prescription Item not found");
            }
            prescriptionItemFromServer.OrderStatus = ENUM_PrescriptionOrderStatus.Discarded;
            _phrmDbContext.SaveChanges();



            var prescriptionId = prescriptionItemFromServer.PrescriptionId;
            var isAllPrescriptionItemDiscarded = _phrmDbContext.PHRMPrescriptionItems.Where(a => a.PrescriptionId == prescriptionId).All(a => a.OrderStatus == ENUM_PrescriptionOrderStatus.Discarded);
            if (isAllPrescriptionItemDiscarded)
            {
                var prescription = _phrmDbContext.PHRMPrescription.FirstOrDefault(a => a.PrescriptionId == prescriptionId);
                prescription.PrescriptionStatus = ENUM_PrescriptionOrderStatus.Discarded;
            }
            _phrmDbContext.SaveChanges();
            return prescriptionItemFromServer;
        }

        [HttpPut]
        [Route("DiscardPrescription")]
        public IActionResult DiscardPrescription(int PrescriptionId)
        {
            Func<object> func = () => UpdatePrescriptionOrderStatus(PrescriptionId);
            return InvokeHttpPutFunction<object>(func);
        }

        private object UpdatePrescriptionOrderStatus(int PrescriptionId)
        {
            var prescriptionFromServer = _phrmDbContext.PHRMPrescription.Include("PHRMPrescriptionItems")
                                                           .FirstOrDefault(a => a.PrescriptionId == PrescriptionId);
            if (prescriptionFromServer == null)
            {
                throw new InvalidOperationException("Prescription not found");
            }
            prescriptionFromServer.PrescriptionStatus = ENUM_PrescriptionOrderStatus.Discarded;
            prescriptionFromServer.PHRMPrescriptionItems.ForEach(item =>
            {
                item.OrderStatus = ENUM_PrescriptionOrderStatus.Discarded;
            });
            _phrmDbContext.SaveChanges();
            return prescriptionFromServer;
        }
    }
}
