using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.AccountingModels.Config;
using DanpheEMR.ServerModel.PharmacyModels;
using DanpheEMR.Services.BillSettings.DTOs;
using DanpheEMR.Services.FiscalYear;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch.Internal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Linq;

namespace DanpheEMR.Controllers.Settings
{
    public class FiscalYearSettingController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly RbacDbContext _rbacDbContext;
        private readonly BillingDbContext _billingDbContext;
        private readonly AccountingDbContext _accountingDbContext;
        private readonly InventoryDbContext _inventoryDbContext;
        private readonly PharmacyDbContext _pharmacyDbContext;


        public FiscalYearSettingController(IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _rbacDbContext = new RbacDbContext(connString);
            _billingDbContext = new BillingDbContext(connString);
            _accountingDbContext = new AccountingDbContext(connString);
            _inventoryDbContext = new InventoryDbContext(connString);
            _pharmacyDbContext= new PharmacyDbContext(connString);
        }
        [HttpGet]
        [Route("HospitalAccount")]
        public IActionResult GetHospitalAccount()
        {
            Func<object> func = () => _accountingDbContext.Hospitals.ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("BillingFiscalYear")]
        public IActionResult GetBillingFiscalYear()
        {
            Func<object> func = () => GetBillingFiscalYear(_billingDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("AccountingFiscalYear")]
        public IActionResult GetAccountngFiscalYear()
        {
            Func<object> func = () => GetAccountngFiscalYear(_accountingDbContext, _billingDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("InventoryFiscalYear")]
        public IActionResult GetInventoryFiscalYear()
        {
            Func<object> func = () => GetInventoryFiscalYear(_inventoryDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PharmacyFiscalYear")]
        public IActionResult GetPharmacyFiscalYear()
        {
            Func<object> func = () => GetPharmacyFiscalYear(_pharmacyDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("BillingFiscalYear")]
        public IActionResult AddBillFiscalyear([FromBody] BillFiscalYear_DTO billFiscalYear_dto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddBillFiscalyear(currentUser, billFiscalYear_dto, _billingDbContext);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("AccountingFiscalYear")]
        public IActionResult AddAccountFiscalyear([FromBody] AccountFiscalYear_DTO accountFiscalYear_dto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddAccountFiscalyear(currentUser, accountFiscalYear_dto, _accountingDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("InventoryFiscalYear")]
        public IActionResult AddInventoryFiscalyear([FromBody] InventoryFiscalYear_DTO inventoryFiscalYear_dto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddInventoryFiscalyear(currentUser, inventoryFiscalYear_dto, _inventoryDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("PharmacyFiscalYear")]
        public IActionResult AddPharmacyFiscalYear([FromBody] PharmacyFiscalYear_DTO pharmacyFiscalYear_dto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddPharmacyFiscalYear(currentUser,pharmacyFiscalYear_dto, _pharmacyDbContext);
            return InvokeHttpPostFunction(func);
        }

        private object GetBillingFiscalYear(BillingDbContext _billingDbContext)
        {
            try
            {
                var billFiscalYearList = (from bf in _billingDbContext.BillingFiscalYears
                                          join emp in _billingDbContext.Employee
                                          on bf.CreatedBy equals emp.EmployeeId into empGroup
                                          from emp in empGroup.DefaultIfEmpty()
                                          select new GetFiscalYearDTO
                                          {
                                              FiscalYearId = bf.FiscalYearId,
                                              FiscalYearName = bf.FiscalYearName,
                                              StartYear = bf.StartYear,
                                              EndYear = bf.EndYear,
                                              CreatedBy = bf.CreatedBy,
                                              IsActive = bf.IsActive,
                                              EmployeeId = emp != null ? emp.EmployeeId : (int?)null,
                                              EmployeeFullName = emp != null ? emp.FullName : null
                                          }).ToList();

                return billFiscalYearList;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting the Billing Fiscal Year: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while getting Billing Fiscal Year .{ex.Message}");

            }
        }

        private object GetAccountngFiscalYear(AccountingDbContext _accountingDbContext, BillingDbContext _billingDbContext)
        {
            try
            {
                var fiscalYears = _accountingDbContext.FiscalYears
             .Select(bf => new
             {
                 FiscalYearId = bf.FiscalYearId,
                 FiscalYearName = bf.FiscalYearName,
                 StartDate = bf.StartDate,
                 EndDate = bf.EndDate,
                 CreatedBy = bf.CreatedBy,
                 IsActive = bf.IsActive
             }).ToList();

                var employees = _billingDbContext.Employee
                    .Select(emp => new
                    {
                        EmployeeId = emp.EmployeeId,
                        FullName = emp.FullName
                    }).ToList();

                // Perform the join in memory (after both queries are done)
                var billFiscalYearList = (from bf in fiscalYears
                                          join emp in employees
                                          on bf.CreatedBy equals emp.EmployeeId into empGroup
                                          from emp in empGroup.DefaultIfEmpty()
                                          select new GetFiscalYearDTO
                                          {
                                              FiscalYearId = bf.FiscalYearId,
                                              FiscalYearName = bf.FiscalYearName,
                                              StartDate = bf.StartDate,
                                              EndDate = bf.EndDate,
                                              CreatedBy = bf.CreatedBy,
                                              IsActive = bf.IsActive,
                                              EmployeeId = emp != null ? emp.EmployeeId : (int?)null,
                                              EmployeeFullName = emp != null ? emp.FullName : null
                                          }).ToList();

                return billFiscalYearList;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting the Accounting Fiscal Year: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while getting the Accounting Fiscal Year.{ex.Message}");

            }
        }

        private object GetInventoryFiscalYear(InventoryDbContext _inventoryDbContext)
        {
            try
            {
                var InvFiscalYearList = (from bf in _inventoryDbContext.InventoryFiscalYears
                                         join emp in _inventoryDbContext.Employees
                                         on bf.CreatedBy equals emp.EmployeeId into empGroup
                                         from emp in empGroup.DefaultIfEmpty()
                                         select new GetFiscalYearDTO
                                         {
                                             FiscalYearId = bf.FiscalYearId,
                                             FiscalYearName = bf.FiscalYearName,
                                             StartDate = bf.StartDate,
                                             EndDate = bf.EndDate,
                                             CreatedBy = bf.CreatedBy,
                                             IsActive = bf.IsActive,
                                             EmployeeId = emp != null ? emp.EmployeeId : (int?)null,
                                             EmployeeFullName = emp != null ? emp.FullName : null
                                         }).ToList();

                return InvFiscalYearList;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting the Inventory Fiscal Year: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while getting the Inventory Fiscal Year.{ex.Message}");

            }
        }
        private object GetPharmacyFiscalYear(PharmacyDbContext _pharmacyDbContext)
        {
            try
            {
                var PharmacyYearList = (from bf in _pharmacyDbContext.PharmacyFiscalYears
                                         join emp in _pharmacyDbContext.Employees
                                         on bf.CreatedBy equals emp.EmployeeId into empGroup
                                         from emp in empGroup.DefaultIfEmpty()
                                         select new GetFiscalYearDTO
                                         {
                                             FiscalYearId = bf.FiscalYearId,
                                             FiscalYearName = bf.FiscalYearName,
                                             StartDate =bf.StartDate ?? DateTime.MinValue,
                                             EndDate = bf.EndDate ?? DateTime.MinValue,
                                             CreatedBy = bf.CreatedBy,
                                             IsActive = (bool)bf.IsActive,
                                             EmployeeId = emp != null ? emp.EmployeeId : (int?)null,
                                             EmployeeFullName = emp != null ? emp.FullName : null
                                         }).ToList();

                return PharmacyYearList;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting the Pharmacy Fiscal Year: {ex.Message}");
                throw new InvalidOperationException($"An error occurred while getting the Pharmacy Fiscal Year.{ex.Message}");

            }
        }
        private object AddBillFiscalyear(RbacUser currentUser, BillFiscalYear_DTO billFiscalYear_dto, BillingDbContext _billingDbContext)
        {
            using (var dbContextTransaction = _billingDbContext.Database.BeginTransaction())
                {
                try
                {
                    int maxFiscalYearId = _billingDbContext.BillingFiscalYears
                                .Select(fy => (int?)fy.FiscalYearId)
                                .Max() ?? 0;
                    int newFiscalYearId = maxFiscalYearId + 1;

                    if (billFiscalYear_dto == null)
                    {
                        Log.Error($"Nothing to save as {nameof(billFiscalYear_dto)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(billFiscalYear_dto)} is null.");
                    }


                    string trimmedFiscalName = billFiscalYear_dto.FiscalYearName.Trim();
                    bool counterNameExists = _billingDbContext.BillingFiscalYears
                                             .Any(bc => bc.FiscalYearName.Trim().Equals(trimmedFiscalName, StringComparison.OrdinalIgnoreCase));

                    if (counterNameExists)
                    {
                        Log.Error($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                        throw new InvalidOperationException($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                    }


                    DateTime parsedStartDate = DateTime.ParseExact(billFiscalYear_dto.StartYear, "yyyy-MM-dd", null);
                    DateTimeOffset dateTimeOffset = new DateTimeOffset(parsedStartDate, TimeSpan.Zero);

                    // Use the constructor to ensure time is set to 00:00:00.000
                    DateTime startDate = new DateTime(parsedStartDate.Year, parsedStartDate.Month, parsedStartDate.Day, 0, 0, 0, 0);


                    DateTime parsedEndDate = DateTime.ParseExact(billFiscalYear_dto.EndYear, "yyyy-MM-dd", null);
                    DateTime endDate = new DateTime(parsedEndDate.Year, parsedEndDate.Month, parsedEndDate.Day, 23, 59, 59, 997);




                    var billingyear = new BillingFiscalYear()
                    {   
                        FiscalYearId=newFiscalYearId,
                        FiscalYearName = trimmedFiscalName,
                        FiscalYearFormatted = trimmedFiscalName,
                        StartYear = startDate,
                        EndYear = endDate,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };


                    _billingDbContext.BillingFiscalYears.Add(billingyear);
                    _billingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return billFiscalYear_dto;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred while saving the billing fiscal year : {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the billing fiscal year .{ex.Message}");

                }
            }
        }

        private object AddAccountFiscalyear(RbacUser currentUser, AccountFiscalYear_DTO accountFiscalYear_dto, AccountingDbContext _accountingDbContext)
        {
            using (var dbContextTransaction = _accountingDbContext.Database.BeginTransaction())

                {
                try
                {
                    int maxFiscalYearId = _accountingDbContext.FiscalYears
                                .Select(fy => (int?)fy.FiscalYearId)
                                .Max() ?? 0;
                    int newFiscalYearId = maxFiscalYearId + 1;
                    if (accountFiscalYear_dto == null)
                    {
                        Log.Error($"Nothing to save as {nameof(accountFiscalYear_dto)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(accountFiscalYear_dto)} is null.");
                    }


                    string trimmedFiscalName = accountFiscalYear_dto.FiscalYearName.Trim();
                    bool counterNameExists = _accountingDbContext.FiscalYears
                                             .Any(bc => bc.FiscalYearName.Trim().Equals(trimmedFiscalName, StringComparison.OrdinalIgnoreCase));

                    if (counterNameExists)
                    {
                        Log.Error($"A Account fiscal year with the name '{trimmedFiscalName}' already exists.");
                        throw new InvalidOperationException($"A Account fiscal year with the name '{trimmedFiscalName}' already exists.");
                    }


                    DateTime parsedStartDate = DateTime.ParseExact(accountFiscalYear_dto.StartDate, "yyyy-MM-dd", null);
                    DateTimeOffset dateTimeOffset = new DateTimeOffset(parsedStartDate, TimeSpan.Zero);

                    // Use the constructor to ensure time is set to 00:00:00.000
                    DateTime startDate = new DateTime(parsedStartDate.Year, parsedStartDate.Month, parsedStartDate.Day, 0, 0, 0, 0);


                    DateTime parsedEndDate = DateTime.ParseExact(accountFiscalYear_dto.EndDate, "yyyy-MM-dd", null);
                    DateTime endDate = new DateTime(parsedEndDate.Year, parsedEndDate.Month, parsedEndDate.Day, 23, 59, 59, 997);




                    var fiscalYear = new FiscalYearModel()
                    {   
                        FiscalYearId=newFiscalYearId,
                        FiscalYearName = trimmedFiscalName,
                        StartDate = startDate,
                        EndDate = endDate,
                        IsActive = true,
                        HospitalId = accountFiscalYear_dto.HospitalId,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };


                    _accountingDbContext.FiscalYears.Add(fiscalYear);
                    _accountingDbContext.SaveChanges();

                    var ACCMapFiscalYear = new MapFiscalYearModel
                    {
                        FiscalYearId = fiscalYear.FiscalYearId,
                        HospitalId = fiscalYear.HospitalId,
                        IsClosed=false,
                        ReadyToClose=false,
                        ModuleName="ACC",
                        CreatedOn = System.DateTime.Now,
                        CreatedBy=currentUser.EmployeeId,
                        IsActive=true
                    };

                    _accountingDbContext.MapFiscalYears.Add(ACCMapFiscalYear);
                    _accountingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return accountFiscalYear_dto;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred while saving the Account fiscal year : {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the Account fiscal year .{ex.Message}");

                }
            }
        }

        private object AddInventoryFiscalyear(RbacUser currentUser, InventoryFiscalYear_DTO inventoryFiscalYear_dto, InventoryDbContext _inventoryDbContext)
        {
            using (var dbContextTransaction = _inventoryDbContext.Database.BeginTransaction())
            
                {
                try
                {
                    int maxFiscalYearId = _inventoryDbContext.InventoryFiscalYears
                                 .Select(fy => (int?)fy.FiscalYearId)
                                 .Max() ?? 0;
                    int newFiscalYearId = maxFiscalYearId + 1;

                    if (inventoryFiscalYear_dto == null)
                    {
                        Log.Error($"Nothing to save as {nameof(inventoryFiscalYear_dto)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(inventoryFiscalYear_dto)} is null.");
                    }


                    string trimmedFiscalName = inventoryFiscalYear_dto.FiscalYearName.Trim();
                    bool counterNameExists = _inventoryDbContext.InventoryFiscalYears
                                             .Any(bc => bc.FiscalYearName.Trim().Equals(trimmedFiscalName, StringComparison.OrdinalIgnoreCase));

                    if (counterNameExists)
                    {
                        Log.Error($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                        throw new InvalidOperationException($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                    }


                    DateTime parsedStartDate = DateTime.ParseExact(inventoryFiscalYear_dto.StartDate, "yyyy-MM-dd", null);
                    DateTimeOffset dateTimeOffset = new DateTimeOffset(parsedStartDate, TimeSpan.Zero);

                    // Use the constructor to ensure time is set to 00:00:00.000
                    DateTime startDate = new DateTime(parsedStartDate.Year, parsedStartDate.Month, parsedStartDate.Day, 0, 0, 0, 0);


                    DateTime parsedEndDate = DateTime.ParseExact(inventoryFiscalYear_dto.EndDate, "yyyy-MM-dd", null);
                    DateTime endDate = new DateTime(parsedEndDate.Year, parsedEndDate.Month, parsedEndDate.Day, 23, 59, 59, 997);




                    var inventoryyear = new InventoryFiscalYear()
                    {   
                        FiscalYearId= newFiscalYearId,
                        FiscalYearName = trimmedFiscalName,
                        StartDate = startDate,
                        EndDate = endDate,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };


                    _inventoryDbContext.InventoryFiscalYears.Add(inventoryyear);
                    _inventoryDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return inventoryFiscalYear_dto;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred while saving the inventory fiscal year : {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the inventory fiscal year .{ex.Message}");

                }
            }
        }

        private object AddPharmacyFiscalYear(RbacUser currentUser, PharmacyFiscalYear_DTO pharmacyFiscalYear_dto, PharmacyDbContext _pharmacyDbContext)
        {
            using (var dbContextTransaction = _pharmacyDbContext.Database.BeginTransaction())
            {

                try
                {
                    int maxFiscalYearId = _pharmacyDbContext.PharmacyFiscalYears
                                 .Select(fy => (int?)fy.FiscalYearId)  
                                 .Max() ?? 0; 
                    int newFiscalYearId = maxFiscalYearId + 1;


                    if (pharmacyFiscalYear_dto == null)
                    {
                        Log.Error($"Nothing to save as {nameof(pharmacyFiscalYear_dto)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(pharmacyFiscalYear_dto)} is null.");
                    }


                    string trimmedFiscalName = pharmacyFiscalYear_dto.FiscalYearName.Trim();
                    bool counterNameExists = _pharmacyDbContext.PharmacyFiscalYears
                                             .Any(bc => bc.FiscalYearName.Trim().Equals(trimmedFiscalName, StringComparison.OrdinalIgnoreCase));

                    if (counterNameExists)
                    {
                        Log.Error($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                        throw new InvalidOperationException($"A billing fiscal year with the name '{trimmedFiscalName}' already exists.");
                    }


                    DateTime parsedStartDate = DateTime.ParseExact(pharmacyFiscalYear_dto.StartDate, "yyyy-MM-dd", null);
                    DateTimeOffset dateTimeOffset = new DateTimeOffset(parsedStartDate, TimeSpan.Zero);

                    // Use the constructor to ensure time is set to 00:00:00.000
                    DateTime startDate = new DateTime(parsedStartDate.Year, parsedStartDate.Month, parsedStartDate.Day, 0, 0, 0, 0);


                    DateTime parsedEndDate = DateTime.ParseExact(pharmacyFiscalYear_dto.EndDate, "yyyy-MM-dd", null);
                    DateTime endDate = new DateTime(parsedEndDate.Year, parsedEndDate.Month, parsedEndDate.Day, 23, 59, 59, 997);

                    var pharmacyYear = new PharmacyFiscalYear()
                    {
                        FiscalYearId = newFiscalYearId,
                        FiscalYearName = trimmedFiscalName,
                        StartDate = startDate,
                        EndDate = endDate,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };


                    _pharmacyDbContext.PharmacyFiscalYears.Add(pharmacyYear);
                    _pharmacyDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return pharmacyFiscalYear_dto;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"An error occurred while saving the pharmacy fiscal year : {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the pharmacy fiscal year .{ex.Message}");

                }
            }
            }
        }


 }

