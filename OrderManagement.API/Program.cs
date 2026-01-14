using Microsoft.EntityFrameworkCore;
using OrderManagement.Infrastructure.DbContexts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<OrderManagementDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();

app.Run();