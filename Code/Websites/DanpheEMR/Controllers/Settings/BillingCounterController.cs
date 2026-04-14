using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.Services.BillSettings.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Serilog;
using System;
using System.Linq;
using EntityState = System.Data.Entity.EntityState;

namespace DanpheEMR.Controllers.Settings
{
    public class BillingCounterController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly RbacDbContext _rbacDbContext;
        private readonly BillingDbContext _billingDbContext;


        public BillingCounterController(IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _rbacDbContext = new RbacDbContext(connString);
            _billingDbContext = new BillingDbContext(connString);
            
        }
        [HttpPost]
        [Route("BillingCounter")]
        public IActionResult AddBillingCounter([FromBody] BillingCounter_DTO billingCounter_dto)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => AddBillingCounter(currentUser, billingCounter_dto, _billingDbContext);
            return InvokeHttpPostFunction(func);
        }
        private object AddBillingCounter(RbacUser currentUser, BillingCounter_DTO billingCounter_dto, BillingDbContext _billingDbContext)
        {
            using (var dbContextTransaction = _billingDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (billingCounter_dto == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(billingCounter_dto)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(billingCounter_dto)} is null.");
                    }
                    string trimmedCounterName = billingCounter_dto.CounterName.Trim();
                    bool counterNameExists = _billingDbContext.BillingCounter
                                             .Any(bc => bc.CounterName.Trim().Equals(trimmedCounterName, StringComparison.OrdinalIgnoreCase));

                    if (counterNameExists)
                    {
                        Log.Error($"A billing counter with the name '{trimmedCounterName}' already exists.");
                        throw new InvalidOperationException($"A billing counter with the name '{trimmedCounterName}' already exists.");
                    }
                    DateTime? beginningDate = null;
                    DateTime? closingDate = null;

                    if (!string.IsNullOrWhiteSpace(billingCounter_dto.BeginningDate))
                    {
                        if (DateTime.TryParse(billingCounter_dto.BeginningDate, out DateTime parsedBeginningDate))
                        {
                            beginningDate = parsedBeginningDate;
                        }

                    }

                    if (!string.IsNullOrWhiteSpace(billingCounter_dto.ClosingDate))
                    {
                        if (DateTime.TryParse(billingCounter_dto.ClosingDate, out DateTime parsedClosingDate))
                        {
                            closingDate = parsedClosingDate;
                        }

                    }
                    var billingcounters = new BillingCounter()
                    {
                        CounterName = trimmedCounterName,
                        CounterType = string.IsNullOrWhiteSpace(billingCounter_dto.CounterType) ? null : billingCounter_dto.CounterType,
                        BeginningDate = beginningDate,
                        ClosingDate = closingDate,
                        IsActive = true,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    _billingDbContext.BillingCounter.Add(billingcounters);
                    _billingDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return billingCounter_dto;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the Billing Counter: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the Billing Counter.{ex.Message}");

                }
            }
        }
        [HttpGet]
        [Route("BillingCounter")]
        public IActionResult GetBillingCounterList()
        {
            Func<object> func = () => _billingDbContext.BillingCounter.ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpPut]
        [Route("ChangeActiveStatus")]
        public IActionResult ActivateDeactivateIntakeOutputVariable(int counterId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => ActivateDeactivateBillingCounter(currentUser, counterId, _billingDbContext);
            return InvokeHttpPutFunction(func);
        }
        private object ActivateDeactivateBillingCounter(RbacUser currentUser, int counterId, BillingDbContext _billingDbContext)
        {
            if (counterId == 0)
            {
                Log.Error($"{nameof(counterId)} is not provided");
                throw new InvalidOperationException($"{nameof(counterId)} is not provided");

            }

            var selectedCounterData = _billingDbContext.BillingCounter.FirstOrDefault(r => r.CounterId == counterId);
            if (selectedCounterData == null)
            {
                Log.Error($"There is no selected BillingCounter to update with counterId {nameof(counterId)}");
                throw new InvalidOperationException($"There is no selected BillingCounter to update with counterId {nameof(counterId)}");
            }

            selectedCounterData.IsActive = !selectedCounterData.IsActive;

            _billingDbContext.Entry(selectedCounterData).State = EntityState.Modified;
            _billingDbContext.SaveChanges();
            return selectedCounterData;
        }

    }
}
