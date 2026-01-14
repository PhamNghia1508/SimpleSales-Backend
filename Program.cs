using Microsoft.EntityFrameworkCore;
// ...existing code...
var builder = WebApplication.CreateBuilder(args);
// ...existing code...
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});
// ...existing code...
var app = builder.Build();
// ...existing code...
app.Run();

