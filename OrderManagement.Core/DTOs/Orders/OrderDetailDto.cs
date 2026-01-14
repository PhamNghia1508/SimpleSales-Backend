namespace OrderManagement.Core.DTOs.Orders;

public class OrderDetailDto
{
	public string ProductName { get; set; } = string.Empty;
	public int Quantity { get; set; }
	public decimal Price { get; set; }
}