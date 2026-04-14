using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.Clinical_New;
using DanpheEMR.Services.Medicare;
using DanpheEMR.Services.Patient;
using DanpheEMR.Utilities;
using DanpheEMR.ViewModel.Medicare;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Patient
{
    public class PatinetMedicareRegistrationController : CommonController
    {
        private readonly IPatientService _IPatientService;
        private readonly MedicareDbContext _medicareDbContext;


        public PatinetMedicareRegistrationController(IPatientService iPatientService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _IPatientService = iPatientService;
            _medicareDbContext = new MedicareDbContext(connString);
        }

        [HttpGet]
        [Route("MedicarePatientList")]
        public IActionResult GetMedicarePatientList()
        {
            Func<object> func = () => _IPatientService.GetMedicarePatientList(_medicareDbContext);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("Designations")]
        public async Task<ActionResult> Designations()
        {

            Func<Task<object>> func = () => _IPatientService.GetDesignations(_medicareDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }
        [HttpGet]
        [Route("InsuranceProviders")]
        public async Task<ActionResult> InsuranceProviders()
        {
            Func<Task<object>> func = () => _IPatientService.GetInsuranceProviders(_medicareDbContext);
            return await InvokeHttpGetFunctionAsync(func);

        }

        [HttpGet]
        [Route("MedicareInstitutes")]
        public async Task<ActionResult> MedicareInstitutes()
        {
            Func<Task<object>> func = () => _IPatientService.GetAllMedicareInstitutes(_medicareDbContext);
            return await InvokeHttpGetFunctionAsync(func);

        }

        [HttpGet]
        [Route("Departments")]
        public async Task<ActionResult> Departments()
        {
            Func<Task<object>> func = () => _IPatientService.GetDepartments(_medicareDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }

        [HttpGet]
        [Route("MedicareTypes")]
        public async Task<ActionResult> MedicareTypes()
        {
            Func<Task<object>> func = () => _IPatientService.GetMedicareTypes(_medicareDbContext);
            return await InvokeHttpGetFunctionAsync(func);

        }

        [HttpGet]
        [Route("MedicareMemberByPatientId")]
        public async Task<IActionResult> MedicareMemberDetailByPatientId(int PatientId)
        {
            Func<Task<object>> func = () => _IPatientService.GetMedicareMemberByPatientId(_medicareDbContext, PatientId);
            return await InvokeHttpGetFunctionAsync(func);

        }

        [HttpPost]
        [Route("MedicareMemberDetails")]

        public IActionResult AddMedicareMemberDetails([FromBody] MedicareMemberDto medicareMemberDto)
        {
            if (medicareMemberDto == null)
            {
                throw new ArgumentNullException("Medicare member details is null");
            }
            else
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
                using (var medicareTransactionScope = _medicareDbContext.Database.BeginTransaction())
                {
                    Func<object> func = () => _IPatientService.SaveMedicareMemberDetails(_medicareDbContext, medicareMemberDto, currentUser);
                    return InvokeHttpPostFunctionSingleTransactionScope<object>(func, medicareTransactionScope);
                }
            }
        }

        [HttpPut]
        [Route("MedicareMemberDetails")]
        public IActionResult UpdateMedicareMemberDetails([FromBody] MedicareMemberDto medicareMemberDto)
        {

            if (medicareMemberDto == null)
            {
                throw new ArgumentNullException("Medicare member details is null");
            }
            else
            {
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
                using (var medicareTransactionScope = _medicareDbContext.Database.BeginTransaction())
                {
                    Func<object> func = () => _IPatientService.UpdateMedicareMemberDetails(_medicareDbContext, medicareMemberDto, currentUser);
                    return InvokeHttpPutFunctionSingleTransactionScope<object>(func, medicareTransactionScope);
                }
            }
        }

        [HttpGet]
        [Route("DependentMedicareMember")]
        public async Task<ActionResult> DependentMedicareMember(int patientId)
        {
            Func<Task<object>> fun = () => _IPatientService.GetDependentMedicareMemberByPatientId(_medicareDbContext, patientId);
            return await InvokeHttpGetFunctionAsync(fun);
        }
        [HttpGet]
        [Route("MedicareMemberByMemberNo")]
        public async Task<ActionResult> MedicareMemberDetailByMedicareNo(string medicareNo)
        {
            Func<Task<object>> fun = () => _IPatientService.GetMedicareMemberByMedicareNo(_medicareDbContext, medicareNo);
            return await InvokeHttpGetFunctionAsync(fun);
        }
    }
}
