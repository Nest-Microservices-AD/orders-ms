import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../common/enums';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatusList)
  status: OrderStatus;
}
