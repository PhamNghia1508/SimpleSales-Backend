using OrderManagement.Core.Interfaces.Repositories;

namespace OrderManagement.Core.Interfaces;

public interface IUnitOfWork
{
    IAccountRepository Accounts { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}