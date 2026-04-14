using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.OtModels;
using DanpheEMR.ServerModel.OTModels;
using DanpheEMR.Services.OT.DTOs;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.IO;
using System.Drawing.Imaging;
using System.Drawing;
using System.Data.Entity;
using Serilog;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ViewModel.OT;

namespace DanpheEMR.Services.OT
{
    public class OperationTheatreService : IOperationTheatreService
    {
        #region GET

        public object GetOTBookingList(OtDbContext operationTheaterDbContext, DateTime? FromDate, DateTime? ToDate, string Status, int PrescribedBy)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", FromDate),
                        new SqlParameter("@ToDate", ToDate),
                        new SqlParameter("@Status", Status),
                        new SqlParameter("@PrescribedBy", PrescribedBy),
                    };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_OT_GetOTBookingList", paramList, operationTheaterDbContext);
            var OTBookingList = OTGetBookingListDTO.MapDataTableToSingleObject(dt);
            return OTBookingList;
        }

        public object GetOTBookingDetailsByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@OTBookingId", OTBookingId),
                    };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_OT_GetOTBookingDetailsByOTBookingId", paramList, operationTheaterDbContext);
            var OTBookingDetails = OTGetOTBookingDetailsDTO.MapDataTableToSingleObject(dt);
            return OTBookingDetails[0];
            //  TODO : Do not convert data table into List. Just convert into Object.
        }

        public object GetDiagnosesByPatientIdAndPatientVisitId(OtDbContext operationTheaterDbContext, int PatientId, int PatientVisitId)
        {
            if (PatientId == 0 && PatientVisitId == 0)
            {
                Log.Error($"Invalid  {nameof(PatientId)} and {nameof(PatientVisitId)}. Can not fetch Diagnoses with out {nameof(PatientId)} and {nameof(PatientVisitId)}.");
                throw new ArgumentNullException($"Invalid  {nameof(PatientId)} and {nameof(PatientVisitId)}. Can not fetch Diagnoses with out {nameof(PatientId)} and {nameof(PatientVisitId)}.");
            }
            else if (PatientId == 0)
            {
                Log.Error($"Invalid  {nameof(PatientId)}. Can not fetch Diagnoses with out {nameof(PatientId)}.");
                throw new ArgumentNullException($"Invalid  {nameof(PatientId)}. Can not fetch Diagnoses with out {nameof(PatientId)}.");
            }
            if (PatientVisitId == 0)
            {
                Log.Error($"Invalid  {nameof(PatientVisitId)}. Can not fetch Diagnoses with out {nameof(PatientVisitId)}.");
                throw new ArgumentNullException($"Invalid  {nameof(PatientVisitId)}. Can not fetch Diagnoses with out {nameof(PatientVisitId)}.");
            }
            else if (PatientVisitId == 0)
            {
                throw new Exception("Invalid PatientVisitId.");
            }

            List<DiagnosisModel> Diagnoses = operationTheaterDbContext.Diagnoses.Where(d => d.PatientId == PatientId && d.PatientVisitId == PatientVisitId).ToList();
            return Diagnoses;
        }

        public object GetOTBookingTeamInfo(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            var OTTeamInfo = (from team in operationTheaterDbContext.OTTeamInfo
                              where team.OTBookingId == OTBookingId
                              join emp in operationTheaterDbContext.Employees on team.EmployeeId equals emp.EmployeeId
                              join pType in operationTheaterDbContext.PersonnelType on team.PersonnelTypeId equals pType.PersonnelTypeId
                              select new OTGetTeamInfoDTO
                              {
                                  TeamInfoId = team.TeamInfoId,
                                  PersonnelTypeId = team.PersonnelTypeId,
                                  PersonnelType = pType.PersonnelType,
                                  EmployeeId = team.EmployeeId,
                                  FullName = emp.FullName,
                                  OTBookingId = team.OTBookingId,
                                  PatientId = team.PatientId,
                                  PatientVisitId = team.PatientVisitId,
                                  CreatedBy = team.CreatedBy,
                                  CreatedOn = team.CreatedOn,
                                  ModifiedBy = team.ModifiedBy,
                                  ModifiedOn = team.ModifiedOn
                              }).ToList();
            return OTTeamInfo;
        }

        public object GetOTMachines(OtDbContext operationTheaterDbContext)
        {
            var OTMachineList = operationTheaterDbContext.OTMachines
                                                          .OrderBy(machine => machine.MachineName)
                                                          .ToList();
            return OTMachineList;
        }

        public object GetPersonnelTypes(OtDbContext operationTheaterDbContext)
        {
            var PersonnelTypes = (from personneltType in operationTheaterDbContext.PersonnelType
                                      //join empRole in operationTheaterDbContext.EmployeeRoles on personneltType.PersonnelType.ToLower() equals empRole.EmployeeRoleName.ToLower()
                                  orderby personneltType.PersonnelTypeId
                                  select new OTGetPersonnelTypesDTO
                                  {
                                      PersonnelTypeId = personneltType.PersonnelTypeId,
                                      PersonnelType = personneltType.PersonnelType,
                                      IsIncentiveApplicable = personneltType.IsIncentiveApplicable,
                                      CreatedOn = personneltType.CreatedOn,
                                      CreatedBy = personneltType.CreatedBy,
                                      ModifiedOn = personneltType.ModifiedOn,
                                      ModifiedBy = personneltType.ModifiedBy,
                                      IsActive = personneltType.IsActive,
                                      //EmployeeRoleId = empRole.EmployeeRoleId,
                                  }
                                   ).ToList();
            return PersonnelTypes;
        }

        public object GetPersonnels(OtDbContext operationTheaterDbContext)
        {
            var AllEmployee = (from emp in operationTheaterDbContext.Employees.Include("Department").Include("EmployeeRole").Include("EmployeeType")
                               select new OTGetPersonnelsDTO
                               {
                                   EmployeeId = emp.EmployeeId,
                                   Salutation = emp.Salutation,
                                   FirstName = emp.FirstName,
                                   MiddleName = emp.MiddleName,
                                   LastName = emp.LastName,
                                   FullName = emp.FullName,
                                   DateOfBirth = emp.DateOfBirth,
                                   DateOfJoining = emp.DateOfJoining,
                                   ContactNumber = emp.ContactNumber,
                                   ContactAddress = emp.ContactAddress,
                                   Email = emp.Email,
                                   Gender = emp.Gender,
                                   Extension = emp.Extension,
                                   SpeedDial = emp.SpeedDial,
                                   OfficeHour = emp.OfficeHour,
                                   RoomNo = emp.RoomNo,
                                   IsActive = emp.IsActive,
                                   MedCertificationNo = emp.MedCertificationNo,
                                   Signature = emp.Signature,
                                   LongSignature = emp.LongSignature,
                                   DepartmentId = emp.DepartmentId,
                                   DepartmentName = emp.Department != null ? emp.Department.DepartmentName : null,
                                   EmployeeRoleId = emp.EmployeeRoleId,
                                   EmployeeRoleName = emp.EmployeeRole != null ? emp.EmployeeRole.EmployeeRoleName : null,
                                   //EmployeeTypeId = emp.EmployeeTypeId,
                                   //EmployeeTypeName = emp.EmployeeType != null ? emp.EmployeeType.EmployeeTypeName : null,
                                   IsAppointmentApplicable = emp.IsAppointmentApplicable,
                                   LabSignature = emp.LabSignature,
                                   CreatedOn = emp.CreatedOn,
                                   CreatedBy = emp.CreatedBy,
                                   SignatoryImageName = emp.SignatoryImageName,
                                   DisplaySequence = emp.DisplaySequence,
                                   TDSPercent = emp.TDSPercent,
                                   PANNumber = emp.PANNumber,
                                   IsIncentiveApplicable = emp.IsIncentiveApplicable,
                                   RadiologySignature = emp.RadiologySignature,
                                   BloodGroup = emp.BloodGroup,
                                   NursingCertificationNo = emp.NursingCertificationNo,
                                   HealthProfessionalCertificationNo = emp.HealthProfessionalCertificationNo,
                                   DriverLicenseNo = emp.DriverLicenseNo,
                                   OpdNewPatientServiceItemId = emp.OpdNewPatientServiceItemId,
                                   FollowupServiceItemId = emp.FollowupServiceItemId,
                                   OpdOldPatientServiceItemId = emp.OpdOldPatientServiceItemId,
                                   InternalReferralServiceItemId = emp.InternalReferralServiceItemId
                               })
                                 .OrderBy(e => e.FirstName)
                                 .ThenBy(e => e.LastName).ToList();
            /*var PersonnelList = (from emp in AllEmployee
                                 where emp.EmployeeRoleName != null
                                 join personneltType in operationTheaterDbContext.PersonnelType
                                 on emp.EmployeeRoleName.ToLower() equals personneltType.PersonnelType.ToLower()
                                 orderby emp.EmployeeId
                                 select new OTGetPersonnelsDTO
                                 {
                                     EmployeeId = emp.EmployeeId,
                                     Salutation = emp.Salutation,
                                     FirstName = emp.FirstName,
                                     MiddleName = emp.MiddleName,
                                     LastName = emp.LastName,
                                     FullName = emp.FullName,
                                     DateOfBirth = emp.DateOfBirth,
                                     DateOfJoining = emp.DateOfJoining,
                                     ContactNumber = emp.ContactNumber,
                                     ContactAddress = emp.ContactAddress,
                                     Email = emp.Email,
                                     Gender = emp.Gender,
                                     Extension = emp.Extension,
                                     SpeedDial = emp.SpeedDial,
                                     OfficeHour = emp.OfficeHour,
                                     RoomNo = emp.RoomNo,
                                     IsActive = emp.IsActive,
                                     MedCertificationNo = emp.MedCertificationNo,
                                     Signature = emp.Signature,
                                     LongSignature = emp.LongSignature,
                                     DepartmentId = emp.DepartmentId,
                                     DepartmentName = emp.DepartmentName,
                                     EmployeeRoleId = emp.EmployeeRoleId,
                                     EmployeeRoleName = emp.EmployeeRoleName,
                                     //EmployeeTypeId = emp.EmployeeTypeId,
                                     //EmployeeTypeName = emp.EmployeeTypeName,
                                     IsAppointmentApplicable = emp.IsAppointmentApplicable,
                                     LabSignature = emp.LabSignature,
                                     CreatedOn = emp.CreatedOn,
                                     CreatedBy = emp.CreatedBy,
                                     SignatoryImageName = emp.SignatoryImageName,
                                     DisplaySequence = emp.DisplaySequence,
                                     TDSPercent = emp.TDSPercent,
                                     PANNumber = emp.PANNumber,
                                     IsIncentiveApplicable = emp.IsIncentiveApplicable,
                                     RadiologySignature = emp.RadiologySignature,
                                     BloodGroup = emp.BloodGroup,
                                     NursingCertificationNo = emp.NursingCertificationNo,
                                     HealthProfessionalCertificationNo = emp.HealthProfessionalCertificationNo,
                                     DriverLicenseNo = emp.DriverLicenseNo,
                                     OpdNewPatientServiceItemId = emp.OpdNewPatientServiceItemId,
                                     FollowupServiceItemId = emp.FollowupServiceItemId,
                                     OpdOldPatientServiceItemId = emp.OpdOldPatientServiceItemId,
                                     InternalReferralServiceItemId = emp.InternalReferralServiceItemId,
                                     PersonnelTypeId = personneltType.PersonnelTypeId,
                                     PersonnelTypeName = personneltType.PersonnelType
                                 })
                                 .ToList();*/
            return AllEmployee;
        }

        public object GetAnaesthesiaTypes(OtDbContext operationTheaterDbContext)
        {
            var PersonnelTypes = operationTheaterDbContext.AnaesthesiaTypes
                                                          .OrderBy(a => a.AnaesthesiaType)
                                                          .ToList();
            return PersonnelTypes;
        }

        /// <summary>
        /// Getting a list of Billing Service Items from the database.
        /// </summary>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation.</param>
        /// <returns>Returns a list of Billing Service Item mappings which </returns>
        public object GetAnaesthesiaServiceItems(OtDbContext operationTheaterDbContext)
        {
            var anaesthesiaServiceItems = (from item in operationTheaterDbContext.BillServiceItems
                                           join dept in operationTheaterDbContext.ServiceDepartment
                                           on item.ServiceDepartmentId equals dept.ServiceDepartmentId
                                           where dept.ServiceDepartmentName.Trim().ToUpper() == "ANAESTHESIA"
                                           select new GetAnaesthesiaServiceItemDTO
                                           {
                                               ServiceItemId = item.ServiceItemId,
                                               ItemName = item.ItemName,
                                               IsActive = item.IsActive

                                           }).ToList();

            return anaesthesiaServiceItems;
        }
        /// <summary>
        /// Method is used for get the data of AnaesthesiaType Service Item
        /// </summary>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation.</param>
        /// <returns>Returns a list of Map Anaesthesia Service Item mappings.</returns>
        public object GetOTMapAnaesthesiaServiceItems(OtDbContext operationTheaterDbContext)
        {
            var mapAnaesthesiaServiceItems = (from map in operationTheaterDbContext.Anaesthesias
                                              join serviceItem in operationTheaterDbContext.BillServiceItems
                                                  on map.ServiceItemId equals serviceItem.ServiceItemId
                                              join anaesthesiaType in operationTheaterDbContext.AnaesthesiaTypes
                                                  on map.AnaesthesiaTypeId equals anaesthesiaType.AnaesthesiaTypeId
                                              select new GetOTAnaesthesiaServiceItemList
                                              {
                                                  AnaesthesiaId = map.AnaesthesiaId,
                                                  IsActive = map.IsActive,
                                                  ItemName = serviceItem.ItemName,
                                                  ServiceItemId = serviceItem.ServiceItemId,
                                                  AnaesthesiaType = anaesthesiaType.AnaesthesiaType,
                                                  AnaesthesiaTypeId = anaesthesiaType.AnaesthesiaTypeId
                                              }).ToList();

            return mapAnaesthesiaServiceItems;
        }

        public object GetAnaesthesias(OtDbContext operationTheaterDbContext, int PriceCategoryId)
        {
            var AnaesthesiaList = (from serviceItem in operationTheaterDbContext.BillServiceItems
                                   join priceCatServiceItem in operationTheaterDbContext.BillItemsPriceCategoryMaps on serviceItem.ServiceItemId equals priceCatServiceItem.ServiceItemId
                                   where priceCatServiceItem.PriceCategoryId == PriceCategoryId
                                   join anaesthesia in operationTheaterDbContext.Anaesthesias on serviceItem.ServiceItemId equals anaesthesia.ServiceItemId
                                   where anaesthesia.IsActive == true
                                   orderby serviceItem.ItemName
                                   select new OTGetAnaesthesiaServiceItemDTO
                                   {
                                       AnaesthesiaId = anaesthesia.AnaesthesiaId,
                                       ServiceItemId = serviceItem.ServiceItemId,
                                       ServiceDepartmentId = serviceItem.ServiceDepartmentId,
                                       IntegrationItemId = serviceItem.IntegrationItemId,
                                       IntegrationName = serviceItem.IntegrationName,
                                       ItemCode = serviceItem.ItemCode,
                                       ItemName = serviceItem.ItemName,
                                       IsTaxApplicable = serviceItem.IsTaxApplicable,
                                       Description = serviceItem.Description,
                                       DisplaySeq = serviceItem.DisplaySeq,
                                       IsDoctorMandatory = serviceItem.IsDoctorMandatory,
                                       IsOT = serviceItem.IsOT,
                                       IsProc = serviceItem.IsProc,
                                       ServiceCategoryId = serviceItem.ServiceCategoryId,
                                       AllowMultipleQty = serviceItem.AllowMultipleQty,
                                       DefaultDoctorList = serviceItem.DefaultDoctorList,
                                       IsValidForReporting = serviceItem.IsValidForReporting,
                                       IsErLabApplicable = serviceItem.IsErLabApplicable,
                                       CreatedBy = serviceItem.CreatedBy,
                                       CreatedOn = serviceItem.CreatedOn,
                                       ModifiedOn = serviceItem.ModifiedOn,
                                       ModifiedBy = serviceItem.ModifiedBy,
                                       IsActive = serviceItem.IsActive,
                                       IsIncentiveApplicable = serviceItem.IsIncentiveApplicable,
                                       //BilCfgItemsVsPriceCategoryMap = serviceItem.BilCfgItemsVsPriceCategoryMap,
                                       AnaesthesiaTypeId = anaesthesia.AnaesthesiaTypeId,
                                       Price = priceCatServiceItem.Price
                                   }
                                   ).ToList();
            return AnaesthesiaList;
        }

        /*     public object GetAnaesthesiaDetailsByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
             {
                 var AnaesthesiaList = (from book in operationTheaterDbContext.OTBookingDetails
                                        where book.OTBookingId == OTBookingId
                                        select new OTBookingDetailsDTO
                                        {
                                            UseAnaesthesia = book.UseAnaesthesia,
                                            Anaesthesias = book.Anaesthesias
                                        }
                                        ).ToList();
                 return AnaesthesiaList;
             }*/

        public object GetICDList(OtDbContext operationTheaterDbContext)
        {
            var ICDLists = operationTheaterDbContext.ICDCode
                                                    .Select(a => new OTICDModel
                                                    {
                                                        ICDId = a.ICD10ID,
                                                        ICDCode = a.ICD10Code,
                                                        ICDDescription = a.ICD10Description,
                                                        ICDVersion = a.IcdVersion,
                                                        IsActive = a.Active
                                                    })
                                                    .ToList();
            return ICDLists;
        }

        public object GetOTBillingItems(OtDbContext operationTheaterDbContext)
        {
            var OTBillingItems = (from serviceItem in operationTheaterDbContext.BillServiceItems
                                  where (serviceItem.IsProc == true || serviceItem.IsOT == true)
                                  orderby serviceItem.ItemName
                                  select serviceItem)
                              .ToList();
            return OTBillingItems;
        }

        public object GetOTPrescribers(OtDbContext operationTheaterDbContext)
        {
            var Prescribers = (from emp in operationTheaterDbContext.Employees
                               join dept in operationTheaterDbContext.Departments on emp.DepartmentId equals dept.DepartmentId
                               where emp.IsAppointmentApplicable == true && emp.IsActive == true
                               select new OTPrescriberDTO
                               {
                                   PrescriberId = emp.EmployeeId,
                                   PrescriberName = emp.FullName,
                                   DepartmentId = dept.DepartmentId,
                                   DepartmentName = dept.DepartmentName
                               })
                              .ToList();
            return Prescribers;
        }

        public object CheckListInputTypes(OtDbContext operationTheaterDbContext)
        {
            var CheckListInputTypes = (from inputTypes in operationTheaterDbContext.CheckListInputTypes
                                       select inputTypes)
                              .ToList();
            return CheckListInputTypes;
        }

        public object GetMSTCheckList(OtDbContext operationTheaterDbContext)
        {
            var MSTCheckList = (from checkListItem in operationTheaterDbContext.OTMSTCheckList
                                select checkListItem)
                              .OrderByDescending(c => c.CheckListId)
                              .ToList();
            return MSTCheckList;
        }

        public object GetMSTCheckListBySurgeryId(OtDbContext operationTheaterDbContext, int SurgeryId)
        {
            var MSTCheckList = (from checkListItem in operationTheaterDbContext.OTMSTCheckList
                                join map in operationTheaterDbContext.OTMapSurgeryCheckList on checkListItem.CheckListId equals map.CheckListId
                                where map.SurgeryId == SurgeryId && map.IsActive
                                orderby map.DisplaySequence
                                select checkListItem)
                              .ToList();
            return MSTCheckList;
        }

        public object GetCheckListByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId, int SurgeryId)
        {
            var CheckList = (from checkList in operationTheaterDbContext.OTTXNCheckList
                             where checkList.OTBookingId == OTBookingId
                             join mstCL in operationTheaterDbContext.OTMSTCheckList on checkList.CheckListId equals mstCL.CheckListId
                             join mapCheckList in operationTheaterDbContext.OTMapSurgeryCheckList on mstCL.CheckListId equals mapCheckList.CheckListId
                             where mapCheckList.SurgeryId == SurgeryId && mapCheckList.IsActive == true
                             orderby mapCheckList.DisplaySequence
                             select new OTGetBookingCheckListDTO
                             {
                                 TXNChecklistId = checkList.TXNChecklistId,
                                 CheckListId = checkList.CheckListId,
                                 OTBookingId = checkList.OTBookingId,
                                 PatientId = checkList.PatientId,
                                 PatientVisitId = checkList.PatientVisitId,
                                 CheckListValue = checkList.CheckListValue,
                                 Remarks = checkList.Remarks,
                                 CreatedBy = checkList.CreatedBy,
                                 CreatedOn = checkList.CreatedOn,
                                 ModifiedBy = checkList.ModifiedBy,
                                 ModifiedOn = checkList.ModifiedOn,
                                 DisplayName = mstCL.CheckListName,
                                 InputType = mstCL.InputType
                             })
                              .ToList();
            foreach (var item in CheckList)
            {
                string filePathOrString = item.CheckListValue;

                if (IsFilePath(filePathOrString))
                {
                    try
                    {
                        byte[] imageBytes = File.ReadAllBytes(filePathOrString);
                        string base64Image = Convert.ToBase64String(imageBytes);
                        string fileExtension = Path.GetExtension(filePathOrString).ToLower();

                        // Get MIME type using System.Drawing.Common
                        string mimeType = GetMimeType(filePathOrString);

                        string FileName = Path.GetFileName(filePathOrString);
                        string Type = mimeType;
                        string BinaryData = "data:" + mimeType + ";base64," + base64Image;

                        var checkListValue = new
                        {
                            FileName = FileName,
                            Type = Type,
                            BinaryData = BinaryData
                        };

                        string serializedChecklistValue = JsonConvert.SerializeObject(checkListValue);

                        item.CheckListValue = serializedChecklistValue;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"An error occurred: {ex.Message}");
                    }
                }
            }
            return CheckList;
        }


        static string GetMimeType(string filePath)
        {
            try
            {
                using (var bitmap = new Bitmap(filePath))
                {
                    ImageCodecInfo codec = ImageCodecInfo.GetImageDecoders().First(c => c.FormatID == bitmap.RawFormat.Guid);
                    return codec.MimeType;
                }
            }
            catch (Exception)
            {
                // Handle exceptions if the file is not a valid image
                return "application/octet-stream";
            }
        }

        static bool IsFilePath(string input)
        {
            return !string.IsNullOrWhiteSpace(input) && File.Exists(input);
        }

        public object CheckForDuplicateOTBooking(OtDbContext operationTheaterDbContext, int PatientVisitId, int SurgeryId)
        {
            if (PatientVisitId == null)
            {
                throw new Exception("Invalid PatientVisitId.");
            }
            if (SurgeryId == null || SurgeryId == 0)
            {
                throw new Exception("Invalid SurgeryId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    /*bool isProcedurePresent = operationTheaterDbContext.OTBookingDetails
                                                                .Any(b => b.PatientVisitId == PatientVisitId && b.SurgeryId == SurgeryId && b.Status == ENUM_OT_Booking_Status.Booked);*/
                    var OTBooking = operationTheaterDbContext.OTBookingDetails
                                         .Where(b => b.PatientVisitId == PatientVisitId && b.SurgeryId == SurgeryId)
                                         .OrderByDescending(b => b.OTBookingId)
                                         .FirstOrDefault();
                    if (OTBooking != null) 
                    {
                        return OTBooking.Status;
                    }
                    else
                    {
                        return null;
                    }
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object CheckForProceduresBookedForDateCollision(OtDbContext operationTheaterDbContext, int PatientVisitId, DateTime BookedForDate)
        {
            if (PatientVisitId == null)
            {
                throw new Exception("Invalid PatientVisitId.");
            }
            if (BookedForDate == null)
            {
                throw new Exception("Invalid BookedForDate.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = operationTheaterDbContext.OTBookingDetails
                                                             .Where(a => a.PatientVisitId == PatientVisitId && a.BookedForDate == BookedForDate && a.Status != ENUM_OT_Booking_Status.Cancelled && a.Status != ENUM_OT_Booking_Status.Concluded)
                                                             .FirstOrDefault();
                    if (OTBooking != null)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object GetOTSurgeries(OtDbContext operationTheaterDbContext)
        {
            var OTMachineList = operationTheaterDbContext.OTSurgery
                                                          .OrderBy(sur => sur.SurgeryName)
                                                          .ToList();
            return OTMachineList;
        }

        public object GetMapSurgeryCheckListBySurgeryId(OtDbContext operationTheaterDbContext, int surgeryId)
        {
            var MapSurgeryCheckListItems = operationTheaterDbContext.OTMapSurgeryCheckList
                                                          .Where(map => map.SurgeryId == surgeryId)
                                                          .OrderBy(sur => sur.DisplaySequence)
                                                          .ToList();
            return MapSurgeryCheckListItems;
        }

        public object GetTeamInfoByOTBooingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            var teamInfo = (from team in operationTheaterDbContext.OTTeamInfo
                            where team.OTBookingId == OTBookingId
                            join pType in operationTheaterDbContext.PersonnelType on team.PersonnelTypeId equals pType.PersonnelTypeId
                            select new
                            {
                                TeamInfoId = team.TeamInfoId,
                                PersonnelTypeId = team.PersonnelTypeId,
                                EmployeeId = team.EmployeeId,
                                OTBookingId = team.OTBookingId,
                                PatientId = team.PatientId,
                                PatientVisitId = team.PatientVisitId,
                                CreatedBy = team.CreatedBy,
                                CreatedOn = team.CreatedOn,
                                ModifiedBy = team.ModifiedBy,
                                ModifiedOn = team.ModifiedOn,
                                PersonnelType = pType.PersonnelType
                            })
                            .OrderBy(t => t.TeamInfoId)
                            .ToList();
            return teamInfo;
        }

        public object GetImplantDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            var ImplantDetail = operationTheaterDbContext.ImplantDetail
                                                          .Where(i => i.OTBookingId == OTBookingId)
                                                          .OrderBy(sur => sur.ImplantDetailId)
                                                          .ToList();
            return ImplantDetail;
        }

        public object GetMachineDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            var MachineDetail = (from machineDet in operationTheaterDbContext.MachineDetail
                                 where machineDet.OTBookingId == OTBookingId
                                 join machine in operationTheaterDbContext.OTMachines on machineDet.OTMachineId equals machine.OTMachineId
                                 select new OTGetMachineDetailDTO
                                 {
                                     MachineDetailId = machineDet.MachineDetailId,
                                     OTMachineId = machineDet.OTMachineId,
                                     MachineName = machine.MachineName,
                                     Charge = machineDet.Charge,
                                     IsActive = machineDet.IsActive,
                                     PatientId = machineDet.PatientId,
                                     PatientVisitId = machineDet.PatientVisitId,
                                     OTBookingId = machineDet.OTBookingId,
                                     CreatedBy = machineDet.CreatedBy,
                                     CreatedOn = machineDet.CreatedOn,
                                     ModifiedBy = machineDet.ModifiedBy,
                                     ModifiedOn = machineDet.ModifiedOn,
                                 }).ToList().OrderBy(x => x.MachineDetailId);
            return MachineDetail;
        }

        public object GetAnaesthesiaDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            var anaesthesia = operationTheaterDbContext.OTBookingDetails
                                                          .Where(i => i.OTBookingId == OTBookingId)
                                                          .Select(book => book.Anaesthesias)
                                                          .FirstOrDefault();
            return anaesthesia;
        }

        public object GetConcludeDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId)
        {
            var anaesthesia = (from book in operationTheaterDbContext.OTBookingDetails
                               where book.OTBookingId == OTBookingId
                               select new OTConcludeBookingDTO
                               {
                                   OTStartTime = book.OTStartTime,
                                   OTConcludeTime = book.OTConcludeTime,
                                   IsOnScheduledTime = book.IsOnScheduledTime,
                                   OutTimeCharge = book.OutTimeCharge,
                                   ConcludeRemarks = book.ConcludeRemarks,
                                   IsSeroPositive = book.IsSeroPositive,
                               }).FirstOrDefault();

            return anaesthesia;
        }

        public object GetOTSummaryReport(OtDbContext operationTheaterDbContext, bool IsOTStartDate, DateTime FromDate, DateTime ToDate, int? PrescribedBy)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@IsOTStartDate", IsOTStartDate),
                new SqlParameter("@FromDate", FromDate),
                new SqlParameter("@ToDate", ToDate),
                new SqlParameter("@PrescribedBy", PrescribedBy),
            };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_RPT_OT_Summary_Report", paramList, operationTheaterDbContext);
            var OTSummaryReport = OTSummaryReportDTO.MapDataTableToSingleObject(dt);
            return OTSummaryReport;
        }

        public object GetOtTemplates(OtDbContext operationTheaterDbContext)
        {
            var templates = (from temp in operationTheaterDbContext.ClinicalTemplates
                             where temp.TemplateType == ENUM_TemplateType.OT
                             select temp
                            ).ToList();
            return templates;
        }
        public object GetOTFinancialReport(OtDbContext operationTheaterDbContext, bool IsOTStartDate, DateTime FromDate, DateTime ToDate, int? PrescribedBy)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                new SqlParameter("@IsOTStartDate", IsOTStartDate),
                new SqlParameter("@FromDate", FromDate),
                new SqlParameter("@ToDate", ToDate),
                new SqlParameter("@PrescribedBy", PrescribedBy),
            };
            DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_RPT_OT_Financial_Report", paramList, operationTheaterDbContext);
            var OTSummaryReport = FinancialReportVM.MapDataTableToSingleObject(dt);
            return OTSummaryReport;
        }

        #endregion


        #region POST

        public object SaveOTMachine(RbacUser currentUser, OTMachineDTO otMachineDTO, OtDbContext operationTheaterDbContext)
        {
            if (otMachineDTO == null)
            {
                throw new Exception("Invalid OT Machine Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTMachineModel OtMachine = new OTMachineModel();
                    OtMachine.OTMachineId = otMachineDTO.OTMachineId;
                    OtMachine.MachineName = otMachineDTO.MachineName;
                    OtMachine.MachineCharge = otMachineDTO.MachineCharge;
                    OtMachine.CreatedBy = currentUser.EmployeeId;
                    OtMachine.CreatedOn = DateTime.Now;
                    OtMachine.IsActive = otMachineDTO.IsActive;
                    operationTheaterDbContext.OTMachines.Add(OtMachine);
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtMachine.OTMachineId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SavePersonnelType(RbacUser currentUser, OTPersonnelTypeDTO otPersonnelTypeDTO, OtDbContext operationTheaterDbContext)
        {
            if (otPersonnelTypeDTO == null)
            {
                throw new Exception("Invalid OT PersonnelType Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTPersonnelTypeModel OtPersonnel = new OTPersonnelTypeModel();
                    OtPersonnel.PersonnelTypeId = otPersonnelTypeDTO.PersonnelTypeId;
                    OtPersonnel.PersonnelType = otPersonnelTypeDTO.PersonnelType;
                    OtPersonnel.IsIncentiveApplicable = otPersonnelTypeDTO.IsIncentiveApplicable;
                    OtPersonnel.CreatedBy = currentUser.EmployeeId;
                    OtPersonnel.CreatedOn = DateTime.Now;
                    OtPersonnel.IsActive = otPersonnelTypeDTO.IsActive;
                    operationTheaterDbContext.PersonnelType.Add(OtPersonnel);
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtPersonnel.PersonnelTypeId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveNewOTBooking(RbacUser currentUser, OTBookingDetailsDTO otBookingDTO, OtDbContext operationTheaterDbContext)
        {
            if (otBookingDTO == null)
            {
                throw new Exception("Invalid OT Booking.");
            }
            // TODO: Handle Billing Item mandatory at Server-Side.
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTBookingDetailsModel OTBookingDetails = new OTBookingDetailsModel();
                    OTBookingDetails.PatientId = otBookingDTO.PatientId;
                    OTBookingDetails.PatientVisitId = otBookingDTO.PatientVisitId;
                    OTBookingDetails.BookedForDate = otBookingDTO.BookedForDate;
                    OTBookingDetails.ICDDiagnosis = otBookingDTO.ICDDiagnosis;
                    OTBookingDetails.OtherDiagnosis = otBookingDTO.OtherDiagnosis;
                    OTBookingDetails.BillingItems = otBookingDTO.BillingItems;
                    OTBookingDetails.UseAnaesthesia = otBookingDTO.UseAnaesthesia;
                    OTBookingDetails.Anaesthesias = otBookingDTO.Anaesthesias;
                    /*OTBookingDetails.OTMachineId = otBookingDTO.OTMachineId;*/
                    OTBookingDetails.Remarks = otBookingDTO.Remarks;
                    OTBookingDetails.CancellationRemarks = null;
                    OTBookingDetails.Status = otBookingDTO.Status;
                    OTBookingDetails.CreatedBy = currentUser.EmployeeId;
                    OTBookingDetails.CreatedOn = DateTime.Now;
                    OTBookingDetails.OTExpectedDuration = otBookingDTO.OTExpectedDuration;
                    OTBookingDetails.SurgeryId = otBookingDTO.SurgeryId;
                    OTBookingDetails.SurgeryType = otBookingDTO.SurgeryType;
                    OTBookingDetails.PrescribedBy = otBookingDTO.PrescribedBy;
                    OTBookingDetails.OTPriority = otBookingDTO.OTPriority;
                    OTBookingDetails.OTStartTime = otBookingDTO.OTStartTime;
                    OTBookingDetails.OTConcludeTime = otBookingDTO.OTConcludeTime;
                    OTBookingDetails.IsOnScheduledTime = otBookingDTO.IsOnScheduledTime;
                    OTBookingDetails.IsSeroPositive = otBookingDTO.IsSeroPositive;
                    OTBookingDetails.OutTimeCharge = otBookingDTO.OutTimeCharge;
                    OTBookingDetails.ConcludeRemarks = otBookingDTO.ConcludeRemarks;
                    operationTheaterDbContext.OTBookingDetails.Add(OTBookingDetails);
                    //operationTheaterDbContext.SaveChanges();

                    /*foreach (var team in otBookingDTO.OTTeamInfo)
                    {
                        OTTeamInfoModel OTTeamInfo = new OTTeamInfoModel();
                        OTTeamInfo.PersonnelTypeId = team.PersonnelTypeId;
                        OTTeamInfo.EmployeeId = team.EmployeeId;
                        OTTeamInfo.OTBookingId = OTBookingDetails.OTBookingId;
                        OTTeamInfo.PatientId = otBookingDTO.PatientId;
                        OTTeamInfo.PatientVisitId = otBookingDTO.PatientVisitId;
                        OTTeamInfo.CreatedBy = currentUser.EmployeeId;
                        OTTeamInfo.CreatedOn = DateTime.Now;
                        operationTheaterDbContext.OTTeamInfo.Add(OTTeamInfo);
                    }*/

                    AddDiagnosis(otBookingDTO.Diagnoses, otBookingDTO.PatientId, otBookingDTO.PatientVisitId, operationTheaterDbContext, currentUser);

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return new { OTBookingId = OTBookingDetails.OTBookingId };
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }
 

        public static void AddDiagnosis(List<OTPostDiagnosisDTO> Diagnoses, int PatientId, int PatientVisitId, OtDbContext otDbContext, RbacUser currentUser)
        {
            DateTime CurrentDateTime = DateTime.Now;

            // Fetch existing diagnoses from the database
            List<DiagnosisModel> ExistingDiagnoses = otDbContext.Diagnoses
                .Where(diag => diag.PatientId == PatientId && diag.PatientVisitId == PatientVisitId)
                .ToList();

            // New diagnoses to add (where DiagnosisId == 0)
            List<OTPostDiagnosisDTO> NewDiagnoses = Diagnoses
                .Where(d => d.DiagnosisId == 0)
                .ToList();

            // Handle deactivation of existing diagnoses not present in the incoming list
            List<int> IncomingDiagnosisIds = Diagnoses
                .Where(d => d.DiagnosisId != 0)
                .Select(d => d.DiagnosisId)
                .ToList();

            List<DiagnosisModel> DeactivatedDiagnoses = ExistingDiagnoses
                .Where(d => d.IsActive && !IncomingDiagnosisIds.Contains(d.DiagnosisId))
                .ToList();

            foreach (DiagnosisModel diag in DeactivatedDiagnoses)
            {
                diag.IsActive = false;
                diag.ModifiedOn = CurrentDateTime;
                diag.ModifiedBy = currentUser.EmployeeId;

               /* // Add deactivation entry to modification history
                var modification = new
                {
                    Modification = "Deactivated",
                    ModifiedBy = currentUser.EmployeeId,
                    ModifiedOn = CurrentDateTime
                };
                diag.ModificationHistory += (string.IsNullOrEmpty(diag.ModificationHistory) ? "" : ",") + Newtonsoft.Json.JsonConvert.SerializeObject(modification);*/
            }

            // Add new diagnoses
            foreach (OTPostDiagnosisDTO diag in NewDiagnoses)
            {
                DiagnosisModel newDiag = new DiagnosisModel
                {
                    PatientId = PatientId,
                    ICDId = diag.ICDId,
                    PatientVisitId = PatientVisitId,
                    DiagnosisCode = diag.DiagnosisCode,
                    DiagnosisCodeDescription = diag.DiagnosisCodeDescription,
                    DiagnosisType = diag.DiagnosisType,
                    IsCauseOfDeath = diag.IsCauseOfDeath,
                    Remarks = diag.Remarks,
                    ModificationHistory = "", // Initialize with empty string or any initial history
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = CurrentDateTime,
                    IsActive = true
                };
                otDbContext.Diagnoses.Add(newDiag);
            }

            // Reactivate diagnoses if present in the incoming list but deactivated in the database
            List<DiagnosisModel> ReactivatedDiagnoses = ExistingDiagnoses
                .Where(d => !d.IsActive && IncomingDiagnosisIds.Contains(d.DiagnosisId))
                .ToList();

            foreach (DiagnosisModel diag in ReactivatedDiagnoses)
            {
                diag.IsActive = true;
                diag.ModifiedOn = CurrentDateTime;
                diag.ModifiedBy = currentUser.EmployeeId;

                /*// Add reactivation entry to modification history
                var modification = new
                {
                    Modification = "Activated",
                    ModifiedBy = currentUser.EmployeeId,
                    ModifiedOn = CurrentDateTime
                };
                diag.ModificationHistory += (string.IsNullOrEmpty(diag.ModificationHistory) ? "" : ",") + Newtonsoft.Json.JsonConvert.SerializeObject(modification);*/
            }
        }

        public object SaveMSTCheckList(RbacUser currentUser, OTPostMSTCheckListDTO oTPostMSTCheckListDTO, OtDbContext operationTheaterDbContext)
        {
            if (oTPostMSTCheckListDTO == null)
            {
                throw new Exception("Invalid OT CheckList Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTMSTCheckListModel OTCheckList = new OTMSTCheckListModel();
                    OTCheckList.ServiceItemId = oTPostMSTCheckListDTO.ServiceItemId;
                    OTCheckList.CheckListName = oTPostMSTCheckListDTO.CheckListName;
                    OTCheckList.DisplayName = oTPostMSTCheckListDTO.DisplayName;
                    OTCheckList.InputType = oTPostMSTCheckListDTO.InputType;
                    OTCheckList.IsMandatory = oTPostMSTCheckListDTO.IsMandatory;
                    OTCheckList.DisplaySequence = oTPostMSTCheckListDTO.DisplaySequence;
                    OTCheckList.IsActive = oTPostMSTCheckListDTO.IsActive;
                    OTCheckList.CreatedBy = currentUser.EmployeeId;
                    OTCheckList.CreatedOn = DateTime.Now;
                    operationTheaterDbContext.OTMSTCheckList.Add(OTCheckList);
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OTCheckList.CheckListId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveCheckList(RbacUser currentUser, OTPostCheckListDTO oTPostCheckListDTO, OtDbContext operationTheaterDbContext)
        {
            if (oTPostCheckListDTO == null || oTPostCheckListDTO.CheckList.Count == 0)
            {
                throw new Exception("Invalid OT CheckList Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var dateTime = DateTime.Now;
                    var otCheckListItems = new List<OTCheckListModel>();
                    var inputTypeFileCheckistIds = (from checklist in operationTheaterDbContext.OTMSTCheckList
                                                    where checklist.InputType == "File"
                                                    select checklist.CheckListId).ToList();
                    foreach (var item in oTPostCheckListDTO.CheckList)
                    {
                        OTCheckListModel OTCheckList = new OTCheckListModel();
                        OTCheckList.CheckListId = item.CheckListId;
                        if (item.CheckListValue != null && inputTypeFileCheckistIds.Contains(item.CheckListId))
                        {
                            var file = JsonConvert.DeserializeObject<OTCheckListFileDTO>(item.CheckListValue);
                            if (file != null)
                            {
                                try
                                {
                                    var location = (from dbc in operationTheaterDbContext.CoreCfgParameter
                                                    where dbc.ParameterGroupName == "OT"
                                                    && dbc.ParameterName == "OTCheckListFileUploadLocation"
                                                    select dbc.ParameterValue).FirstOrDefault();
                                    if (location == null)
                                    {
                                        throw new Exception("Please set OTCheckListFileUploadLocation.");
                                    }
                                    if (!Directory.Exists(location))
                                    {
                                        Directory.CreateDirectory(location);
                                    }
                                    string imgPath = Path.Combine(location, Path.GetFileNameWithoutExtension(file.FileName) + "_" + Guid.NewGuid() + Path.GetExtension(file.FileName));
                                    byte[] imageBytes = Convert.FromBase64String(file.BinaryData);
                                    File.WriteAllBytes(imgPath, imageBytes);
                                    OTCheckList.CheckListValue = imgPath;
                                }
                                catch (Exception ex)
                                {
                                    throw new Exception("Unble to save CheckList File." + " " + "Error: " + ex.Message);
                                }
                            }
                        }
                        else
                        {
                            OTCheckList.CheckListValue = item.CheckListValue;
                        }
                        OTCheckList.Remarks = item.Remarks;
                        OTCheckList.OTBookingId = oTPostCheckListDTO.OTBookingId;
                        OTCheckList.PatientId = oTPostCheckListDTO.PatientId;
                        OTCheckList.PatientVisitId = oTPostCheckListDTO.PatientVisitId;
                        OTCheckList.CreatedBy = currentUser.EmployeeId;
                        OTCheckList.CreatedOn = dateTime;
                        otCheckListItems.Add(OTCheckList);
                    }
                    operationTheaterDbContext.OTTXNCheckList.AddRange(otCheckListItems);
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return oTPostCheckListDTO.OTBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveOTSurgery(RbacUser currentUser, OTSurgeryDTO otSurgeryDTO, OtDbContext operationTheaterDbContext)
        {
            if (otSurgeryDTO == null)
            {
                throw new Exception("Invalid OT Surgery Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTSurgeryModel OtSurgery = new OTSurgeryModel();
                    OtSurgery.SurgeryId = otSurgeryDTO.SurgeryId;
                    OtSurgery.SurgeryName = otSurgeryDTO.SurgeryName;
                    OtSurgery.SurgeryCode = otSurgeryDTO.SurgeryCode;
                    OtSurgery.Description = otSurgeryDTO.Description;
                    OtSurgery.CreatedBy = currentUser.EmployeeId;
                    OtSurgery.CreatedOn = DateTime.Now;
                    OtSurgery.IsActive = otSurgeryDTO.IsActive;
                    OtSurgery.IsSystemDefault = false;  // Sanjeev :    Restriction to make System Default Surgery while adding Surgery From API
                    operationTheaterDbContext.OTSurgery.Add(OtSurgery);
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtSurgery.SurgeryId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveImplantDetail(RbacUser currentUser, OTPostImplantDetailDTO Implant, int PatientId, int PatientVisitId, int OTBookingId, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (Implant == null)
            {
                throw new Exception("Implant can't be null.");
            }
            if (Implant != null && string.IsNullOrWhiteSpace(Implant.ImplantName))
            {
                throw new Exception("ImplantName can't be null or empty.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTImplantDetailModel newImplant = new OTImplantDetailModel();
                    newImplant.PatientId = PatientId;
                    newImplant.PatientVisitId = PatientVisitId;
                    newImplant.OTBookingId = OTBookingId;
                    newImplant.ImplantName = Implant.ImplantName;
                    newImplant.Quantity = Implant.Quantity;
                    newImplant.Charge = Implant.Charge;
                    newImplant.Remarks = Implant.Remarks;
                    newImplant.CreatedBy = currentUser.EmployeeId;
                    newImplant.CreatedOn = DateTime.Now;
                    newImplant.IsActive = true;
                    operationTheaterDbContext.ImplantDetail.Add(newImplant);

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return newImplant;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveMachineDetail(RbacUser currentUser, OTPostMachineDetailDTO machine, OtDbContext operationTheaterDbContext)
        {
            if (machine == null)
            {
                throw new Exception("MachineDetail can't be null.");
            }
            if (machine.OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (machine.OTMachineId == 0)
            {
                throw new Exception("MachineId can't be zero.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var existingMachineDetail = (from macDetail in operationTheaterDbContext.MachineDetail
                                                 where macDetail.OTMachineId == machine.OTMachineId && macDetail.OTBookingId == machine.OTBookingId
                                                 select macDetail)
                                                 .FirstOrDefault();
                    if (existingMachineDetail != null)
                    {
                        existingMachineDetail.IsActive = true;
                        existingMachineDetail.Charge = machine.Charge;
                        existingMachineDetail.ModifiedBy = currentUser.EmployeeId;
                        existingMachineDetail.ModifiedOn = DateTime.Now;

                        operationTheaterDbContext.SaveChanges();
                        dbContextTransaction.Commit();
                        return existingMachineDetail;
                    }
                    else
                    {
                        OTMachineDetailModel newMachine = new OTMachineDetailModel();
                        newMachine.PatientId = machine.PatientId;
                        newMachine.PatientVisitId = machine.PatientVisitId;
                        newMachine.OTBookingId = machine.OTBookingId;
                        newMachine.OTMachineId = machine.OTMachineId;
                        newMachine.Charge = machine.Charge;
                        newMachine.CreatedBy = currentUser.EmployeeId;
                        newMachine.CreatedOn = DateTime.Now;
                        newMachine.IsActive = true;
                        operationTheaterDbContext.MachineDetail.Add(newMachine);

                        operationTheaterDbContext.SaveChanges();
                        dbContextTransaction.Commit();
                        return newMachine;
                    }

                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        #endregion
        public object SaveAnaesthesiaType(RbacUser currentUser, OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO, OtDbContext operationTheaterDbContext)
        {
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (otPostAnaesthesiaTypeDTO == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(otPostAnaesthesiaTypeDTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(otPostAnaesthesiaTypeDTO)} is null.");
                    }


                    var otAnaesthesiaTypeModel = new OTAnaesthesiaTypeModel()
                    {
                        AnaesthesiaType = otPostAnaesthesiaTypeDTO.AnaesthesiaType,
                        IsActive = otPostAnaesthesiaTypeDTO.IsActive,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    operationTheaterDbContext.AnaesthesiaTypes.Add(otAnaesthesiaTypeModel);
                    operationTheaterDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return otPostAnaesthesiaTypeDTO;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the Anaesthesiatype: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the Anaesthesiatype.{ex.Message}");

                }
            }
        }
        /// <summary>
        /// Method implement for add the Map Anaesthesia Service Item
        /// </summary>
        /// <param name="currentUser">Identity of user that performing Updataion </param>
        /// <param name="otMapAnaesthesiaServiceItemDTO">The DTO contain details of the Anaesthesia Service Item for mapping when API call for add Map Anaesthesia Service Items</param>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation</param>
        /// <returns>Returns the AnaesthesiaTypeId of the updated Anaesthesia Service item</returns>
        /// <exception cref="InvalidOperationException">Thrown when an error occurs during the update operation</exception>
        public object SaveOTMapAnaesthesiaType(RbacUser currentUser, OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO, OtDbContext operationTheaterDbContext)
        {
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (otMapAnaesthesiaServiceItemDTO == null)
                    {
                        Log.Error($"Nothing to save as  {nameof(otMapAnaesthesiaServiceItemDTO)} is null.");
                        throw new ArgumentNullException($"Nothing to save as {nameof(otMapAnaesthesiaServiceItemDTO)} is null.");
                    }
                    var existingAnaesthesia = operationTheaterDbContext.Anaesthesias
                     .Where(x => x.AnaesthesiaTypeId == otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId && x.ServiceItemId == otMapAnaesthesiaServiceItemDTO.ServiceItemId)
                      .FirstOrDefault();

                    if (existingAnaesthesia != null)
                    {
                        Log.Error($"Anaesthesia with AnaesthesiaType {otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId} and ServiceItem {otMapAnaesthesiaServiceItemDTO.ServiceItemId} already exists.");
                        throw new Exception($"Anaesthesia with AnaesthesiaType{otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId} and ServiceItem {otMapAnaesthesiaServiceItemDTO.ServiceItemId} already exists.");
                    }

                    var otAnaesthesiaModel = new OTAnaesthesiaModel()
                    {
                        AnaesthesiaTypeId = otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId,
                        IsActive = otMapAnaesthesiaServiceItemDTO.IsActive,
                        ServiceItemId = otMapAnaesthesiaServiceItemDTO.ServiceItemId,
                        CreatedBy = currentUser.EmployeeId,
                        CreatedOn = System.DateTime.Now
                    };
                    operationTheaterDbContext.Anaesthesias.Add(otAnaesthesiaModel);
                    operationTheaterDbContext.SaveChanges();

                    dbContextTransaction.Commit();
                    return otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId;
                }

                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while saving the Anaesthesia Service Item: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while saving the Anaesthesia Service Item.{ex.Message}");

                }
            }
        }


        #region PUT

        public object UpdateOTMachine(RbacUser currentUser, OTMachineDTO otMachineDTO, OtDbContext operationTheaterDbContext)
        {
            if (otMachineDTO == null)
            {
                throw new Exception("Invalid TO Machine Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OtMachine = (from machine in operationTheaterDbContext.OTMachines
                                     where machine.OTMachineId == otMachineDTO.OTMachineId
                                     select machine).FirstOrDefault();
                    if (OtMachine == null)
                    {
                        throw new Exception("OT Machine not found.");
                    }
                    OtMachine.MachineName = otMachineDTO.MachineName;
                    OtMachine.MachineCharge = otMachineDTO.MachineCharge;
                    OtMachine.IsActive = otMachineDTO.IsActive;
                    OtMachine.ModifiedBy = currentUser.EmployeeId;
                    OtMachine.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtMachine.OTMachineId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdatePersonnelType(RbacUser currentUser, OTPersonnelTypeDTO otPersonnelTypeDTO, OtDbContext operationTheaterDbContext)
        {
            if (otPersonnelTypeDTO == null)
            {
                throw new Exception("Invalid PersonnelType Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OtPersonnel = (from machine in operationTheaterDbContext.PersonnelType
                                       where machine.PersonnelTypeId == otPersonnelTypeDTO.PersonnelTypeId
                                       select machine).FirstOrDefault();
                    if (OtPersonnel == null)
                    {
                        throw new Exception("OT PersonnelType not found.");
                    }
                    OtPersonnel.PersonnelType = otPersonnelTypeDTO.PersonnelType;
                    OtPersonnel.IsIncentiveApplicable = otPersonnelTypeDTO.IsIncentiveApplicable;
                    OtPersonnel.IsActive = otPersonnelTypeDTO.IsActive;
                    OtPersonnel.ModifiedBy = currentUser.EmployeeId;
                    OtPersonnel.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtPersonnel.PersonnelTypeId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }

            }
        }

        public object UpdateOTBooking(RbacUser currentUser, OTBookingDetailsDTO otBookingDTO, OtDbContext operationTheaterDbContext)
        {
            if (otBookingDTO == null)
            {
                throw new Exception("Unable to update OT Booking.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBookingDetails = (from booking in operationTheaterDbContext.OTBookingDetails
                                            where booking.OTBookingId == otBookingDTO.OTBookingId
                                            select booking).FirstOrDefault();
                    OTBookingDetails.BookedForDate = otBookingDTO.BookedForDate;
                    OTBookingDetails.ICDDiagnosis = otBookingDTO.ICDDiagnosis;
                    OTBookingDetails.OtherDiagnosis = otBookingDTO.OtherDiagnosis;
                    OTBookingDetails.BillingItems = otBookingDTO.BillingItems;
                    OTBookingDetails.UseAnaesthesia = otBookingDTO.UseAnaesthesia;
                    OTBookingDetails.Anaesthesias = otBookingDTO.Anaesthesias;
                    /*OTBookingDetails.OTMachineId = otBookingDTO.OTMachineId;*/
                    OTBookingDetails.Remarks = otBookingDTO.Remarks;
                    OTBookingDetails.CancellationRemarks = null;

                    OTBookingDetails.OTExpectedDuration = otBookingDTO.OTExpectedDuration;
                    OTBookingDetails.SurgeryId = otBookingDTO.SurgeryId;
                    OTBookingDetails.SurgeryType = otBookingDTO.SurgeryType;
                    OTBookingDetails.PrescribedBy = otBookingDTO.PrescribedBy;
                    OTBookingDetails.OTPriority = otBookingDTO.OTPriority;

                    OTBookingDetails.OTStartTime = otBookingDTO.OTStartTime;
                    OTBookingDetails.OTConcludeTime = otBookingDTO.OTConcludeTime;
                    OTBookingDetails.IsOnScheduledTime = otBookingDTO.IsOnScheduledTime;
                    OTBookingDetails.IsSeroPositive = otBookingDTO.IsSeroPositive;
                    OTBookingDetails.OutTimeCharge = otBookingDTO.OutTimeCharge;
                    OTBookingDetails.ConcludeRemarks = otBookingDTO.ConcludeRemarks;

                    OTBookingDetails.ModifiedBy = currentUser.EmployeeId;
                    OTBookingDetails.ModifiedOn = DateTime.Now;

                    /*var allOTTeamPersonnels = otBookingDTO.OTTeamInfo;
                    var existingPersonnels = (from per in operationTheaterDbContext.OTTeamInfo
                                              where per.OTBookingId == otBookingDTO.OTBookingId
                                              select new OTPostTeamInfoDTO
                                              {
                                                  TeamInfoId = per.TeamInfoId,
                                                  PersonnelTypeId = per.PersonnelTypeId,
                                                  EmployeeId = per.EmployeeId
                                              }).ToList();
                    var newPersonnels = allOTTeamPersonnels.Where(personnel => personnel.TeamInfoId == 0).ToList();
                    var removedPersonnels = existingPersonnels.Where(personnel => !allOTTeamPersonnels.Any(p => p.TeamInfoId == personnel.TeamInfoId)).ToList();

                    if(removedPersonnels.Count > 0)
                    {
                        foreach (var removedPersonnel in removedPersonnels)
                        {
                            var personnelToRemove = operationTheaterDbContext.OTTeamInfo
                                .FirstOrDefault(p => p.TeamInfoId == removedPersonnel.TeamInfoId);

                            if (personnelToRemove != null)
                            {
                                operationTheaterDbContext.OTTeamInfo.Remove(personnelToRemove);
                            }
                        }
                    }
                    
                    if(newPersonnels.Count > 0)
                    {
                        foreach (var personnel in newPersonnels)
                        {
                            OTTeamInfoModel OTTeamInfo = new OTTeamInfoModel();
                            OTTeamInfo.PersonnelTypeId = personnel.PersonnelTypeId;
                            OTTeamInfo.EmployeeId = personnel.EmployeeId;
                            OTTeamInfo.OTBookingId = OTBookingDetails.OTBookingId;
                            OTTeamInfo.PatientId = otBookingDTO.PatientId;
                            OTTeamInfo.PatientVisitId = otBookingDTO.PatientVisitId;
                            OTTeamInfo.CreatedBy = currentUser.EmployeeId;
                            OTTeamInfo.CreatedOn = DateTime.Now;
                            operationTheaterDbContext.OTTeamInfo.Add(OTTeamInfo);
                        }
                    }*/
                    AddDiagnosis(otBookingDTO.Diagnoses, otBookingDTO.PatientId, otBookingDTO.PatientVisitId, operationTheaterDbContext, currentUser);
                    operationTheaterDbContext.SaveChanges();

                    var responseData = (from book in operationTheaterDbContext.OTBookingDetails
                                        where book.OTBookingId == otBookingDTO.OTBookingId
                                        join pat in operationTheaterDbContext.Patient on book.PatientId equals pat.PatientId
                                        join vis in operationTheaterDbContext.Visit on book.PatientVisitId equals vis.PatientVisitId
                                        select new
                                        {
                                            PatientName = pat.ShortName,
                                            PatientCode = pat.PatientCode,
                                            Address = pat.Address,
                                            AgeSex = pat.Age + pat.Gender.Substring(0, 1),
                                            PhoneNumber = pat.PhoneNumber,
                                            SurgeryId = book.SurgeryId,
                                            SurgeryType = book.SurgeryType,
                                            PrescribedBy = book.PrescribedBy,
                                            BookedForDate = book.BookedForDate,
                                            OTPriority = book.OTPriority,
                                            Status = book.Status,
                                            OTExpectedDuration = book.OTExpectedDuration,
                                            OtherDiagnosis = book.OtherDiagnosis,
                                            Remarks = book.Remarks,
                                            VisitType = vis.VisitType
                                        }).FirstOrDefault();
                    if (responseData == null)
                    {
                        dbContextTransaction.Rollback();
                        throw new Exception("Unable to get Response Data.");
                    }

                    dbContextTransaction.Commit();
                    return responseData;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdateAnaesthesiaDetails(RbacUser currentUser, int OTBookingId, bool UseAneasthesia, string AnaesthesiaDetails, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (UseAneasthesia == true && string.IsNullOrEmpty(AnaesthesiaDetails) == true)
            {
                throw new Exception("Empty AnaesthesiaDetails.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = (from booking in operationTheaterDbContext.OTBookingDetails
                                     where booking.OTBookingId == OTBookingId
                                     select booking).FirstOrDefault();


                    if (OTBooking == null)
                    {
                        throw new Exception("Cannot find OT Booking Details for the OTBookingId: " + OTBookingId);
                    }

                    if (UseAneasthesia == false)
                    {
                        OTBooking.UseAnaesthesia = false;
                    }

                    else
                    {
                        OTBooking.UseAnaesthesia = true;
                        OTBooking.Anaesthesias = AnaesthesiaDetails;
                    }

                    OTBooking.ModifiedBy = currentUser.EmployeeId;
                    OTBooking.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return OTBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object CancelOTBooking(RbacUser currentUser, int otBookingId, string cancellationRemarks, OtDbContext operationTheaterDbContext)
        {
            if (otBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = (from booking in operationTheaterDbContext.OTBookingDetails
                                     where booking.OTBookingId == otBookingId
                                     select booking).FirstOrDefault();
                    if (OTBooking == null)
                    {
                        throw new Exception("Cannot find OT Booking Details for the OTBookingId: " + otBookingId);
                    }

                    OTBooking.CancellationRemarks = cancellationRemarks;
                    OTBooking.Status = ENUM_OT_Booking_Status.Cancelled;
                    OTBooking.ModifiedBy = currentUser.EmployeeId;
                    OTBooking.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return otBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object ConfirmOTBooking(RbacUser currentUser, int otBookingId, OtDbContext operationTheaterDbContext)
        {
            if (otBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = (from booking in operationTheaterDbContext.OTBookingDetails
                                     where booking.OTBookingId == otBookingId
                                     select booking).FirstOrDefault();
                    if (OTBooking == null)
                    {
                        throw new Exception("Cannot find OT Booking Details for the OTBookingId: " + otBookingId);
                    }

                    OTBooking.Status = ENUM_OT_Booking_Status.Scheduled;
                    OTBooking.ModifiedBy = currentUser.EmployeeId;
                    OTBooking.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return otBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object CheckInOTBooking(RbacUser currentUser, int otBookingId, OtDbContext operationTheaterDbContext)
        {
            if (otBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = (from booking in operationTheaterDbContext.OTBookingDetails
                                     where booking.OTBookingId == otBookingId
                                     select booking).FirstOrDefault();
                    if (OTBooking == null)
                    {
                        throw new Exception("Cannot find OT Booking Details for the OTBookingId: " + otBookingId);
                    }

                    OTBooking.Status = ENUM_OT_Booking_Status.InProgress;
                    OTBooking.ModifiedBy = currentUser.EmployeeId;
                    OTBooking.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return otBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object RescheduleOTBooking(RbacUser currentUser, int otBookingId, DateTime rescheduledDate, OtDbContext operationTheaterDbContext)
        {
            if (otBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OTBooking = (from booking in operationTheaterDbContext.OTBookingDetails
                                     where booking.OTBookingId == otBookingId
                                     select booking).FirstOrDefault();
                    if (OTBooking == null)
                    {
                        throw new Exception("Cannot find OT Booking Details for the OTBookingId: " + otBookingId);
                    }

                    OTBooking.BookedForDate = rescheduledDate;
                    OTBooking.ModifiedBy = currentUser.EmployeeId;
                    OTBooking.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return otBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdateMSTCheckList(RbacUser currentUser, OTPostMSTCheckListDTO oTMSTPostCheckListDTO, OtDbContext operationTheaterDbContext)
        {
            if (oTMSTPostCheckListDTO == null)
            {
                throw new Exception("Invalid OT CheckList Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    OTMSTCheckListModel OTCheckList = (from checklist in operationTheaterDbContext.OTMSTCheckList
                                                       where checklist.CheckListId == oTMSTPostCheckListDTO.CheckListId
                                                       select checklist).FirstOrDefault();
                    if (OTCheckList == null)
                    {
                        throw new Exception("Invalid CheckListId.");
                    }
                    OTCheckList.ServiceItemId = oTMSTPostCheckListDTO.ServiceItemId;
                    OTCheckList.CheckListName = oTMSTPostCheckListDTO.CheckListName;
                    OTCheckList.DisplayName = oTMSTPostCheckListDTO.DisplayName;
                    OTCheckList.InputType = oTMSTPostCheckListDTO.InputType;
                    OTCheckList.IsMandatory = oTMSTPostCheckListDTO.IsMandatory;
                    OTCheckList.DisplaySequence = oTMSTPostCheckListDTO.DisplaySequence;
                    OTCheckList.IsActive = oTMSTPostCheckListDTO.IsActive;
                    OTCheckList.ModifiedBy = currentUser.EmployeeId;
                    OTCheckList.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OTCheckList.CheckListId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object SaveLookUp(RbacUser currentUser, int checkListId, string lookUp, OtDbContext operationTheaterDbContext)
        {
            if (checkListId == 0)
            {
                throw new Exception("Invalid CheckListId.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var CheckListItem = (from item in operationTheaterDbContext.OTMSTCheckList
                                         where item.CheckListId == checkListId
                                         select item).FirstOrDefault();
                    if (CheckListItem == null)
                    {
                        throw new Exception("Cannot find CheckList Item for the CheckListId: " + checkListId);
                    }
                    CheckListItem.LookUp = lookUp;
                    CheckListItem.ModifiedBy = currentUser.EmployeeId;
                    CheckListItem.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();

                    return CheckListItem.LookUp;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdateCheckList(RbacUser currentUser, OTPostCheckListDTO oTPostCheckListDTO, OtDbContext operationTheaterDbContext)
        {
            if (oTPostCheckListDTO == null || oTPostCheckListDTO.CheckList.Count == 0)
            {
                throw new Exception("Invalid OT CheckList Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var dateTime = DateTime.Now;
                    var inputTypeFileCheckistIds = (from checklist in operationTheaterDbContext.OTMSTCheckList
                                                    where checklist.InputType == "File"
                                                    select checklist.CheckListId).ToList();
                    foreach (var item in oTPostCheckListDTO.CheckList)
                    {
                        OTCheckListModel OTCheckList = operationTheaterDbContext.OTTXNCheckList.Where(c => c.CheckListId == item.CheckListId && c.OTBookingId == oTPostCheckListDTO.OTBookingId).FirstOrDefault();
                        bool isNewCheckList = false;
                        if (OTCheckList == null)
                        {
                            OTCheckList = new OTCheckListModel();
                            isNewCheckList = true;
                            OTCheckList.CheckListId = item.CheckListId;
                            OTCheckList.OTBookingId = oTPostCheckListDTO.OTBookingId;
                            OTCheckList.PatientId = oTPostCheckListDTO.PatientId;
                            OTCheckList.PatientVisitId = oTPostCheckListDTO.PatientVisitId;
                        }
                        if (item.CheckListValue != null && inputTypeFileCheckistIds.Contains(item.CheckListId))
                        {
                            var file = JsonConvert.DeserializeObject<OTCheckListFileDTO>(item.CheckListValue);
                            if (file != null)
                            {
                                try
                                {
                                    var location = (from dbc in operationTheaterDbContext.CoreCfgParameter
                                                    where dbc.ParameterGroupName == "OT"
                                                    && dbc.ParameterName == "OTCheckListFileUploadLocation"
                                                    select dbc.ParameterValue).FirstOrDefault();
                                    if (location == null)
                                    {
                                        throw new Exception("Please set OTCheckListFileUploadLocation.");
                                    }
                                    if (!Directory.Exists(location))
                                    {
                                        Directory.CreateDirectory(location);
                                    }
                                    string fileName = file.FileName;
                                    string filePath = Path.Combine(location, fileName);
                                    if (!(File.Exists(filePath)))
                                    {
                                        string imgPath = Path.Combine(location, Path.GetFileNameWithoutExtension(file.FileName) + "_" + Guid.NewGuid() + Path.GetExtension(file.FileName));
                                        byte[] imageBytes = Convert.FromBase64String(file.BinaryData);
                                        File.WriteAllBytes(imgPath, imageBytes);
                                        OTCheckList.CheckListValue = imgPath;
                                    }
                                }
                                catch (Exception ex)
                                {
                                    dbContextTransaction.Rollback();
                                    throw new Exception("Unable to save CheckList File." + " " + "Error: " + ex.Message);
                                }
                            }
                        }
                        else
                        {
                            OTCheckList.CheckListValue = item.CheckListValue;
                        }
                        OTCheckList.Remarks = item.Remarks;
                        if (isNewCheckList)
                        {
                            OTCheckList.CreatedBy = currentUser.EmployeeId;
                            OTCheckList.CreatedOn = dateTime;
                            operationTheaterDbContext.OTTXNCheckList.Add(OTCheckList);
                        }
                        else
                        {
                            OTCheckList.ModifiedBy = currentUser.EmployeeId;
                            OTCheckList.ModifiedOn = dateTime;
                        }
                    }
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return oTPostCheckListDTO.OTBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdateOTSurgery(RbacUser currentUser, OTSurgeryDTO otSurgeryDTO, OtDbContext operationTheaterDbContext)
        {
            if (otSurgeryDTO == null)
            {
                throw new Exception("Invalid TO Surgery Details.");
            }
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var OtSurgery = (from sur in operationTheaterDbContext.OTSurgery
                                     where sur.SurgeryId == otSurgeryDTO.SurgeryId
                                     select sur).FirstOrDefault();
                    if (OtSurgery == null)
                    {
                        throw new Exception("OT Surgery not found.");
                    }
                    if (OtSurgery.IsSystemDefault == true && otSurgeryDTO.IsSystemDefault == false)
                    {
                        throw new Exception("Default Surgery can't be Deactivated.");   // Sanjeev :    Restriction to make System Default Surgery while updating Surgery From API
                    }
                    OtSurgery.SurgeryName = otSurgeryDTO.SurgeryName;
                    OtSurgery.SurgeryCode = otSurgeryDTO.SurgeryCode;
                    OtSurgery.Description = otSurgeryDTO.Description;
                    OtSurgery.IsActive = otSurgeryDTO.IsActive;
                    OtSurgery.ModifiedBy = currentUser.EmployeeId;
                    OtSurgery.ModifiedOn = DateTime.Now;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtSurgery.SurgeryId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object MapSurgeryCheckList(RbacUser currentUser, OTMapSurgeryCheckListDTO otMapSurgeryCheckListDTO, OtDbContext operationTheaterDbContext)
        {
            if (otMapSurgeryCheckListDTO == null)
            {
                throw new Exception("Invalid MapSurgeryCheckList.");
            }
            if (otMapSurgeryCheckListDTO.SurgeryId == 0)
            {
                throw new Exception("Invalid SurgeryId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    List<OTMapSurgeryCheckListModel> exisitingSurgeryCheckListMappedItems = (from map in operationTheaterDbContext.OTMapSurgeryCheckList
                                                                                             where map.SurgeryId == otMapSurgeryCheckListDTO.SurgeryId
                                                                                             select map)
                                                                                    .ToList();
                    if (otMapSurgeryCheckListDTO.MapSurgeryCheckListItems.Count == 0 && exisitingSurgeryCheckListMappedItems.Count == 0)
                    {
                        throw new Exception("Invalid. Empty MapSurgeryCheckList items.");
                    }
                    OTMapSurgeryCheckListModel OtMapSurgeryCheckListObject = new OTMapSurgeryCheckListModel();
                    DateTime currentDateTime = DateTime.Now;
                    List<OTMapSurgeryCheckListModel> DeactivatedSurgeryCheckListMapItems = exisitingSurgeryCheckListMappedItems
                                                                                            .Where(existingItem => !otMapSurgeryCheckListDTO.MapSurgeryCheckListItems.Any(newItem => newItem.CheckListId == existingItem.CheckListId))
                                                                                            .ToList();
                    List<OTMapSurgeryCheckListItems> oldSurgeryCheckListMappedItems = otMapSurgeryCheckListDTO.MapSurgeryCheckListItems.Where(item => item.SurgeryCheckListId > 0).ToList();

                    List<OTMapSurgeryCheckListItems> newSurgeryCheckListMappedItems = otMapSurgeryCheckListDTO.MapSurgeryCheckListItems.Where(item => item.SurgeryCheckListId == 0).ToList();

                    if (newSurgeryCheckListMappedItems.Count > 0)
                    {
                        foreach (OTMapSurgeryCheckListItems item in newSurgeryCheckListMappedItems)
                        {
                            OtMapSurgeryCheckListObject = new OTMapSurgeryCheckListModel();
                            OtMapSurgeryCheckListObject.SurgeryId = item.SurgeryId;
                            OtMapSurgeryCheckListObject.CheckListId = item.CheckListId;
                            OtMapSurgeryCheckListObject.DisplaySequence = item.DisplaySequence;
                            OtMapSurgeryCheckListObject.IsMandatory = item.IsMandatory;
                            OtMapSurgeryCheckListObject.IsActive = item.IsActive;
                            OtMapSurgeryCheckListObject.CreatedBy = currentUser.EmployeeId;
                            OtMapSurgeryCheckListObject.CreatedOn = currentDateTime;
                            operationTheaterDbContext.OTMapSurgeryCheckList.Add(OtMapSurgeryCheckListObject);
                        }
                    }

                    if (oldSurgeryCheckListMappedItems.Count > 0)
                    {
                        foreach (OTMapSurgeryCheckListItems item in oldSurgeryCheckListMappedItems)
                        {
                            OtMapSurgeryCheckListObject = (from map in operationTheaterDbContext.OTMapSurgeryCheckList
                                                           where map.SurgeryCheckListId == item.SurgeryCheckListId
                                                           select map).FirstOrDefault();
                            if (OtMapSurgeryCheckListObject == null)
                            {
                                throw new Exception("Invalid SurgeryCheckListId.");
                            }
                            OtMapSurgeryCheckListObject.DisplaySequence = item.DisplaySequence;
                            OtMapSurgeryCheckListObject.IsMandatory = item.IsMandatory;
                            OtMapSurgeryCheckListObject.IsActive = item.IsActive;
                            OtMapSurgeryCheckListObject.ModifiedBy = currentUser.EmployeeId;
                            OtMapSurgeryCheckListObject.ModifiedOn = currentDateTime;
                        }
                    }

                    if (DeactivatedSurgeryCheckListMapItems.Count > 0)
                    {
                        foreach (OTMapSurgeryCheckListModel item in DeactivatedSurgeryCheckListMapItems)
                        {
                            OtMapSurgeryCheckListObject = (from map in operationTheaterDbContext.OTMapSurgeryCheckList
                                                           where map.SurgeryCheckListId == item.SurgeryCheckListId
                                                           select map).FirstOrDefault();
                            if (OtMapSurgeryCheckListObject == null)
                            {
                                throw new Exception("Invalid SurgeryCheckListId.");
                            }
                            OtMapSurgeryCheckListObject.IsActive = false;
                        }
                    }
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OtMapSurgeryCheckListObject.SurgeryId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object UpdatePersonnelDetails(RbacUser currentUser, List<OTPostTeamInfoDTO> TeamInfoList, int OTBookingId, int PatientId, int PatientVisitId, OtDbContext operationTheaterDbContext)
        {
            if (TeamInfoList == null)
            {
                throw new Exception("Invalid TeamInfo.");
            }
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (PatientId == 0)
            {
                throw new Exception("Invalid PatientId.");
            }
            if (PatientVisitId == 0)
            {
                throw new Exception("Invalid PatientVisitId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var allOTTeamPersonnels = TeamInfoList;
                    var existingPersonnels = (from per in operationTheaterDbContext.OTTeamInfo
                                              where per.OTBookingId == OTBookingId
                                              select new OTPostTeamInfoDTO
                                              {
                                                  TeamInfoId = per.TeamInfoId,
                                                  PersonnelTypeId = per.PersonnelTypeId,
                                                  EmployeeId = per.EmployeeId
                                              }).ToList();
                    var newPersonnels = allOTTeamPersonnels.Where(personnel => personnel.TeamInfoId == 0).ToList();
                    var removedPersonnels = existingPersonnels.Where(personnel => !allOTTeamPersonnels.Any(p => p.TeamInfoId == personnel.TeamInfoId)).ToList();

                    if (removedPersonnels.Count > 0)
                    {
                        foreach (var removedPersonnel in removedPersonnels)
                        {
                            var personnelToRemove = operationTheaterDbContext.OTTeamInfo
                                .FirstOrDefault(p => p.TeamInfoId == removedPersonnel.TeamInfoId);

                            if (personnelToRemove != null)
                            {
                                operationTheaterDbContext.OTTeamInfo.Remove(personnelToRemove);
                            }
                        }
                    }

                    if (newPersonnels.Count > 0)
                    {
                        foreach (var personnel in newPersonnels)
                        {
                            OTTeamInfoModel OTTeamInfo = new OTTeamInfoModel();
                            OTTeamInfo.PersonnelTypeId = personnel.PersonnelTypeId;
                            OTTeamInfo.EmployeeId = personnel.EmployeeId;
                            OTTeamInfo.OTBookingId = OTBookingId;
                            OTTeamInfo.PatientId = PatientId;
                            OTTeamInfo.PatientVisitId = PatientVisitId;
                            OTTeamInfo.CreatedBy = currentUser.EmployeeId;
                            OTTeamInfo.CreatedOn = DateTime.Now;
                            operationTheaterDbContext.OTTeamInfo.Add(OTTeamInfo);
                        }
                    }
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return OTBookingId;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        /*public object UpdateOTMachineByOTBookingId(RbacUser currentUser, int OTBookingId, int OTMachineId, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (OTMachineId == 0)
            {
                throw new Exception("Invalid PatientId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var Booking = (from book in operationTheaterDbContext.OTBookingDetails
                                   where book.OTBookingId == OTBookingId
                                   select book)
                                       .FirstOrDefault();
                    if (Booking == null)
                    {
                        throw new Exception("Cannot find Booking Detail with the OTBookingId : " + OTBookingId);
                    }
                    Booking.OTMachineId = OTMachineId;
                    Booking.ModifiedOn = DateTime.Now;
                    Booking.ModifiedBy = currentUser.EmployeeId;

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return ("OTBookingId : " + OTBookingId);
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }*/

        /*public object UpdateInstrumentDetails(RbacUser currentUser, List<OTPostImplantDetailDTO> ImplantList, int PatientId, int PatientVisitId, int OTBookingId, int OTMachineId, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0 || OTBookingId == null)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (OTMachineId == 0 || OTMachineId == null)
            {
                throw new Exception("Invalid PatientId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var BookingDetail = (from book in operationTheaterDbContext.OTBookingDetails
                                         where book.OTBookingId == OTBookingId
                                         select book)
                                       .FirstOrDefault();
                    if (BookingDetail == null)
                    {
                        throw new Exception("Cannot find Booking Detail with the OTBookingId : " + OTBookingId);
                    }
                    BookingDetail.OTMachineId = OTMachineId;

                    if (ImplantList.Count > 0)
                    {
                        var allImplants = ImplantList;
                        var existingImplants = (from implant in operationTheaterDbContext.ImplantDetail
                                                where implant.OTBookingId == OTBookingId
                                                select new OTPostImplantDetailDTO
                                                {
                                                    ImplantDetailId = implant.ImplantDetailId
                                                }).ToList();
                        var newImplants = allImplants.Where(i => i.ImplantDetailId == 0).ToList();
                        var removedImplants = existingImplants.Where(personnel => !allImplants.Any(p => p.ImplantDetailId == personnel.ImplantDetailId)).ToList();

                        if (removedImplants.Count > 0)
                        {
                            foreach (var implant in removedImplants)
                            {
                                var implantsToRemove = operationTheaterDbContext.ImplantDetail
                                    .FirstOrDefault(p => p.ImplantDetailId == implant.ImplantDetailId);

                                if (implantsToRemove != null)
                                {
                                    implantsToRemove.IsActive = false;
                                    implantsToRemove.ModifiedBy = currentUser.EmployeeId;
                                    implantsToRemove.ModifiedOn = DateTime.Now;
                                }
                            }
                        }

                        if (newImplants.Count > 0)
                        {
                            if (newImplants.Any(implant => string.IsNullOrWhiteSpace(implant.ImplantName)))
                            {
                                throw new Exception("ImplantName can't be empty");
                            }

                            foreach (var implant in newImplants)
                            {
                                OTImplantDetailModel newImplant = new OTImplantDetailModel();
                                newImplant.PatientId = PatientId;
                                newImplant.PatientVisitId = PatientVisitId;
                                newImplant.OTBookingId = OTBookingId;
                                newImplant.ImplantName = implant.ImplantName;
                                newImplant.Quantity = implant.Quantity;
                                newImplant.Charge = implant.Charge;
                                newImplant.Remarks = implant.Remarks;
                                newImplant.CreatedBy = currentUser.EmployeeId;
                                newImplant.CreatedOn = DateTime.Now;
                                newImplant.IsActive = true;
                                operationTheaterDbContext.ImplantDetail.Add(newImplant);
                            }
                        }
                    }

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return ("OTBookingId : " + OTBookingId);
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }*/

        public object DeactivateImplantDetail(RbacUser currentUser, int OTBookingId, int ImplantDetailId, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (ImplantDetailId == 0)
            {
                throw new Exception("Invalid ImplantDetailId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var implant = operationTheaterDbContext.ImplantDetail
                        .Where(i => i.ImplantDetailId == ImplantDetailId && i.OTBookingId == OTBookingId)
                    .FirstOrDefault();

                    if (implant == null)
                    {
                        throw new Exception("Implant Detail Not Found for OTBookingId : " + OTBookingId);
                    }

                    if (implant != null)
                    {
                        implant.IsActive = false;
                        implant.ModifiedBy = currentUser.EmployeeId;
                        implant.ModifiedOn = DateTime.Now;
                    }

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return implant;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object DeactivateMachineDetail(RbacUser currentUser, int OTBookingId, int MachineDetailId, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (MachineDetailId == 0)
            {
                throw new Exception("Invalid MachineDetailId.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var machine = operationTheaterDbContext.MachineDetail
                        .Where(i => i.MachineDetailId == MachineDetailId && i.OTBookingId == OTBookingId)
                        .FirstOrDefault();

                    if (machine == null)
                    {
                        throw new Exception("Machine Detail Not Found for OTBookingId : " + OTBookingId);
                    }

                    if (machine != null)
                    {
                        machine.IsActive = false;
                        machine.ModifiedBy = currentUser.EmployeeId;
                        machine.ModifiedOn = DateTime.Now;
                    }

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return machine;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        public object ConcludeOTBooking(RbacUser currentUser, int OTBookingId, OTConcludeBookingDTO oTConcludeBookingDTO, OtDbContext operationTheaterDbContext)
        {
            if (OTBookingId == 0)
            {
                throw new Exception("Invalid OTBookingId.");
            }
            if (oTConcludeBookingDTO == null)
            {
                throw new Exception("Invalid Conclude Booking Detail.");
            }
            if (oTConcludeBookingDTO.OTStartTime == null)
            {
                throw new Exception("OTSTartTime is mandatory.");
            }
            if (oTConcludeBookingDTO.OTConcludeTime == null)
            {
                throw new Exception("OTConcludeTime is mandatory.");
            }

            using (DbContextTransaction dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    var booking = operationTheaterDbContext.OTBookingDetails
                        .Where(i => i.OTBookingId == OTBookingId)
                        .FirstOrDefault();

                    if (booking != null)
                    {
                        booking.OTStartTime = oTConcludeBookingDTO.OTStartTime;
                        booking.OTConcludeTime = oTConcludeBookingDTO.OTConcludeTime;
                        booking.IsOnScheduledTime = oTConcludeBookingDTO.IsOnScheduledTime;
                        booking.IsSeroPositive = oTConcludeBookingDTO.IsSeroPositive;
                        booking.OutTimeCharge = oTConcludeBookingDTO.OutTimeCharge;
                        booking.ConcludeRemarks = oTConcludeBookingDTO.ConcludeRemarks;
                        booking.ModifiedBy = currentUser.EmployeeId;
                        booking.Status = ENUM_OT_Booking_Status.Concluded;
                        booking.ModifiedOn = DateTime.Now;
                    }

                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return booking.Status;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw new Exception("Error: " + ex.Message);
                }
            }
        }

        #endregion
        public object UpdateAnaesthesiaType(RbacUser currentUser, OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO, OtDbContext operationTheaterDbContext)
        {
            if (otPostAnaesthesiaTypeDTO == null)
            {
                throw new ArgumentNullException($"{nameof(otPostAnaesthesiaTypeDTO)} is null");
            }
            if (otPostAnaesthesiaTypeDTO != null && otPostAnaesthesiaTypeDTO.AnaesthesiaTypeId == 0)
            {
                throw new ArgumentNullException($"{nameof(otPostAnaesthesiaTypeDTO.AnaesthesiaTypeId)} is not provided to update the AnaesthesiaType");
            }
            var oTAnaesthesiaType = operationTheaterDbContext.AnaesthesiaTypes.Where(x => x.AnaesthesiaTypeId == otPostAnaesthesiaTypeDTO.AnaesthesiaTypeId).FirstOrDefault();
            if (oTAnaesthesiaType == null)
            {
                throw new Exception($"No AnaesthesiaType is found for {nameof(otPostAnaesthesiaTypeDTO.AnaesthesiaTypeId)}");
            }

            oTAnaesthesiaType.ModifiedOn = DateTime.Now;
            oTAnaesthesiaType.ModifiedBy = currentUser.EmployeeId;
            oTAnaesthesiaType.IsActive = otPostAnaesthesiaTypeDTO.IsActive;
            oTAnaesthesiaType.AnaesthesiaType = otPostAnaesthesiaTypeDTO.AnaesthesiaType;


            //operationTheaterDbContext.Entry(oTAnaesthesiaType).State = EntityState.Modified;
            operationTheaterDbContext.SaveChanges();
            return otPostAnaesthesiaTypeDTO;
        }

        /// <summary>
        /// Method is used for Updating the Map Anaesthesia Service Item
        /// </summary>
        /// <param name="currentUser">Identity of user that performing Updataion </param>
        /// <param name="otMapAnaesthesiaServiceItemDTO">The DTO contain details of the Anaesthesia Service Item for mapping when API call for update Map Anaesthesia Service Items</param>
        /// <param name="operationTheaterDbContext">The database context to be used for the operation</param>
        /// <returns>Returns the ID of the updated Anaesthesia Service Item</returns>
        /// <exception cref="InvalidOperationException">Thrown when an error occurs during the update operation.</exception>
        public object UpdateMapAnaesthesiaType(RbacUser currentUser, OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO, OtDbContext operationTheaterDbContext)
        {
            using (var dbContextTransaction = operationTheaterDbContext.Database.BeginTransaction())
            {
                try
                {
                    if (otMapAnaesthesiaServiceItemDTO == null)
                    {
                        Log.Error($"Nothing to update as  {nameof(otMapAnaesthesiaServiceItemDTO)} is null.");
                        throw new ArgumentNullException($"{nameof(otMapAnaesthesiaServiceItemDTO)} is null");
                    }
                    if (otMapAnaesthesiaServiceItemDTO != null && otMapAnaesthesiaServiceItemDTO.AnaesthesiaId == 0)
                    {
                        Log.Error($" {nameof(otMapAnaesthesiaServiceItemDTO.AnaesthesiaId)} is not provided to update the OT Anaesthesia service item.");
                        throw new ArgumentNullException($"{nameof(otMapAnaesthesiaServiceItemDTO.AnaesthesiaId)} is not provided to update the OT Anaesthesia service item");
                    }
                    var otMapAnaesthesia = operationTheaterDbContext.Anaesthesias.Where(x => x.AnaesthesiaId == otMapAnaesthesiaServiceItemDTO.AnaesthesiaId).FirstOrDefault();
                    if (otMapAnaesthesia == null)
                    {
                        Log.Error($"No Anaesthesia Service Item is found for {nameof(otMapAnaesthesiaServiceItemDTO.AnaesthesiaId)}");
                        throw new Exception($"No Anaesthesia Service Item is found for {nameof(otMapAnaesthesiaServiceItemDTO.AnaesthesiaId)}");
                    }
                    var existingAnaesthesia = operationTheaterDbContext.Anaesthesias
                    .Where(x => x.AnaesthesiaTypeId == otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId && x.ServiceItemId == otMapAnaesthesiaServiceItemDTO.ServiceItemId)
                     .FirstOrDefault();


                    otMapAnaesthesia.ModifiedOn = DateTime.Now;
                    otMapAnaesthesia.ModifiedBy = currentUser.EmployeeId;
                    otMapAnaesthesia.IsActive = otMapAnaesthesiaServiceItemDTO.IsActive;
                    otMapAnaesthesia.AnaesthesiaTypeId = otMapAnaesthesiaServiceItemDTO.AnaesthesiaTypeId;
                    otMapAnaesthesia.ServiceItemId = otMapAnaesthesiaServiceItemDTO.ServiceItemId;

                    //operationTheaterDbContext.Entry(otMapAnaesthesia).State = EntityState.Modified;
                    operationTheaterDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return otMapAnaesthesiaServiceItemDTO.AnaesthesiaId;
                }
                catch (SqlException sqlEx)
                {
                    dbContextTransaction.Rollback();
                    Log.Error($"A SQL error occurred while updating the Anaesthesia Service Item: {sqlEx.Message}");
                    throw new InvalidOperationException($"A SQL error occurred while updating the Anaesthesia Service Item: {sqlEx.Message}", sqlEx);
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();

                    Log.Error($"An error occurred while Updating the Anaesthesia Service Item: {ex.Message}");
                    throw new InvalidOperationException($"An error occurred while updating the Anaesthesia Service Item.{ex.Message}");

                }
            }
        }
               
    }
}
   






