using Microsoft.Extensions.Caching.Memory;
using OrderManagement.Core.DTOs.Orders;
using OrderManagement.Core.Interfaces.Services;

namespace OrderManagement.Application.Services;

public class CachedOrderService : IOrderService
{
    private readonly IMemoryCache _cache;
    private readonly IOrderService _innerService;

    private const string CacheKeyPrefix = "v1:orders:account:";

    public CachedOrderService(IOrderService innerService, IMemoryCache cache)
    {
        _innerService = innerService;
        _cache = cache;
    }

    public async Task CreateOrderAsync(int accountId, OrderCreateDto request, CancellationToken cancellationToken = default)
    {
        await _innerService.CreateOrderAsync(accountId, request, cancellationToken);

        // Dữ liệu orders của account đã thay đổi => xóa cache để lần sau lấy dữ liệu mới
        _cache.Remove(GetCacheKey(accountId));
    }

    public Task<IReadOnlyList<OrderDto>> GetOrdersByAccountAsync(int accountId, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(accountId);

        // Chỉ rõ generic type để tránh lỗi suy luận kiểu TItem
        return _cache.GetOrCreateAsync<IReadOnlyList<OrderDto>>(cacheKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));

            // Chỉ nên SetSize nếu bạn có cấu hình SizeLimit trong AddMemoryCache(options => ...)
            entry.SetSize(1);

            var orders = await _innerService.GetOrdersByAccountAsync(accountId, cancellationToken);
            return orders ?? Array.Empty<OrderDto>();
        })!;
    }

    private static string GetCacheKey(int accountId) => $"{CacheKeyPrefix}{accountId}";
}
