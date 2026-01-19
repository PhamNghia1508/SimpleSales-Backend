using System.Security.Claims;

namespace OrderManagement.API.Extensions;

public static class ClaimsExtensions
{
    public static int? GetAccountId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier);

        if (claim != null && int.TryParse(claim.Value, out var id))
        {
            return id;
        }

        return null;
    }
}