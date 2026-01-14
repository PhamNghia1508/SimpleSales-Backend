namespace OrderManagement.Application.DTOs.Accounts;

public class AccountDto
{
    public int AccountId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? FullName { get; set; }
}