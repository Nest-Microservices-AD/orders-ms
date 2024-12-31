import { OrderStatus } from '@prisma/client';

export interface OrderWithProducts {
  OrderItem: {
    name: string;
    quantity: number;
    price: number;
    productId: number;
  }[];
  id: string;
  status: OrderStatus;
  totalAmount: number;
  totalItems: number;
  paid: boolean;
  paydAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
