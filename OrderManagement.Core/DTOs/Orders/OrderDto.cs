namespace OrderManagement.Core.DTOs.Orders;

public class OrderDto
{
	public int OrderId { get; set; }
	public DateTime? OrderDate { get; set; }
	public decimal? TotalAmount { get; set; }
	public List<OrderDetailDto> Details { get; set; } = new();
}