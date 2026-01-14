namespace OrderManagement.Core.Interfaces.Repositories;

public interface IAccountRepository
{
    Task<bool> UsernameExistsAsync(string username);
    Task AddAsync(Entities.Account account);
    Task<Entities.Account?> GetByUsernameAsync(string username);
}