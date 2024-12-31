import { Controller, ParseUUIDPipe } from '@nestjs/common';
import {
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersPaginationDto, UpdateOrderDto } from './dto';
import { OrderPaymentDto } from './dto/order-payment.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    try {
      const order = await this.ordersService.create(createOrderDto);
      const paymentSession = this.ordersService.createPaymentSession(order);
      return paymentSession;
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

  @EventPattern('payment.success')
  paymentSuccess(@Payload() orderPaymentDto: OrderPaymentDto) {
    return this.ordersService.paymentSuccess(orderPaymentDto);
  }
}
