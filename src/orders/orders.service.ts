import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { OrdersPaginationDto } from './dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private logger = new Logger('ProductService');
  onModuleInit() {
    this.$connect();
    this.logger.log('Database Connected');
  }
  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(paginationDto: OrdersPaginationDto) {
    const { page, limit } = paginationDto;
    const total = await this.order.count({
      where: {
        AND: [
          {
            status: paginationDto.status,
          },
        ],
      },
    });
    const lastPage = Math.ceil(total / limit);
    const data = await this.order.findMany({
      where: {
        AND: [
          {
            status: paginationDto.status,
          },
        ],
      },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      data,
      pagination: {
        page,
        total,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        message: `Order with id ${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    return order;
  }

  async update(updateOrderDto: UpdateOrderDto) {
    await this.findOne(updateOrderDto.id);
    return this.order.update({
      where: {
        id: updateOrderDto.id,
      },
      data: {
        status: updateOrderDto.status,
      },
    });
  }
}
