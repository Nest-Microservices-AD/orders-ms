import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';
import { OrderStatusList } from '../common/enums';
import { OrderStatus } from '@prisma/client';

export class OrdersPaginationDto extends PaginationDto {
  @IsEnum(OrderStatusList)
  @IsOptional()
  status?: OrderStatus;
}
