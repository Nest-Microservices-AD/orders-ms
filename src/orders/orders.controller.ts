import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersPaginationDto, UpdateOrderDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    try {
      return this.ordersService.create(createOrderDto);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() paginationDto: OrdersPaginationDto) {
    try {
      return this.ordersService.findAll(paginationDto);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    try {
      return this.ordersService.findOne(id);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() updateStatusDto: UpdateOrderDto) {
    return this.ordersService.update(updateStatusDto);
  }
}
