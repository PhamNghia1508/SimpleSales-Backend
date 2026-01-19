using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using OrderManagement.Core.DTOs.Orders;
using OrderManagement.Core.Interfaces.Services;

namespace OrderManagement.Application.Services;

public class CachedOrderService : IOrderService
{
    private readonly IMemoryCache _cache;
    private readonly IOrderService _innerService;
    private readonly ILogger<CachedOrderService> _logger;

    private const string CacheKeyPrefix = "v1:orders:account:";

    public CachedOrderService(IOrderService innerService, IMemoryCache cache, ILogger<CachedOrderService> logger)
    {
        _innerService = innerService;
        _cache = cache;
        _logger = logger;
    }

    public async Task CreateOrderAsync(int accountId, OrderCreateDto request, CancellationToken cancellationToken = default)
    {
        await _innerService.CreateOrderAsync(accountId, request, cancellationToken);

        // Dữ liệu orders của account đã thay đổi => xóa cache để lần sau lấy dữ liệu mới
        var cacheKey = GetCacheKey(accountId);
        _cache.Remove(cacheKey);
        _logger.LogInformation("[OrdersCache] Invalidate key={CacheKey}", cacheKey);
    }

    public Task<IReadOnlyList<OrderDto>> GetOrdersByAccountAsync(int accountId, CancellationToken cancellationToken = default)
    {
        var cacheKey = GetCacheKey(accountId);

        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<OrderDto>? cached) && cached is not null)
        {
            _logger.LogInformation("[OrdersCache] HIT key={CacheKey} count={Count}", cacheKey, cached.Count);
            return Task.FromResult(cached);
        }

        _logger.LogInformation("[OrdersCache] MISS key={CacheKey}", cacheKey);

        // Chỉ rõ generic type để tránh lỗi suy luận kiểu TItem
        return _cache.GetOrCreateAsync<IReadOnlyList<OrderDto>>(cacheKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));

            // Chỉ nên SetSize nếu bạn có cấu hình SizeLimit trong AddMemoryCache(options => ...)
            entry.SetSize(1);

            var orders = await _innerService.GetOrdersByAccountAsync(accountId, cancellationToken);
            var result = orders ?? Array.Empty<OrderDto>();

            _logger.LogInformation("[OrdersCache] SET key={CacheKey} count={Count}", cacheKey, result.Count);
            return result;
        })!;
    }

    private static string GetCacheKey(int accountId) => $"{CacheKeyPrefix}{accountId}";
}
