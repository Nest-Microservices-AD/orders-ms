import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import {
  HttpStatus,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('OrdersService');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    { transport: Transport.TCP, options: { port: envs.port } },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: validationErrors.map((error) => ({
            field: error.property,
            error: Object.values(error.constraints).join(', '),
          })),
        });
      },
    }),
  );
  await app.listen();
  logger.verbose(`Orders microservice running on port ${envs.port}`);
}
bootstrap();
