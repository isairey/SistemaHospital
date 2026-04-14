using System;
using System.Linq;
using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using DanpheEMR.ServerModel;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Enums;
using DanpheEMR.Services.OT;
using DanpheEMR.Services.OT.DTOs;
using System.Collections.Generic;
using DanpheEMR.Services.Clinical_New.DTOs;

namespace DanpheEMR.Controllers
{
    public class OperationTheatreController : CommonController
    {
        public readonly IOperationTheatreService _IOperationTheatreService;
        private readonly OtDbContext _operationTheaterDbContext;
        //private readonly BillingDbContext _billingDbContext;
        public DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
        public OperationTheatreController(IOperationTheatreService iOperationTheatreService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _IOperationTheatreService = iOperationTheatreService;
            _operationTheaterDbContext = new OtDbContext(connString);
            //_billingDbContext = new BillingDbContext(connString);
        }

        /// <summary>
        /// Method is used for Update the Map Anaesthesia Service Items
        /// </summary>
        /// <param name="otMapAnaesthesiaServiceItemDTO"> The DTO contain details of the Anaesthesia Service Item for mapping when API call for update Map Anaesthesia Service Items  </param>
        /// <returns>Returns an ActionResult containing a serialized DanpheHTTPResponse with the function result or error details</returns>
        [HttpPut]
        [Route("OTMapAnaesthesiaServiceItems")]
        public IActionResult UpdateMapAnaesthesiaType([FromBody] OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateMapAnaesthesiaType(currentUser, otMapAnaesthesiaServiceItemDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }
        /// <summary>
        /// Method implement for add the Map Anaesthesia Service Item
        /// </summary>
        /// <param name="otMapAnaesthesiaServiceItemDTO">The DTO contain details of the Anaesthesia Service Item for mapping when API call for Save Map Anaesthesia Service Items </param>
        /// <returns>Returns an ActionResult containing a serialized DanpheHTTPResponse with the function result or error details</returns>
        [HttpPost]
        [Route("OTMapAnaesthesiaServiceItems")]
        public IActionResult SaveOTMapAnaesthesiaType([FromBody] OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveOTMapAnaesthesiaType(currentUser, otMapAnaesthesiaServiceItemDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }
        /// <summary>
        /// Method is used for get the data of AnaesthesiaType Service Item
        /// </summary>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation.</param>
        /// <returns>Returns an ActionResult containing a serialized DanpheHTTPResponse with the function result or error details</returns>
        [HttpGet]
        [Route("OTMapAnaesthesiaServiceItems")]
        public IActionResult GetOTMapAnaesthesiaServiceItems()
        {
            Func<object> func = () => _IOperationTheatreService.GetOTMapAnaesthesiaServiceItems(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        /// <summary>
        /// Getting the Billing Service Item 
        /// </summary>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation.</param>
        /// <returns>Returns an ActionResult containing a serialized DanpheHTTPResponse with the function result or error details</returns>
        [HttpGet]
        [Route("AnaesthesiaServiceItems")]
        public IActionResult GetAnaesthesiaServiceItems()
        {
            Func<object> func = () => _IOperationTheatreService.GetAnaesthesiaServiceItems(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("AnaesthesiaType")]
        public IActionResult SaveAnaesthesiaType([FromBody] OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveAnaesthesiaType(currentUser, otPostAnaesthesiaTypeDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }
     
        [HttpPut]
        [Route("AnaesthesiaType")]
        public IActionResult UpdateAnaesthesiaType([FromBody] OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateAnaesthesiaType(currentUser, otPostAnaesthesiaTypeDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("BookOperationTheatre")] 
        public IActionResult BookOperationThreater()
        {
            //   if (reqType == "addNewOtBookingDetails")
            string str = this.ReadPostData();
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => BookNewOperationThreater(str, currentUser);
            return InvokeHttpPostFunction(func);

        }

        [HttpPut]
        [Route("BookingInfo")]
        public IActionResult OperationTheaterDetails()
        {
            //  if (reqType == "updateotdetails")
            string str = this.ReadPostData();
            Func<object> func = () => UpdateOTDetails(str);
            return InvokeHttpPutFunction(func);

        }

        private object UpdateOTDetails(string str)
        {
                OTBookingDetailsModel OTdetails = DanpheJSONConvert.DeserializeObject<OTBookingDetailsModel>(str);

                _operationTheaterDbContext.OTTeamInfo.RemoveRange(_operationTheaterDbContext.OTTeamInfo.Where(ott => ott.OTBookingId == OTdetails.OTBookingId));

                /*if (OTdetails.OtTeam.Count > 0)
                {

                    foreach (var data in OTdetails.OtTeam)
                    {
                        OTTeamsModel teaminfo = new OTTeamsModel();
                        teaminfo = data;
                        teaminfo.OTBookingId = OTdetails.OtBookingId;
                    _operationTheaterDbContext.OtTeamDetails.Add(teaminfo);
                    }

                }*/

            _operationTheaterDbContext.OTBookingDetails.Attach(OTdetails);

               _operationTheaterDbContext.Entry(OTdetails).Property(x => x.BookedForDate).IsModified = true;
               /*_operationTheaterDbContext.Entry(OTdetails).Property(x => x.Diagnosis).IsModified = true;
               _operationTheaterDbContext.Entry(OTdetails).Property(x => x.AnesthesiaType).IsModified = true;
               _operationTheaterDbContext.Entry(OTdetails).Property(x => x.SurgeryType).IsModified = true;
               _operationTheaterDbContext.Entry(OTdetails).Property(x => x.ProcedureType).IsModified = true;*/
               _operationTheaterDbContext.Entry(OTdetails).Property(x => x.Remarks).IsModified = true;
            _operationTheaterDbContext.SaveChanges();
                return "OT Details updated successfully.";
            
        }
        private object BookNewOperationThreater(string str, RbacUser currentUser)
        {
            OTBookingDetailsModel otDetails = DanpheJSONConvert.DeserializeObject<OTBookingDetailsModel>(str);

            using (var dbContextTransaction = _operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {

                    otDetails.CreatedOn = DateTime.Now;
                    otDetails.CreatedBy = currentUser.EmployeeId;
                    //dbContext.OtTeamDetails.Add(otDetails.OtTeam);

                    _operationTheaterDbContext.OTBookingDetails.Add(otDetails);

                    /*if (otDetails.OtTeam.Count > 0)
                    {
                        OTTeamsModel teaminfo = new OTTeamsModel();
                        foreach (var data in otDetails.OtTeam)
                        {
                            teaminfo = data;
                        }
                        _operationTheaterDbContext.OtTeamDetails.Add(teaminfo);
                    }*/
                    _operationTheaterDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return otDetails;

                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }
    
        #region Get APIs

        [HttpGet]
        [Route("BookingInfo")]
        public IActionResult OTBookingInfo(DateTime? FromDate, DateTime? ToDate, string Status, int PrescribedBy)
        {
            Func<object> func = () => _IOperationTheatreService.GetOTBookingList(_operationTheaterDbContext, FromDate, ToDate, Status, PrescribedBy);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("OTBookingDetailsByOTBookingId")]
        public IActionResult OTBookingDetailsByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetOTBookingDetailsByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("DiagnosesByPatientIdAndPatientVisitId")]
        public IActionResult GetDiagnosesByPatientIdAndPatientVisitId(int PatientId, int PatientVisitId)
        {
            Func<object> func = () => _IOperationTheatreService.GetDiagnosesByPatientIdAndPatientVisitId(_operationTheaterDbContext, PatientId, PatientVisitId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("OTBookingTeamInfo")]
        public IActionResult GetOTBookingTeamInfo(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetOTBookingTeamInfo(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("OTMachines")]
        public IActionResult GetOTMachines()
        {
            Func<object> func = () => _IOperationTheatreService.GetOTMachines(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PersonnelTypes")]
        public IActionResult GetPersonnelTypes()
        {
            Func<object> func = () => _IOperationTheatreService.GetPersonnelTypes(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("Personnel")]
        public IActionResult GetPersonnels()
        {
            Func<object> func = () => _IOperationTheatreService.GetPersonnels(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("AnaesthesiaTypes")]
        public IActionResult GetAnaesthesiaTypes()
        {
            Func<object> func = () => _IOperationTheatreService.GetAnaesthesiaTypes(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("Anaesthesias")]
        public IActionResult GetAnaesthesias(int PriceCategoryId)
        {
            Func<object> func = () => _IOperationTheatreService.GetAnaesthesias(_operationTheaterDbContext, PriceCategoryId);
            return InvokeHttpGetFunction(func);
        }

      /*  [HttpGet]
        [Route("AnaesthesiaDetailsByOTBookingId")]
        public IActionResult GetAnaesthesiaDetailsByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetAnaesthesiaDetailsByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }*/

        [HttpGet]
        [Route("ICD")]
        public IActionResult GetICDList()
        {
            Func<object> func = () => _IOperationTheatreService.GetICDList(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("OTBillingItems")]
        public IActionResult GetOTBillingItems()
        {
            Func<object> func = () => _IOperationTheatreService.GetOTBillingItems(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("OTPrescribers")]
        public IActionResult GetOTPrescribers()
        {
            Func<object> func = () => _IOperationTheatreService.GetOTPrescribers(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("CheckListInputTypes")]
        public IActionResult GetCheckListInputTypes()
        {
            Func<object> func = () => _IOperationTheatreService.CheckListInputTypes(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("MSTCheckList")]
        public IActionResult GetMSTCheckList()
        {
            Func<object> func = () => _IOperationTheatreService.GetMSTCheckList(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("MSTCheckListBySurgeryId")]
        public IActionResult GetMSTCheckListBySurgeryId(int SurgeryId)
        {
            Func<object> func = () => _IOperationTheatreService.GetMSTCheckListBySurgeryId(_operationTheaterDbContext, SurgeryId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("CheckListByOTBookingId")]
        public IActionResult GetCheckListByOTBookingId( int OTBookingId, int SurgeryId)
        {
            Func<object> func = () => _IOperationTheatreService.GetCheckListByOTBookingId(_operationTheaterDbContext, OTBookingId, SurgeryId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("CheckForDuplicateOTBooking")]
        public IActionResult CheckForDuplicateOTBooking( int PatientVisitId, int SurgeryId)
        {
            Func<object> func = () => _IOperationTheatreService.CheckForDuplicateOTBooking(_operationTheaterDbContext, PatientVisitId, SurgeryId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("CheckForProceduresBookedForDateCollision")]
        public IActionResult CheckForProceduresBookedForDateCollision( int PatientVisitId, DateTime BookedForDate)
        {
            Func<object> func = () => _IOperationTheatreService.CheckForProceduresBookedForDateCollision(_operationTheaterDbContext, PatientVisitId, BookedForDate);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("OTSurgeries")]
        public IActionResult GetOTSurgeries()
        {
            Func<object> func = () => _IOperationTheatreService.GetOTSurgeries(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("MapSurgeryCheckListItemsBySurgeryId")]
        public IActionResult GetMapSurgeryCheckListBySurgeryId(int surgeryId)
        {
            Func<object> func = () => _IOperationTheatreService.GetMapSurgeryCheckListBySurgeryId(_operationTheaterDbContext, surgeryId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("TeamInfoByOTBooingId")]
        public IActionResult GetTeamInfoByOTBooingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetTeamInfoByOTBooingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("ImplantDetailByOTBookingId")]
        public IActionResult GetImplantDetailByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetImplantDetailByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("MachineDetailByOTBookingId")]
        public IActionResult GetMachineDetailByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetMachineDetailByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("AnaesthesiaDetailByOTBookingId")]
        public IActionResult GetAnaesthesiaDetailByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetAnaesthesiaDetailByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("ConcludeDetailByOTBookingId")]
        public IActionResult GetConcludeDetailByOTBookingId(int OTBookingId)
        {
            Func<object> func = () => _IOperationTheatreService.GetConcludeDetailByOTBookingId(_operationTheaterDbContext, OTBookingId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("OTSummaryReport")]
        public IActionResult GetOTSummaryReport(bool IsOTStartDate, DateTime FromDate, DateTime ToDate, int? PrescribedBy)
        {
            Func<object> func = () => _IOperationTheatreService.GetOTSummaryReport(_operationTheaterDbContext, IsOTStartDate, FromDate, ToDate, PrescribedBy);
            return InvokeHttpGetFunction(func);
        }
        
        [HttpGet]
        [Route("OtTemplates")]
        public IActionResult GetOtTemplates()
        {
            Func<object> func = () => _IOperationTheatreService.GetOtTemplates(_operationTheaterDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("OTFinancialReport")]
        public IActionResult GetOTFinancialReport(bool IsOTStartDate, DateTime FromDate, DateTime ToDate, int? PrescribedBy)
        {
            Func<object> func = () => _IOperationTheatreService.GetOTFinancialReport(_operationTheaterDbContext, IsOTStartDate, FromDate, ToDate, PrescribedBy);
            return InvokeHttpGetFunction(func);
        }

        #endregion

        #region Post APIs

        [HttpPost]
        [Route("OTMachine")]
        public IActionResult SaveOTMachine([FromBody] OTMachineDTO otMachineDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveOTMachine(currentUser, otMachineDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("PersonnelType")]
        public IActionResult SavePersonnelType([FromBody] OTPersonnelTypeDTO otPersonnelTypeDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SavePersonnelType(currentUser, otPersonnelTypeDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("OTBooking")]
        public IActionResult SaveNewOTBooking([FromBody] OTBookingDetailsDTO otBookingDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveNewOTBooking(currentUser, otBookingDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("MSTCheckList")]
        public IActionResult SaveMSTCheckList([FromBody] OTPostMSTCheckListDTO otMSTCheckListDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveMSTCheckList(currentUser, otMSTCheckListDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("CheckList")]
        public IActionResult SaveCheckList([FromBody] OTPostCheckListDTO otCheckListDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveCheckList(currentUser, otCheckListDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("OTSurgery")]
        public IActionResult SaveOTSurgery([FromBody] OTSurgeryDTO otSurgeryDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveOTSurgery(currentUser, otSurgeryDTO, _operationTheaterDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ImplantDetail")]
        public IActionResult SaveImplantDetail([FromBody] OTPostImplantDetailDTO Implant, int PatientId, int PatientVisitId, int OTBookingId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveImplantDetail(currentUser, Implant, PatientId, PatientVisitId, OTBookingId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPost]
        [Route("MachineDetail")]
        public IActionResult SaveMachineDetail([FromBody] OTPostMachineDetailDTO machine)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveMachineDetail(currentUser, machine, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        #endregion

        #region PUT APIs

        [HttpPut]
        [Route("OTMachine")]
        public IActionResult UpdateOTMachine([FromBody] OTMachineDTO otMachineDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateOTMachine(currentUser, otMachineDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("PersonnelType")]
        public IActionResult UpdatePersonnelType([FromBody] OTPersonnelTypeDTO otPersonnelTypeDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdatePersonnelType(currentUser, otPersonnelTypeDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("OTBooking")]
        public IActionResult UpdateOTBooking([FromBody] OTBookingDetailsDTO otBookingDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateOTBooking(currentUser, otBookingDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("AnaesthesiaDetails")]
        public IActionResult UpdateAnaesthesiaDetails(int OTBookingId, bool UseAnaesthesia, string AnaesthesiaDetails)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateAnaesthesiaDetails(currentUser, OTBookingId, UseAnaesthesia, AnaesthesiaDetails, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("BookingCancellation")]
        public IActionResult CancelOTBooking(int otBookingId, string cancellationRemarks)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.CancelOTBooking(currentUser, otBookingId, cancellationRemarks, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("ConfirmOTBooking")]
        public IActionResult ConfirmOTBooking(int otBookingId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.ConfirmOTBooking(currentUser, otBookingId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
         
        [HttpPut]
        [Route("CheckInOTBooking")]
        public IActionResult CheckInOTBooking(int otBookingId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.CheckInOTBooking(currentUser, otBookingId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("RescheduleOTBooking")]
        public IActionResult RescheduleOTBooking(int otBookingId, DateTime rescheduledDate)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.RescheduleOTBooking(currentUser, otBookingId, rescheduledDate, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("MSTCheckList")]
        public IActionResult UpdateMSTCheckList([FromBody] OTPostMSTCheckListDTO otMSTCheckListDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateMSTCheckList(currentUser, otMSTCheckListDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("SaveLookUp")] /* AddLookUp is basically updating the OtBooking. That's why "AddLookUp" API is kept under PUT section*/
        public IActionResult AddLookUp(int checkListId, string lookUp)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.SaveLookUp(currentUser, checkListId, lookUp, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("CheckList")]
        public IActionResult UpdateCheckList([FromBody] OTPostCheckListDTO otCheckListDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateCheckList(currentUser, otCheckListDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("OTSurgery")]
        public IActionResult UpdateOTSurgery([FromBody] OTSurgeryDTO otSurgeryDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateOTSurgery(currentUser, otSurgeryDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("MapSurgeryCheckList")]
        public IActionResult MapSurgeryCheckList([FromBody] OTMapSurgeryCheckListDTO otMapSurgeryCheckListDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.MapSurgeryCheckList(currentUser, otMapSurgeryCheckListDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("PersonnelDetails")]
        public IActionResult UpdatePersonnelDetails([FromBody] List<OTPostTeamInfoDTO> TeamInfoList, int OTBookingId, int PatientId, int PatientVisitId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdatePersonnelDetails(currentUser, TeamInfoList, OTBookingId, PatientId, PatientVisitId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

       /* [HttpPut]
        [Route("OTMachineByOTBookingId")]
        public IActionResult UpdateOTMachineByOTBookingId(int OTBookingId, int OTMachineId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.UpdateOTMachineByOTBookingId(currentUser, OTBookingId, OTMachineId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }*/

        [HttpPut]
        [Route("DeactivateImplantDetail")]
        public IActionResult DeactivateImplantDetail(int OTBookingId, int ImplantDetailId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.DeactivateImplantDetail(currentUser, OTBookingId, ImplantDetailId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("DeactivateMachineDetail")]
        public IActionResult DeactivateMachineDetail(int OTBookingId, int MachineDetailId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.DeactivateMachineDetail(currentUser, OTBookingId, MachineDetailId, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ConcludeOTBooking")]
        public IActionResult ConcludeOTBooking(int OTBookingId, [FromBody] OTConcludeBookingDTO concludeBookingDTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IOperationTheatreService.ConcludeOTBooking(currentUser, OTBookingId, concludeBookingDTO, _operationTheaterDbContext);
            return InvokeHttpPutFunction(func);
        }
        #endregion

    }
}
