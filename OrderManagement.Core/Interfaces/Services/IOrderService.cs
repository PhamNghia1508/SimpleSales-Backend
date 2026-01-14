using OrderManagement.Core.DTOs.Orders;

namespace OrderManagement.Core.Interfaces.Services;

public interface IOrderService
{
    Task CreateOrderAsync(int accountId, OrderCreateDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderDto>> GetOrdersByAccountAsync(int accountId, CancellationToken cancellationToken = default);
}
