import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { OrdersPaginationDto } from './dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/services';
import { catchError, firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './common/interfaces/order-with-products.interface';
import { OrderPaymentDto } from './dto/order-payment.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private logger = new Logger('ProductService');
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {
    super();
  }
  onModuleInit() {
    this.$connect();
    this.logger.log('Database Connected');
  }
  async create(createOrderDto: CreateOrderDto) {
    const products: any[] = await firstValueFrom(
      this.natsClient
        .send(
          'product_validate',
          createOrderDto.items.map((item) => item.productId),
        )
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });
          }),
        ),
    );
    const totalAmount = createOrderDto.items.reduce(
      (acc, item) =>
        acc +
        item.quantity * products.find((p) => p.id === item.productId).price,
      0,
    );
    const totalItems = createOrderDto.items.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
    const newOrder = { totalAmount, totalItems };
    const order = await this.order.create({
      data: {
        ...newOrder,
        OrderItem: {
          createMany: {
            data: [
              ...createOrderDto.items.map((item) => ({
                quantity: item.quantity,
                price: products.find((p) => p.id === item.productId).price,
                productId: item.productId,
              })),
            ],
          },
        },
      },
      include: {
        OrderItem: {
          select: {
            quantity: true,
            price: true,
            productId: true,
          },
        },
      },
    });
    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((p) => p.id === item.productId).name,
      })),
    };
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
      include: {
        OrderItem: {
          select: {
            quantity: true,
            price: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        message: `Order with id ${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    const products: any[] = await firstValueFrom(
      this.natsClient
        .send(
          'product_validate',
          order.OrderItem.map((item) => item.productId),
        )
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });
          }),
        ),
    );
    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((p) => p.id === item.productId).name,
      })),
    };
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

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession: OrderWithProducts = await firstValueFrom(
      this.natsClient
        .send('create.payment.session', {
          orderId: order.id,
          currency: 'usd',
          items: order.OrderItem.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });
          }),
        ),
    );
    return { order, paymentSession };
  }

  paymentSuccess(orderPaymentDto: OrderPaymentDto) {
    return this.order.update({
      where: {
        id: orderPaymentDto.orderId,
      },
      data: {
        paid: true,
        paydAt: new Date(),
        status: OrderStatus.PAID,
        stripeChargeId: orderPaymentDto.stripePaymentId,
        OrderReceipt: {
          create: {
            receiptUrl: orderPaymentDto.receiptUrl,
            stripeChargeId: orderPaymentDto.stripePaymentId,
          },
        },
      },
    });
  }
}
