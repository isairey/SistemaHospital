using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.BillingModels.DischargeModel;
using DanpheEMR.ServerModel.BillingModels.DischargeStatementModels;
using DanpheEMR.ServerModel;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using DanpheEMR.Controllers.Billing;
using DanpheEMR.Services.SSF.DTO;
using System.Data.Entity;
using DanpheEMR.CommonTypes;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.MasterModels;
using DanpheEMR.ServerModel.MedicareModels;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.Services.Billing.DTO;
using DanpheEMR.Sync.IRDNepal.Models;
using Newtonsoft.Json;
using System.Data.SqlClient;
using System.Configuration;
using System.Data.Entity.Infrastructure;
using Serilog;
using DanpheEMR.ServerModel.ReportingModels;

namespace DanpheEMR.Services.Discharge
{
    public class DischargeBillingService
    {
        public static async Task<object> SaveBillingAndPharmacyTransactionAndDischarge(DischargeDbContext _dischargeDbContext, PendingBill pendingBills, RbacUser currentUser, string connString, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            using (var dischargeTransactionScope = _dischargeDbContext.Database.BeginTransaction(System.Data.IsolationLevel.ReadUncommitted))
            {
                try
                {
                    int FiscalYearId = GetFiscalYear(_dischargeDbContext);
                    DateTime currentDate = DateTime.Now;

                    IpBillingTxnVM ipBillingTxnVM = pendingBills.BillingPendingItems;
                    List<PharmacyPendingBillItem> phrmPendingInvoiceItems = pendingBills.PharmacyPendingItem;
                    DischargeStatementModel dischargeStatement = SaveDischargeStatement(_dischargeDbContext,currentUser, FiscalYearId, currentDate, ipBillingTxnVM.dischargeDetailVM);

                    //Read SettlePharamcyCreditFromBilling parameter and see if Pharmacy Credits are allowed to settle from Billing?
                    var param = _dischargeDbContext.CFGParameters.FirstOrDefault(p => p.ParameterGroupName == "Billing" && p.ParameterName == "SettlePharamcyCreditFromBilling");
                    bool settlePharamcyCredits = false;
                    if(param != null && param.ParameterValue == "true")
                    {
                        settlePharamcyCredits = true;
                    }
                   
                    if (ipBillingTxnVM.billingTransactionModel.BillingTransactionItems.Count() > 0)
                    {
                        SaveBillingTransactionAndDischarge(currentUser, currentDate, connString, ipBillingTxnVM, dischargeStatement.DischargeStatementId, _dischargeDbContext, realTimeRemoteSyncEnabled, realTimeSSFClaimBooking);
                    }
                    else
                    {
                        DischargeOnZeroItem(ipBillingTxnVM, currentUser, _dischargeDbContext);
                    }
                    if (ipBillingTxnVM.billingTransactionModel.PaymentMode == ENUM_BillPaymentMode.cash && pendingBills.PharmacyTotalAmount > 0 && settlePharamcyCredits)
                    {
                        SettlePharmacyCreditInvoices(_dischargeDbContext, ipBillingTxnVM.billingTransactionModel.PatientId, (int)ipBillingTxnVM.billingTransactionModel.PatientVisitId, dischargeStatement.DischargeStatementId,
                            FiscalYearId, currentUser, ipBillingTxnVM.billingTransactionModel.CounterId);
                    }

                    if (ipBillingTxnVM.billingTransactionModel.PaymentMode == ENUM_BillPaymentMode.credit && pendingBills.PharmacyTotalAmount > 0 && settlePharamcyCredits)
                    {
                        UpdatePharmacyInvoiceItemsWithDischargeStatementId(_dischargeDbContext,ipBillingTxnVM.billingTransactionModel.PatientId, (int)ipBillingTxnVM.billingTransactionModel.PatientVisitId, dischargeStatement.DischargeStatementId);
                    }

                    dischargeTransactionScope.Commit();

                    if (ipBillingTxnVM.billingTransactionModel.PaymentDetails != null && ipBillingTxnVM.billingTransactionModel.PaymentDetails.ToLower().Contains(ENUM_OnlinePaymentMode.FonePay))
                    {
                        FonePayHub hub = new FonePayHub(hubContext, contextAccessor);
                        InvoiceDetail invoiceDetail = new InvoiceDetail();
                        invoiceDetail.DischargeStatementId = dischargeStatement.DischargeStatementId;
                        invoiceDetail.PatientId = ipBillingTxnVM.billingTransactionModel.PatientId;
                        invoiceDetail.PatientVisitId = dischargeStatement.PatientVisitId;
                        invoiceDetail.PaymentStatus = true;
                        hub.SendNotification(currentUser.UserId.ToString(), invoiceDetail);
                    }
                    Log.Information($"Patient, {pendingBills.BillingPendingItems.billingTransactionModel.PatientId} is discharged successfully!");
                    return new
                    {
                        DischargeStatementId = dischargeStatement.DischargeStatementId,
                        PatientId = ipBillingTxnVM.billingTransactionModel.PatientId,
                        PatientVisitId = dischargeStatement.PatientVisitId
                    };
                }
                catch (Exception ex)
                {
                    Log.Error($"The Discharge Transaction is being Rolled Back as Exception is thrown while discharging patient, {pendingBills.BillingPendingItems.billingTransactionModel.PatientId} with PatientVisit, {pendingBills.BillingPendingItems.billingTransactionModel.PatientVisitId}!");
                    dischargeTransactionScope.Rollback();
                    throw new Exception($"The Discharge Transaction is being Rolled Back as Exception is thrown while discharging patient, {pendingBills.BillingPendingItems.billingTransactionModel.PatientId} with PatientVisit, {pendingBills.BillingPendingItems.billingTransactionModel.PatientVisitId}, with exception Message,\n {ex.Message} and exception details is \n {ex.ToString()}");
                }
            }
        }

        private static void UpdatePharmacyInvoiceItemsWithDischargeStatementId(DischargeDbContext dischargeDbContext,int patientId, int patientVisitId, int dischargeStatementId)
        {
            var pharmacyCreditInvoiceDetails = GetPharmacyCreditInvoiceDetails(dischargeDbContext,patientId, patientVisitId);

            if (pharmacyCreditInvoiceDetails.Count() > 0)
            {
                pharmacyCreditInvoiceDetails.ForEach(a =>
                {

                    var InvoiceDetails = dischargeDbContext.PHRMInvoiceTransaction.Include(inv => inv.InvoiceItems).Where(inv => inv.InvoiceId == a.InvoiceId).FirstOrDefault();
                    if (InvoiceDetails != null)
                    {

                        InvoiceDetails.InvoiceItems.ForEach(invitm =>
                        {
                            invitm.DischargeStatementId = dischargeStatementId;
                            dischargeDbContext.Entry(invitm).Property(x => x.DischargeStatementId).IsModified = true;
                        });
                        dischargeDbContext.Entry(InvoiceDetails).Property(x => x.BilStatus).IsModified = true;
                    }
                });
                dischargeDbContext.SaveChanges();
            }
        }


        private static void SettlePharmacyCreditInvoices(DischargeDbContext dischargeDbContext,int PatientId, int PatientVisitId, int DischargeStatementId, int FiscalYearId, RbacUser currentUser, int CounterId)
        {
            var pharmacyCreditInvoiceDetails = GetPharmacyCreditInvoiceDetails(dischargeDbContext,PatientId, PatientVisitId);

            if (pharmacyCreditInvoiceDetails.Count() > 0)
            {
                pharmacyCreditInvoiceDetails.ForEach(a =>
                {
                    BillSettlementModel billSett = new BillSettlementModel
                    {
                        FiscalYearId = FiscalYearId,
                        SettlementDate = DateTime.Now,
                        PatientId = PatientId,
                        SettlementReceiptNo = GetSettlementReceiptNo(dischargeDbContext),
                        CollectionFromReceivable = (double)a.CreditAmount,
                        PaidAmount = (double)a.CreditAmount,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = DateTime.Now,
                        OrganizationId = a.OrganizationId,
                        IsActive = true,
                        PaymentMode = ENUM_BillPaymentMode.cash,
                        CounterId = CounterId,
                        PrintCount = 0,
                        ModuleName = ENUM_ModuleNames.Billing
                    };

                    dischargeDbContext.BillSettlements.Add(billSett);
                    dischargeDbContext.SaveChanges();

                    var InvoiceDetails = dischargeDbContext.PHRMInvoiceTransaction.Include(inv => inv.InvoiceItems).Where(inv => inv.InvoiceId == a.InvoiceId).FirstOrDefault();
                    if (InvoiceDetails != null)
                    {
                        InvoiceDetails.BilStatus = ENUM_BillingStatus.paid;
                        InvoiceDetails.SettlementId = billSett.SettlementId;

                        InvoiceDetails.InvoiceItems.ForEach(invitm =>
                        {
                            invitm.BilItemStatus = ENUM_BillingStatus.paid;
                            invitm.DischargeStatementId = DischargeStatementId;
                            dischargeDbContext.Entry(invitm).Property(x => x.BilItemStatus).IsModified = true;
                            dischargeDbContext.Entry(invitm).Property(x => x.DischargeStatementId).IsModified = true;
                        });
                        dischargeDbContext.Entry(InvoiceDetails).Property(x => x.BilStatus).IsModified = true;
                        dischargeDbContext.Entry(InvoiceDetails).Property(x => x.SettlementId).IsModified = true;
                    }
                });
                dischargeDbContext.SaveChanges();
            }
        }

        private static List<PharmacyCreditInvoiceDetail_DTO> GetPharmacyCreditInvoiceDetails(DischargeDbContext dischargeDbContext,int patientId, int patientVisitId)
        {
            var pharmacyCreditInvoiceDetails = (from inv in dischargeDbContext.PHRMInvoiceTransaction.Where(inv => inv.PatientId == patientId && inv.PatientVisitId == patientVisitId && inv.BilStatus == ENUM_BillingStatus.unpaid)
                                                join invret in
                                                (
                                                    from invret in dischargeDbContext.PHRMInvoiceReturnModels.Where(a => a.PatientId == patientId)
                                                    group invret by new { invret.InvoiceId } into invoiceReturn
                                                    select new
                                                    {
                                                        InvoiceId = invoiceReturn.Key.InvoiceId,
                                                        TotalCreditAmount = invoiceReturn.Select(a => a.TotalAmount).DefaultIfEmpty(0).Sum()
                                                    }
                                                )
                                                on inv.InvoiceId equals invret.InvoiceId
                                                into invAndReturn
                                                from invoiceAndReturnDetials in invAndReturn.DefaultIfEmpty()
                                                select new PharmacyCreditInvoiceDetail_DTO
                                                {
                                                    InvoiceId = inv.InvoiceId,
                                                    CreditAmount = inv.TotalAmount - (invoiceAndReturnDetials == null ? 0 : invoiceAndReturnDetials.TotalCreditAmount),
                                                    OrganizationId = (int)inv.OrganizationId
                                                }).ToList();
            return pharmacyCreditInvoiceDetails;
        }


        private static int GetSettlementReceiptNo(DischargeDbContext dischargeDbContext)
        {
            int currSettlmntNo = dischargeDbContext.BillSettlements.Select(a => a.SettlementReceiptNo).DefaultIfEmpty(0).Max();
            return currSettlmntNo + 1;
        }

        private static object DischargeOnZeroItem(IpBillingTxnVM ipBillingTxnVM, RbacUser currentUser, DischargeDbContext dischargeDbContext)
        {
            BillingDepositModel deposit = new BillingDepositModel();

            var admissionDetail = dischargeDbContext.Admissions.Where(a => a.PatientVisitId == ipBillingTxnVM.dischargeDetailVM.PatientVisitId).FirstOrDefault();
            admissionDetail.DischargedBy = currentUser.EmployeeId;
            admissionDetail.DischargeDate = ipBillingTxnVM.dischargeDetailVM.DischargeDate;
            admissionDetail.AdmissionStatus = ENUM_AdmissionStatus.discharged;

            admissionDetail.BillStatusOnDischarge = ENUM_BillingStatus.paid;

            admissionDetail.DischargeRemarks = ipBillingTxnVM.dischargeDetailVM.Remarks;
            dischargeDbContext.Entry(admissionDetail).Property(a => a.DischargedBy).IsModified = true;
            dischargeDbContext.Entry(admissionDetail).Property(a => a.DischargeDate).IsModified = true;
            dischargeDbContext.Entry(admissionDetail).Property(a => a.AdmissionStatus).IsModified = true;
            dischargeDbContext.Entry(admissionDetail).Property(a => a.BillStatusOnDischarge).IsModified = true;
            dischargeDbContext.Entry(admissionDetail).Property(a => a.DischargeRemarks).IsModified = true;
            dischargeDbContext.SaveChanges();


            var patBedInfo = dischargeDbContext.PatientBedInfos.Where(b => (b.PatientVisitId == ipBillingTxnVM.dischargeDetailVM.PatientVisitId) && !b.EndedOn.HasValue &&
            (b.OutAction == null || b.OutAction == "")).OrderByDescending(o => o.PatientBedInfoId).FirstOrDefault();
            patBedInfo.OutAction = ENUM_AdmissionStatus.discharged;
            patBedInfo.EndedOn = ipBillingTxnVM.dischargeDetailVM.DischargeDate;
            dischargeDbContext.Entry(patBedInfo).Property(a => a.OutAction).IsModified = true;
            dischargeDbContext.Entry(patBedInfo).Property(a => a.EndedOn).IsModified = true;
            dischargeDbContext.SaveChanges();


            var bed = dischargeDbContext.Beds.Where(b => b.BedId == patBedInfo.BedId).FirstOrDefault();
            //set bed to not occupied
            bed.IsOccupied = false;
            bed.OnHold = false;
            bed.HoldedOn = null;
            bed.IsReserved = false;
            dischargeDbContext.Entry(bed).Property(a => a.IsOccupied).IsModified = true;
            dischargeDbContext.Entry(bed).Property(a => a.OnHold).IsModified = true;
            dischargeDbContext.Entry(bed).Property(a => a.HoldedOn).IsModified = true;
            dischargeDbContext.Entry(bed).Property(a => a.IsReserved).IsModified = true;
            dischargeDbContext.SaveChanges();

            //Krishna, 27thApril'23, get the Default DepositHeadId ..
            var DefaultDepositHead = dischargeDbContext.DepositHeadModels.FirstOrDefault(a => a.IsDefault == true);
            int DepositHeadId = DefaultDepositHead != null ? DefaultDepositHead.DepositHeadId : 0;

            if (ipBillingTxnVM.dischargeDetailVM.DepositBalance > 0)
            {
                deposit.PatientId = ipBillingTxnVM.dischargeDetailVM.PatientId;
                deposit.PatientVisitId = ipBillingTxnVM.dischargeDetailVM.PatientVisitId;
                //deposit.Amount = ipBillingTxnVM.dischargeDetailVM.DepositBalance;
                deposit.OutAmount = (decimal)ipBillingTxnVM.dischargeDetailVM.DepositBalance;
                deposit.DepositBalance = 0;
                deposit.CounterId = ipBillingTxnVM.dischargeDetailVM.CounterId;
                deposit.TransactionType = ENUM_DepositTransactionType.ReturnDeposit;
                deposit.CreatedOn = System.DateTime.Now;
                deposit.CreatedBy = currentUser.EmployeeId;
                BillingFiscalYear fiscYear = GetFiscalYearObject(dischargeDbContext);
                deposit.FiscalYearId = fiscYear.FiscalYearId;
                deposit.ReceiptNo = GetDepositReceiptNo(dischargeDbContext);
                deposit.FiscalYear = fiscYear.FiscalYearFormatted;
                EmployeeModel currentEmp = dischargeDbContext.Employee.Where(emp => emp.EmployeeId == currentUser.EmployeeId).AsNoTracking().FirstOrDefault();
                deposit.BillingUser = currentEmp.FullName;
                deposit.IsActive = true;
                deposit.ModuleName = ENUM_ModuleNames.Billing;
                deposit.OrganizationOrPatient = ENUM_Deposit_OrganizationOrPatient.Patient;
                deposit.DepositHeadId = DepositHeadId;

                dischargeDbContext.BillingDeposits.Add(deposit);
                dischargeDbContext.SaveChanges();

                EmpCashTransactionModel empCashTransaction = new EmpCashTransactionModel();
                empCashTransaction.TransactionType = deposit.TransactionType;
                empCashTransaction.ReferenceNo = deposit.DepositId;
                empCashTransaction.InAmount = 0;
                empCashTransaction.OutAmount = (double)deposit.OutAmount;
                empCashTransaction.EmployeeId = currentUser.EmployeeId;
                empCashTransaction.TransactionDate = DateTime.Now;
                empCashTransaction.CounterID = deposit.CounterId;
                empCashTransaction.IsActive = true;

                dischargeDbContext.EmpCashTransactions.Add(empCashTransaction);
                dischargeDbContext.SaveChanges();
            }

            return deposit;
        }

        private static BillingFiscalYear GetFiscalYearObject(DischargeDbContext dischargeDbContext)
        {
            DateTime currentDate = DateTime.Now.Date;
            var FiscalYear = dischargeDbContext.BillingFiscalYears.FirstOrDefault(fsc => fsc.StartYear <= currentDate && fsc.EndYear >= currentDate);
            return FiscalYear;
        }

        private static DischargeStatementModel SaveDischargeStatement(DischargeDbContext dischargeDbContext,RbacUser currentUser, int FiscalYearId, DateTime currentDate, DischargeDetailVM dischargeDetailVM)
        {
            DischargeStatementModel dischargeStatement = new DischargeStatementModel();

            int StatementNo = (from dischargeInfo in dischargeDbContext.DischargeStatements
                               where dischargeInfo.FiscalYearId == FiscalYearId
                               select dischargeInfo.StatementNo).DefaultIfEmpty(0).Max();

            dischargeStatement.StatementNo = StatementNo + 1;
            dischargeStatement.FiscalYearId = FiscalYearId;
            dischargeStatement.StatementDate = currentDate;
            dischargeStatement.StatementTime = currentDate.TimeOfDay;
            dischargeStatement.CreatedOn = currentDate;
            dischargeStatement.PatientId = dischargeDetailVM.PatientId;
            dischargeStatement.PatientVisitId = dischargeDetailVM.PatientVisitId;
            dischargeStatement.CreatedBy = currentUser.EmployeeId;
            dischargeStatement.IsActive = true;
            dischargeStatement.PrintedOn = currentDate;
            dischargeStatement.PrintCount = 0;
            dischargeStatement.PrintedBy = currentUser.EmployeeId;

            dischargeDbContext.DischargeStatements.Add(dischargeStatement);
            dischargeDbContext.SaveChanges();
            return dischargeStatement;
        }

        private static void SaveBillingTransactionAndDischarge(RbacUser currentUser, DateTime currentDate, string connString, IpBillingTxnVM ipBillingTxnVM, int DischargeStatementId, DischargeDbContext dischargeDbContext, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking)
        {
            BillingTransactionModel billTransaction = ipBillingTxnVM.billingTransactionModel;

            if (billTransaction != null)
            {
                if (IsValidForDischarge(billTransaction.PatientId, billTransaction.PatientVisitId, dischargeDbContext))
                {
                    if (IsDepositAvailable(dischargeDbContext, billTransaction.PatientId, billTransaction.DepositUsed))
                    {
                        ProceedToPostBillTransaction(dischargeDbContext, billTransaction, currentUser, currentDate, DischargeStatementId, realTimeRemoteSyncEnabled, realTimeSSFClaimBooking, connString);

                        DischargeDetailVM dischargeDetail = ipBillingTxnVM.dischargeDetailVM;
                        dischargeDetail.BillingTransactionId = billTransaction.BillingTransactionId;
                        dischargeDetail.BillStatus = billTransaction.BillStatus;
                        dischargeDetail.PatientId = billTransaction.PatientId;
                        dischargeDetail.PatientVisitId = (int)billTransaction.PatientVisitId;

                        ProceedToDischargeFromBilling(dischargeDetail, currentUser, currentDate, dischargeDbContext);
                    }
                    else
                    {
                        throw new Exception("Deposit Amount is Invalid");
                    }

                }
                else
                {
                    throw new Exception("Patient is already discharged.");
                }

            }
        }

        private static bool IsValidForDischarge(int patientId, int? patientVisitId, DischargeDbContext dischargeDbContext)
        {
            bool isValidForDischarge = true;

            //condition-1: Check if patient is admitted or not in Admission table.
            AdmissionModel admissionObj = dischargeDbContext.Admissions.Where(adm => adm.PatientId == patientId
                                                  && adm.PatientVisitId == patientVisitId
                                                  && adm.AdmissionStatus == ENUM_AdmissionStatus.admitted).FirstOrDefault();

            //if admissionobject is not found then Patient is nomore Admitted. Hence Discharge is INVALID in such case.
            if (admissionObj == null)
            {
                isValidForDischarge = false;
            }

            return isValidForDischarge;
        }

        private static bool IsDepositAvailable(DischargeDbContext contex, int patientId, double? depositUsed)
        {

            var usePharmacyDepositsIndependently = false;
            usePharmacyDepositsIndependently = ReadDepositConfigureationParam(contex);

            var patientAllDepositTxns = (from bill in contex.BillingDeposits
                                         where bill.PatientId == patientId && bill.IsActive == true
                                         && ((usePharmacyDepositsIndependently && bill.ModuleName == "Billing") || (!usePharmacyDepositsIndependently && bill.ModuleName == bill.ModuleName))
                                         group bill by new { bill.PatientId, bill.TransactionType } into p
                                         select new
                                         {
                                             TransactionType = p.Key.TransactionType,
                                             SumInAmount = p.Sum(a => a.InAmount),
                                             SumOutAmount = p.Sum(a => a.OutAmount)
                                         }).ToList();
            decimal totalDepositAmt, totalDepositDeductAmt, totalDepositReturnAmt, currentDepositBalance;
            currentDepositBalance = totalDepositAmt = totalDepositDeductAmt = totalDepositReturnAmt = 0;

            if (patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "deposit").FirstOrDefault() != null)
            {
                totalDepositAmt = patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "deposit").FirstOrDefault().SumInAmount;
            }
            if (patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "depositdeduct").FirstOrDefault() != null)
            {
                totalDepositDeductAmt = patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "depositdeduct").FirstOrDefault().SumOutAmount;
            }
            if (patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "returndeposit").FirstOrDefault() != null)
            {
                totalDepositReturnAmt = patientAllDepositTxns.Where(bil => bil.TransactionType.ToLower() == "returndeposit").FirstOrDefault().SumOutAmount;
            }
            currentDepositBalance = totalDepositAmt - totalDepositDeductAmt - totalDepositReturnAmt;

            depositUsed = depositUsed == null ? 0 : depositUsed;
            return (decimal)depositUsed <= currentDepositBalance ? true : false;
        }

        #region Method to post bill transaction..
        private static void ProceedToPostBillTransaction(DischargeDbContext dischargeDbContext, BillingTransactionModel billTransaction, RbacUser currentUser, DateTime currentDate, int DischargeStatementId, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking, string connString)
        {
            try
            {

                billTransaction = PostBillingTransaction(dischargeDbContext, billTransaction, currentUser, currentDate, DischargeStatementId, connString);

                //step:3-- if there's deposit balance, then add a return transaction to deposit table. 
                if (billTransaction.DepositReturnAmount > 0 && ((billTransaction.PaymentMode != ENUM_BillPaymentMode.credit) || (billTransaction.IsCoPayment && billTransaction.PaymentMode == ENUM_BillPaymentMode.credit)))
                {
                    var DefaultDepositHead = dischargeDbContext.DepositHeadModels.FirstOrDefault(a => a.IsDefault == true);
                    var DepositHeadId = DefaultDepositHead != null ? DefaultDepositHead.DepositHeadId : 0;
                    BillingDepositModel dep = new BillingDepositModel()
                    {
                        TransactionType = ENUM_DepositTransactionType.ReturnDeposit, // "ReturnDeposit",
                        Remarks = "Deposit Refunded from InvoiceNo. " + billTransaction.InvoiceCode + billTransaction.InvoiceNo,
                        //Amount = billTransaction.DepositReturnAmount,
                        OutAmount = (decimal)billTransaction.DepositReturnAmount,
                        IsActive = true,
                        BillingTransactionId = billTransaction.BillingTransactionId,
                        DepositBalance = 0,
                        FiscalYearId = billTransaction.FiscalYearId,
                        CounterId = billTransaction.CounterId,
                        CreatedBy = billTransaction.CreatedBy,
                        CreatedOn = currentDate,
                        PatientId = billTransaction.PatientId,
                        PatientVisitId = billTransaction.PatientVisitId,
                        PaymentMode = billTransaction.PaymentMode,
                        PaymentDetails = billTransaction.PaymentDetails,
                        ModuleName = ENUM_ModuleNames.Billing,
                        OrganizationOrPatient = ENUM_Deposit_OrganizationOrPatient.Patient,
                        DepositHeadId = DepositHeadId, //! Krishna, 27thApril'23, Need to Change this logic
                        VisitType = ENUM_VisitType.inpatient, // Bibek 18th June '23

                    };
                    if (billTransaction.ReceiptNo == null)
                    {
                        dep.ReceiptNo = GetDepositReceiptNo(dischargeDbContext);
                    }
                    else
                    {
                        dep.ReceiptNo = billTransaction.ReceiptNo;
                    }


                    dischargeDbContext.BillingDeposits.Add(dep);
                    dischargeDbContext.SaveChanges();

                    EmpCashTransactionModel empCashTransaction = new EmpCashTransactionModel();
                    empCashTransaction.TransactionType = ENUM_DepositTransactionType.ReturnDeposit;
                    empCashTransaction.ReferenceNo = dep.DepositId;
                    empCashTransaction.InAmount = 0;
                    empCashTransaction.OutAmount = (double)dep.OutAmount;
                    empCashTransaction.EmployeeId = currentUser.EmployeeId;
                    empCashTransaction.TransactionDate = DateTime.Now;
                    empCashTransaction.CounterID = dep.CounterId;
                    empCashTransaction.PatientId = dep.PatientId;
                    empCashTransaction.ModuleName = ENUM_ModuleNames.Billing;
                    empCashTransaction.PaymentModeSubCategoryId = GetPaymentModeSubCategoryId(dischargeDbContext);
                    AddEmpCashTransaction(dischargeDbContext, empCashTransaction);

                    List<BillingTransactionItemModel> item = dischargeDbContext.BillingTransactionItems.Where(a => a.PatientId == billTransaction.PatientId
                                                                                                            && a.PatientVisitId == billTransaction.PatientVisitId
                                                                                                            && a.BillStatus == "provisional" && a.Quantity == 0).ToList();
                    if (item.Count() > 0)
                    {
                        item.ForEach(itm =>
                        {
                            var txnItem = UpdateTxnItemBillStatus(dischargeDbContext, itm, "adtCancel", currentUser, currentDate, billTransaction.CounterId, null);
                        });
                    }



                    var allPatientBedInfos = dischargeDbContext.PatientBedInfos.Where(a => a.PatientVisitId == billTransaction.PatientVisitId
                                                                                    && a.IsActive == true).OrderByDescending(b => b.PatientBedInfoId)
                                                                                    .Take(2).ToList();

                    if (allPatientBedInfos.Count > 0)
                    {
                        allPatientBedInfos.ForEach(bed =>
                        {
                            var b = dischargeDbContext.Beds.FirstOrDefault(fd => fd.BedId == bed.BedId);
                            if (b != null)
                            {
                                b.OnHold = false;
                                b.HoldedOn = null;
                                dischargeDbContext.Entry(b).State = EntityState.Modified;
                                dischargeDbContext.Entry(b).Property(x => x.OnHold).IsModified = true;
                                dischargeDbContext.Entry(b).Property(x => x.HoldedOn).IsModified = true;
                                dischargeDbContext.SaveChanges();
                            }
                        });
                    }
                }

                if (realTimeRemoteSyncEnabled)
                {
                    if (billTransaction.Patient == null)
                    {
                        PatientModel pat = dischargeDbContext.Patient.Where(p => p.PatientId == billTransaction.PatientId).FirstOrDefault();
                        billTransaction.Patient = pat;
                    }
                    //Sud:23Dec'18--making parallel thread call (asynchronous) to post to IRD. so that it won't stop the normal execution of logic.

                    //Task.Run(() => SyncBillToRemoteServer(billTransaction, "sales", dischargeDbContext));
                    BillingDbContext billingDbContext = new BillingDbContext(connString);
                    Task.Run(() => BillingBL.SyncBillToRemoteServer(billTransaction, "sales", billingDbContext));

                }

                //Send to SSF Server for Real time ClaimBooking.
                var patientSchemes = dischargeDbContext.PatientSchemes.Where(a => a.SchemeId == billTransaction.SchemeId && a.PatientId == billTransaction.PatientId).FirstOrDefault();
                if (patientSchemes != null)
                {
                    //int priceCategoryId = billTransaction.BillingTransactionItems[0].PriceCategoryId;
                    //var priceCategory = dischargeDbContext.PriceCategories.Where(a => a.PriceCategoryId == priceCategoryId).FirstOrDefault();
                    var scheme = dischargeDbContext.BillingSchemes.FirstOrDefault(s => s.SchemeId == patientSchemes.SchemeId);
                    if (scheme != null && scheme.ApiIntegrationName != null && scheme.ApiIntegrationName.ToLower() == "ssf")
                    {
                        Log.Information($"The Real Time SSF Claim Booking is started from IP Billing and is in process to book,Invoice BL{billTransaction.InvoiceNo} with ClaimCode {billTransaction.ClaimCode}");
                        var fiscalYear = dischargeDbContext.BillingFiscalYears.FirstOrDefault(f => f.FiscalYearId == billTransaction.FiscalYearId);
                        var fiscalYearFormatted = fiscalYear != null ? fiscalYear.FiscalYearFormatted : "";
                        //making parallel thread call (asynchronous) to post to SSF Server. so that it won't stop the normal BillingFlow.
                        SSFDbContext ssfDbContext = new SSFDbContext(connString);
                        var billObj = new SSF_ClaimBookingBillDetail_DTO()
                        {
                            InvoiceNoFormatted = $"{fiscalYearFormatted}-BL{billTransaction.InvoiceNo}",
                            TotalAmount = (decimal)billTransaction.TotalAmount,
                            ClaimCode = (long)billTransaction.ClaimCode,
                            VisitType = billTransaction.TransactionType
                        };

                        SSF_ClaimBookingService_DTO claimBooking = SSF_ClaimBookingService_DTO.GetMappedToBookClaim(billObj, patientSchemes);

                        Task.Run(() => BillingBL.SyncToSSFServer(claimBooking, "billing", ssfDbContext, patientSchemes, currentUser, realTimeSSFClaimBooking));
                        Log.Information($"Parallel thread is created from IP Billing to book, ssf Invoice BL{billTransaction.InvoiceNo} with ClaimCode {billTransaction.ClaimCode}");

                    }
                }
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        #endregion

        #region Method to Discharge a patient from billing..
        private static void ProceedToDischargeFromBilling(DischargeDetailVM dischargeDetail, RbacUser currentUser, DateTime currentDate, DischargeDbContext dischargeDbContext)
        {
            try
            {
                AdmissionModel admission = dischargeDbContext.Admissions.Where(adt => adt.PatientVisitId == dischargeDetail.PatientVisitId).FirstOrDefault();

                PatientBedInfo bedInfo = dischargeDbContext.PatientBedInfos
                                                         .Where(bed => bed.PatientVisitId == dischargeDetail.PatientVisitId)
                                                         .OrderByDescending(bed => bed.PatientBedInfoId).FirstOrDefault();

                admission.AdmissionStatus = "discharged";
                admission.DischargeDate = dischargeDetail.DischargeDate;
                admission.BillStatusOnDischarge = dischargeDetail.BillStatus;
                admission.DischargedBy = currentUser.EmployeeId;
                admission.ModifiedBy = currentUser.EmployeeId;
                admission.ModifiedOn = DateTime.Now;
                admission.ProcedureType = dischargeDetail.ProcedureType;
                admission.DiscountSchemeId = dischargeDetail.DiscountSchemeId;
                admission.DischargeRemarks = dischargeDetail.Remarks;

                FreeBed(bedInfo.PatientBedInfoId, dischargeDetail.DischargeDate, admission.AdmissionStatus, dischargeDbContext);

                dischargeDbContext.Entry(admission).Property(a => a.DischargedBy).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.AdmissionStatus).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.DischargeDate).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.BillStatusOnDischarge).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.ModifiedBy).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.ProcedureType).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.DischargeRemarks).IsModified = true;
                dischargeDbContext.Entry(admission).Property(a => a.ModifiedBy).IsModified = true;
                dischargeDbContext.SaveChanges();
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        #endregion

        #region This gets the PaymentModeSubCategoryId of Cash PaymentMode.....
        private static int GetPaymentModeSubCategoryId(DischargeDbContext dischargeDbContext)
        {
            var paymentModeSubCategoryId = 0;
            var paymentModes = dischargeDbContext.PaymentModes.Where(a => a.PaymentSubCategoryName.ToLower() == "cash");
            if (paymentModes != null)
            {
                paymentModeSubCategoryId = paymentModes.Select(a => a.PaymentSubCategoryId).FirstOrDefault();
            }
            return paymentModeSubCategoryId;
        }
        #endregion

        #region This is used to free the occupied bed while discharging...
        private static void FreeBed(int bedInfoId, DateTime? endedOn, string status, DischargeDbContext dischargeDbContext)
        {
            try
            {
                PatientBedInfo bedInfo = dischargeDbContext.PatientBedInfos
                                                         .Where(b => b.PatientBedInfoId == bedInfoId)
                                                         .FirstOrDefault();
                UpdateIsOccupiedStatus(bedInfo.BedId, false, dischargeDbContext);
                //endedOn can get updated from Billing Edit item as well.
                if (bedInfo.EndedOn == null)
                    bedInfo.EndedOn = endedOn;


                if (status == "discharged")
                {
                    bedInfo.OutAction = "discharged";
                }
                else if (status == "transfer")
                {
                    bedInfo.OutAction = "transfer";
                }
                else
                {
                    bedInfo.OutAction = null;
                }

                dischargeDbContext.Entry(bedInfo).State = EntityState.Modified;
                dischargeDbContext.Entry(bedInfo).Property(x => x.CreatedOn).IsModified = false;
                dischargeDbContext.Entry(bedInfo).Property(x => x.StartedOn).IsModified = false;
                dischargeDbContext.Entry(bedInfo).Property(x => x.CreatedBy).IsModified = false;
                dischargeDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
        #endregion

        #region This is used to update the Occupied status of a bed...
        private static void UpdateIsOccupiedStatus(int bedId, bool status, DischargeDbContext dischargeDbContext)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            try
            {
                BedModel selectedBed = dischargeDbContext.Beds
                                                       .Where(b => b.BedId == bedId)
                                                       .FirstOrDefault();
                selectedBed.IsOccupied = status;
                dischargeDbContext.Entry(selectedBed).State = EntityState.Modified;
                dischargeDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        #endregion


        private static int GetFiscalYear(DischargeDbContext dischargeDbContext)
        {
            DateTime currentDate = DateTime.Now.Date;
            var FiscalYear = dischargeDbContext.BillingFiscalYears.Where(fsc => fsc.StartYear <= currentDate && fsc.EndYear >= currentDate).FirstOrDefault();
            int fiscalYearId = 0;
            if (FiscalYear != null)
            {
                fiscalYearId = FiscalYear.FiscalYearId;
            }
            return fiscalYearId;
        }

        private static BillingTransactionModel PostBillingTransaction(DischargeDbContext dischargeDbContext, BillingTransactionModel billingTransaction, RbacUser currentUser, DateTime currentDate, int DischargeStatementId, string connString)
        {
            List<BillingTransactionItemModel> newTxnItems = new List<BillingTransactionItemModel>();
            dischargeDbContext.AuditDisabled = false;
            if (billingTransaction.BillingTransactionItems != null && billingTransaction.BillingTransactionItems.Count > 0)
            {
                foreach (var txnItem in billingTransaction.BillingTransactionItems)
                {

                    BillingTransactionItemModel clonedItem = BillingTransactionItemModel.GetClone(txnItem);
                    clonedItem.BillingTransaction = null;
                    newTxnItems.Add(clonedItem);
                }
                billingTransaction.BillingTransactionItems = null;
            }

            //if paymentmode is credit, paiddate and paidamount should be null
            //handle this in client side as well. 
            billingTransaction.CreatedBy = currentUser.EmployeeId;
            if (billingTransaction.PatientVisitId == null)
            {
                billingTransaction.PatientVisitId = newTxnItems[0].PatientVisitId;
            }
            if (billingTransaction.BillStatus == ENUM_BillingStatus.unpaid)// "unpaid")
            {
                billingTransaction.PaidDate = null;
                billingTransaction.PaidAmount = 0;
                billingTransaction.PaymentReceivedBy = null;
                billingTransaction.PaidCounterId = null;

            }
            else if (billingTransaction.BillStatus == ENUM_BillingStatus.paid)// "paid")
            {
                billingTransaction.PaidDate = currentDate;
                billingTransaction.PaidCounterId = billingTransaction.CounterId;
                billingTransaction.PaymentReceivedBy = billingTransaction.CreatedBy;
            }

            BillingFiscalYear fiscalYear = GetFiscalYearObject(dischargeDbContext);

            billingTransaction.CreatedOn = currentDate;
            billingTransaction.CreatedBy = currentUser.EmployeeId;
            billingTransaction.FiscalYearId = fiscalYear.FiscalYearId;
            billingTransaction.InvoiceCode = billingTransaction.IsInsuranceBilling == true ? "INS" : BillingBL.InvoiceCode;


            dischargeDbContext.BillingTransactions.Add(billingTransaction);

            dischargeDbContext.AddAuditCustomField("ChangedByUserId", currentUser.EmployeeId);
            dischargeDbContext.AddAuditCustomField("ChangedByUserName", currentUser.UserName);

            GenerateInvoiceNoAndSaveInvoice(billingTransaction, dischargeDbContext); //To avoid the duplicate the invoiceNo..

            dischargeDbContext.AuditDisabled = true;

            //This will map PatientVisitId to the Provisional Items of inpatient only
            #region This will map PatientVisitId to the Provisional Items of inpatient 
            for (int i = 0; i < newTxnItems.Count; i++)
            {
                if (newTxnItems[i].BillStatus == ENUM_BillingStatus.provisional && billingTransaction.TransactionType == ENUM_BillingType.inpatient)
                {
                    newTxnItems[i].PatientVisitId = billingTransaction.PatientVisitId;
                }
            }
            #endregion

            PostUpdateBillingTransactionItems(dischargeDbContext,
                   newTxnItems,
                   currentUser, currentDate,
                   billingTransaction.BillStatus,
                   billingTransaction.CounterId,
                   DischargeStatementId,
                   billingTransaction.BillingTransactionId
                   );

            dischargeDbContext.SaveChanges();



            if (billingTransaction.BillStatus == ENUM_BillingStatus.paid || billingTransaction.IsCoPayment == true)
            { //If transaction is done with Depositor paymentmode is credit we don't have to add in EmpCashTransaction table
                List<EmpCashTransactionModel> empCashTransaction = new List<EmpCashTransactionModel>();
                for (int i = 0; i < billingTransaction.EmployeeCashTransaction.Count; i++)
                {
                    EmpCashTransactionModel empCashTransactionModel = new EmpCashTransactionModel();
                    empCashTransactionModel.TransactionType = "CashSales";
                    empCashTransactionModel.ReferenceNo = billingTransaction.BillingTransactionId;
                    empCashTransactionModel.InAmount = billingTransaction.EmployeeCashTransaction[i].InAmount;
                    empCashTransactionModel.OutAmount = 0;
                    empCashTransactionModel.EmployeeId = currentUser.EmployeeId;
                    empCashTransactionModel.TransactionDate = DateTime.Now;
                    empCashTransactionModel.CounterID = billingTransaction.CounterId;
                    empCashTransactionModel.PaymentModeSubCategoryId = billingTransaction.EmployeeCashTransaction[i].PaymentModeSubCategoryId;
                    empCashTransactionModel.PatientId = billingTransaction.PatientId;
                    empCashTransactionModel.ModuleName = billingTransaction.EmployeeCashTransaction[i].ModuleName;
                    empCashTransactionModel.Remarks = billingTransaction.EmployeeCashTransaction[i].Remarks;
                    empCashTransaction.Add(empCashTransactionModel);
                }

                AddEmpCashtransactionForBilling(dischargeDbContext, empCashTransaction);
            }

            //step:3-- if there's deposit deduction, then add to deposit table. 
            if ((billingTransaction.IsCoPayment == true &&
                billingTransaction.PaymentMode.ToLower() == ENUM_BillPaymentMode.credit.ToLower() &&  //case of Copayment
                billingTransaction.DepositUsed != null && billingTransaction.DepositUsed > 0) ||
                (billingTransaction.PaymentMode != ENUM_BillPaymentMode.credit // "credit" 
                && billingTransaction.DepositUsed != null && billingTransaction.DepositUsed > 0))
            {
                decimal depBalance = 0;
                if (billingTransaction.InvoiceType == ENUM_InvoiceType.inpatientDischarge)
                {
                    //in case of discharge bill, we clear all remaining deposits of a patient.
                    //but from client side, we're already making deposit balance=0.
                    //so only for DepositTable, we have to re-calcaultate the balance amount again.
                    depBalance = (decimal)billingTransaction.DepositReturnAmount;
                }
                else
                {
                    depBalance = (decimal)billingTransaction.DepositBalance;
                }

                //get Default Deposit Head
                var DefaultDepositHead = dischargeDbContext.DepositHeadModels.FirstOrDefault(a => a.IsDefault == true);
                var DepositHeadId = DefaultDepositHead != null ? DefaultDepositHead.DepositHeadId : 0;
                BillingDepositModel dep = new BillingDepositModel()
                {
                    TransactionType = ENUM_DepositTransactionType.DepositDeduct, //"depositdeduct",
                    Remarks = "Deposit used in InvoiceNo. " + billingTransaction.InvoiceCode + billingTransaction.InvoiceNo,
                    IsActive = true,
                    //Amount = billingTransaction.DepositUsed,
                    OutAmount = (decimal)billingTransaction.DepositUsed,
                    BillingTransactionId = billingTransaction.BillingTransactionId,
                    DepositBalance = depBalance,
                    FiscalYearId = billingTransaction.FiscalYearId,
                    CounterId = billingTransaction.CounterId,
                    CreatedBy = billingTransaction.CreatedBy,
                    CreatedOn = currentDate,
                    PatientId = billingTransaction.PatientId,
                    PatientVisitId = billingTransaction.PatientVisitId,
                    PaymentMode = billingTransaction.PaymentMode,
                    PaymentDetails = billingTransaction.PaymentDetails,
                    ReceiptNo = GetDepositReceiptNo(dischargeDbContext),
                    ModuleName = ENUM_ModuleNames.Billing,
                    OrganizationOrPatient = ENUM_Deposit_OrganizationOrPatient.Patient,
                    DepositHeadId = DepositHeadId,
                    VisitType = ENUM_VisitType.inpatient
                };
                billingTransaction.ReceiptNo = dep.ReceiptNo + 1;
                dischargeDbContext.BillingDeposits.Add(dep);
                dischargeDbContext.SaveChanges();

                MasterDbContext masterDbContext = new MasterDbContext(connString);
                PaymentModes MstPaymentModes = masterDbContext.PaymentModes.Where(a => a.PaymentSubCategoryName.ToLower() == "deposit").FirstOrDefault();
                EmpCashTransactionModel empCashTransaction = new EmpCashTransactionModel();
                empCashTransaction.TransactionType = ENUM_DepositTransactionType.DepositDeduct;
                empCashTransaction.ReferenceNo = dep.DepositId;
                empCashTransaction.InAmount = 0;
                empCashTransaction.OutAmount = (double)dep.OutAmount;
                empCashTransaction.EmployeeId = currentUser.EmployeeId;
                empCashTransaction.TransactionDate = DateTime.Now;
                empCashTransaction.CounterID = dep.CounterId;
                empCashTransaction.ModuleName = "Billing";
                empCashTransaction.PatientId = dep.PatientId;
                empCashTransaction.PaymentModeSubCategoryId = MstPaymentModes.PaymentSubCategoryId;

                AddEmpCashTransaction(dischargeDbContext, empCashTransaction);
            }
            billingTransaction.FiscalYear = fiscalYear.FiscalYearFormatted;

            //create BillingTxnCreditBillStatus when IsCoPayment is true, Krishna,23,Aug'22

            if (billingTransaction.PaymentMode == ENUM_BillPaymentMode.credit)
            {
                BillingTransactionCreditBillStatusModel billingTransactionCreditBillStatus = new BillingTransactionCreditBillStatusModel();

                billingTransactionCreditBillStatus.BillingTransactionId = billingTransaction.BillingTransactionId;
                billingTransactionCreditBillStatus.FiscalYearId = billingTransaction.FiscalYearId;
                billingTransactionCreditBillStatus.InvoiceNoFormatted = $"{billingTransaction.FiscalYear}-{billingTransaction.InvoiceCode}{billingTransaction.InvoiceNo}";
                billingTransactionCreditBillStatus.InvoiceDate = (DateTime)billingTransaction.CreatedOn;
                billingTransactionCreditBillStatus.PatientVisitId = (int)billingTransaction.PatientVisitId;
                billingTransactionCreditBillStatus.SchemeId = billingTransaction.SchemeId;
                billingTransactionCreditBillStatus.LiableParty = billingTransaction.OrganizationId is null ? "SELF" : "Organization";
                billingTransactionCreditBillStatus.PatientId = billingTransaction.PatientId;
                billingTransactionCreditBillStatus.CreditOrganizationId = (int)billingTransaction.OrganizationId;
                billingTransactionCreditBillStatus.MemberNo = billingTransaction.MemberNo;
                billingTransactionCreditBillStatus.SalesTotalBillAmount = (decimal)billingTransaction.TotalAmount;
                billingTransactionCreditBillStatus.SettlementStatus = ENUM_ClaimManagement_SettlementStatus.Pending;
                billingTransactionCreditBillStatus.ReturnTotalBillAmount = 0; //This will come if bill is returned
                billingTransactionCreditBillStatus.CoPayReceivedAmount = billingTransaction.ReceivedAmount;
                billingTransactionCreditBillStatus.CoPayReturnAmount = 0;
                billingTransactionCreditBillStatus.NetReceivableAmount = billingTransactionCreditBillStatus.SalesTotalBillAmount - billingTransactionCreditBillStatus.CoPayReceivedAmount - (billingTransactionCreditBillStatus.ReturnTotalBillAmount - billingTransactionCreditBillStatus.CoPayReturnAmount);
                billingTransactionCreditBillStatus.CreatedBy = currentUser.EmployeeId;
                billingTransactionCreditBillStatus.NonClaimableAmount = 0;
                billingTransactionCreditBillStatus.IsClaimable = true;
                billingTransactionCreditBillStatus.ClaimCode = billingTransaction.ClaimCode;
                billingTransactionCreditBillStatus.CreatedOn = currentDate;
                billingTransactionCreditBillStatus.IsActive = true;

                dischargeDbContext.BillingTransactionCreditBillStatuses.Add(billingTransactionCreditBillStatus);
                dischargeDbContext.SaveChanges();
            }

            //update PatientPriceCategoryMap table to update CreditLimits according to Visit Types ('inpatient', 'outpatient')
            var patientVisit = dischargeDbContext.Visit.Where(a => a.PatientVisitId == billingTransaction.PatientVisitId).FirstOrDefault();

            //Krishna, 8th-Jan'23 Below logic is responsible to update the MedicareMemberBalance When Medicare Patient Billing is done.
            BillingSchemeModel scheme = new BillingSchemeModel();

            if (patientVisit != null)
            {
                scheme = dischargeDbContext.BillingSchemes.FirstOrDefault(a => a.SchemeId == patientVisit.SchemeId);
            }
            if (scheme != null && (scheme.IsGeneralCreditLimited || scheme.IsOpCreditLimited || scheme.IsIpCreditLimited))
            {
                UpdatePatientSchemeMap(billingTransaction, patientVisit, dischargeDbContext, currentDate, currentUser, scheme);
            }
            //UpdatePatientMapPriceCategoryForMedicarePatientBilling(billingTransaction, patientVisit, dbContext, currentDate, currentUser);

            if (scheme != null && scheme.ApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.Medicare)
            {
                UpdateMedicareMemberBalance(billingTransaction, patientVisit, dischargeDbContext, currentDate, currentUser);
            }

            return billingTransaction;
        }

        private static void UpdatePatientSchemeMap(BillingTransactionModel billingTransaction, VisitModel patientVisit, DischargeDbContext dbContext, DateTime currentDate, RbacUser currentUser, BillingSchemeModel scheme)
        {
            PatientSchemeMapModel patientSchemeMap = new PatientSchemeMapModel();
            patientSchemeMap = dbContext.PatientSchemes.Where(a => a.PatientId == billingTransaction.PatientId && a.SchemeId == patientVisit.SchemeId).FirstOrDefault();

            if (scheme.IsGeneralCreditLimited && patientSchemeMap.GeneralCreditLimit > 0)
            {
                if ((decimal)billingTransaction.TotalAmount <= patientSchemeMap.GeneralCreditLimit)
                {
                    if (billingTransaction.IsCoPayment == true)
                    {
                        Boolean isTotalAmountSubtracted = dbContext.CFGParameters.Where(ap => ap.ParameterGroupName == "Insurance" && ap.ParameterName == "SubtractTotalAmountFromGeneralCreditLimitForCoPayment").Select(param => param.ParameterValue == "true" ? true : false).FirstOrDefault();
                                           
                        if (isTotalAmountSubtracted == true)
                        {
                            patientSchemeMap.GeneralCreditLimit = patientSchemeMap.GeneralCreditLimit - (decimal)billingTransaction.TotalAmount;
                        }
                        else
                        {
                            patientSchemeMap.GeneralCreditLimit = patientSchemeMap.GeneralCreditLimit - (decimal)billingTransaction.CoPaymentCreditAmount;
                        }
                    }
                    else
                    {
                        patientSchemeMap.GeneralCreditLimit = patientSchemeMap.GeneralCreditLimit - (decimal)billingTransaction.TotalAmount;

                    }
                    patientSchemeMap.ModifiedOn = currentDate;
                    patientSchemeMap.ModifiedBy = currentUser.EmployeeId;

                    dbContext.Entry(patientSchemeMap).Property(p => p.GeneralCreditLimit).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedOn).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedBy).IsModified = true;
                    dbContext.SaveChanges();
                }
                else
                {
                    throw new Exception("General Credit Limit is less than total bill amount");
                }
            }

            if (scheme.IsOpCreditLimited && (patientVisit != null && patientVisit.VisitType.ToLower() == ENUM_VisitType.outpatient.ToLower()))
            {

                if (patientSchemeMap != null && patientSchemeMap.OpCreditLimit > 0)
                {
                    patientSchemeMap.OpCreditLimit = patientSchemeMap.OpCreditLimit - (decimal)billingTransaction.TotalAmount;
                    patientSchemeMap.ModifiedOn = currentDate;
                    patientSchemeMap.ModifiedBy = currentUser.EmployeeId;

                    dbContext.Entry(patientSchemeMap).Property(p => p.OpCreditLimit).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedOn).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedBy).IsModified = true;
                    dbContext.SaveChanges();
                }
                else
                {
                    throw new Exception("OP Credit Limit is less than total bill amount");
                }
            }

            if (scheme.IsIpCreditLimited && (patientVisit != null && patientVisit.VisitType.ToLower() == ENUM_VisitType.inpatient.ToLower() && scheme.ApiIntegrationName != ENUM_Scheme_ApiIntegrationNames.SSF))
            {
                if (patientSchemeMap != null && patientSchemeMap.IpCreditLimit > 0)
                {
                    patientSchemeMap.IpCreditLimit = patientSchemeMap.IpCreditLimit - (decimal)billingTransaction.TotalAmount;
                    patientSchemeMap.ModifiedOn = currentDate;
                    patientSchemeMap.ModifiedBy = currentUser.EmployeeId;

                    dbContext.Entry(patientSchemeMap).Property(p => p.IpCreditLimit).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedOn).IsModified = true;
                    dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedBy).IsModified = true;
                    dbContext.SaveChanges();
                }
                else
                {
                    throw new Exception("IP Credit Limit is less than total bill amount");
                }
            }

            //Below block is for inpatient i.e. either IPCreditlimit only is used or both IP and OP Credit limits are used.
            if (scheme.IsIpCreditLimited && (patientVisit != null && patientVisit.VisitType.ToLower() == ENUM_VisitType.inpatient.ToLower() && scheme.ApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.SSF))
            {
                //Here when TotalBillAmount is less than the sum of (IPCreditLimit and OPCreditLimit) then only update Credit limits or allow to use Credit limits
                decimal TotalBillAmount = (decimal)billingTransaction.TotalAmount;
                if (patientSchemeMap != null && (TotalBillAmount <= (patientSchemeMap.IpCreditLimit + patientSchemeMap.OpCreditLimit)))
                {
                    //This checks which credit limit to use (if TotalBillAmount is less than IpCreditLimit itself use IpCreditLimit only and update its value as well)
                    if (TotalBillAmount <= patientSchemeMap.IpCreditLimit)
                    {
                        patientSchemeMap.IpCreditLimit = patientSchemeMap.IpCreditLimit - TotalBillAmount;
                        patientSchemeMap.ModifiedOn = currentDate;
                        patientSchemeMap.ModifiedBy = currentUser.EmployeeId;

                        dbContext.Entry(patientSchemeMap).Property(p => p.IpCreditLimit).IsModified = true;
                        dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedOn).IsModified = true;
                        dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedBy).IsModified = true;
                        dbContext.SaveChanges();
                    }
                    //(if TotalBillAmount is more than IpCreditLimit and there is OPCreditlimit remaining then use both and update there value as well)
                    else if (TotalBillAmount > patientSchemeMap.IpCreditLimit && patientSchemeMap.OpCreditLimit > 0)
                    {
                        TotalBillAmount = TotalBillAmount - patientSchemeMap.IpCreditLimit;
                        patientSchemeMap.IpCreditLimit = 0;
                        patientSchemeMap.OpCreditLimit = (decimal)(patientSchemeMap.OpCreditLimit - TotalBillAmount);
                        patientSchemeMap.ModifiedOn = currentDate;
                        patientSchemeMap.ModifiedBy = currentUser.EmployeeId;

                        dbContext.Entry(patientSchemeMap).Property(p => p.IpCreditLimit).IsModified = true;
                        dbContext.Entry(patientSchemeMap).Property(p => p.OpCreditLimit).IsModified = true;
                        dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedOn).IsModified = true;
                        dbContext.Entry(patientSchemeMap).Property(p => p.ModifiedBy).IsModified = true;
                        dbContext.SaveChanges();
                    }
                }
                else
                {
                    throw new Exception("Credit Limit is less than total bill amount");
                }
            }
        }

        #region Update PatientMapPriceCategory For Medicare Patient Billing only
        private static void UpdatePatientMapPriceCategoryForMedicarePatientBilling(BillingTransactionModel billingTransaction, VisitModel patientVisit, DischargeDbContext dbContext, DateTime currentDate, RbacUser currentUser)
        {
            if (billingTransaction.CoPaymentCreditAmount > 0 && (patientVisit != null && patientVisit.VisitType.ToLower() == ENUM_VisitType.outpatient.ToLower()))
            {
                PatientSchemeMapModel patientMapPriceCategory = new PatientSchemeMapModel();
                patientMapPriceCategory = dbContext.PatientSchemes.Where(a => a.PatientSchemeId == billingTransaction.PatientMapPriceCategoryId).FirstOrDefault();
                if (patientMapPriceCategory != null && patientMapPriceCategory.OpCreditLimit > 0)
                {
                    patientMapPriceCategory.OpCreditLimit = patientMapPriceCategory.OpCreditLimit - (decimal)billingTransaction.CoPaymentCreditAmount;
                    patientMapPriceCategory.ModifiedOn = currentDate;
                    patientMapPriceCategory.ModifiedBy = currentUser.EmployeeId;

                    dbContext.Entry(patientMapPriceCategory).Property(p => p.OpCreditLimit).IsModified = true;
                    dbContext.Entry(patientMapPriceCategory).Property(p => p.ModifiedOn).IsModified = true;
                    dbContext.Entry(patientMapPriceCategory).Property(p => p.ModifiedBy).IsModified = true;
                    dbContext.SaveChanges();
                }
            }

            if (billingTransaction.CoPaymentCreditAmount > 0 && (patientVisit != null && patientVisit.VisitType.ToLower() == ENUM_VisitType.inpatient.ToLower()))
            {
                PatientSchemeMapModel patientMapPriceCategory = new PatientSchemeMapModel();
                patientMapPriceCategory = dbContext.PatientSchemes.Where(a => a.PatientSchemeId == billingTransaction.PatientMapPriceCategoryId).FirstOrDefault();
                if (patientMapPriceCategory != null && patientMapPriceCategory.IpCreditLimit > 0)
                {
                    patientMapPriceCategory.IpCreditLimit = patientMapPriceCategory.IpCreditLimit - (decimal)billingTransaction.CoPaymentCreditAmount;
                    patientMapPriceCategory.ModifiedOn = currentDate;
                    patientMapPriceCategory.ModifiedBy = currentUser.EmployeeId;

                    dbContext.Entry(patientMapPriceCategory).Property(p => p.IpCreditLimit).IsModified = true;
                    dbContext.Entry(patientMapPriceCategory).Property(p => p.ModifiedOn).IsModified = true;
                    dbContext.Entry(patientMapPriceCategory).Property(p => p.ModifiedBy).IsModified = true;
                    dbContext.SaveChanges();
                }
            }
        }
        #endregion

        #region Update Medicare Member Balance
        private static void UpdateMedicareMemberBalance(BillingTransactionModel billingTransaction, VisitModel patientVisit, DischargeDbContext dbContext, DateTime currentDate, RbacUser currentUser)
        {
            MedicareMemberBalance medicareMemberBalance = new MedicareMemberBalance();
            var medicareMember = dbContext.MedicareMembers.FirstOrDefault(a => a.PatientId == billingTransaction.PatientId);
            if (medicareMember != null && medicareMember.IsDependent == false)
            {
                medicareMemberBalance = dbContext.MedicareMemberBalances.FirstOrDefault(a => a.MedicareMemberId == medicareMember.MedicareMemberId);
            }
            if (medicareMember != null && medicareMember.IsDependent == true)
            {
                medicareMemberBalance = dbContext.MedicareMemberBalances.FirstOrDefault(a => a.MedicareMemberId == medicareMember.ParentMedicareMemberId);
            }
            if (patientVisit != null)
            {
                if (patientVisit.VisitType.ToLower() == ENUM_VisitType.outpatient.ToLower())
                {
                    if (medicareMemberBalance.OpBalance >= (decimal)billingTransaction.TotalAmount)
                    {
                        medicareMemberBalance.OpBalance = (medicareMemberBalance.OpBalance - (decimal)billingTransaction.TotalAmount);
                        medicareMemberBalance.OpUsedAmount = (medicareMemberBalance.OpUsedAmount + (decimal)billingTransaction.TotalAmount);
                        medicareMemberBalance.ModifiedOn = currentDate;
                        medicareMemberBalance.ModifiedBy = currentUser.EmployeeId;

                        dbContext.Entry(medicareMemberBalance).Property(p => p.OpBalance).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.OpUsedAmount).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.ModifiedOn).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.ModifiedBy).IsModified = true;

                        dbContext.SaveChanges();
                    }
                    else
                    {
                        throw new Exception("Op Balance for Medicare Member is less than Total Bill Amount");
                    }
                }
                if (patientVisit.VisitType.ToLower() == ENUM_VisitType.inpatient.ToLower())
                {
                    if (medicareMemberBalance.IpBalance >= (decimal)billingTransaction.TotalAmount)
                    {
                        medicareMemberBalance.IpBalance = (medicareMemberBalance.IpBalance - (decimal)billingTransaction.TotalAmount);
                        medicareMemberBalance.IpUsedAmount = (medicareMemberBalance.IpUsedAmount + (decimal)billingTransaction.TotalAmount);
                        medicareMemberBalance.ModifiedOn = currentDate;
                        medicareMemberBalance.ModifiedBy = currentUser.EmployeeId;

                        dbContext.Entry(medicareMemberBalance).Property(p => p.IpBalance).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.IpUsedAmount).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.ModifiedOn).IsModified = true;
                        dbContext.Entry(medicareMemberBalance).Property(p => p.ModifiedBy).IsModified = true;

                        dbContext.SaveChanges();
                    }
                    else
                    {
                        throw new Exception("Ip Balance for Medicare Member is less than Total Bill Amount");
                    }
                }
            }

        }
        #endregion

        private static void GenerateInvoiceNoAndSaveInvoice(BillingTransactionModel billingTransaction, DischargeDbContext dbContext)
        {
            try
            {
                billingTransaction.InvoiceNo = GetInvoiceNumber(dbContext);
                //if(invoiceNoTest == 1) { billingTransaction.InvoiceNo = 258017; invoiceNoTest++; }//logic to test the duplicate invoice no and retry to get the latest invoiceNo
                dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                if (ex is DbUpdateException dbUpdateEx)
                {
                    if (dbUpdateEx.InnerException?.InnerException is SqlException sqlException)
                    {

                        if (sqlException.Number == 2627)// unique constraint error in BillingTranscation table..
                        {
                            GenerateInvoiceNoAndSaveInvoice(billingTransaction, dbContext);
                        }
                        else
                        {
                            throw;
                        }
                    }
                    else throw;
                }
                else throw;

            }
        }
        private static int GetInvoiceNumber(DischargeDbContext dischargeDbContext)
        {
            int fiscalYearId = GetFiscalYear(dischargeDbContext);
            int invoiceNumber = (from txn in dischargeDbContext.BillingTransactions
                                 where txn.FiscalYearId == fiscalYearId
                                 select txn.InvoiceNo).DefaultIfEmpty(0).Max();

            return invoiceNumber + 1;
        }

        //post to BIL_TXN_BillingTransactionItems
        private static List<BillingTransactionItemModel> PostUpdateBillingTransactionItems(DischargeDbContext dbContext,
            List<BillingTransactionItemModel> billingTransactionItems,
            RbacUser currentUser,
            DateTime currentDate,
            string billStatus,
            int counterId,
            int DischargeStatementId,
             int? billingTransactionId = null
             )
        {

            BillingFiscalYear fiscYear = GetFiscalYearObject(dbContext);

            var srvDepts = dbContext.ServiceDepartment.ToList();
            //var empList = masterDbContext.Employees.ToList();
            if (billingTransactionItems != null && billingTransactionItems.Count > 0)
            {
                // we are using this only for Provisional billing hence we can use first element to check billing status..
                int? ProvisionalReceiptNo = null;
                if (billingTransactionItems[0].BillStatus == ENUM_BillingStatus.provisional)
                {
                    ProvisionalReceiptNo = GetProvisionalReceiptNo(dbContext);
                }
                for (int i = 0; i < billingTransactionItems.Count; i++)
                {
                    var txnItem = billingTransactionItems[i];
                    if (txnItem.BillingTransactionItemId == 0)
                    {
                        //if (string.IsNullOrEmpty(txnItem.LabTypeName))
                        //{
                        //    txnItem.LabTypeName = "op-lab";
                        //}
                        txnItem.CreatedOn = currentDate;
                        txnItem.CreatedBy = currentUser.EmployeeId;
                        txnItem.RequisitionDate = currentDate;
                        txnItem.CounterId = counterId;
                        txnItem.BillingTransactionId = billingTransactionId;
                        if (txnItem.BillStatus == ENUM_BillingStatus.provisional) // "provisional")
                        {
                            txnItem.ProvisionalReceiptNo = ProvisionalReceiptNo;
                            txnItem.ProvisionalFiscalYearId = fiscYear.FiscalYearId;
                            txnItem.ProvFiscalYear = fiscYear.FiscalYearFormatted; //not mapped
                        }

                        //assign providername and servicedepartmentname to each of the incoming transaction items.
                        //Needs Revision: 12-12-17: sud: I think we don't need to get providername since that property already comes from client side: 
                        //txnItem.ProviderName = (from a in empList where a.EmployeeId == txnItem.ProviderId select a.FullName).FirstOrDefault();
                        txnItem.ServiceDepartmentName = (from b in srvDepts where b.ServiceDepartmentId == txnItem.ServiceDepartmentId select b.ServiceDepartmentName).FirstOrDefault();

                        txnItem = GetBillStatusMapped(txnItem, billStatus, currentDate, currentUser.EmployeeId, counterId);
                        //UpdateRequisitionItemsBillStatus(dbContext, txnItem.ServiceDepartmentName, billStatus, currentUser, txnItem.RequisitionId, currentDate);
                        dbContext.BillingTransactionItems.Add(txnItem);
                    }
                    else
                    {
                        txnItem = UpdateTxnItemBillStatus(dbContext, txnItem, billStatus, currentUser, currentDate, counterId, billingTransactionId, DischargeStatementId);
                    }


                    //update the Requisitions billingstatus as 'paid' for above items. 
                    //List<Int32?> requisitionIds = (from a in billTranItems select a.BillItemRequisitionId).ToList();
                    BillItemRequisition billItemRequisition = (from bill in dbContext.BillItemRequisitions
                                                               where bill.RequisitionId == txnItem.RequisitionId
                                                               && bill.ServiceDepartmentId == txnItem.ServiceDepartmentId
                                                               select bill).FirstOrDefault();
                    if (billItemRequisition != null)
                    {
                        billItemRequisition.BillStatus = "paid";
                        dbContext.Entry(billItemRequisition).State = System.Data.Entity.EntityState.Modified;
                    }
                }
                dbContext.SaveChanges();
            }
            else
            {
                throw new Exception("BillingTranscation Items is null");
            }
            return billingTransactionItems;
        }

        private static BillingTransactionItemModel GetBillStatusMapped(BillingTransactionItemModel billItem,
    string billStatus,
    DateTime? currentDate,
    int userId,
    int? counterId)
        {
            if (billStatus == ENUM_BillingStatus.paid) //"paid")
            {
                billItem.PaidDate = currentDate;
                billItem.BillStatus = ENUM_BillingStatus.paid;// "paid";
                billItem.PaymentReceivedBy = userId;
                billItem.PaidCounterId = counterId;

            }
            else if (billStatus == ENUM_BillingStatus.unpaid)// "unpaid")
            {
                billItem.PaidDate = null;
                billItem.BillStatus = ENUM_BillingStatus.unpaid;// "unpaid";
                billItem.PaidCounterId = null;
                billItem.PaymentReceivedBy = null;

            }
            else if (billStatus == ENUM_BillingStatus.cancel)// "cancel")
            {
                billItem.CancelledBy = userId;
                billItem.BillStatus = ENUM_BillingStatus.cancel;// "cancel";
                billItem.CancelledOn = currentDate;
            }
            else if (billStatus == ENUM_BillingStatus.returned)//"returned")
            {
                billItem.ReturnStatus = true;
                billItem.ReturnQuantity = billItem.Quantity;//all items will be returned            
            }
            else if (billStatus == "adtCancel") // if admission cancelled
            {
                billItem.CancelledBy = userId;
                billItem.BillStatus = "adtCancel";
                billItem.CancelledOn = currentDate;
            }
            return billItem;
        }
        //updates billStatus in respective tables.
        private static void UpdateRequisitionItemsBillStatus(DischargeDbContext dischargeDbContext,
            string serviceDepartmentName,
            string billStatus, //provisional,paid,unpaid,returned
            RbacUser currentUser,
            int billingTransactionItemId,
            DateTime? modifiedDate,
            int? patientVisitId)
        {

            string integrationName = dischargeDbContext.ServiceDepartment
             .Where(a => a.ServiceDepartmentName == serviceDepartmentName)
             .Select(a => a.IntegrationName).FirstOrDefault();

            if (integrationName != null)
            {
                //update return status in lab 
                if (integrationName.ToLower() == "lab")
                {
                    var labItem = dischargeDbContext.LabRequisitions.Where(req => req.BillingTransactionItemId == billingTransactionItemId).FirstOrDefault();
                    if (labItem != null)
                    {
                        labItem.BillingStatus = billStatus;
                        labItem.ModifiedOn = modifiedDate;
                        labItem.ModifiedBy = currentUser.EmployeeId;
                        dischargeDbContext.Entry(labItem).Property(a => a.BillingStatus).IsModified = true;
                        dischargeDbContext.Entry(labItem).Property(a => a.ModifiedOn).IsModified = true;
                        dischargeDbContext.Entry(labItem).Property(a => a.ModifiedBy).IsModified = true;
                    }

                }
                //update return status for Radiology
                else if (integrationName.ToLower() == "radiology")
                {
                    var radioItem = dischargeDbContext.RadiologyImagingRequisitions.Where(req => req.BillingTransactionItemId == billingTransactionItemId).FirstOrDefault();
                    if (radioItem != null)
                    {
                        radioItem.BillingStatus = billStatus;
                        radioItem.ModifiedOn = modifiedDate;
                        radioItem.ModifiedBy = currentUser.EmployeeId;
                        dischargeDbContext.Entry(radioItem).Property(a => a.BillingStatus).IsModified = true;
                        dischargeDbContext.Entry(radioItem).Property(a => a.ModifiedOn).IsModified = true;
                        dischargeDbContext.Entry(radioItem).Property(a => a.ModifiedBy).IsModified = true;
                    }

                }
                //update return status for Visit
                else if (integrationName.ToLower() == "opd" || integrationName.ToLower() == "er")
                {
                    var visitItem = dischargeDbContext.Visit.Where(vis => vis.PatientVisitId == patientVisitId).FirstOrDefault();
                    if (visitItem != null)
                    {
                        visitItem.BillingStatus = billStatus;
                        visitItem.ModifiedOn = modifiedDate;
                        visitItem.ModifiedBy = currentUser.EmployeeId;
                        dischargeDbContext.Entry(visitItem).Property(a => a.BillingStatus).IsModified = true;
                        dischargeDbContext.Entry(visitItem).Property(a => a.ModifiedOn).IsModified = true;
                        dischargeDbContext.Entry(visitItem).Property(a => a.ModifiedBy).IsModified = true;
                    }
                }

                dischargeDbContext.AddAuditCustomField("ChangedByUserId", currentUser.EmployeeId);
                dischargeDbContext.AddAuditCustomField("ChangedByUserName", currentUser.UserName);

                dischargeDbContext.SaveChanges();
            }


        }


        private static void AddEmpCashtransactionForBilling(DischargeDbContext dbContext, List<EmpCashTransactionModel> empCashTransaction) //This is for testing need to merge this into above function....
        {
            try
            {
                for (int i = 0; i < empCashTransaction.Count; i++)
                {
                    EmpCashTransactionModel empCashTxn = new EmpCashTransactionModel();
                    empCashTxn.TransactionType = empCashTransaction[i].TransactionType;
                    empCashTxn.ReferenceNo = empCashTransaction[i].ReferenceNo;
                    empCashTxn.EmployeeId = empCashTransaction[i].EmployeeId;
                    empCashTxn.InAmount = empCashTransaction[i].InAmount;
                    empCashTxn.OutAmount = empCashTransaction[i].OutAmount;
                    empCashTxn.Description = empCashTransaction[i].Description;
                    empCashTxn.TransactionDate = empCashTransaction[i].TransactionDate;
                    empCashTxn.CounterID = empCashTransaction[i].CounterID;
                    empCashTxn.IsActive = true;
                    empCashTxn.ModuleName = empCashTransaction[i].ModuleName;
                    empCashTxn.PatientId = empCashTransaction[i].PatientId;
                    empCashTxn.PaymentModeSubCategoryId = empCashTransaction[i].PaymentModeSubCategoryId;
                    empCashTxn.Remarks = empCashTransaction[i].Remarks;
                    dbContext.EmpCashTransactions.Add(empCashTxn);
                }
                dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception("Unable to Add Cash Transaction Detail:" + ex.ToString());
            }
        }

        private static int? GetDepositReceiptNo(DischargeDbContext dischargeDbContext)
        {

            //This is to get the uncommited row data (ReceiptNo).
            //using (new TransactionScope(TransactionScopeOption.Required, new TransactionOptions { IsolationLevel = IsolationLevel.ReadUncommitted }))
            //{
            //}
            int fiscalYearId = GetFiscalYear(dischargeDbContext);
            int? receiptNo = (from depTxn in dischargeDbContext.BillingDeposits
                              where depTxn.FiscalYearId == fiscalYearId
                              select depTxn.ReceiptNo).DefaultIfEmpty(0).Max();

            return receiptNo + 1;
        }

        private static void AddEmpCashTransaction(DischargeDbContext dbContext, EmpCashTransactionModel empCashTransaction)
        {
            try
            {
                EmpCashTransactionModel empCashTxn = new EmpCashTransactionModel();
                empCashTxn.TransactionType = empCashTransaction.TransactionType;
                empCashTxn.ReferenceNo = empCashTransaction.ReferenceNo;
                empCashTxn.EmployeeId = empCashTransaction.EmployeeId;
                empCashTxn.InAmount = empCashTransaction.InAmount;
                empCashTxn.OutAmount = empCashTransaction.OutAmount;
                empCashTxn.Description = empCashTransaction.Description;
                empCashTxn.TransactionDate = empCashTransaction.TransactionDate;
                empCashTxn.CounterID = empCashTransaction.CounterID;
                empCashTxn.IsActive = true;
                empCashTxn.ModuleName = empCashTransaction.ModuleName;
                empCashTxn.PatientId = empCashTransaction.PatientId;
                empCashTxn.PaymentModeSubCategoryId = empCashTransaction.PaymentModeSubCategoryId;
                dbContext.EmpCashTransactions.Add(empCashTxn);
                dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw new Exception("Unable to Add Cash Transaction Detail:" + ex.ToString());
            }
        }

        private static BillingTransactionItemModel UpdateTxnItemBillStatus(DischargeDbContext dischargeDbContext, BillingTransactionItemModel billItem, string billStatus, RbacUser currentUser, DateTime? modifiedDate = null, int? counterId = null, int? billingTransactionId = null, int? DischargeStatementId = null)
        {
            modifiedDate = modifiedDate != null ? modifiedDate : DateTime.Now;

            billItem = GetBillStatusMapped(billItem, billStatus, modifiedDate, currentUser.EmployeeId, counterId);
            dischargeDbContext.BillingTransactionItems.Attach(billItem);
            //update returnstatus and returnquantity
            if (billStatus == "paid")
            {
                dischargeDbContext.Entry(billItem).Property(b => b.PaidDate).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.BillStatus).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(b => b.PaymentReceivedBy).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(b => b.PaidCounterId).IsModified = true;
            }
            else if (billStatus == "unpaid")
            {

                dischargeDbContext.Entry(billItem).Property(b => b.PaidDate).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.BillStatus).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(b => b.PaidCounterId).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(b => b.PaymentReceivedBy).IsModified = true;
            }
            else if (billStatus == "cancel")
            {

                dischargeDbContext.Entry(billItem).Property(a => a.CancelledBy).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.BillStatus).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.CancelledOn).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.CancelRemarks).IsModified = true;

            }
            else if (billStatus == "adtCancel")
            {

                dischargeDbContext.Entry(billItem).Property(a => a.CancelledBy).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.BillStatus).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.CancelledOn).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.CancelRemarks).IsModified = true;

            }
            else if (billStatus == "returned")
            {
                dischargeDbContext.Entry(billItem).Property(a => a.ReturnStatus).IsModified = true;
                dischargeDbContext.Entry(billItem).Property(a => a.ReturnQuantity).IsModified = true;
            }

            if (billItem.BillingTransactionId == null)
            {
                billItem.BillingTransactionId = billingTransactionId;
                dischargeDbContext.Entry(billItem).Property(b => b.BillingTransactionId).IsModified = true;
            }
            if (DischargeStatementId != null)
            {
                billItem.DischargeStatementId = DischargeStatementId;
                dischargeDbContext.Entry(billItem).Property(b => b.DischargeStatementId).IsModified = true;
            }

            //these fields could also be changed during update.
            dischargeDbContext.Entry(billItem).Property(b => b.BillStatus).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.Price).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.Quantity).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.SubTotal).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.DiscountAmount).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.DiscountPercent).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.DiscountPercentAgg).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.DiscountSchemeId).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.TotalAmount).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.PerformerId).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.PerformerName).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.TaxableAmount).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.NonTaxableAmount).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.PatientVisitId).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.CoPaymentCashAmount).IsModified = true;
            dischargeDbContext.Entry(billItem).Property(a => a.CoPaymentCreditAmount).IsModified = true;
            dischargeDbContext.SaveChanges();


            UpdateRequisitionItemsBillStatus(dischargeDbContext, billItem.ServiceDepartmentName, billStatus, currentUser, billItem.BillingTransactionItemId, modifiedDate, billItem.PatientVisitId);

            //update bill status in BillItemRequistion (Order Table)
            BillItemRequisition billItemRequisition = (from bill in dischargeDbContext.BillItemRequisitions
                                                       where bill.RequisitionId == billItem.RequisitionId
                                                       && bill.ServiceDepartmentId == billItem.ServiceDepartmentId
                                                       select bill).FirstOrDefault();
            if (billItemRequisition != null)
            {
                billItemRequisition.BillStatus = billStatus;
                dischargeDbContext.Entry(billItemRequisition).Property(a => a.BillStatus).IsModified = true;
            }
            return billItem;
        }
        private static int? GetProvisionalReceiptNo(DischargeDbContext dischargeDbContext)
        {
            int fiscalYearId = GetFiscalYear(dischargeDbContext);
            int? receiptNo = (from txnItems in dischargeDbContext.BillingTransactionItems
                              where txnItems.ProvisionalFiscalYearId == fiscalYearId
                              select txnItems.ProvisionalReceiptNo).DefaultIfEmpty(0).Max();

            return receiptNo + 1;
        }
        private static bool ReadDepositConfigureationParam(DischargeDbContext contex)
        {
            var usePharmacyDepositsIndependently = false;
            var param = contex.CFGParameters.FirstOrDefault(p => p.ParameterGroupName == "Pharmacy" && p.ParameterName == "UsePharmacyDeposit");
            if (param != null)
            {
                var paramValue = param.ParameterValue;
                usePharmacyDepositsIndependently = paramValue == "true" ? true : false;
            }

            return usePharmacyDepositsIndependently;
        }
    }
}
