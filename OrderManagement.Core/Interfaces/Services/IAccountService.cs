namespace OrderManagement.Core.Interfaces.Services;

public interface IAccountService
{
    Task<(string Token, DateTime ExpiresAt, string Username)> RegisterAsync(string username, string password, string? fullName);
    Task<(string Token, DateTime ExpiresAt, string Username)> LoginAsync(string username, string password);
}