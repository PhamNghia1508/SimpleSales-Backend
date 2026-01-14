using OrderManagement.Core.Entities;

namespace OrderManagement.Core.Interfaces.Repositories;

public interface IOrderRepository
{
	Task AddAsync(Order order, CancellationToken cancellationToken = default);
	Task<IReadOnlyList<Order>> GetByAccountIdAsync(int accountId, CancellationToken cancellationToken = default);
}