using DanpheEMR.DalLayer;
using DanpheEMR.Services.Admission.DTOs;
using System.Threading.Tasks;
using System.Linq;
using DanpheEMR.Enums;
using System.Data.Entity;
using System;
using DanpheEMR.Services.Discharge.DTO;

namespace DanpheEMR.Services.Admission
{
    public class AdmissionService : IAdmissionService
    {
        public async Task<PatientAdmissionSlip_DTO> GetAdmissionSlipDetails(int PatientVisitId, AdmissionDbContext _admissionDbContext)
        {
            var AdmissionSlipDetails = await (from adm in _admissionDbContext.Admissions
                                        join pat in _admissionDbContext.Patients on adm.PatientId equals pat.PatientId
                                        join visit in _admissionDbContext.Visits on adm.PatientVisitId equals visit.PatientVisitId
                                        join dept in _admissionDbContext.Department on visit.DepartmentId equals dept.DepartmentId
                                        join bedInfo in _admissionDbContext.PatientBedInfos on visit.PatientVisitId equals bedInfo.PatientVisitId
                                        join ward in _admissionDbContext.Wards on bedInfo.WardId equals ward.WardId
                                        join bed in _admissionDbContext.Beds on bedInfo.BedId equals bed.BedId
                                        join emp in _admissionDbContext.Employees on adm.AdmittingDoctorId equals emp.EmployeeId into empGroup
                                        from employee in empGroup.DefaultIfEmpty()
                                        where visit.PatientVisitId == PatientVisitId && adm.AdmissionStatus == ENUM_AdmissionStatus.admitted
                                        select new PatientAdmissionSlip_DTO
                                        {
                                            PatientName = pat.ShortName,
                                            AgeGender = pat.Age.ToString() + "/" + pat.Gender.Substring(0, 1),
                                            HospitalNumber = pat.PatientCode,
                                            IpNumber = visit.VisitCode,
                                            WardNameBedNumber = ward.WardName + "/" + bed.BedNumber,
                                            DepartmentName = dept.DepartmentName,
                                            DoctorName = employee.FullName,
                                            AdmittedOn = adm.AdmissionDate,
                                            DateOfBirth = pat.DateOfBirth,
                                            Gender = pat.Gender
                                        }).FirstOrDefaultAsync();
            return AdmissionSlipDetails;
        }

        public async Task<PatientDischargeSlip_DTO> GetDischargeSlipDetails(int PatientVisitId, AdmissionDbContext _admissionDbContext)
        {
            var DischargeSlipDetails = await   (from adm in _admissionDbContext.Admissions
                                               join pat in _admissionDbContext.Patients on adm.PatientId equals pat.PatientId
                                               join visit in _admissionDbContext.Visits on adm.PatientVisitId equals visit.PatientVisitId
                                               join dept in _admissionDbContext.Department on visit.DepartmentId equals dept.DepartmentId
                                               join bedInfo in _admissionDbContext.PatientBedInfos.Where(p => p.OutAction == "discharged") on visit.PatientVisitId equals bedInfo.PatientVisitId
                                               join ward in _admissionDbContext.Wards on bedInfo.WardId equals ward.WardId
                                               join bed in _admissionDbContext.Beds on bedInfo.BedId equals bed.BedId
                                               join emp in _admissionDbContext.Employees on adm.AdmittingDoctorId equals emp.EmployeeId into empGroup
                                               from employee in empGroup.DefaultIfEmpty()
                                               where visit.PatientVisitId == PatientVisitId && adm.AdmissionStatus == ENUM_AdmissionStatus.discharged
                                               select new PatientDischargeSlip_DTO
                                               {
                                                   PatientName = pat.ShortName,
                                                   AgeGender = pat.Age.ToString() + "/" + pat.Gender.Substring(0, 1),
                                                   HospitalNumber = pat.PatientCode,
                                                   IpNumber = visit.VisitCode,
                                                   WardNameBedNumber = ward.WardName + "/" + bed.BedNumber,
                                                   DepartmentName = dept.DepartmentName,
                                                   DoctorName = employee.FullName,
                                                   AdmittedOn = adm.AdmissionDate,
                                                   DischargedOn = (DateTime)adm.DischargeDate,
                                                   DateOfBirth = pat.DateOfBirth,
                                                   Gender = pat.Gender
                                               }).FirstOrDefaultAsync();
            return DischargeSlipDetails;
        }
    }
}
