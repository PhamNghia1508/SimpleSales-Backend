using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OrderManagement.API.Extensions;
using OrderManagement.Application.Mappings;
using OrderManagement.Application.Services;
using OrderManagement.Core.Interfaces.Services;
using OrderManagement.Infrastructure.DbContexts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OrderManagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "OrderManagement.API", Version = "v1" });

    // Enable JWT Bearer auth in Swagger UI (Authorize button)
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập JWT token theo format: Bearer {your_token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

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
    var logger = provider.GetRequiredService<ILogger<CachedOrderService>>();
    return new CachedOrderService(coreService, memoryCache, logger);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

