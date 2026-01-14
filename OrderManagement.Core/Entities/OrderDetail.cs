using System;
using System.Collections.Generic;

namespace OrderManagement.Core.Entities;

public partial class OrderDetail
{
    public int DetailId { get; set; }

    public int OrderId { get; set; }

    public string ProductName { get; set; } = null!;

    public int? Quantity { get; set; }

    public decimal Price { get; set; }

    public virtual Order Order { get; set; } = null!;
}
