using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Core.Entities;

namespace OrderManagement.Infrastructure.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Account");
        builder.HasKey(a => a.AccountId);
        builder.Property(a => a.AccountId).HasColumnName("AccountID");
        builder.Property(a => a.Username).HasMaxLength(50).IsUnicode(false);
        builder.Property(a => a.PasswordHash).HasMaxLength(64);
        builder.Property(a => a.PasswordSalt).HasMaxLength(64);
        builder.Property(a => a.FullName).HasMaxLength(100);
        builder.HasIndex(a => a.Username).IsUnique();
        builder.HasMany(a => a.Orders)
            .WithOne(o => o.Account)
            .HasForeignKey(o => o.AccountId)
            .OnDelete(DeleteBehavior.ClientSetNull)
            .HasConstraintName("FK_Order_Account");
    }
}