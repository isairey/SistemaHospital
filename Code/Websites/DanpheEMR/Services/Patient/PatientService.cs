using DanpheEMR.Controllers.Accounting.DTOs;
using DanpheEMR.Controllers.Appointment.DTOs;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.MedicareModels;
using DanpheEMR.Services.Patient.DTO;
using DanpheEMR.ViewModel.ADT;
using DanpheEMR.ViewModel.Medicare;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Serilog;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Patient
{
    public class PatientService : IPatientService
    {
        private readonly ILogger<PatientService> _logger;

        public PatientService(ILogger<PatientService> logger)
        {
            _logger = logger;
        }
        public async Task<PatientDetailByPatientCodeDTO> GetPatientDetailByPatientCodeAsync(string patientCode, PatientDbContext patientDbContext)
        {
            return await (from pat in patientDbContext.Patients.Where(p => p.PatientCode.Equals(patientCode))
                          join cnt in patientDbContext.Countries on pat.CountryId equals cnt.CountryId
                          join cntSub in patientDbContext.CountrySubdivisions on pat.CountrySubDivisionId equals cntSub.CountrySubDivisionId into cntgrp
                          from countrySub in cntgrp.DefaultIfEmpty()
                          join mun in patientDbContext.Municipalities on pat.MunicipalityId equals mun.MunicipalityId into munGrp
                          from municipality in munGrp.DefaultIfEmpty()
                          select new PatientDetailByPatientCodeDTO
                          {
                              PatientId = pat.PatientId,
                              PatientCode = pat.PatientCode,
                              FirstName = pat.FirstName,
                              MiddleName = pat.MiddleName,
                              LastName = pat.LastName,
                              Gender = pat.Gender,
                              DateOfBirth = pat.DateOfBirth.Value,
                              Email = pat.Email,
                              PhoneNumber = pat.PhoneNumber,
                              Address = pat.Address,
                              CountryName = cnt.CountryName,
                              CountrySubDivisionName = countrySub != null ? countrySub.CountrySubDivisionName : null,
                              MunicipalityName = municipality != null ? municipality.MunicipalityName : null
                          }).FirstOrDefaultAsync();
        }


        public object GetMedicarePatientList(MedicareDbContext _medicareDbContext)
        {
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>();

                DataSet dataset = DALFunctions.GetDatasetFromStoredProc("SP_INS_Medicare_GetMedicarePatientList", paramList, _medicareDbContext);
                DataTable dataTable = dataset.Tables[0];
                string PatientData = JsonConvert.SerializeObject(dataTable);
                List<MedicarePatientList_DTO> medicarePatients = JsonConvert.DeserializeObject<List<MedicarePatientList_DTO>>(PatientData);
                return medicarePatients;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting MedicarePatientList : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting MedicarePatientList: {ex.Message}. Exception details: {ex}");
            }

        }

        public async Task<object> GetDesignations(MedicareDbContext medicareDbContext)
        {
            try
            {
                var designations = await medicareDbContext.EmployeeRole
                                        .Where(a => a.IsActive == true)
                                        .Select(empRole => new
                                        {
                                            DesignationName = empRole.EmployeeRoleName,
                                            DesignationId = empRole.EmployeeRoleId
                                        })
                                        .Distinct()
                                        .OrderBy(d => d.DesignationName)
                                        .ToListAsync();
                return designations;

            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting designations : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting designations: {ex.Message}. Exception details: {ex}");
            }
        }

        public async Task<object> GetInsuranceProviders(MedicareDbContext medicareDbContext)
        {
            try
            {
                var insuranceProviders = await medicareDbContext.InsuranceProvider
                                                .Where(m => m.IsActive == true)
                                                .ToListAsync();
                return insuranceProviders;
            }

            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting InsuranceProviders : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting InsuranceProviders: {ex.Message}. Exception details: {ex}");
            }
        }

        public async Task<object> GetAllMedicareInstitutes(MedicareDbContext medicareDbContext)
        {
            try
            {
                var medicareInstitutes = await medicareDbContext.MedicareInstitutes
                                                .Where(m => m.IsActive == true)
                                                .ToListAsync();
                return medicareInstitutes;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting MedicareInstitutes : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting MedicareInstitutes: {ex.Message}. Exception details: {ex}");
            }

        }

        public async Task<object> GetDepartments(MedicareDbContext medicareDbContext)
        {
            try
            {
                var departments = await medicareDbContext.Departments
                                         .Where(a => a.IsActive == true)
                                         .Select(dept => new
                                         {
                                             DepartmentName = dept.DepartmentName,
                                             DepartmentId = dept.DepartmentId,
                                             DepartmentCode = dept.DepartmentCode,
                                         })
                                         .OrderBy(d => d.DepartmentName)
                                         .ToListAsync();
                return departments;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting Departments : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting Departments: {ex.Message}. Exception details: {ex}");
            }

        }

        public async Task<object> GetMedicareTypes(MedicareDbContext medicareDbContext)
        {
            try
            {
                var medicareTypes = await medicareDbContext.MedicareTypes
                                            .Where(m => m.IsActive == true)
                                            .ToListAsync();
                return medicareTypes;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting MedicareTypes : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting MedicareTypes: {ex.Message}. Exception details: {ex}");
            }
        }

        public async Task<object> GetMedicareMemberByPatientId(MedicareDbContext medicareDbContext, int PatientId)
        {
            try
            {
                var medicareDependent = await medicareDbContext.MedicareMembers
                                            .Where(m => m.IsActive == true
                                                        && m.PatientId == PatientId
                                                        && m.IsDependent == false)
                                            .FirstOrDefaultAsync();
                return medicareDependent;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while getting Patient data : {ex.Message}", ex);
                throw new Exception($"An error occurred while getting  Patient data: {ex.Message}. Exception details: {ex}");
            }
        }


        public MedicareMember SaveMedicareMemberDetails(MedicareDbContext medicareDbContext, MedicareMemberDto medicareMemberDto, RbacUser currentUser)
        {

            try
            {
                if (medicareMemberDto != null)
                {
                    if (medicareMemberDto.IsDependent == true)
                    {
                        medicareMemberDto.MemberNo = medicareMemberDto.DependentMemberNo;
                    }
                    bool isMemberNoExists = medicareDbContext.MedicareMembers
               .Any(member => member.MemberNo == medicareMemberDto.MemberNo);

                    if (isMemberNoExists)
                    {
                        throw new InvalidOperationException($"A Member with MemberNo '{medicareMemberDto.MemberNo}' already exists.");
                    }
                    bool isHospitalNoExists = medicareDbContext.MedicareMembers
               .Any(member => member.HospitalNo == medicareMemberDto.HospitalNo);

                    if (isHospitalNoExists)
                    {
                        throw new InvalidOperationException($"A Medicare Member with HospitalNo '{medicareMemberDto.HospitalNo}' already exists.");
                    }
                }



                MedicareMember medicareMemberDetail = JsonConvert.DeserializeObject<MedicareMember>(JsonConvert.SerializeObject(medicareMemberDto));
                medicareMemberDetail.CreatedBy = currentUser.EmployeeId;
                medicareMemberDetail.CreatedOn = DateTime.Now;
                medicareDbContext.MedicareMembers.Add(medicareMemberDetail);
                medicareDbContext.SaveChanges();

                //Krishna, 26thJan'23 We need to add Member Balance as well while adding Medicare Member
                if (!medicareMemberDetail.IsDependent)
                {
                    AddMedicareMemberBalanceUsingSelectedMedicareType(medicareDbContext, medicareMemberDetail, currentUser);
                }
                return medicareMemberDetail;

            }
            catch (Exception ex)
            {

                Log.Error($"An error occurred while saving Medicare Member : {ex.Message}", ex);
                throw new Exception($"An error occurred while saving  Medicare Member : {ex.Message}.");

            }

        }

        private void AddMedicareMemberBalanceUsingSelectedMedicareType(MedicareDbContext medicareDbContext, MedicareMember medicareMemberDetail, RbacUser currentUser)
        {
            try
            {
                var medicareType = medicareDbContext.MedicareTypes.FirstOrDefault(a => a.MedicareTypeId == (medicareMemberDetail.MedicareTypeId ?? 0));
                MedicareMemberBalance medicareMemberBalance = new MedicareMemberBalance
                {
                    MedicareMemberId = medicareMemberDetail.MedicareMemberId,
                    HospitalNo = medicareMemberDetail.HospitalNo,
                    PatientId = medicareMemberDetail.PatientId,
                    OpBalance = medicareType?.OpCreditAmount ?? 0,
                    IpBalance = medicareType?.IpCreditAmount ?? 0,
                    OpUsedAmount = 0,
                    IpUsedAmount = 0,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now
                };

                medicareDbContext.MedicareMemberBalance.Add(medicareMemberBalance);
                medicareDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while saving Medicare Member balence : {ex.Message}", ex);
                throw new Exception($"An error occurred while saving  Medicare Member balence: {ex.Message}. Exception details: {ex}");
            }


        }

        public MedicareMember UpdateMedicareMemberDetails(MedicareDbContext medicareDbContext, MedicareMemberDto medicareMemberDto, RbacUser currentUser)
        {
            try
            {
                if (medicareMemberDto.InsuranceProviderId == 0)
                {
                    medicareMemberDto.InsuranceProviderId = null;
                }
                var medicareMember = medicareDbContext.MedicareMembers.Where(x => x.MedicareMemberId == medicareMemberDto.MedicareMemberId).FirstOrDefault();
                medicareMember.MedicareInstituteCode = medicareMemberDto.MedicareInstituteCode;
                medicareMember.DesignationId = medicareMemberDto.DesignationId;
                medicareMember.DepartmentId = medicareMemberDto.DepartmentId;
                medicareMember.MemberNo = medicareMemberDto.MemberNo;
                medicareMember.FullName = medicareMemberDto.FullName;
                medicareMember.MedicareInstituteCode = medicareMemberDto.MedicareInstituteCode;
                medicareMember.MedicareStartDate = Convert.ToDateTime(medicareMemberDto.MedicareStartDate);
                medicareMember.MedicareEndDate = Convert.ToDateTime(medicareMemberDto.MedicareEndDate);
                medicareMember.InsuranceProviderId = medicareMemberDto.InsuranceProviderId;
                medicareMember.IsIpLimitExceeded = medicareMemberDto.IsIpLimitExceeded;
                medicareMember.IsOpLimitExceeded = medicareMemberDto.IsOpLimitExceeded;
                medicareMember.IsActive = medicareMemberDto.IsActive;
                medicareMember.ParentMedicareMemberId = medicareMemberDto.ParentMedicareMemberId;
                medicareMember.Relation = medicareMemberDto.Relation;
                medicareMember.HospitalNo = medicareMemberDto.HospitalNo;
                medicareMember.DateOfBirth = Convert.ToDateTime(medicareMemberDto.DateOfBirth);
                medicareMember.ModifiedBy = currentUser.EmployeeId;
                medicareMember.ModifiedOn = DateTime.Now;
                medicareMember.Remarks = medicareMemberDto.Remarks;
                medicareMember.InsurancePolicyNo = medicareMemberDto.InsurancePolicyNo;
                medicareMember.MedicareTypeId = medicareMemberDto.MedicareTypeId;
                medicareMember.PriceCategoryId = medicareMemberDto.PriceCategoryId;
                medicareMember.SchemeId = medicareMemberDto.SchemeId;

                if (!medicareMember.IsDependent && medicareMember.MedicareTypeId != medicareMemberDto.MedicareTypeId)
                {
                    UpdateMedicareMemberBalance(medicareDbContext, medicareMember.MedicareMemberId, medicareMemberDto.MedicareTypeId ?? 0, currentUser);
                }

                medicareDbContext.Entry(medicareMember).State = System.Data.Entity.EntityState.Modified;
                medicareDbContext.SaveChanges();
                return medicareMember;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while update Medicare Member  : {ex.Message}", ex);
                throw new Exception($"An error occurred while update  Medicare Member: {ex.Message}. Exception details: {ex}");
            }

        }

        private void UpdateMedicareMemberBalance(MedicareDbContext medicareDbContext, int medicareMemberId, int medicareTypeId, RbacUser currentUser)
        {
            try
            {
                var medicareType = medicareDbContext.MedicareTypes.FirstOrDefault(a => a.MedicareTypeId == medicareTypeId);

                var medicareMemberBalance = medicareDbContext.MedicareMemberBalance.FirstOrDefault(a => a.MedicareMemberId == medicareMemberId);
                medicareMemberBalance.OpBalance = medicareType.OpCreditAmount;
                medicareMemberBalance.IpBalance = medicareType.IpCreditAmount;
                medicareMemberBalance.ModifiedBy = currentUser.EmployeeId;
                medicareMemberBalance.ModifiedOn = DateTime.Now;

                medicareDbContext.Entry(medicareMemberBalance).State = System.Data.Entity.EntityState.Modified;
                medicareDbContext.SaveChanges();

            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while update Medicare Member Balence  : {ex.Message}", ex);
                throw new Exception($"An error occurred while update  Medicare Member Balence: {ex.Message}. Exception details: {ex}");
            }
        }


        public async Task<object> GetDependentMedicareMemberByPatientId(MedicareDbContext medicareDbContext, int PatientId)
        {
            try
            {


                var medicareDependent = await medicareDbContext.MedicareMembers
                                                .Where(m => m.IsActive == true
                                                            && m.PatientId == PatientId
                                                            && m.IsDependent == true)
                                                .FirstOrDefaultAsync();
                var result = new
                {
                    MedicareDependent = medicareDependent,
                    ParentMedicareMember = medicareDbContext.MedicareMembers
                                                            .Select(a => new
                                                            {
                                                                MedicareMemberId = a.MedicareMemberId,
                                                                ParentMedicareNumber = a.MemberNo,
                                                                ParentMedicareMemberName = a.FullName
                                                            })
                                                            .FirstOrDefault(a => a.MedicareMemberId == medicareDependent.ParentMedicareMemberId)
                };
                return result;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Get Dependent Medicare Member  : {ex.Message}", ex);
                throw new Exception($"An error occurred while Get Dependent Medicare Member: {ex.Message}. Exception details: {ex}");
            }
        }

        public async Task<object> GetMedicareMemberByMedicareNo(MedicareDbContext medicareDbContext, string memeberNo)
        {
            try
            {


                var medicareMember = await medicareDbContext.MedicareMembers
                                            .Where(m => m.IsActive == true
                                                        && m.MemberNo == memeberNo
                                                        && m.IsDependent == false)
                                            .FirstOrDefaultAsync();
                return medicareMember;
            }
            catch (Exception ex)
            {
                Log.Error($"An error occurred while Get  Medicare Member  : {ex.Message}", ex);
                throw new Exception($"An error occurred while Get Medicare Member: {ex.Message}. Exception details: {ex}");
            }

        }

        public async Task<object> GetPatientById(int patientId, PatientDbContext patientDbContext)
        {
            try
            {
                var patientDetails = await (from patient in patientDbContext.Patients
                                            where patient.PatientId == patientId
                                            join country in patientDbContext.Countries
                                                on patient.CountryId equals country.CountryId
                                            join subdivision in patientDbContext.CountrySubdivisions
                                                on patient.CountrySubDivisionId equals subdivision.CountrySubDivisionId 
                                            join municipality in patientDbContext.Municipalities
                                                on patient.MunicipalityId equals municipality.MunicipalityId into municipalityGroup
                                            from municipality in municipalityGroup.DefaultIfEmpty()
                                            join visit in patientDbContext.Visits
                                                .Where(v => v.PatientId == patientId)
                                                .OrderByDescending(v => v.VisitDate).Take(1) // Latest Visit
                                                on patient.PatientId equals visit.PatientId into visitGroup
                                            from visit in visitGroup.DefaultIfEmpty()
                                            join adm in patientDbContext.Admissions
                                                on visit.PatientVisitId equals adm.PatientVisitId into admGroup
                                            from adm in admGroup.DefaultIfEmpty()
                                            select new GetPatientDetailsResponse
                                            {
                                                PatientId = patient.PatientId,
                                                PatientVisitId = visit != null ? visit.PatientVisitId : default,
                                                VisitType = visit != null ? visit.VisitType : null,
                                                FirstName = patient.FirstName,
                                                MiddleName = patient.MiddleName,
                                                LastName = patient.LastName,
                                                DateOfBirth = patient.DateOfBirth,
                                                CountrySubDivisionId = patient.CountrySubDivisionId,
                                                Address = patient.Address,
                                                Age = patient.Age,
                                                Gender = patient.Gender,
                                                EthnicGroup = patient.EthnicGroup,
                                                IsDobVerified = patient.IsDobVerified,
                                                Email = patient.Email,
                                                PhoneNumber = patient.PhoneNumber,
                                                Salutation = patient.Salutation,
                                                CountryId = patient.CountryId,
                                                CountryName = country.CountryName,
                                                CountrySubDivisionName = subdivision.CountrySubDivisionName,
                                                MunicipalityName = municipality != null ? municipality.MunicipalityName : null,
                                                DiscountSchemeId = adm != null ? adm.DiscountSchemeId : null,
                                                IsItemDiscountEnabled = adm != null ? adm.IsItemDiscountEnabled : default,
                                                SchemeId = visit != null ? visit.SchemeId : default,
                                                PriceCategoryId = visit != null ? visit.PriceCategoryId : default,
                                                IsAdmitted = adm != null && adm.DischargeDate == null,
                                                MaritalStatus = patient.MaritalStatus,
                                                ShortName = patient.ShortName,
                                                PatientCode = patient.PatientCode
                                            }).FirstOrDefaultAsync();

                if (patientDetails == null)
                {
                    _logger.LogWarning("Patient with ID {patientId} not found.");
                    throw new KeyNotFoundException($"Patient with ID {patientId} not found.");
                }

                return patientDetails;
            }
            catch (Exception ex)
            {
                _logger.LogError("An error occurred while retrieving patient details: {ex.Message}", ex);
                throw new ApplicationException($"An error occurred while retrieving patient details: {ex.Message}", ex);
            }
        }

    }
}
