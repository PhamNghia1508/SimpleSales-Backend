namespace OrderManagement.Core.DTOs.Orders;

public class OrderCreateDto
{
	public List<OrderDetailDto> Details { get; set; } = new();
}