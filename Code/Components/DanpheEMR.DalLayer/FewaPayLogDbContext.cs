using DanpheEMR.ServerModel.FewaPayLogModel;
using System.Data.Entity;

namespace DanpheEMR.DalLayer
{
    public class FewaPayLogDbContext: DbContext
    {
        public DbSet<FewaPayTransactionLogModel> FewaPayTransactionLogs { get; set; }
      
        public FewaPayLogDbContext(string conn) : base(conn)
        {
            this.Configuration.LazyLoadingEnabled = true;
            this.Configuration.ProxyCreationEnabled = false;
        }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FewaPayTransactionLogModel>().ToTable("LOG_FewaPayTransactions");

        }
    }
}
