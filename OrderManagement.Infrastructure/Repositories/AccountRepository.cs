using Microsoft.EntityFrameworkCore;
using OrderManagement.Core.Entities;
using OrderManagement.Core.Interfaces.Repositories;
using OrderManagement.Infrastructure.DbContexts;

namespace OrderManagement.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly OrderManagementDbContext _context;

    public AccountRepository(OrderManagementDbContext context)
    {
        _context = context;
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return await _context.Accounts.AnyAsync(a => a.Username == username);
    }

    public async Task AddAsync(Account account)
    {
        await _context.Accounts.AddAsync(account);
    }

    public async Task<Account?> GetByUsernameAsync(string username)
    {
        return await _context.Accounts.FirstOrDefaultAsync(a => a.Username == username);
    }
}