using OrderManagement.Core.Interfaces;
using OrderManagement.Core.Interfaces.Repositories;
using OrderManagement.Infrastructure.DbContexts;
using OrderManagement.Infrastructure.Repositories;

namespace OrderManagement.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly OrderManagementDbContext _context;
    public IAccountRepository Accounts { get; }

    public UnitOfWork(OrderManagementDbContext context)
    {
        _context = context;
        Accounts = new AccountRepository(context);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }
}