using Microsoft.EntityFrameworkCore;
using OrderManagement.Core.Entities;
using OrderManagement.Core.Interfaces.Repositories;
using OrderManagement.Infrastructure.DbContexts;

namespace OrderManagement.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
	private readonly OrderManagementDbContext _context;

	public OrderRepository(OrderManagementDbContext context)
	{
		_context = context;
	}

	public async Task AddAsync(Order order, CancellationToken cancellationToken = default)
	{
		await _context.Orders.AddAsync(order, cancellationToken);
	}

	public async Task<IReadOnlyList<Order>> GetByAccountIdAsync(int accountId, CancellationToken cancellationToken = default)
	{
		return await _context.Orders
			.AsNoTracking()
			.Where(o => o.AccountId == accountId)
			.Include(o => o.OrderDetails)
			.OrderByDescending(o => o.OrderDate)
			.ToListAsync(cancellationToken);
	}
}