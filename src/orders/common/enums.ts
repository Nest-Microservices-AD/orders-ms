import { OrderStatus } from '@prisma/client';

export const OrderStatusList = [
  OrderStatus.CANCELLED,
  OrderStatus.CONFIRMED,
  OrderStatus.DELIVERED,
  OrderStatus.PENDING,
];
