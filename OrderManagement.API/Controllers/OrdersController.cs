using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Core.DTOs.Orders;
using OrderManagement.Core.Interfaces.Services;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
	private readonly IOrderService _orderService;

	public OrdersController(IOrderService orderService)
	{
		_orderService = orderService;
	}

	[HttpPost]
	public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto request, CancellationToken cancellationToken)
	{
		var accountId = GetAccountId();
		if (accountId == null) return Unauthorized();

		await _orderService.CreateOrderAsync(accountId.Value, request, cancellationToken);
		return Ok(new { message = "Order created successfully." });
	}

	[HttpGet]
	public async Task<IActionResult> GetMyOrders(CancellationToken cancellationToken)
	{
		var accountId = GetAccountId();
		if (accountId == null) return Unauthorized();

		var orders = await _orderService.GetOrdersByAccountAsync(accountId.Value, cancellationToken);
		return Ok(orders);
	}

	private int? GetAccountId()
	{
		var claim = User.FindFirst(ClaimTypes.NameIdentifier);
		return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
	}
}