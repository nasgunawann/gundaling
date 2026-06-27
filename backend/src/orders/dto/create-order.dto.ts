import {
  IsInt,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsInt()
  @IsNotEmpty()
  qty: number;

  @IsBoolean()
  @IsOptional()
  sent?: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  table_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
