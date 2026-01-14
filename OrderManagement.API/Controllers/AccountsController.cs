using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.API.Models;
using OrderManagement.Core.Interfaces.Services;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var result = await _accountService.RegisterAsync(request.Username, request.Password, request.FullName);
        return Ok(new AuthResponse { Token = result.Token, Username = result.Username, ExpiresAt = result.ExpiresAt });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var result = await _accountService.LoginAsync(request.Username, request.Password);
        return Ok(new AuthResponse { Token = result.Token, Username = result.Username, ExpiresAt = result.ExpiresAt });
    }
}