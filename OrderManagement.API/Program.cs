using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OrderManagement.API.Extensions;
using OrderManagement.Application.Mappings;
using OrderManagement.Application.Services;
using OrderManagement.Core.Interfaces.Services;
using OrderManagement.Infrastructure.DbContexts;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OrderManagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024;
});

// Đăng ký các service "core" (bao gồm IOrderService -> OrderService)
builder.Services.AddApplicationServices();
builder.Services.AddJwtAuthentication(builder.Configuration);

// Decorate IOrderService bằng CachedOrderService
// Lưu ý: đăng ký OrderService concrete để lấy làm inner service (tránh resolve ngược IOrderService gây vòng lặp)
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<IOrderService>(provider =>
{
    var coreService = provider.GetRequiredService<OrderService>();
    var memoryCache = provider.GetRequiredService<IMemoryCache>();
    return new CachedOrderService(coreService, memoryCache);
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); 
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();