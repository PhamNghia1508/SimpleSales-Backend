using System;
using System.Linq;
using AutoMapper;
using OrderManagement.Core.DTOs.Orders;
using OrderManagement.Core.Interfaces.Services;
using OrderManagement.Core.Entities;
using OrderManagement.Core.Interfaces;

namespace OrderManagement.Application.Services;

public class OrderService : IOrderService
{
	private readonly IUnitOfWork _unitOfWork;
	private readonly IMapper _mapper;

	public OrderService(IUnitOfWork unitOfWork, IMapper mapper)
	{
		_unitOfWork = unitOfWork;
		_mapper = mapper;
	}

	public async Task CreateOrderAsync(int accountId, OrderCreateDto request, CancellationToken cancellationToken = default)
	{
		if (request.Details == null || request.Details.Count == 0)
			throw new ArgumentException("Order must contain at least one detail item.", nameof(request));

		var order = _mapper.Map<Order>(request);
		order.AccountId = accountId;
		order.OrderDate = DateTime.Now;
		order.TotalAmount = request.Details.Sum(d => d.Quantity * d.Price);

		// Ensure OrderDetails references are initialized
		if (order.OrderDetails == null || order.OrderDetails.Count == 0)
		{
			order.OrderDetails = request.Details
				.Select(d => new OrderDetail
				{
					ProductName = d.ProductName,
					Quantity = d.Quantity,
					Price = d.Price
				})
				.ToList();
		}

		await _unitOfWork.Orders.AddAsync(order, cancellationToken);
		await _unitOfWork.SaveChangesAsync(cancellationToken);
	}

	public async Task<IReadOnlyList<OrderDto>> GetOrdersByAccountAsync(int accountId, CancellationToken cancellationToken = default)
	{
		var orders = await _unitOfWork.Orders.GetByAccountIdAsync(accountId, cancellationToken);
		return _mapper.Map<IReadOnlyList<OrderDto>>(orders);
	}
}