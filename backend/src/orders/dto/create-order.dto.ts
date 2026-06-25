import {
  IsInt,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt()
  @IsNotEmpty()
  product_id: number;

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
  @IsInt()
  @IsNotEmpty()
  table_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
