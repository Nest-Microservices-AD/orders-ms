import { IsString, IsUrl, IsUUID } from 'class-validator';

export class OrderPaymentDto {
  @IsString()
  stripePaymentId: string;

  @IsString()
  @IsUUID()
  orderId: string;

  @IsString()
  @IsUrl()
  receiptUrl: string;
}
