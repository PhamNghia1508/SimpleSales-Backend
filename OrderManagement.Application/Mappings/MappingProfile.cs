using AutoMapper;
using OrderManagement.Core.DTOs.Orders;
using OrderManagement.Core.Entities;

namespace OrderManagement.Application.Mappings;

public class MappingProfile : Profile
{
	public MappingProfile()
	{
		CreateMap<OrderCreateDto, Order>();
		CreateMap<OrderDetailDto, OrderDetail>().ReverseMap();
		CreateMap<Order, OrderDto>()
			.ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.OrderDetails));
	}
}