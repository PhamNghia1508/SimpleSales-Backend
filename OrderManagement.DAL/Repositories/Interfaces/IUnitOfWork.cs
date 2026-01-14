namespace OrderManagement.DAL.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IAccountRepository Accounts { get; }
    IOrderRepository Orders { get; }
    int SaveChanges(); // Hàm này mới thực sự commit xuống DB
    Task<int> SaveChangesAsync();
    void BeginTransaction();
    void Commit();
    void Rollback();
}