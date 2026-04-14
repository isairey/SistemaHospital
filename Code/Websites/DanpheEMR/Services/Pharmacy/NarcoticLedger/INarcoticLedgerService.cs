using System;
using System.Threading.Tasks;
using DanpheEMR.DalLayer;

namespace DanpheEMR.Services.Pharmacy.NarcoticLedger
{
    public interface INarcoticLedgerService
    {

        Task<object> GetAllGenericItemList(PharmacyDbContext pharmacyDbContext);
        Task<object> GetAllSupplierList(PharmacyDbContext pharmacyDbContext);
        Task<object> GetAllCompanyList(PharmacyDbContext pharmacyDbContext);
        Task<object> GetNarcoticLedger(int? genericId, int? supplierId, int? companyId, DateTime fromDate, DateTime toDate, PharmacyDbContext _pharmacyDbContext);
    }
}
