using System;
using System.Collections.Generic;

namespace OrderManagement.DAL.Entities;

public partial class Account
{
    public int AccountId { get; set; }

    public string Username { get; set; } = null!;

    public byte[] PasswordHash { get; set; } = null!;

    public string? FullName { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
