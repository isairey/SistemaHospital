using DanpheEMR.Controllers.Admission.DTOs;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using Newtonsoft.Json;
using Serilog;
using System;
using System.Data.Entity;
using System.Linq;

namespace DanpheEMR.Services.Admission.BedReservationServices
{
    public class BedReservationService : IBedReservationService
    {
        public object ReserveBed(AdmissionDbContext _admissionDbContext, AddBedReservation_DTO addBedReservation, RbacUser currentUser)
        {
            try
            {
                if (addBedReservation is null)
                {
                    Log.Error($"{nameof(addBedReservation)} is null to perform bed reservation!");
                    throw new ArgumentNullException($"{nameof(addBedReservation)} cannot be null inorder to perform bed reservation!");
                }
                int bedId = addBedReservation.BedId;
                dynamic bedAvailabilityObj = CheckIfBedIsAvailable(_admissionDbContext, bedId);
                if (!bedAvailabilityObj.IsAvailable)
                {
                    throw new Exception(bedAvailabilityObj.Message);
                }
                var admissionDetail = _admissionDbContext.Admissions
                                                         .FirstOrDefault(a => a.PatientVisitId == addBedReservation.PatientVisitId);

                if (admissionDetail is null)
                {
                    Log.Error($"No Admission Detail found for PatientVisitId = {addBedReservation.PatientVisitId}");
                    throw new InvalidOperationException($"No Admission Detail found for PatientVisitId = {addBedReservation.PatientVisitId}");
                }

                var reservedBed = (from bedRsrv in _admissionDbContext.BedReservation
                                   join bed in _admissionDbContext.Beds on
                                    new
                                    {
                                        WardId = bedRsrv.WardId,
                                        BedId = bedRsrv.BedId
                                    } equals
                                    new
                                    {
                                        WardId = bed.WardId,
                                        BedId = bed.BedId
                                    }
                                   where (bed.IsReserved == true || bed.IsOccupied == true) && bedRsrv.PatientId == addBedReservation.PatientId && bedRsrv.PatientVisitId == addBedReservation.PatientVisitId
                                   select bedRsrv
                                   ).FirstOrDefault();

                if (reservedBed != null)
                {
                    Log.Error($"There is already bed reserved for the patient: {addBedReservation.PatientId} on PatientVisit: {addBedReservation.PatientVisitId}");
                    throw new InvalidOperationException($"There is already bed: {reservedBed.BedId} is reserved for the patient: {addBedReservation.PatientId} on PatientVisit: {addBedReservation.PatientVisitId}");
                }

                using (var reservationScope = _admissionDbContext.Database.BeginTransaction())
                {
                    try
                    {
                        var currentDateTime = DateTime.Now;
                        var careTakerInformation = new GuarantorModel();

                        if (addBedReservation.CareTakerId == 0 || addBedReservation.CareTakerId is null)
                        {
                            Log.Information($"Primary Care Taker Information is being stored in the PAT_PatientGurantorInfo table for Patient: {addBedReservation.PatientId}");
                            careTakerInformation = SavePatientCareTakerInformation(addBedReservation, _admissionDbContext);
                        }

                        Log.Information($"Visitor Bed Reservation process started for Patient : {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}");

                        var bedReservation = new ADTBedReservation();
                        bedReservation.CreatedOn = currentDateTime;
                        bedReservation.CreatedBy = currentUser.EmployeeId;
                        bedReservation.IsActive = true;
                        bedReservation.WardId = addBedReservation.WardId;
                        bedReservation.BedFeatureId = addBedReservation.BedFeatureId;
                        bedReservation.BedId = addBedReservation.BedId;
                        bedReservation.AdmissionStartsOn = admissionDetail.AdmissionDate;
                        bedReservation.ReservedOn = currentDateTime;
                        bedReservation.ReservedBy = admissionDetail.AdmittingDoctorId;
                        bedReservation.IsAutoCancelled = false;
                        bedReservation.PatientId = addBedReservation.PatientId;
                        bedReservation.PatientVisitId = addBedReservation.PatientVisitId;
                        bedReservation.AdmissionCase = admissionDetail.AdmissionCase;
                        bedReservation.CareTakerInformation = GenerateJsonStringForCareTakerInformation(addBedReservation, careTakerInformation); //This will generate the json object for the care Taker information

                        _admissionDbContext.BedReservation.Add(bedReservation);

                        _admissionDbContext.SaveChanges();
                        Log.Information($"After Visitor Bed Reservation Process is added to be tracked, Bed Status Update process is started for Patient: {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}");

                        UpdateBedStatusForReservation(bedReservation, currentDateTime, currentUser, _admissionDbContext);//Update Bed Status 

                        reservationScope.Commit();
                        Log.Information($"{addBedReservation.BedId} is reserved for the patient: {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}");

                        return bedReservation.ReservedBedInfoId;

                    }
                    catch (Exception ex)
                    {
                        Log.Error($"Exception is thrown during the Visitor Bed Reservation Process and the transaction is getting rolled back for the patient: {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}");
                        reservationScope.Rollback();
                        if (ex.InnerException != null)
                        {
                            Log.Error(ex.InnerException.InnerException.Message.ToString());
                            throw new Exception($"Exception is thrown during the Visitor Bed Reservation Process and the transaction is getting rolled back for the patient: {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}, {ex.InnerException.InnerException.Message.ToString()}");
                        }
                        else
                        {
                            Log.Error(ex.Message.ToString());
                            throw new Exception($"Exception is thrown during the Visitor Bed Reservation Process and the transaction is getting rolled back for the patient: {addBedReservation.PatientId} with PatientVisit: {addBedReservation.PatientVisitId}, {ex.Message.ToString()}");
                        }
                    }
                }
            }
            catch (ArgumentNullException argNullException)
            {
                Log.Error($"Argument null Exception thrown during Visitor Bed Reservation, {argNullException.Message.ToString()}");
                throw argNullException;
            }
            catch (InvalidOperationException invalidOperationException)
            {
                Log.Error($"Invalid Operation Exception thrown during Visitor Bed Reservation, {invalidOperationException.Message.ToString()}");
                throw invalidOperationException;
            }
            catch (Exception ex)
            {
                Log.Error($"Exception thrown during Visitor Bed Reservation, {ex.Message.ToString()}");
                throw ex;
            }
        }

        private object CheckIfBedIsAvailable(AdmissionDbContext _admissionDbContext, int bedId)
        {
            bool IsAvailable = false;
            string Message = "";
            var BedInfo = _admissionDbContext.Beds
                                   .FirstOrDefault(bed => bed.BedId == bedId);
            if (BedInfo != null && (BedInfo.IsOccupied || BedInfo.IsReserved))
            {
                if (BedInfo.IsOccupied)
                {
                    Log.Error($"Selected Bed {BedInfo.BedCode} is already occupied!");
                    IsAvailable = false;
                    Message = $"Selected Bed {BedInfo.BedCode} is already occupied!";
                }
                else if (BedInfo.IsReserved)
                {
                    Log.Error($"Selected Bed {BedInfo.BedCode} is already reserved!");
                    IsAvailable = false;
                    Message = $"Selected Bed {BedInfo.BedCode} is already reserved!";
                }
            }
            else
            {
                IsAvailable = true;
            }
            return new { IsAvailable, Message };
        }

        private GuarantorModel SavePatientCareTakerInformation(AddBedReservation_DTO addBedReservation, AdmissionDbContext _admissionDbContext)
        {
            var existingCareTaker = _admissionDbContext.Guarantor.FirstOrDefault(g => g.PatientId == addBedReservation.PatientId);

            if (existingCareTaker is null)
            {
                var careTaker = new GuarantorModel();
                careTaker.PatientId = addBedReservation.PatientId;
                careTaker.GuarantorName = addBedReservation.PrimaryCareTakerName;
                careTaker.GuarantorPhoneNumber = addBedReservation.PrimaryCareTakerContact;

                _admissionDbContext.Guarantor.Add(careTaker);
                _admissionDbContext.SaveChanges();

                Log.Information($"Primcary Care Taker information is stored as Gurantor in the database for the patient: {addBedReservation.PatientId} during Visitor Bed Reservation");

                return careTaker;
            }
            else
            {
                Log.Information($"There is already a care taker added for Patient: {addBedReservation.PatientId}, hence, updating the name and contact number of care taker!");
                existingCareTaker.GuarantorName = addBedReservation.PrimaryCareTakerName;
                existingCareTaker.GuarantorPhoneNumber = addBedReservation.PrimaryCareTakerContact;

                _admissionDbContext.Entry(existingCareTaker).State = EntityState.Modified;
                _admissionDbContext.SaveChanges();

                Log.Information($"Gurantor for the Patient: {addBedReservation.PatientId} is updated successfully!");

                return existingCareTaker;
            }
        }

        private string GenerateJsonStringForCareTakerInformation(AddBedReservation_DTO addBedReservation, GuarantorModel guarantor)
        {
            var careTakerInformation = new
            {
                PrimaryCareTakerId = guarantor.PatientGurantorInfo,//This is the Id of the primary Care Taker
                PrimaryCareTakerName = addBedReservation.PrimaryCareTakerName,
                PrimaryCareTakerContact = addBedReservation.PrimaryCareTakerContact,
                SecondaryCareTakerName = addBedReservation.SecondaryCareTakerName,
                SecondaryCareTakerContact = addBedReservation.SecondaryCareTakerContact
            };
            Log.Information($"Care Taker Json Object is created and ready to be saved as a string in db for patient: {addBedReservation.PatientId}");
            return JsonConvert.SerializeObject(careTakerInformation);

        }

        private void UpdateBedStatusForReservation(ADTBedReservation bedReservation, DateTime currentDateTime, RbacUser currentUser, AdmissionDbContext _admissionDbContext)
        {
            if (bedReservation != null && bedReservation.ReservedBedInfoId > 0)
            {

                var bedToReserve = _admissionDbContext.Beds
                                                      .FirstOrDefault(b => b.BedId == bedReservation.BedId
                                                                       && b.WardId == bedReservation.WardId
                                                                       && b.IsActive == true);
                if (bedToReserve != null)
                {
                    bedToReserve.IsReserved = true;
                    bedToReserve.ModifiedOn = currentDateTime;
                    bedToReserve.ModifiedBy = currentUser.EmployeeId;

                    _admissionDbContext.Entry(bedToReserve).State = EntityState.Modified;

                    _admissionDbContext.SaveChanges();
                    Log.Information($"Bed: {bedToReserve.BedId} is now reserved for the patient: {bedReservation.PatientId}, during visitor bed reservation process!");
                }
                else
                {
                    Log.Error($"{nameof(bedToReserve)} is not found free, to reserve for the patient, Either bed might be inactive or there is no bed for provided search query with wardId and BedId!");
                    throw new InvalidOperationException($"{nameof(bedToReserve)} is not found free, to reserve for the patient, Either bed might be inactive or there is no bed for provided search query with wardId and BedId!");
                }

                _admissionDbContext.SaveChanges();
            }
            else
            {
                Log.Error($"Bed Reservation is not created to reserve the bed for the BedId: {bedReservation.BedId} for the patient: {bedReservation.PatientId} with PatientVisit: {bedReservation.PatientVisitId}");
                throw new InvalidOperationException($"Bed Reservation is not created to reserve the bed for the BedId: {bedReservation.BedId} for the patient: {bedReservation.PatientId} with PatientVisit: {bedReservation.PatientVisitId}");
            }
        }
    }
}
