using System;
using System.Collections.Generic;

namespace OrderManagement.Core.Entities;

public partial class Order
{
    public int OrderId { get; set; }

    public int AccountId { get; set; }

    public DateTime? OrderDate { get; set; }

    public decimal? TotalAmount { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}
