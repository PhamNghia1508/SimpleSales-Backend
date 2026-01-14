namespace OrderManagement.Application.DTOs.Accounts;

public class AccountCreateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? FullName { get; set; }
}