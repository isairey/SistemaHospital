using DanpheEMR.Controllers.Billing;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.Services.SSF.DTO;
using DanpheEMR.Utilities.SignalRHubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Billing.Invoice
{
    public class BillingInvoiceService
    {
        public static async Task<object> PostBillingTransactionAsync(BillingDbContext _billingDbContext, BillingTransactionPostVM billingTransactionPostVM, RbacUser currentUser, string connString, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking, IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            BillingTransactionModel billingTransactionModel = new BillingTransactionModel();
            using (var billingTransactionScope = _billingDbContext.Database.BeginTransaction())
            {
                try
                {

                    if (!BillingTransactionBL.IsDepositAvailable(_billingDbContext, billingTransactionPostVM.Txn.PatientId, billingTransactionPostVM.Txn.DepositUsed))
                    {
                        Log.ForContext("UserId", currentUser.EmployeeId).Error($"Available Deposit Balance is not sufficient to be used in this transaction for patient, {billingTransactionPostVM.Txn.PatientId}");
                        throw new InvalidOperationException($"Available Deposit Balance is not sufficient to be used in this transaction for patient, {billingTransactionPostVM.Txn.PatientId}");
                    }

                    if (billingTransactionPostVM.VisitItems != null && billingTransactionPostVM.VisitItems.Count > 0)
                    {
                        billingTransactionPostVM.VisitItems.ForEach(a => a.BillingStatus = billingTransactionPostVM.Txn.BillStatus);
                        billingTransactionPostVM.VisitItems = AddVisitItems(_billingDbContext, billingTransactionPostVM.VisitItems, currentUser.EmployeeId);
                    }

                    if (billingTransactionPostVM.VisitItems != null && billingTransactionPostVM.VisitItems.Count > 0)
                    {
                        MapPatientVisitId(billingTransactionPostVM.Txn.BillingTransactionItems, billingTransactionPostVM.VisitItems);
                    }
                    billingTransactionModel = billingTransactionPostVM.Txn;

                    billingTransactionModel = PostBillingTransaction(_billingDbContext, billingTransactionPostVM, billingTransactionModel, currentUser, connString, realTimeRemoteSyncEnabled, realTimeSSFClaimBooking);

                    billingTransactionModel.BillingUserName = currentUser.UserName;

                    if (billingTransactionModel != null)
                    {
                        billingTransactionScope.Commit();

                        Log.ForContext("UserId", currentUser.EmployeeId).Information($"This Billing Transaction is successful and commited the transaction into database for the patient, {billingTransactionModel.PatientId}");

                        if(billingTransactionModel.PaymentDetails != null && billingTransactionModel.PaymentDetails.ToLower().Contains(ENUM_OnlinePaymentMode.FonePay)){
                            FonePayHub hub = new FonePayHub(hubContext, contextAccessor);
                            InvoiceDetail invoiceDetail = new InvoiceDetail();
                            invoiceDetail.InvoiceNo = billingTransactionModel.InvoiceNo;
                            invoiceDetail.InvoiceId = billingTransactionModel.BillingTransactionId;
                            invoiceDetail.FiscalYearId = billingTransactionModel.FiscalYearId;
                            invoiceDetail.PaymentStatus = true;
                            hub.SendNotification(currentUser.UserId.ToString(), invoiceDetail);
                        }
                    }
                }
                catch (Exception ex)
                {
                    billingTransactionScope.Rollback();
                    Log.ForContext("UserId", currentUser.EmployeeId).Error($"This Billing Transaction is being rolled back, Exception is thrown during the process as, {ex.Message.ToString()}");
                    throw new Exception($"This Billing Transaction is being rolled back, Exception is thrown during the process as, {ex.Message}, Exception Details, {ex.ToString()}");
                }
            }

            return billingTransactionModel;
        }

        public static async Task<object> CheckValidationForCreditBilling(BillingTransactionModel Txn, BillingDbContext _billingDbContext)
        {
            bool IsValid = true;
            string ErrorMessage = "";
            int txnPatientSchemeId = Txn.SchemeId;
            BillingSchemeModel txnScheme = (from s in _billingDbContext.BillingSchemes
                             where s.SchemeId == txnPatientSchemeId
                             select s).FirstOrDefault();
            if (txnScheme != null && txnScheme.DefaultCreditOrganizationId > 0 && Txn.PaymentMode == ENUM_BillPaymentMode.credit)
            {
                int patLatestVisitId = Txn.PatientVisitId.HasValue ? Txn.PatientVisitId.Value : 0;
                if (patLatestVisitId == 0)
                {
                    IsValid = false;
                    ErrorMessage = "Patient must have Visit for Credit Billing.";
                    return new { IsValid, ErrorMessage };
                }
                VisitModel patLatestVisit = (from vis in _billingDbContext.Visit
                                      where vis.PatientVisitId == patLatestVisitId
                                      select vis).FirstOrDefault();
                if (patLatestVisit.SchemeId != txnScheme.SchemeId)
                {
                    IsValid = false;
                    ErrorMessage = "Same Scheme Visit is compulsory for Credit Billing.";
                    return new { IsValid, ErrorMessage };
                }
                int txnPaymentOrganizationId = Txn.OrganizationId.Value; //Payment CreditOrganizationId
                CreditOrganizationModel txnCreditOrg = (from crOrg in _billingDbContext.CreditOrganization
                                    where crOrg.OrganizationId == txnPaymentOrganizationId
                                    select crOrg).FirstOrDefault();
                if (txnPaymentOrganizationId != txnScheme.DefaultCreditOrganizationId && txnCreditOrg.IsClaimManagementApplicable)
                {
                    IsValid = false;
                    ErrorMessage = "Cannot perform Credit Billing except for default Credit Organization of selected Scheme.";
                    return new { IsValid, ErrorMessage };
                }
            }
            return new { IsValid, ErrorMessage };
        }
        private static List<VisitModel> AddVisitItems(BillingDbContext billingDbContext, List<VisitModel> visitItems, int employeeId)
        {
            /*visitItems.ForEach(visit =>
            {
                visit.VisitCode = CreateNewPatientVisitCode(visit.VisitType, billingDbContext);
                billingDbContext.Visit.Add(visit);

            });
            billingDbContext.SaveChanges();*/
            GeneratePatientVisitCodeAndSave(billingDbContext, visitItems);
            return visitItems;
        }

        private static void GeneratePatientVisitCodeAndSave(BillingDbContext billingDbContext, List<VisitModel> visitItems)
        {
            try
            {
                visitItems.ForEach(visit =>
                {
                    //below code can be used to test the workflow for the duplicate visitCode...
                    /*if(testCount == 1) { visit.VisitCode = "V2200003"; testCount++; }
                    else*/
                    visit.VisitCode = CreateNewPatientVisitCode(visit.VisitType, billingDbContext);
                    billingDbContext.Visit.Add(visit);

                });
                billingDbContext.SaveChanges();
            }
            catch (Exception ex)
            {

                if (ex is DbUpdateException dbUpdateEx)
                {
                    if (dbUpdateEx.InnerException?.InnerException is SqlException sqlException)
                    {

                        if (sqlException.Number == 2627)// unique constraint error 
                        {
                            GeneratePatientVisitCodeAndSave(billingDbContext, visitItems);
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

        private static string CreateNewPatientVisitCode(string visitType, BillingDbContext billingDbContext)
        {
            try
            {
                var visitCode = "";
                if (visitType != null)
                {
                    //VisitDbContext visitDbContext = new VisitDbContext(connString);
                    var year = DateTime.Now.Year;
                    var patVisitId = billingDbContext.Visit.Where(s => s.VisitType == visitType && s.VisitDate.Year == year && s.VisitCode != null).DefaultIfEmpty()
                        .Max(t => t.PatientVisitId == null ? 0 : t.PatientVisitId);
                    string codeChar;
                    switch (visitType)
                    {
                        case "inpatient":
                            codeChar = "H";
                            break;
                        case "emergency":
                            codeChar = "ER";
                            break;
                        default:
                            codeChar = "V";
                            break;
                    }
                    if (patVisitId > 0)
                    {
                        var vCodMax = (from v in billingDbContext.Visit
                                       where v.PatientVisitId == patVisitId
                                       select v.VisitCode).FirstOrDefault();
                        int newCodeDigit = Convert.ToInt32(vCodMax.Substring(codeChar.Length + 2)) + 1;
                        visitCode = (string)codeChar + DateTime.Now.ToString("yy") + String.Format("{0:D5}", newCodeDigit);
                    }
                    else
                    {
                        visitCode = (string)codeChar + DateTime.Now.ToString("yy") + String.Format("{0:D5}", 1);
                    }
                }
                return visitCode;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private static List<BillingTransactionItemModel> MapPatientVisitId(List<BillingTransactionItemModel> billingTransactionItems, List<VisitModel> visitItems)
        {
            for (int i = 0; i < billingTransactionItems.Count; i++)
            {
                var erVisit = visitItems.Where(a => billingTransactionItems[i].ItemName.ToLower() == "emergency registration" && a.PerformerId == billingTransactionItems[i].PerformerId);
                if (erVisit != null && (billingTransactionItems[i].RequisitionId == null || billingTransactionItems[i].RequisitionId == 0))
                {
                    billingTransactionItems[i].RequisitionId = erVisit.Select(a => a.ParentVisitId).FirstOrDefault();

                }

                var opVisit = visitItems.Where(a => billingTransactionItems[i].ItemIntegrationName.ToLower() == "opd" && a.PerformerId == billingTransactionItems[i].PerformerId);
                if (opVisit != null && (billingTransactionItems[i].RequisitionId == null || billingTransactionItems[i].RequisitionId == 0))
                {
                    billingTransactionItems[i].RequisitionId = opVisit.Select(a => a.PatientVisitId).FirstOrDefault();
                }

            }

            return billingTransactionItems;
        }

        private static BillingTransactionModel PostBillingTransaction(BillingDbContext billingDbContext, BillingTransactionPostVM billingTransactionPostVM, BillingTransactionModel billingTransactionModel, RbacUser currentUser, string connString, bool realTimeRemoteSyncEnabled, bool realTimeSSFClaimBooking)
        {

            try
            {
                billingTransactionModel = BillingTransactionBL.PostBillingTransaction(billingDbContext, connString, billingTransactionPostVM, billingTransactionModel, currentUser, DateTime.Now);

                //Billing User should be assigned from the server side avoiding assigning from client side 
                //which is causing issue in billing receipt while 2 user loggedIn in the same browser
                billingTransactionModel.BillingUserName = currentUser.UserName;//Yubaraj: 28June'19                            


                //send to IRD only after transaction is committed successfully: sud-23Dec'18
                //Below is asynchronous call, so even if IRD api is down, it won't hold the execution of other code..
                if (realTimeRemoteSyncEnabled)
                {
                    if (billingTransactionModel.Patient == null)
                    {
                        PatientModel pat = billingDbContext.Patient.Where(p => p.PatientId == billingTransactionModel.PatientId).FirstOrDefault();
                        billingTransactionModel.Patient = pat;
                    }
                    //making parallel thread call (asynchronous) to post to IRD. so that it won't stop the normal execution of logic.
                    // BillingBL.SyncBillToRemoteServer(billTransaction, "sales", billingDbContext);
                    Task.Run(() => BillingBL.SyncBillToRemoteServer(billingTransactionModel, "sales", billingDbContext));

                    Log.ForContext("UserId", currentUser.EmployeeId).Information($"Parallel Thread is created to sync invoice BL{billingTransactionModel.InvoiceNo} of patient {billingTransactionModel.PatientId} in IRD Server!");
                }

                //Send to SSF Server for Real time ClaimBooking.
                var patientSchemes = billingDbContext.PatientSchemeMaps.Where(a => a.SchemeId == billingTransactionModel.SchemeId && a.PatientId == billingTransactionModel.PatientId).FirstOrDefault();
                if (patientSchemes != null)
                {
                    //int priceCategoryId = billingTransactionModel.BillingTransactionItems[0].PriceCategoryId;
                    //var priceCategory = billingDbContext.PriceCategoryModels.Where(a => a.PriceCategoryId == priceCategoryId).FirstOrDefault();
                    var scheme = billingDbContext.BillingSchemes.FirstOrDefault(s => s.SchemeId == patientSchemes.SchemeId);
                    if (scheme != null && scheme.ApiIntegrationName != null && scheme.ApiIntegrationName.ToLower() == "ssf")
                    {
                        Log.ForContext("UserId", currentUser.EmployeeId).Information($"The Real Time SSF Claim Booking is started from OP Billing and is in process to book,Invoice BL{billingTransactionModel.InvoiceNo} with ClaimCode {billingTransactionModel.ClaimCode}");
                        var fiscalYear = billingDbContext.BillingFiscalYears.FirstOrDefault(f => f.FiscalYearId == billingTransactionModel.FiscalYearId);
                        var fiscalYearFormatted = fiscalYear != null ? fiscalYear.FiscalYearFormatted : "";
                        //making parallel thread call (asynchronous) to post to SSF Server. so that it won't stop the normal BillingFlow.
                        SSFDbContext ssfDbContext = new SSFDbContext(connString);
                        var billObj = new SSF_ClaimBookingBillDetail_DTO()
                        {
                            InvoiceNoFormatted = $"{fiscalYearFormatted}-BL{billingTransactionModel.InvoiceNo}",
                            TotalAmount = (decimal)billingTransactionModel.TotalAmount,
                            ClaimCode = (long)billingTransactionModel.ClaimCode,
                            VisitType = billingTransactionModel.TransactionType
                        };

                        SSF_ClaimBookingService_DTO claimBooking = SSF_ClaimBookingService_DTO.GetMappedToBookClaim(billObj, patientSchemes);

                        Task.Run(() => BillingBL.SyncToSSFServer(claimBooking, "billing", ssfDbContext, patientSchemes, currentUser, realTimeSSFClaimBooking));

                        Log.ForContext("UserId", currentUser.EmployeeId).Information($"Parallel thread is created from OP Billing to book, ssf Invoice BL{billingTransactionModel.InvoiceNo} with ClaimCode {billingTransactionModel.ClaimCode}");

                    }
                }
                return billingTransactionModel;
            }
            catch (Exception ex)
            {
                throw ex;

            }

        }

        #region This method is responsible to convert numeric values into their corresponding words representation.
        public static string ConvertNumbersInWords(decimal number)
        {
            string[] Th = { "", "thousand", "million", "billion", "trillion" };
            string[] Dg = { "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine" };
            string[] Tn = { "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen" };
            string[] Tw = { "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety" };

            string s = number.ToString();
            s = s.Replace(",", "").Replace(" ", "");
            if (!decimal.TryParse(s, out _)) return "not a number";

            int x = s.IndexOf('.');
            if (x == -1) x = s.Length;
            if (x > 15) return "too big";

            var n = s.ToCharArray();
            var str = new StringBuilder();
            int sk = 0;

            for (int i = 0; i < x; i++)
            {
                if (n[i] == '-')
                {
                    str.Append("minus ");
                }
                else
                {
                    if ((x - i) % 3 == 2)
                    {
                        if (n[i] == '1')
                        {
                            str.Append(Tn[Convert.ToInt32(n[i + 1].ToString())] + " ");
                            i++;
                            sk = 1;
                        }
                        else if (n[i] != '0')
                        {
                            str.Append(Tw[Convert.ToInt32(n[i].ToString()) - 2] + " ");
                            sk = 1;
                        }
                    }
                    else if (n[i] != '0')
                    {
                        str.Append(Dg[Convert.ToInt32(n[i].ToString())] + " ");
                        if ((x - i) % 3 == 0) str.Append("hundred ");
                        sk = 1;
                    }

                    if ((x - i) % 3 == 1)
                    {
                        if (sk != 0)
                        {
                            str.Append(Th[(x - i - 1) / 3] + " ");
                            sk = 0;
                        }
                    }
                }
            }

            if (x != s.Length)
            {
                str.Append("point ");
                for (int i = x + 1; i < s.Length; i++)
                {
                    str.Append(Dg[Convert.ToInt32(n[i].ToString())] + " ");
                }
            }

            // Remove trailing "point zero zero" if it exists
            string result = str.ToString().Trim();
            if (result.EndsWith("point zero zero"))
            {
                result = result.Replace("point zero zero", "").Trim();
            }

            return result.Replace("  ", " ");
        }
        #endregion

        #region This below logic is used to convert date and time in required format
        public static string Transform(string value, string actionName, string actionValue = "")
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            switch (actionName.ToLower())
            {
                case "format":
                    return FormatDate(value, actionValue);

                case "age":
                    return GetFormattedAge(value);

                case "datename":
                    return GetDateName(value);

                case "timename":
                    return GetTimeName(value);

                case "diff":
                    return GetDifference(value, actionValue);

                case "format-time":
                    return FormatTime(value);

                default:
                    return "Invalid Action";
            }
        }

        private static string FormatDate(string value, string format)
        {
            DateTime date;
            if (DateTime.TryParse(value, out date))
            {
                return date.ToString(format, CultureInfo.InvariantCulture);
            }
            return "Invalid Date";
        }

        private static string GetFormattedAge(string value)
        {
            if (DateTime.TryParse(value, out DateTime dob))
            {
                int age = DateTime.Now.Year - dob.Year;
                if (DateTime.Now < dob.AddYears(age))
                {
                    age--;
                }
                return age.ToString();
            }
            return "Invalid Date";
        }

        private static string GetDateName(string value)
        {
            if (DateTime.TryParse(value, out DateTime date))
            {
                var today = DateTime.Now.Date;
                int diffDays = (today - date.Date).Days;

                if (diffDays == 0) return "today";
                if (diffDays == 1) return "yesterday";
                return date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            }
            return "Invalid Date";
        }

        private static string GetTimeName(string value)
        {
            if (DateTime.TryParse(value, out DateTime date))
            {
                var now = DateTime.Now;
                int diffDays = (now.Date - date.Date).Days;
                var diffHours = (now - date).TotalHours;
                var diffMinutes = (now - date).TotalMinutes;

                if (diffDays > 0) return $"{diffDays} days ago";
                if (diffHours > 0) return $"{(int)diffHours} hours ago";
                if (diffMinutes > 3) return $"{(int)diffMinutes} minutes ago";
                return "just now";
            }
            return "Invalid Date";
        }

        private static string GetDifference(string value, string unit)
        {
            if (DateTime.TryParse(value, out DateTime date))
            {
                var now = DateTime.Now.Date;

                switch (unit.ToLower())
                {
                    case "year":
                        return ((now.Year - date.Year) + 1).ToString();

                    case "month":
                        var years = now.Year - date.Year;
                        var months = (now.Month - date.Month) + (years * 12);
                        return months.ToString();

                    case "day":
                        return ((now - date).Days).ToString();

                    default:
                        return "Invalid Unit";
                }
            }
            return "Invalid Date";
        }

        private static string FormatTime(string value)
        {
            // Allow different time formats
            string[] possibleFormats = { "HHmm", "hhmm", "HH:mm", "hh:mm", "HH:mm:ss", "hh:mm:ss tt" };

            foreach (var format in possibleFormats)
            {
                if (DateTime.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedTime))
                {
                    return parsedTime.ToString("hh:mm tt", CultureInfo.InvariantCulture);
                }
            }

            return "Invalid Time Format";
        }

        public static string InvoiceLebelDetailGenerate(bool isInsuranceBilling, int printCount)
        {

            string invoiceText = "Invoice";

            if (printCount > 0)
            {
                invoiceText = $"Invoice | COPY({printCount}) OF ORIGINAL";
            }

            return invoiceText;


        }
        #endregion

    }
}
